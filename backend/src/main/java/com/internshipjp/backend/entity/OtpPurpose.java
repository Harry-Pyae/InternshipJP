package com.internshipjp.backend.entity;

/**
 * Why an email OTP was issued. Member 2 adds LOGIN_CHALLENGE handling.
 */
public enum OtpPurpose {
    ENABLE_EMAIL_OTP,

    /** A code emailed to someone who cannot sign in. */
    PASSWORD_RESET,
    LOGIN_CHALLENGE,

    /**
     * A code emailed to somebody invited to become an administrator.
     *
     * The invited account exists with role ADMIN and status PENDING but no
     * password: one administrator must never set another's credentials, so the
     * invitee proves control of the mailbox and chooses their own.
     */
    ADMIN_INVITE
}
