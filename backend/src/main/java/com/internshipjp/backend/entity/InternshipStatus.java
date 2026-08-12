package com.internshipjp.backend.entity;

/**
 * Internship lifecycle.
 * Only OPEN internships are visible to students and accept applications.
 */
public enum InternshipStatus {
    DRAFT,
    OPEN,
    CLOSED,
    FILLED,
    ARCHIVED
}
