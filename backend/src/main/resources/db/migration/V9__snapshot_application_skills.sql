-- Skills as they stood when the application was made.
--
-- WHY A COPY RATHER THAN A LOOKUP
--   The employer's view read the student's CURRENT skills, so a student could
--   apply, then add five skills, and the employer would see them attached to an
--   application that was never made with them. An application is a statement
--   about a person at a moment; reading it later should show what was said at
--   the time, not what has been said since.
--
--   It also means an employer reviewing two applications a month apart is
--   comparing like with like.
--
-- WHY THIS MIGRATION IS SAFE ON AN EXISTING DATABASE
--   It only creates a table. Nothing is altered, nothing is constrained, and no
--   existing row has to satisfy anything - so it cannot fail on data that is
--   already here.
--
--   Applications made before this migration have no rows here. The service
--   falls back to the live skills for those, which is the behaviour they were
--   created under.

CREATE TABLE application_skills (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    application_id BIGINT       NOT NULL,
    name           VARCHAR(100) NOT NULL,
    skill_type     VARCHAR(30)  NOT NULL,
    proficiency    VARCHAR(20)  NULL,
    created_at     DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_application_skill_application
        FOREIGN KEY (application_id) REFERENCES applications (id)
        ON DELETE CASCADE,
    KEY idx_application_skill_application (application_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci;
