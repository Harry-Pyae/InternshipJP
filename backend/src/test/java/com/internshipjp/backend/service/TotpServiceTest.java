package com.internshipjp.backend.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Checks the TOTP implementation against the behaviour an authenticator app
 * expects. No Spring context, no database, no network.
 */
class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    @Test
    void generatesADifferentSecretEveryTime() {
        String first = totpService.generateSecret();
        String second = totpService.generateSecret();

        assertNotEquals(first, second);
        // Base32 with no padding, so an authenticator app can read it.
        assertFalse(first.contains("="));
        assertTrue(first.matches("[A-Z2-7]+"), "a Base32 secret should only use A-Z and 2-7");
    }

    @Test
    void producesSixDigits() {
        String code = totpService.generateCode(totpService.generateSecret(), Instant.now());

        assertEquals(6, code.length());
        assertTrue(code.matches("\\d{6}"));
    }

    @Test
    void acceptsTheCodeItJustGenerated() {
        String secret = totpService.generateSecret();
        String code = totpService.generateCode(secret, Instant.now());

        assertTrue(totpService.verify(secret, code));
    }

    @Test
    void acceptsACodeFromTheStepBeforeSoASlowUserIsNotPunished() {
        String secret = totpService.generateSecret();
        String previousCode = totpService.generateCode(secret, Instant.now().minusSeconds(30));

        assertTrue(totpService.verify(secret, previousCode));
    }

    @Test
    void rejectsACodeFromLongAgo() {
        String secret = totpService.generateSecret();
        String oldCode = totpService.generateCode(secret, Instant.now().minusSeconds(600));

        assertFalse(totpService.verify(secret, oldCode));
    }

    @Test
    void rejectsACodeFromADifferentSecret() {
        String code = totpService.generateCode(totpService.generateSecret(), Instant.now());

        assertFalse(totpService.verify(totpService.generateSecret(), code));
    }

    @Test
    void rejectsRubbishInsteadOfThrowing() {
        String secret = totpService.generateSecret();

        assertFalse(totpService.verify(secret, ""));
        assertFalse(totpService.verify(secret, "12345"));
        assertFalse(totpService.verify(secret, "abcdef"));
        assertFalse(totpService.verify(secret, null));
    }

    @Test
    void buildsAnOtpAuthUriAnAuthenticatorAppCanRead() {
        String secret = totpService.generateSecret();
        String uri = totpService.buildOtpAuthUri("InternshipJP", "student@example.com", secret);

        assertTrue(uri.startsWith("otpauth://totp/"));
        assertTrue(uri.contains("secret=" + secret));
        assertTrue(uri.contains("digits=6"));
        assertTrue(uri.contains("period=30"));
    }
}
