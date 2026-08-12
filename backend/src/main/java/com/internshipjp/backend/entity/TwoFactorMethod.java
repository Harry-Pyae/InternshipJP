package com.internshipjp.backend.entity;

/**
 * Which second factor the user prefers at login.
 */
public enum TwoFactorMethod {
    NONE,
    TOTP,
    EMAIL_OTP
}
