# Database schema

Database: `internshipjp_db` (MariaDB, InnoDB, `utf8mb4`)
Owner of the migration sequence: **Member 1**

19 tables, created by Flyway migrations `V1` to `V7`. Hibernate runs with
`ddl-auto=validate`, so it checks the entities against these tables and never
alters them.

---

## Conventions

| Convention | Reason |
| --- | --- |
| `BIGINT AUTO_INCREMENT` primary key named `id` | one rule everywhere, no surprises in joins |
| `DATETIME(6)` for timestamps | matches Java `LocalDateTime` exactly, which keeps `validate` happy |
| `VARCHAR` status columns, never MariaDB `ENUM` | a new enum value needs a code change, not a schema change |
| `VARCHAR` rather than `TEXT` | keeps Hibernate's type validation predictable; see the note at the end |
| `created_at` / `updated_at` on records that change | set by `@PrePersist` / `@PreUpdate`, so no trigger is needed |
| named constraints (`uk_`, `fk_`) | a violation names the rule it broke, which makes errors readable |

**Migrations are append-only.** Once `V7` has been pushed and pulled, editing it
breaks every other machine with a checksum error. Add `V8__...sql` instead.

---

## V1 - Accounts and account security &nbsp;·&nbsp; Member 2

### `users`
Every account: student, employer and administrator.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | BIGINT PK | |
| `email` | VARCHAR(190) | `uk_users_email`, stored lower-case |
| `password_hash` | VARCHAR(100) | BCrypt. Never returned by any DTO |
| `full_name` | VARCHAR(150) | |
| `phone` | VARCHAR(30) | nullable |
| `role` | VARCHAR(20) | `STUDENT` \| `EMPLOYER` \| `ADMIN` |
| `account_status` | VARCHAR(20) | `ACTIVE` \| `PENDING` \| `SUSPENDED` |
| `last_login_at` | DATETIME(6) | nullable |

`PENDING` employers *can* sign in - they need to see "waiting for approval".
Only `SUSPENDED` is refused at login.

### `user_two_factor_settings`
One row per user, created the first time 2FA is touched.
`user_id` → `users` **CASCADE**, unique.
`encrypted_totp_secret` holds AES-GCM ciphertext, never the Base32 secret.

### `email_otp_challenges`
One row per issued code. `user_id` → `users` **CASCADE**.
`otp_hash` is a BCrypt hash, so the table never contains a usable code.
`attempt_count` enforces the brute-force limit; `consumed_at` makes a code
single-use.

---

## V2 - Student domain &nbsp;·&nbsp; Member 2

### `student_profiles`
`user_id` → `users` **CASCADE**, unique. One student = one profile.
Everything below hangs off `student_profiles.id`.

### `student_education`
`student_profile_id` → `student_profiles` **CASCADE**. Several rows per student.

### `student_skills`
`uk_student_skill_name (student_profile_id, name)` - a student cannot list the
same skill twice. `skill_type` is `TECHNICAL` \| `SOFT`; `proficiency` is
optional (`BEGINNER` \| `INTERMEDIATE` \| `ADVANCED`).

### `student_interests`
`uk_student_interest (student_profile_id, interest)`. Used as AI context.

### `student_resumes`
File **metadata** only - the bytes live under `UPLOAD_ROOT`.

---

## V3 - Company and employer &nbsp;·&nbsp; Member 3 (data) / Member 4 (approval)

### `companies`

| Column | Notes |
| --- | --- |
| `approval_status` | `PENDING` \| `APPROVED` \| `REJECTED` \| `MORE_INFO_REQUIRED` |
| `approval_note` | the administrator's reason |
| `approved_by` | `users.id`, **SET NULL** - the decision survives the admin's account |

Only an `APPROVED` company can publish an internship.

### `employer_profiles`
Links one employer user to one company.
`user_id` → `users` **CASCADE** (unique), `company_id` → `companies` **RESTRICT**
so a company with recruiters cannot be deleted by accident.

---

## V4 - Internships and applications &nbsp;·&nbsp; Member 3

### `internships`
`company_id` → `companies` **CASCADE**, `created_by` → `users` **SET NULL**.
`status` is `DRAFT` \| `OPEN` \| `CLOSED` \| `FILLED` \| `ARCHIVED`; only `OPEN`
is visible to students. `work_mode` is `ONSITE` \| `REMOTE` \| `HYBRID`.

### `internship_skills`
`uk_internship_skill (internship_id, name)`. `required` separates "must have"
from "nice to have". Feeds the transparent match score.

### `applications`

| Column | Notes |
| --- | --- |
| `internship_id` | → `internships` **CASCADE** |
| `student_profile_id` | → `student_profiles` **CASCADE** |
| `resume_id` | → `student_resumes` **SET NULL** |
| `status` | `APPLIED` \| `UNDER_REVIEW` \| `SHORTLISTED` \| `INTERVIEW` \| `ACCEPTED` \| `REJECTED` \| `WITHDRAWN` |
| `decided_by` / `decided_at` | who recorded the last decision |

**`uk_application_once (internship_id, student_profile_id)`** - the required rule
that one student cannot apply twice to the same internship. Also checked in
`ApplicationService` so the user gets a readable 409 rather than a database error.

> **Naming note.** The project brief calls this column `student_id`. It is named
> `student_profile_id` here because it references `student_profiles(id)`, not
> `users(id)` - the explicit name avoids a whole class of join mistake. The
> unique rule required by the brief is implemented exactly as described.

### `application_status_history`
Audit trail: `from_status`, `to_status`, `changed_by`, `note`, `created_at`.
One row per change, written by `ApplicationService`.

---

## V5 - Certificates and notifications

### `certificates` &nbsp;·&nbsp; Member 2 (upload) / Member 4 (verification)

| Column | Notes |
| --- | --- |
| `student_profile_id` | → `student_profiles` **CASCADE** |
| `title`, `issuing_organization`, `issue_date` | the professional data |
| `original_file_name` | what the student called it |
| `stored_file_name` | our generated UUID name |
| `storage_path` | relative to `UPLOAD_ROOT`, never sent to the browser |
| `mime_type`, `file_size` | validated on upload |
| `verification_status` | `PENDING` \| `VERIFIED` \| `REJECTED`, new rows are `PENDING` |
| `verification_note` | the administrator's reason |
| `verified_by` | `users.id`, **SET NULL** |

**The trust rule.** A certificate counts as evidence only when
`verification_status = 'VERIFIED'`.

- students see all of their own, in any status
- administrators see everything
- employers see `VERIFIED` only, and only for someone who applied to one of
  their own internships

Enforced in `CertificateService` - the employer-facing method physically cannot
return another status.

### `notifications` &nbsp;·&nbsp; Member 4
`user_id` → `users` **CASCADE**. `type` is a plain `VARCHAR(50)` on purpose, so
Member 4 can add notification kinds without a migration.

---

## V6 - AI &nbsp;·&nbsp; Member 1

### `ai_conversations`
`owner_user_id` → `users` **CASCADE**. `conversation_type` is
`STUDENT_GUIDANCE` \| `EMPLOYER_COMPARISON`. `context_reference_id` optionally
points at the internship being discussed. Every query is scoped by owner.

### `ai_messages`
`conversation_id` → `ai_conversations` **CASCADE**. `message_role` is `USER` \|
`ASSISTANT`. `content` is `VARCHAR(8000)`; `AiConversationService` truncates
longer answers to fit.

**What is deliberately not stored:** the assembled context block (profile rows,
applicant details, verified certificates). It can always be rebuilt from live
data, and keeping a second copy of personal data in a chat log turns one leak
into two.

### `ai_usage_logs`
Operational only: provider, model, success, HTTP status, a short `error_code`,
token counts, `duration_ms`. **No prompt text.** `user_id` is **SET NULL** so
statistics survive an account deletion.

---

## V7 - Indexes

Foreign keys are indexed automatically by InnoDB, so this migration only covers
filtering and sorting:

| Index | Supports |
| --- | --- |
| `idx_users_role_status` | admin user list |
| `idx_email_otp_lookup` | newest unconsumed OTP challenge |
| `idx_companies_approval` | approval queue |
| `idx_internships_status_created` | public list, newest first |
| `idx_internships_deadline` | closing-soon filters |
| `idx_applications_status` | employer applicant filtering |
| `idx_applications_student_status` | student application history |
| `idx_certificates_status` | admin verification queue |
| `idx_certificates_student_status` | the employer verified-only lookup |
| `idx_notifications_user_read` | the unread badge |
| `idx_ai_conversations_owner` | AI history, most recent first |
| `idx_ai_messages_conversation` | loading one thread in order |
| `idx_ai_usage_created` | AI oversight |

---

## Relationship overview

```text
users 1───1 student_profiles ──┬──< student_education
      │                        ├──< student_skills
      │                        ├──< student_interests
      │                        ├──< student_resumes
      │                        ├──< certificates          (verified by an admin)
      │                        └──< applications >── internships >── companies
      │                                                                  │
      ├───1 employer_profiles >─────────────────────────────────────────┘
      ├───1 user_two_factor_settings
      ├──< email_otp_challenges
      ├──< notifications
      └──< ai_conversations ──< ai_messages
```

---

## Two implementation notes

**No `TEXT` columns.** Long fields are `VARCHAR` with an explicit length that
matches `@Column(length = ...)` in the entity. Hibernate's `validate` compares
JDBC type codes, and a `TEXT` column mapped to a plain `String` is a common
source of "found longtext, but expecting varchar" startup failures. If you need a
genuinely long field later, add the column as `TEXT` **and** annotate the field
with `@JdbcTypeCode(SqlTypes.LONGVARCHAR)` in the same commit.

**Longest limits today:** `internships.description` /
`responsibilities` / `requirements` 2000, `applications.cover_letter` 3000,
`ai_messages.content` 8000, `student_profiles.biography` 1500.

---

## Starting over locally

```sql
DROP DATABASE internshipjp_db;
CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Restart the backend and Flyway rebuilds all 19 tables.
