package com.internshipjp.backend.entity;

/**
 * Why an email OTP was issued. Member 2 adds LOGIN_CHALLENGE handling.
 */
public enum OtpPurpose {
    ENABLE_EMAIL_OTP,

    /** A code emailed to someone who cannot sign in. */
    PASSWORD_RESET,
    LOGIN_CHALLENGE
}
