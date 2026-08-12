-- ===========================================================================
-- V2 - Student domain
-- Owner: Member 2 (student profile, education, skills, interests, resumes)
--
-- One student = one row in users (role=STUDENT) + one row in student_profiles.
-- Everything else hangs off student_profiles.id.
-- ===========================================================================

CREATE TABLE student_profiles (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    university      VARCHAR(150) NULL,
    degree          VARCHAR(150) NULL,
    field_of_study  VARCHAR(150) NULL,
    graduation_year INT          NULL,
    biography       VARCHAR(1500) NULL,
    location        VARCHAR(150) NULL,
    -- FULL_TIME | PART_TIME | INTERNSHIP_ONLY ... free text for now
    availability    VARCHAR(50)  NULL,
    portfolio_url   VARCHAR(255) NULL,
    linkedin_url    VARCHAR(255) NULL,
    created_at      DATETIME(6)  NOT NULL,
    updated_at      DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_student_profile_user UNIQUE (user_id),
    CONSTRAINT fk_student_profile_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE student_education (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    student_profile_id BIGINT       NOT NULL,
    institution        VARCHAR(150) NOT NULL,
    degree             VARCHAR(150) NULL,
    field_of_study     VARCHAR(150) NULL,
    start_year         INT          NULL,
    end_year           INT          NULL,
    grade              VARCHAR(50)  NULL,
    created_at         DATETIME(6)  NOT NULL,
    updated_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_education_student FOREIGN KEY (student_profile_id)
        REFERENCES student_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE student_skills (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    student_profile_id BIGINT       NOT NULL,
    name               VARCHAR(100) NOT NULL,
    -- TECHNICAL | SOFT
    skill_type         VARCHAR(20)  NOT NULL,
    -- BEGINNER | INTERMEDIATE | ADVANCED (optional)
    proficiency        VARCHAR(20)  NULL,
    created_at         DATETIME(6)  NOT NULL,
    updated_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_student_skill_name UNIQUE (student_profile_id, name),
    CONSTRAINT fk_skill_student FOREIGN KEY (student_profile_id)
        REFERENCES student_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE student_interests (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    student_profile_id BIGINT       NOT NULL,
    interest           VARCHAR(120) NOT NULL,
    created_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_student_interest UNIQUE (student_profile_id, interest),
    CONSTRAINT fk_interest_student FOREIGN KEY (student_profile_id)
        REFERENCES student_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Resume files live on disk (see storage/FileStorageService). Only metadata
-- is stored here - never the file bytes.
CREATE TABLE student_resumes (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    student_profile_id BIGINT       NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name   VARCHAR(255) NOT NULL,
    storage_path       VARCHAR(500) NOT NULL,
    mime_type          VARCHAR(100) NOT NULL,
    file_size          BIGINT       NOT NULL,
    is_primary         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         DATETIME(6)  NOT NULL,
    updated_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_resume_student FOREIGN KEY (student_profile_id)
        REFERENCES student_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
