-- ===========================================================================
-- V5 - Certificates and notifications
-- certificates: uploaded by Member 2's student module, verified by Member 4
-- notifications: Member 4
--
-- CERTIFICATE TRUST RULE (non-negotiable, enforced in the backend):
--   A certificate only counts as evidence for recruitment when
--   verification_status = 'VERIFIED'.
--   Students see all of their own certificates.
--   Admins see every certificate.
--   Employers see VERIFIED certificates only, and only for applicants of
--   internships their own company owns.
-- ===========================================================================

CREATE TABLE certificates (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    -- references student_profiles.id (the brief calls this "student_id")
    student_profile_id   BIGINT       NOT NULL,
    title                VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200) NULL,
    issue_date           DATE         NULL,
    -- File metadata. The file itself lives under UPLOAD_ROOT, never in the DB.
    original_file_name   VARCHAR(255) NOT NULL,
    stored_file_name     VARCHAR(255) NOT NULL,
    storage_path         VARCHAR(500) NOT NULL,
    mime_type            VARCHAR(100) NOT NULL,
    file_size            BIGINT       NOT NULL,
    -- PENDING | VERIFIED | REJECTED  (new uploads always start PENDING)
    verification_status  VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    verification_note    VARCHAR(500) NULL,
    verified_by          BIGINT       NULL,
    verified_at          DATETIME(6)  NULL,
    created_at           DATETIME(6)  NOT NULL,
    updated_at           DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_certificate_student FOREIGN KEY (student_profile_id)
        REFERENCES student_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_certificate_verifier FOREIGN KEY (verified_by)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    user_id    BIGINT        NOT NULL,
    -- e.g. APPLICATION_STATUS_CHANGED, CERTIFICATE_VERIFIED, COMPANY_APPROVED
    type       VARCHAR(50)   NOT NULL,
    title      VARCHAR(200)  NOT NULL,
    message    VARCHAR(1000) NULL,
    is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)   NOT NULL,
    read_at    DATETIME(6)   NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
