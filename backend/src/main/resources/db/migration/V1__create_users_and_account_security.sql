-- ===========================================================================
-- V1 - Accounts and account security
-- Owner: Member 2 (Authentication, Security, Student)
--
-- Conventions used by every migration in this project:
--   * BIGINT AUTO_INCREMENT primary keys named "id"
--   * DATETIME(6) for timestamps (matches Java LocalDateTime exactly, which
--     keeps spring.jpa.hibernate.ddl-auto=validate happy)
--   * status columns are VARCHAR, never MariaDB ENUM, so Java enums can be
--     mapped with @Enumerated(EnumType.STRING)
--   * VARCHAR instead of TEXT so Hibernate validation stays predictable
--   * every table is InnoDB + utf8mb4
-- ===========================================================================

CREATE TABLE users (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    email          VARCHAR(190) NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    phone          VARCHAR(30)  NULL,
    -- STUDENT | EMPLOYER | ADMIN
    role           VARCHAR(20)  NOT NULL,
    -- ACTIVE | PENDING | SUSPENDED
    account_status VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    last_login_at  DATETIME(6)  NULL,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per user. Created lazily the first time 2FA is touched.
CREATE TABLE user_two_factor_settings (
    id                    BIGINT      NOT NULL AUTO_INCREMENT,
    user_id               BIGINT      NOT NULL,
    totp_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,
    email_otp_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
    -- AES-GCM ciphertext, never the raw Base32 secret. See util/SecretEncryptor.
    encrypted_totp_secret VARCHAR(512) NULL,
    -- TOTP | EMAIL_OTP | NONE
    preferred_method      VARCHAR(20)  NULL,
    created_at            DATETIME(6)  NOT NULL,
    updated_at            DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_two_factor_user UNIQUE (user_id),
    CONSTRAINT fk_two_factor_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Short-lived email OTP challenges. Only a hash of the code is stored.
CREATE TABLE email_otp_challenges (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    otp_hash      VARCHAR(100) NOT NULL,
    -- ENABLE_EMAIL_OTP | LOGIN_CHALLENGE (Member 2 adds more)
    purpose       VARCHAR(30)  NOT NULL,
    expires_at    DATETIME(6)  NOT NULL,
    consumed_at   DATETIME(6)  NULL,
    attempt_count INT          NOT NULL DEFAULT 0,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_email_otp_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
