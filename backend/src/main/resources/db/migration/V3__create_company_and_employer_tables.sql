-- ===========================================================================
-- V3 - Company and employer domain
-- Owner: Member 3 (company + employer profile), approval flow: Member 4
--
-- Registration flow this schema supports:
--   POST /api/auth/register/employer
--     -> creates users(role=EMPLOYER, account_status=PENDING)
--     -> creates companies(approval_status=PENDING)
--     -> creates employer_profiles linking the two
--   Admin approves  -> companies.approval_status=APPROVED, users.account_status=ACTIVE
--   Only then may the employer publish internships.
-- ===========================================================================

CREATE TABLE companies (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    name            VARCHAR(150) NOT NULL,
    industry        VARCHAR(100) NULL,
    website         VARCHAR(255) NULL,
    location        VARCHAR(150) NULL,
    description     VARCHAR(1500) NULL,
    logo_path       VARCHAR(500) NULL,
    -- PENDING | APPROVED | REJECTED | MORE_INFO_REQUIRED
    approval_status VARCHAR(25)  NOT NULL DEFAULT 'PENDING',
    approval_note   VARCHAR(500) NULL,
    -- users.id of the admin who decided. Kept even if that admin is removed.
    approved_by     BIGINT       NULL,
    approved_at     DATETIME(6)  NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_company_approver FOREIGN KEY (approved_by)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE employer_profiles (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    company_id    BIGINT       NOT NULL,
    job_title     VARCHAR(120) NULL,
    work_email    VARCHAR(190) NULL,
    contact_phone VARCHAR(30)  NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_employer_profile_user UNIQUE (user_id),
    CONSTRAINT fk_employer_profile_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    -- RESTRICT: a company that still has managers cannot be deleted by accident.
    CONSTRAINT fk_employer_profile_company FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
