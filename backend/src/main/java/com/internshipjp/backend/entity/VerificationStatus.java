package com.internshipjp.backend.entity;

/**
 * Certificate review state.
 * Only VERIFIED certificates may be shown to employers.
 */
public enum VerificationStatus {
    PENDING,
    VERIFIED,
    REJECTED
}
