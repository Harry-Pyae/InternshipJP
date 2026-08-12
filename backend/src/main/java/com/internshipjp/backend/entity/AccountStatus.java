package com.internshipjp.backend.entity;

/**
 * Lifecycle of a user account.
 * PENDING employers can sign in but cannot publish until an admin approves them.
 * SUSPENDED accounts cannot sign in at all.
 */
public enum AccountStatus {
    ACTIVE,
    PENDING,
    SUSPENDED
}
