package com.internshipjp.backend.service;

import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Time-based one-time passwords (RFC 6238) for Google Authenticator,
 * Microsoft Authenticator, Authy and similar apps.
 *
 * HOW IT WORKS, IN ONE PARAGRAPH
 *   The server and the phone share a random secret. Both divide the current
 *   Unix time by 30 to get a counter, run HMAC-SHA1(secret, counter), and take
 *   6 digits out of the result. Same secret + same 30-second window = same
 *   code, with no network traffic between them.
 *
 * IMPLEMENTATION NOTE FOR THE TEAM
 *   This is written directly against the JDK's own crypto (javax.crypto.Mac)
 *   plus Apache Commons Codec for Base32, rather than pulling in a TOTP
 *   library. The algorithm is ~40 lines, it is a published standard, and
 *   keeping it here means the whole 2FA path is readable and has one less
 *   third-party dependency to keep up to date. If you would rather use a
 *   library later, this class is the only file that has to change.
 *
 * SECRETS ARE NEVER LOGGED and never stored unencrypted - see SecretEncryptor.
 */
@Service
public class TotpService {

    private static final String HMAC_ALGORITHM = "HmacSHA1";
    private static final int SECRET_BYTES = 20;
    private static final int DIGITS = 6;
    private static final long PERIOD_SECONDS = 30L;

    /**
     * How many 30-second steps either side of "now" are still accepted.
     * 1 means a code stays valid for about 90 seconds, which covers a phone
     * whose clock drifts slightly.
     */
    private static final int ALLOWED_DRIFT_STEPS = 1;

    private static final int[] POWERS = {1, 10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000};

    private final SecureRandom random = new SecureRandom();
    private final Base32 base32 = new Base32();

    /** A fresh random secret, Base32-encoded the way authenticator apps expect. */
    public String generateSecret() {
        byte[] buffer = new byte[SECRET_BYTES];
        random.nextBytes(buffer);
        return base32.encodeToString(buffer).replace("=", "");
    }

    /** The code that should be showing on the phone right now. */
    public String generateCode(String base32Secret, Instant when) {
        return generateForStep(base32Secret, when.getEpochSecond() / PERIOD_SECONDS);
    }

    /**
     * Checks a code the user typed, allowing for small clock drift.
     * Uses a constant-time comparison so the check cannot be attacked by
     * measuring how long it takes.
     */
    public boolean verify(String base32Secret, String submittedCode) {
        if (base32Secret == null || submittedCode == null) {
            return false;
        }
        String candidate = submittedCode.trim().replace(" ", "");
        if (candidate.length() != DIGITS) {
            return false;
        }
        long currentStep = Instant.now().getEpochSecond() / PERIOD_SECONDS;
        for (int offset = -ALLOWED_DRIFT_STEPS; offset <= ALLOWED_DRIFT_STEPS; offset++) {
            String expected = generateForStep(base32Secret, currentStep + offset);
            if (MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    candidate.getBytes(StandardCharsets.UTF_8))) {
                return true;
            }
        }
        return false;
    }

    /**
     * The otpauth:// URI an authenticator app can read from a QR code.
     * The frontend can render it as a QR image, or the user can type the
     * secret by hand.
     */
    public String buildOtpAuthUri(String issuer, String accountName, String base32Secret) {
        String encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
        String encodedAccount = URLEncoder.encode(accountName, StandardCharsets.UTF_8);
        return "otpauth://totp/" + encodedIssuer + ":" + encodedAccount
                + "?secret=" + base32Secret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1"
                + "&digits=" + DIGITS
                + "&period=" + PERIOD_SECONDS;
    }

    private String generateForStep(String base32Secret, long step) {
        byte[] key = base32.decode(base32Secret);
        byte[] counter = new byte[8];
        long value = step;
        for (int i = 7; i >= 0; i--) {
            counter[i] = (byte) (value & 0xFF);
            value >>= 8;
        }

        byte[] hash;
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(key, HMAC_ALGORITHM));
            hash = mac.doFinal(counter);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not calculate the TOTP code", ex);
        }

        // "Dynamic truncation" from RFC 4226: the last nibble picks the offset.
        int offset = hash[hash.length - 1] & 0x0F;
        int binary = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);

        int code = binary % POWERS[DIGITS];
        return String.format("%0" + DIGITS + "d", code);
    }
}
