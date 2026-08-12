-- ===========================================================================
-- V4 - Internships and applications
-- Owner: Member 3
--
-- The duplicate-application rule required by the project brief is enforced
-- twice: here as uk_application_once, and again in ApplicationService so the
-- user gets a readable 409 instead of a database error.
-- ===========================================================================

CREATE TABLE internships (
    id                   BIGINT        NOT NULL AUTO_INCREMENT,
    company_id           BIGINT        NOT NULL,
    -- users.id of the employer who created it (audit only)
    created_by           BIGINT        NULL,
    title                VARCHAR(150)  NOT NULL,
    description          VARCHAR(2000) NULL,
    responsibilities     VARCHAR(2000) NULL,
    requirements         VARCHAR(2000) NULL,
    location             VARCHAR(150)  NULL,
    -- ONSITE | REMOTE | HYBRID
    work_mode            VARCHAR(20)   NOT NULL DEFAULT 'ONSITE',
    duration_months      INT           NULL,
    stipend_amount       DECIMAL(10,2) NULL,
    stipend_currency     VARCHAR(10)   NULL,
    available_positions  INT           NOT NULL DEFAULT 1,
    application_deadline DATE          NULL,
    -- DRAFT | OPEN | CLOSED | FILLED | ARCHIVED
    status               VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    published_at         DATETIME(6)   NULL,
    created_at           DATETIME(6)   NOT NULL,
    updated_at           DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_internship_company FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT fk_internship_creator FOREIGN KEY (created_by)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE internship_skills (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    internship_id BIGINT       NOT NULL,
    name          VARCHAR(100) NOT NULL,
    -- TRUE = mandatory requirement, FALSE = nice to have
    required      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_internship_skill UNIQUE (internship_id, name),
    CONSTRAINT fk_internship_skill FOREIGN KEY (internship_id)
        REFERENCES internships (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE applications (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    internship_id      BIGINT        NOT NULL,
    -- references student_profiles.id (the brief calls this "student_id")
    student_profile_id BIGINT        NOT NULL,
    cover_letter       VARCHAR(3000) NULL,
    resume_id          BIGINT        NULL,
    -- APPLIED | UNDER_REVIEW | SHORTLISTED | INTERVIEW | ACCEPTED | REJECTED | WITHDRAWN
    status             VARCHAR(20)   NOT NULL DEFAULT 'APPLIED',
    -- users.id of whoever recorded the last decision
    decided_by         BIGINT        NULL,
    decided_at         DATETIME(6)   NULL,
    created_at         DATETIME(6)   NOT NULL,
    updated_at         DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_application_once UNIQUE (internship_id, student_profile_id),
    CONSTRAINT fk_application_internship FOREIGN KEY (internship_id)
        REFERENCES internships (id) ON DELETE CASCADE,
    CONSTRAINT fk_application_student FOREIGN KEY (student_profile_id)
        REFERENCES student_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_application_resume FOREIGN KEY (resume_id)
        REFERENCES student_resumes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit trail: every status change records who changed it and when.
CREATE TABLE application_status_history (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    application_id BIGINT       NOT NULL,
    from_status    VARCHAR(20)  NULL,
    to_status      VARCHAR(20)  NOT NULL,
    changed_by     BIGINT       NULL,
    note           VARCHAR(500) NULL,
    created_at     DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_status_history_application FOREIGN KEY (application_id)
        REFERENCES applications (id) ON DELETE CASCADE,
    CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
