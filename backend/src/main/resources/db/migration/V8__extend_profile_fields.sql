-- ===========================================================================
-- V8 - Richer profiles for all three roles
--
-- Added after V1..V7 were shared, so those files stay frozen. This is the
-- pattern for every future change: never edit a migration someone else has
-- already run, always add the next number.
--
-- EVERY COLUMN HERE IS NULLABLE (or has a default). That matters: existing
-- rows keep working, and Hibernate's ddl-auto=validate does not complain about
-- database columns an entity has not mapped yet. So this migration can be
-- merged before Members 2 and 3 have finished using the new fields.
--
-- OWNERSHIP
--   users              Member 2
--   student_profiles   Member 2
--   companies          Member 3
--   employer_profiles  Member 3
-- Coordinated by Member 1 (schema review). Tell the owners before merging.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- users - shared by students, employers and administrators
-- ---------------------------------------------------------------------------
-- Profile photo. The file lives under UPLOAD_ROOT like certificates do; only
-- the path is stored, never the image itself.
ALTER TABLE users
    ADD COLUMN photo_path VARCHAR(500) NULL AFTER phone;

-- ---------------------------------------------------------------------------
-- student_profiles - Member 2
-- ---------------------------------------------------------------------------
ALTER TABLE student_profiles
    -- One line under the name: "Third-year CS student, backend and databases".
    ADD COLUMN headline VARCHAR(150) NULL AFTER user_id,

    -- Date of birth, NOT age.
    -- Age is a value that becomes wrong while it sits in the table. The date
    -- never changes, and the age is one subtraction away whenever it is needed
    -- (see StudentMapper). Storing the age instead is a classic bug: the row
    -- silently goes stale on every birthday.
    ADD COLUMN date_of_birth DATE NULL AFTER graduation_year,

    -- Together these express "attending year" without a free-text field:
    --   currently_attending = TRUE  + graduation_year 2027 -> expects to finish 2027
    --   currently_attending = FALSE + graduation_year 2024 -> graduated in 2024
    ADD COLUMN currently_attending BOOLEAN NOT NULL DEFAULT TRUE AFTER graduation_year,

    -- "location" already holds the city. This completes the address.
    ADD COLUMN country VARCHAR(100) NULL AFTER location,

    ADD COLUMN github_url VARCHAR(255) NULL AFTER linkedin_url,

    -- What the student is looking for, so matching can use it later.
    -- ONSITE | REMOTE | HYBRID, or NULL for no preference.
    ADD COLUMN preferred_work_mode VARCHAR(20) NULL AFTER availability,
    ADD COLUMN available_from DATE NULL AFTER preferred_work_mode;

-- ---------------------------------------------------------------------------
-- companies - Member 3
-- ---------------------------------------------------------------------------
ALTER TABLE companies
    -- Free text rather than a fixed set, so nobody has to run a migration to
    -- add a size band. e.g. "1-10", "11-50", "51-200", "200+".
    ADD COLUMN company_size VARCHAR(30) NULL AFTER industry,
    ADD COLUMN founded_year INT NULL AFTER company_size,

    -- Business registration number. This is what an administrator actually
    -- checks before approving a company, so it belongs next to the approval
    -- columns rather than in a note field.
    ADD COLUMN registration_number VARCHAR(100) NULL AFTER founded_year,

    ADD COLUMN contact_email VARCHAR(190) NULL AFTER website,
    ADD COLUMN contact_phone VARCHAR(30) NULL AFTER contact_email,
    ADD COLUMN linkedin_url VARCHAR(255) NULL AFTER contact_phone,

    ADD COLUMN address VARCHAR(255) NULL AFTER location,
    ADD COLUMN country VARCHAR(100) NULL AFTER address;

-- ---------------------------------------------------------------------------
-- employer_profiles - Member 3
-- ---------------------------------------------------------------------------
ALTER TABLE employer_profiles
    ADD COLUMN department VARCHAR(120) NULL AFTER job_title;

-- ---------------------------------------------------------------------------
-- Indexes for the filters these new columns make possible
-- ---------------------------------------------------------------------------
CREATE INDEX idx_student_availability ON student_profiles (available_from);
CREATE INDEX idx_companies_country ON companies (country);

-- ---------------------------------------------------------------------------
-- NOTE ON PROGRAMMING LANGUAGES
--   No new table. Java, PHP, TypeScript and so on are already rows in
--   student_skills, and skill_type is a VARCHAR, so the Java enum gains
--   PROGRAMMING_LANGUAGE and SPOKEN_LANGUAGE without any schema change.
--   Existing TECHNICAL rows stay valid.
--
--   This is why status columns are VARCHAR and never MariaDB ENUM: a new
--   category costs a code change, not a migration on everyone's database.
-- ---------------------------------------------------------------------------
