package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.AcceptInviteRequest;
import com.internshipjp.backend.dto.request.InviteAdminRequest;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.EmailOtpChallenge;
import com.internshipjp.backend.entity.OtpPurpose;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.repository.EmailOtpChallengeRepository;
import com.internshipjp.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

/**
 * Inviting another administrator.
 *
 * WHY AN INVITATION RATHER THAN A CREATE FORM
 *   One administrator must never type another person's password. A credential
 *   the inviter knows is not a credential. The invited account is created with
 *   no password at all; the invitee proves control of the mailbox with a code
 *   and chooses their own.
 *
 * WHY THERE IS NO SECOND APPROVAL STEP
 *   A queue that is always approved is ceremony. A pending invitation is a
 *   User with role ADMIN and status PENDING, so it appears in the existing
 *   users list under filters that already exist - every administrator can see
 *   who was invited, and by implication that somebody invited them. Visibility
 *   is the check rather than a gate.
 *
 * The one-time code machinery is the same one password recovery uses: hashed
 * before storage, expiring, attempt-limited. Nothing new was built for it.
 */
@Service
public class AdminInviteService {

    private static final Logger log = LoggerFactory.getLogger(AdminInviteService.class);

    private static final int CODE_DIGITS = 6;
    /** Longer than a password reset: an invitation may sit unread over a weekend. */
    private static final int EXPIRY_HOURS = 72;
    private static final int MAX_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final EmailOtpChallengeRepository challengeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountMailService accountMailService;
    private final SecureRandom random = new SecureRandom();

    public AdminInviteService(UserRepository userRepository,
                              EmailOtpChallengeRepository challengeRepository,
                              PasswordEncoder passwordEncoder,
                              AccountMailService accountMailService) {
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountMailService = accountMailService;
    }

    /**
     * Creates a pending administrator and emails them a code.
     *
     * Re-inviting somebody who has not yet accepted issues a fresh code rather
     * than failing, because "an invitation was already sent" is not useful to
     * an administrator whose colleague never received the first one.
     */
    @Transactional
    public void invite(Long invitedByUserId, InviteAdminRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            if (existing.getRole() != Role.ADMIN || existing.getAccountStatus() != AccountStatus.PENDING) {
                throw new BadRequestException(
                        "An account already uses that email address.");
            }
            issueCode(existing, request.getFullName());
            log.info("Administrator invitation re-sent to {} by user {}", email, invitedByUserId);
            return;
        }

        // The account is created with a password nobody knows: a random value,
        // hashed, and never sent anywhere. Signing in then fails the way a wrong
        // password fails, through the normal path, with no null to handle in
        // the authentication chain and no flag anybody could forget to check.
        User invited = new User();
        invited.setEmail(email);
        invited.setFullName(request.getFullName().trim());
        invited.setRole(Role.ADMIN);
        invited.setAccountStatus(AccountStatus.PENDING);
        invited.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        User saved = userRepository.save(invited);

        issueCode(saved, request.getFullName());
        log.info("Administrator invitation sent to {} by user {}", email, invitedByUserId);
    }

    /**
     * Accepts an invitation: verifies the code, sets the chosen password, and
     * activates the account.
     */
    @Transactional
    public void accept(AcceptInviteRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(
                        "That code is not valid. Ask for a new invitation."));

        if (user.getRole() != Role.ADMIN || user.getAccountStatus() != AccountStatus.PENDING) {
            // The same message either way, so this cannot be used to discover
            // which addresses have a pending invitation.
            throw new BadRequestException("That code is not valid. Ask for a new invitation.");
        }

        EmailOtpChallenge challenge = challengeRepository
                .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                        user.getId(), OtpPurpose.ADMIN_INVITE)
                .orElseThrow(() -> new BadRequestException(
                        "That code is not valid. Ask for a new invitation."));

        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("That invitation has expired. Ask for a new one.");
        }
        if (challenge.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new BadRequestException("Too many incorrect codes. Ask for a new invitation.");
        }

        if (!passwordEncoder.matches(request.getCode().trim(), challenge.getOtpHash())) {
            challenge.setAttemptCount(challenge.getAttemptCount() + 1);
            challengeRepository.save(challenge);
            int left = MAX_ATTEMPTS - challenge.getAttemptCount();
            throw new BadRequestException(left > 0
                    ? "That code is not correct. " + left + " attempt(s) left."
                    : "Too many incorrect codes. Ask for a new invitation.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        challenge.setConsumedAt(LocalDateTime.now());
        challengeRepository.save(challenge);

        log.info("Administrator invitation accepted by {}", user.getEmail());
    }

    /** A fresh code, replacing any earlier unused one for this account. */
    private void issueCode(User user, String fullName) {
        String code = String.format("%0" + CODE_DIGITS + "d",
                random.nextInt((int) Math.pow(10, CODE_DIGITS)));

        EmailOtpChallenge challenge = new EmailOtpChallenge();
        challenge.setUser(user);
        challenge.setPurpose(OtpPurpose.ADMIN_INVITE);
        challenge.setOtpHash(passwordEncoder.encode(code));
        challenge.setExpiresAt(LocalDateTime.now().plusHours(EXPIRY_HOURS));
        challenge.setAttemptCount(0);
        challengeRepository.save(challenge);

        accountMailService.sendAdminInvite(user.getEmail(), fullName, code, EXPIRY_HOURS);
    }
}
