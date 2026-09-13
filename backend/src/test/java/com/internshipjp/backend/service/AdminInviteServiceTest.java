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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Inviting an administrator.
 *
 * The property that matters: an invited account exists but cannot be used
 * until the invitee proves control of the mailbox and sets a password of their
 * own. No administrator ever knows another's password.
 */
class AdminInviteServiceTest {

    private UserRepository userRepository;
    private EmailOtpChallengeRepository challengeRepository;
    private AccountMailService mailService;
    private PasswordEncoder encoder;
    private AdminInviteService service;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        challengeRepository = Mockito.mock(EmailOtpChallengeRepository.class);
        mailService = Mockito.mock(AccountMailService.class);
        encoder = new BCryptPasswordEncoder(4);

        service = new AdminInviteService(userRepository, challengeRepository, encoder, mailService);

        Mockito.when(userRepository.save(Mockito.any(User.class)))
                .thenAnswer(i -> i.getArgument(0));
        Mockito.when(challengeRepository.save(Mockito.any(EmailOtpChallenge.class)))
                .thenAnswer(i -> i.getArgument(0));
    }

    private InviteAdminRequest invite(String email) {
        InviteAdminRequest r = new InviteAdminRequest();
        r.setEmail(email);
        r.setFullName("Kyaw Zin");
        return r;
    }

    @Test
    void anInvitedAccountIsPendingAndCannotBeSignedInto() {
        Mockito.when(userRepository.findByEmail("kyaw@example.com")).thenReturn(Optional.empty());

        service.invite(1L, invite("kyaw@example.com"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        Mockito.verify(userRepository).save(saved.capture());
        User created = saved.getValue();

        assertEquals(Role.ADMIN, created.getRole());
        assertEquals(AccountStatus.PENDING, created.getAccountStatus());
        assertNotNull(created.getPasswordHash(), "a null hash would break the auth chain");
        assertFalse(encoder.matches("", created.getPasswordHash()));
        assertFalse(encoder.matches("password", created.getPasswordHash()),
                "the placeholder password must not be guessable");
    }

    @Test
    void theEmailIsLowercasedSoOneAddressIsOneAccount() {
        Mockito.when(userRepository.findByEmail("kyaw@example.com")).thenReturn(Optional.empty());

        service.invite(1L, invite("  KYAW@Example.com  "));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        Mockito.verify(userRepository).save(saved.capture());
        assertEquals("kyaw@example.com", saved.getValue().getEmail());
    }

    @Test
    void anExistingAccountCannotBeInvited() {
        User existing = new User();
        existing.setRole(Role.STUDENT);
        existing.setAccountStatus(AccountStatus.ACTIVE);
        Mockito.when(userRepository.findByEmail("taken@example.com"))
                .thenReturn(Optional.of(existing));

        assertThrows(BadRequestException.class, () -> service.invite(1L, invite("taken@example.com")));
    }

    /** A colleague who never received the first email should not be stuck. */
    @Test
    void reInvitingAPendingAdministratorIssuesAFreshCode() {
        User pending = new User();
        pending.setId(9L);
        pending.setEmail("kyaw@example.com");
        pending.setRole(Role.ADMIN);
        pending.setAccountStatus(AccountStatus.PENDING);
        Mockito.when(userRepository.findByEmail("kyaw@example.com"))
                .thenReturn(Optional.of(pending));

        service.invite(1L, invite("kyaw@example.com"));

        Mockito.verify(challengeRepository).save(Mockito.any(EmailOtpChallenge.class));
        Mockito.verify(mailService).sendAdminInvite(
                Mockito.eq("kyaw@example.com"), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyInt());
        Mockito.verify(userRepository, Mockito.never()).save(Mockito.any(User.class));
    }

    @Test
    void acceptingWithTheRightCodeActivatesTheAccount() {
        User pending = pendingAdmin();
        EmailOtpChallenge challenge = challenge("123456", LocalDateTime.now().plusHours(2));
        Mockito.when(userRepository.findByEmail("kyaw@example.com")).thenReturn(Optional.of(pending));
        Mockito.when(challengeRepository
                        .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                                9L, OtpPurpose.ADMIN_INVITE))
                .thenReturn(Optional.of(challenge));

        service.accept(accept("123456", "a-good-password"));

        assertEquals(AccountStatus.ACTIVE, pending.getAccountStatus());
        assertTrue(encoder.matches("a-good-password", pending.getPasswordHash()),
                "the invitee's own password should now work");
        assertNotNull(challenge.getConsumedAt(), "the code must be single-use");
    }

    @Test
    void aWrongCodeCountsAnAttemptAndChangesNothing() {
        User pending = pendingAdmin();
        EmailOtpChallenge challenge = challenge("123456", LocalDateTime.now().plusHours(2));
        Mockito.when(userRepository.findByEmail("kyaw@example.com")).thenReturn(Optional.of(pending));
        Mockito.when(challengeRepository
                        .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                                9L, OtpPurpose.ADMIN_INVITE))
                .thenReturn(Optional.of(challenge));

        assertThrows(BadRequestException.class, () -> service.accept(accept("000000", "whatever")));

        assertEquals(AccountStatus.PENDING, pending.getAccountStatus());
        assertEquals(1, challenge.getAttemptCount());
    }

    @Test
    void anExpiredInvitationIsRefused() {
        User pending = pendingAdmin();
        EmailOtpChallenge challenge = challenge("123456", LocalDateTime.now().minusMinutes(1));
        Mockito.when(userRepository.findByEmail("kyaw@example.com")).thenReturn(Optional.of(pending));
        Mockito.when(challengeRepository
                        .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
                                9L, OtpPurpose.ADMIN_INVITE))
                .thenReturn(Optional.of(challenge));

        assertThrows(BadRequestException.class, () -> service.accept(accept("123456", "whatever")));
        assertEquals(AccountStatus.PENDING, pending.getAccountStatus());
    }

    /** An already-active account must not be re-activated through this route. */
    @Test
    void anActiveAccountCannotAcceptAnInvitation() {
        User active = pendingAdmin();
        active.setAccountStatus(AccountStatus.ACTIVE);
        Mockito.when(userRepository.findByEmail("kyaw@example.com")).thenReturn(Optional.of(active));

        assertThrows(BadRequestException.class, () -> service.accept(accept("123456", "whatever")));
    }

    private User pendingAdmin() {
        User user = new User();
        user.setId(9L);
        user.setEmail("kyaw@example.com");
        user.setRole(Role.ADMIN);
        user.setAccountStatus(AccountStatus.PENDING);
        user.setPasswordHash(encoder.encode("unknown-placeholder"));
        return user;
    }

    private EmailOtpChallenge challenge(String code, LocalDateTime expiresAt) {
        EmailOtpChallenge challenge = new EmailOtpChallenge();
        challenge.setPurpose(OtpPurpose.ADMIN_INVITE);
        challenge.setOtpHash(encoder.encode(code));
        challenge.setExpiresAt(expiresAt);
        challenge.setAttemptCount(0);
        return challenge;
    }

    private AcceptInviteRequest accept(String code, String password) {
        AcceptInviteRequest r = new AcceptInviteRequest();
        r.setEmail("kyaw@example.com");
        r.setCode(code);
        r.setNewPassword(password);
        return r;
    }
}
