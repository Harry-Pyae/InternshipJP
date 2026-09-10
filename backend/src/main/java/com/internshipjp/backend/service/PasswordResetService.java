package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.ForgotPasswordRequest;
import com.internshipjp.backend.dto.request.ResetPasswordRequest;
import com.internshipjp.backend.entity.EmailOtpChallenge;
import com.internshipjp.backend.entity.OtpPurpose;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.repository.EmailOtpChallengeRepository;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.security.LoginAttemptService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

/**
 * Letting someone back in when they have forgotten their password.
 *
 * WHY THIS REUSES THE OTP TABLE
 *   email_otp_challenges already stores a hashed code, a purpose, an expiry, a
 *   consumed marker and an attempt count - which is exactly what a reset code
 *   needs. Adding a second table would have duplicated all of it for no gain,
 *   and would have been a schema change.
 *
 * WHAT IS DELIBERATE HERE
 *   - The code is HASHED, like a password. A reset code in plain text in the
 *     database is a password: anyone who can read the table can take any
 *     account.
 *   - Requesting a reset says the same thing whether the address exists or
 *     not. Otherwise this endpoint becomes a way to find out who has an
 *     account, which is worth knowing to an attacker.
 *   - Five wrong codes burns the challenge. Six digits is a million
 *     possibilities, but unlimited guesses turns that into a matter of time.
 *   - A successful reset clears the sign-in lockout, because someone who has
 *     proved control of the mailbox should not then be told to wait fifteen
 *     minutes.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private static final int CODE_DIGITS = 6;
    private static final int EXPIRY_MINUTES = 15;
    private static final int MAX_ATTEMPTS = 5;

    /** A new code cannot be requested for the same address more often than this. */
    private static final Duration REQUEST_COOLDOWN = Duration.ofSeconds(60);

    private final UserRepository userRepository;
    private final EmailOtpChallengeRepository challengeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountMailService accountMailService;
    private final LoginAttemptService loginAttemptService;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(UserRepository userRepository,
                                EmailOtpChallengeRepository challengeRepository,
                                PasswordEncoder passwordEncoder,
                                AccountMailService accountMailService,
                                LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountMailService = accountMailService;
        this.loginAttemptService = loginAttemptService;
    }

    /**
     * Emails a code, if the address belongs to an account.
     *
     * Returns nothing either way. The caller always tells the person to check
     * their email, so this endpoint cannot be used to test which addresses are
     * registered.
     */
    @Transactional
    public void requestReset(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Optional<User> found = userRepository.findByEmail(email);
        if (found.isEmpty()) {
            log.info("Password reset asked for {}, which has no account. Nothing sent.", email);
            return;
        }
        User user = found.get();

        // Without this, anyone could post this address repeatedly and flood the
        // person's inbox. Worse, each new code invalidates the previous one, so
        // a stream of requests would also stop the owner completing a reset.
        // The check uses the existing challenge row rather than new state.
        Optional<EmailOtpChallenge> recent = challengeRepository
                .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                        user.getId(), OtpPurpose.PASSWORD_RESET);
        if (recent.isPresent() && recent.get().getCreatedAt() != null
                && recent.get().getCreatedAt().isAfter(
                        LocalDateTime.now().minus(REQUEST_COOLDOWN))) {
            log.info("Password reset for {} asked again within the cooldown. Nothing sent.", email);
            return;
        }

        String code = String.format("%0" + CODE_DIGITS + "d",
                random.nextInt((int) Math.pow(10, CODE_DIGITS)));

        EmailOtpChallenge challenge = new EmailOtpChallenge();
        challenge.setUser(user);
        challenge.setPurpose(OtpPurpose.PASSWORD_RESET);
        challenge.setOtpHash(passwordEncoder.encode(code));
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES));
        challenge.setAttemptCount(0);
        challengeRepository.save(challenge);

        accountMailService.sendPasswordReset(user.getEmail(), user.getFullName(), code,
                EXPIRY_MINUTES);
    }

    /** Checks the code and sets the new password. */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(
                        "That code is not valid. Ask for a new one."));

        EmailOtpChallenge challenge = challengeRepository
                .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                        user.getId(), OtpPurpose.PASSWORD_RESET)
                .orElseThrow(() -> new BadRequestException(
                        "That code is not valid. Ask for a new one."));

        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("That code has expired. Ask for a new one.");
        }
        if (challenge.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new BadRequestException(
                    "Too many incorrect codes. Ask for a new one.");
        }

        if (!passwordEncoder.matches(request.getCode().trim(), challenge.getOtpHash())) {
            challenge.setAttemptCount(challenge.getAttemptCount() + 1);
            challengeRepository.save(challenge);
            int left = MAX_ATTEMPTS - challenge.getAttemptCount();
            throw new BadRequestException(left > 0
                    ? "That code is not correct. " + left + " attempt(s) left."
                    : "Too many incorrect codes. Ask for a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        challenge.setConsumedAt(LocalDateTime.now());
        challengeRepository.save(challenge);

        // Proving control of the mailbox is a stronger signal than the failed
        // sign-ins that may have led here, so the lockout goes with it.
        loginAttemptService.unlock(user.getEmail());
        log.info("Password reset completed for {}", user.getEmail());
    }
}
