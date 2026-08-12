package com.internshipjp.backend.entity;

/**
 * Application lifecycle. Legal transitions live in ApplicationService.
 */
public enum ApplicationStatus {
    APPLIED,
    UNDER_REVIEW,
    SHORTLISTED,
    INTERVIEW,
    ACCEPTED,
    REJECTED,
    WITHDRAWN
}
