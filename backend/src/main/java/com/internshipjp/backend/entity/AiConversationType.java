package com.internshipjp.backend.entity;

/**
 * Which AI feature a conversation belongs to.
 *
 * STUDENT_GUIDANCE        career coaching for one student
 * EMPLOYER_COMPARISON     comparing the applicants of one internship
 * EMPLOYER_COMPANY_REVIEW reviewing the employer's own listings and pipeline
 *
 * Stored as a VARCHAR, so adding a value needs no migration.
 */
public enum AiConversationType {
    STUDENT_GUIDANCE,
    EMPLOYER_COMPARISON,
    EMPLOYER_COMPANY_REVIEW
}
