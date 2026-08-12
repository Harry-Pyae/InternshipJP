package com.internshipjp.backend.util;

import com.internshipjp.backend.config.AppProperties;
import com.internshipjp.backend.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Encrypts small secrets before they are written to the database.
 *
 * Used for TOTP secrets: if someone got a copy of the database, plain secrets
 * would let them generate valid 2FA codes forever.
 *
 * Algorithm: AES-GCM with a random 12-byte IV per value. The stored string is
 * Base64( iv || ciphertext ), so every encryption of the same input differs.
 *
 * The key comes from TOTP_ENCRYPTION_KEY and is never written to a log.
 * If no key is configured the class reports isConfigured() == false and the
 * 2FA endpoints refuse to store anything, rather than silently downgrading to
 * plain text.
 */
@Component
public class SecretEncryptor {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKey key;
    private final SecureRandom random = new SecureRandom();

    public SecretEncryptor(AppProperties appProperties) {
        String configured = appProperties.getSecurity().getTotpEncryptionKey();
        this.key = buildKey(configured);
    }

    private SecretKey buildKey(String base64Key) {
        if (!StringUtils.hasText(base64Key)) {
            return null;
        }
        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(base64Key.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(
                    "TOTP_ENCRYPTION_KEY is not valid Base64. Generate one with: openssl rand -base64 32");
        }
        if (raw.length != 16 && raw.length != 24 && raw.length != 32) {
            throw new IllegalStateException(
                    "TOTP_ENCRYPTION_KEY must decode to 16, 24 or 32 bytes but was " + raw.length);
        }
        return new SecretKeySpec(raw, ALGORITHM);
    }

    public boolean isConfigured() {
        return key != null;
    }

    private void requireKey() {
        if (key == null) {
            throw new BadRequestException(
                    "Two-factor authentication is not available: the server has no TOTP_ENCRYPTION_KEY configured.");
        }
    }

    public String encrypt(String plainText) {
        requireKey();
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception ex) {
            // Never include the value being encrypted in the message.
            throw new IllegalStateException("Could not encrypt the secret", ex);
        }
    }

    public String decrypt(String stored) {
        requireKey();
        try {
            byte[] combined = Base64.getDecoder().decode(stored);
            byte[] iv = new byte[IV_LENGTH];
            byte[] cipherText = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            System.arraycopy(combined, IV_LENGTH, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not decrypt the stored secret. "
                    + "Was TOTP_ENCRYPTION_KEY changed after the secret was saved?", ex);
        }
    }
}
