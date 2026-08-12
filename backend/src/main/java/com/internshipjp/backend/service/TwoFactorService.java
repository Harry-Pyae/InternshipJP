package com.internshipjp.backend.service;

import com.internshipjp.backend.config.AppProperties;
import com.internshipjp.backend.dto.response.TotpSetupResponse;
import com.internshipjp.backend.dto.response.TwoFactorStatusResponse;
import com.internshipjp.backend.entity.EmailOtpChallenge;
import com.internshipjp.backend.entity.OtpPurpose;
import com.internshipjp.backend.entity.TwoFactorMethod;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.entity.UserTwoFactorSettings;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.repository.EmailOtpChallengeRepository;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.repository.UserTwoFactorSettingsRepository;
import com.internshipjp.backend.util.SecretEncryptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Enabling and disabling the two second factors.
 *
 * WHAT IS FINISHED HERE
 *   Turning TOTP on and off, turning email OTP on and off, and all the storage
 *   rules that go with them: secrets encrypted at rest, codes stored only as a
 *   hash, expiry, attempt limits and a resend cooldown.
 *
 * TODO MEMBER_2: WHAT IS LEFT FOR YOU
 *   The login challenge itself. Today AuthService completes a sign-in as soon
 *   as the password is correct. The 2FA login flow should be:
 *     1. password verified -> if 2FA is enabled, do NOT save the security
 *        context yet; return "challenge required" plus the method to use
 *     2. the user submits the TOTP or email code
 *     3. only then save the SecurityContext and return the session
 *   Everything you need is already here: verifyTotpCode() and
 *   verifyEmailCode() can be reused unchanged for step 2.
 */
@Service
public class TwoFactorService {

    private static final String ISSUER = "InternshipJP";

    private final UserRepository userRepository;
    private final UserTwoFactorSettingsRepository settingsRepository;
    private final EmailOtpChallengeRepository challengeRepository;
    private final TotpService totpService;
    private final OtpMailService otpMailService;
    private final SecretEncryptor secretEncryptor;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;
    private final SecureRandom random = new SecureRandom();

    public TwoFactorService(UserRepository userRepository,
                            UserTwoFactorSettingsRepository settingsRepository,
                            EmailOtpChallengeRepository challengeRepository,
                            TotpService totpService,
                            OtpMailService otpMailService,
                            SecretEncryptor secretEncryptor,
                            PasswordEncoder passwordEncoder,
                            AppProperties appProperties) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.challengeRepository = challengeRepository;
        this.totpService = totpService;
        this.otpMailService = otpMailService;
        this.secretEncryptor = secretEncryptor;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
    }

    @Transactional(readOnly = true)
    public TwoFactorStatusResponse getStatus(Long userId) {
        TwoFactorStatusResponse response = new TwoFactorStatusResponse();
        UserTwoFactorSettings settings = settingsRepository.findByUserId(userId).orElse(null);

        response.setTotpEnabled(settings != null && settings.isTotpEnabled());
        response.setEmailOtpEnabled(settings != null && settings.isEmailOtpEnabled());
        response.setPreferredMethod(settings == null || settings.getPreferredMethod() == null
                ? TwoFactorMethod.NONE.name() : settings.getPreferredMethod().name());
        // Tells the UI whether to even offer TOTP: without an encryption key
        // the server refuses to store a secret.
        response.setTotpAvailable(secretEncryptor.isConfigured());
        return response;
    }

    // ------------------------------------------------------------------ TOTP

    /**
     * Step 1 of enabling TOTP: create a secret and show it once.
     * TOTP is not active until verifyTotpSetup() succeeds, so a user cannot
     * lock themselves out by abandoning the setup half way.
     */
    @Transactional
    public TotpSetupResponse startTotpSetup(Long userId) {
        if (!secretEncryptor.isConfigured()) {
            throw new BadRequestException(
                    "Authenticator app sign-in is unavailable: the server has no TOTP_ENCRYPTION_KEY set.");
        }
        User user = requireUser(userId);
        UserTwoFactorSettings settings = requireSettings(user);

        String secret = totpService.generateSecret();
        settings.setEncryptedTotpSecret(secretEncryptor.encrypt(secret));
        settings.setTotpEnabled(false);
        settingsRepository.save(settings);

        TotpSetupResponse response = new TotpSetupResponse();
        response.setSecret(secret);
        response.setOtpAuthUri(totpService.buildOtpAuthUri(ISSUER, user.getEmail(), secret));
        response.setIssuer(ISSUER);
        response.setAccountName(user.getEmail());
        return response;
    }

    /** Step 2: the user proves the app is set up correctly. */
    @Transactional
    public void verifyTotpSetup(Long userId, String code) {
        UserTwoFactorSettings settings = requireExistingSettings(userId);
        if (settings.getEncryptedTotpSecret() == null) {
            throw new BadRequestException("Start the authenticator setup first.");
        }
        if (!verifyTotpCode(userId, code)) {
            throw new BadRequestException("That code is not correct. Check the app and try again.");
        }
        settings.setTotpEnabled(true);
        settings.setPreferredMethod(TwoFactorMethod.TOTP);
        settingsRepository.save(settings);
    }

    /** Reusable by the future login challenge. */
    @Transactional(readOnly = true)
    public boolean verifyTotpCode(Long userId, String code) {
        UserTwoFactorSettings settings = requireExistingSettings(userId);
        if (settings.getEncryptedTotpSecret() == null) {
            return false;
        }
        String secret = secretEncryptor.decrypt(settings.getEncryptedTotpSecret());
        return totpService.verify(secret, code);
    }

    @Transactional
    public void disableTotp(Long userId) {
        UserTwoFactorSettings settings = requireExistingSettings(userId);
        settings.setTotpEnabled(false);
        settings.setEncryptedTotpSecret(null);
        if (settings.getPreferredMethod() == TwoFactorMethod.TOTP) {
            settings.setPreferredMethod(settings.isEmailOtpEnabled()
                    ? TwoFactorMethod.EMAIL_OTP : TwoFactorMethod.NONE);
        }
        settingsRepository.save(settings);
    }

    // ------------------------------------------------------------- email OTP

    /**
     * Sends a fresh code. Only the hash is stored, so the database never
     * contains a usable code.
     */
    @Transactional
    public void sendEmailOtp(Long userId, OtpPurpose purpose) {
        User user = requireUser(userId);
        requireSettings(user);

        challengeRepository
                .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(userId, purpose)
                .ifPresent(this::requireCooldownElapsed);

        String code = randomDigits(appProperties.getOtp().getLength());

        EmailOtpChallenge challenge = new EmailOtpChallenge();
        challenge.setUser(user);
        challenge.setOtpHash(passwordEncoder.encode(code));
        challenge.setPurpose(purpose);
        challenge.setExpiresAt(LocalDateTime.now()
                .plusMinutes(appProperties.getOtp().getExpiryMinutes()));
        challenge.setAttemptCount(0);
        challengeRepository.save(challenge);

        otpMailService.sendOtp(user.getEmail(), code, purpose.name());
    }

    /** Step 2 of enabling email OTP. */
    @Transactional
    public void verifyEmailOtpSetup(Long userId, String code) {
        if (!verifyEmailCode(userId, code, OtpPurpose.ENABLE_EMAIL_OTP)) {
            throw new BadRequestException("That code is not correct or has expired.");
        }
        UserTwoFactorSettings settings = requireExistingSettings(userId);
        settings.setEmailOtpEnabled(true);
        if (settings.getPreferredMethod() == null
                || settings.getPreferredMethod() == TwoFactorMethod.NONE) {
            settings.setPreferredMethod(TwoFactorMethod.EMAIL_OTP);
        }
        settingsRepository.save(settings);
    }

    /**
     * Checks a submitted code against the newest unused challenge.
     * Reusable by the future login challenge.
     */
    @Transactional
    public boolean verifyEmailCode(Long userId, String code, OtpPurpose purpose) {
        EmailOtpChallenge challenge = challengeRepository
                .findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(userId, purpose)
                .orElseThrow(() -> new BadRequestException("Request a code first."));

        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("That code has expired. Request a new one.");
        }
        if (challenge.getAttemptCount() >= appProperties.getOtp().getMaxAttempts()) {
            throw new BadRequestException("Too many incorrect attempts. Request a new code.");
        }

        boolean matches = passwordEncoder.matches(code.trim(), challenge.getOtpHash());
        if (!matches) {
            // Count the failure so codes cannot be brute-forced.
            challenge.setAttemptCount(challenge.getAttemptCount() + 1);
            challengeRepository.save(challenge);
            return false;
        }

        // A code works exactly once.
        challenge.setConsumedAt(LocalDateTime.now());
        challengeRepository.save(challenge);
        return true;
    }

    @Transactional
    public void disableEmailOtp(Long userId) {
        UserTwoFactorSettings settings = requireExistingSettings(userId);
        settings.setEmailOtpEnabled(false);
        if (settings.getPreferredMethod() == TwoFactorMethod.EMAIL_OTP) {
            settings.setPreferredMethod(settings.isTotpEnabled()
                    ? TwoFactorMethod.TOTP : TwoFactorMethod.NONE);
        }
        settingsRepository.save(settings);
    }

    // ---------------------------------------------------------------- helpers

    private void requireCooldownElapsed(EmailOtpChallenge previous) {
        long secondsSince = Duration.between(
                previous.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant(),
                Instant.now()).getSeconds();
        int cooldown = appProperties.getOtp().getResendCooldownSeconds();
        if (secondsSince < cooldown) {
            throw new BadRequestException(
                    "Please wait " + (cooldown - secondsSince) + " more seconds before asking for a new code.");
        }
    }

    private String randomDigits(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(random.nextInt(10));
        }
        return builder.toString();
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("Account", userId));
    }

    /** Settings rows are created on demand the first time 2FA is touched. */
    private UserTwoFactorSettings requireSettings(User user) {
        return settingsRepository.findByUserId(user.getId()).orElseGet(() -> {
            UserTwoFactorSettings created = new UserTwoFactorSettings();
            created.setUser(user);
            created.setTotpEnabled(false);
            created.setEmailOtpEnabled(false);
            created.setPreferredMethod(TwoFactorMethod.NONE);
            return settingsRepository.save(created);
        });
    }

    private UserTwoFactorSettings requireExistingSettings(Long userId) {
        return settingsRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Two-factor authentication is not set up yet."));
    }
}
