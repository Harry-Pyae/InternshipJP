package com.internshipjp.backend.entity;

/**
 * Why an email OTP was issued. Member 2 adds LOGIN_CHALLENGE handling.
 */
public enum OtpPurpose {
    ENABLE_EMAIL_OTP,
    LOGIN_CHALLENGE
}
