# Team ownership

Who owns what, so four people can work in one repository without stepping on
each other. If something is not listed, discuss it before building it.

---

## Member 1 - Integration, Database, Testing, AI, Deployment

**Owns**

- MariaDB connection configuration and the Flyway migration sequence
- Schema review: every new migration gets looked at before it is pushed
- API integration standards (DTO shape, error shape, paging shape)
- The Axios client and React to Spring Boot integration
- The AI provider architecture, the Groq client, AI services, AI chat frontend,
  AI conversation history and AI usage logging
- Integration tests, end-to-end tests, and the final deployment

**Does not own** ordinary Student, Employer or Admin CRUD.

**Files**

```text
backend/src/main/resources/application.yml
backend/src/main/resources/db/migration/**
backend/.../ai/**
backend/.../service/PlatformStatusService.java
backend/.../controller/TestController.java
backend/.../controller/AiController.java
backend/.../controller/AdminAiUsageController.java
backend/.../controller/CertificateFileController.java
backend/src/main/resources/application-prod.yml
backend/src/test/java/**/integration/**
scripts/**
frontend/src/api/**
frontend/src/config/**
frontend/src/features/integration/**
frontend/src/features/ai/**
database/**, documentation/**
```

---

## Member 2 - Authentication, Security, Student Module

**Owns**

- Registration, login, logout, sessions, current user
- BCrypt, role authorisation, password changing
- TOTP 2FA and email OTP 2FA, including the **login challenge**
- Student profile, education, skills, interests, resumes, certificates (upload)
- Student application history
- All student React pages and the student account settings screen

**Files**

```text
backend/.../service/AuthService.java
backend/.../service/AccountService.java
backend/.../service/StudentProfileService.java
backend/.../service/TwoFactorService.java, TotpService.java, OtpMailService.java
backend/.../controller/AuthController.java, AccountController.java
backend/.../controller/TwoFactorController.java, StudentController.java
backend/.../controller/StudentCertificateController.java
frontend/src/features/auth/**
frontend/src/features/student/**
```

**Tables** `users`, `user_two_factor_settings`, `email_otp_challenges`,
`student_profiles`, `student_education`, `student_skills`, `student_interests`,
`student_resumes`, `certificates` (upload side)

---

## Member 3 - Employer, Internship, Application, Recruitment

**Owns**

- Company profiles and employer profiles
- Internship CRUD, search and filtering
- The application workflow: applicant review, shortlist, accept, reject
- Employer statistics and all employer React pages
- Viewing verified certificates of applicants

**Files**

```text
backend/.../service/EmployerService.java
backend/.../service/InternshipService.java
backend/.../service/ApplicationService.java
backend/.../controller/EmployerController.java
backend/.../controller/EmployerInternshipController.java
backend/.../controller/EmployerApplicationController.java
backend/.../controller/InternshipController.java
frontend/src/features/employer/**
```

**Tables** `companies`, `employer_profiles`, `internships`,
`internship_skills`, `applications`, `application_status_history`

---

## Member 4 - Administration, Notifications, Certificate Validation, Shared UI

**Owns**

- Admin dashboard, user management, account suspension and reactivation
- Employer and company approval
- Certificate verification - the decision that makes a certificate count
- Notifications, reports, activity monitoring
- All admin React pages and the shared frontend components and layouts

**Files**

```text
backend/.../service/AdminService.java
backend/.../service/NotificationService.java
backend/.../service/CertificateService.java (verification side)
backend/.../controller/AdminController.java
backend/.../controller/AdminCertificateController.java
backend/.../controller/NotificationController.java
frontend/src/features/admin/**
frontend/src/features/notifications/**
frontend/src/components/shared/**  (from now on)
```

**Tables** `notifications`, `certificates` (verification columns),
`companies.approval_*`, `users.account_status`

---

## Table ownership summary

| Table | Owner |
| --- | --- |
| `users` | Member 2 |
| `user_two_factor_settings` | Member 2 |
| `email_otp_challenges` | Member 2 |
| `student_profiles` | Member 2 |
| `student_education` | Member 2 |
| `student_skills` | Member 2 |
| `student_interests` | Member 2 |
| `student_resumes` | Member 2 |
| `certificates` | Member 2 (upload) + Member 4 (verification) |
| `companies` | Member 3 (data) + Member 4 (approval) |
| `employer_profiles` | Member 3 |
| `internships` | Member 3 |
| `internship_skills` | Member 3 |
| `applications` | Member 3 |
| `application_status_history` | Member 3 |
| `notifications` | Member 4 |
| `ai_conversations` | Member 1 |
| `ai_messages` | Member 1 |
| `ai_usage_logs` | Member 1 |

---

## Shared files - change with care

These are used by everyone. Announce changes in the group chat first.

```text
backend/pom.xml
backend/src/main/resources/application.yml
backend/.../security/SecurityConfig.java
backend/.../exception/GlobalExceptionHandler.java
backend/.../dto/response/PageResponse.java
backend/.../security/CurrentUserService.java
frontend/src/api/axiosClient.js
frontend/src/routes/router.jsx
frontend/src/styles/app.css
```

`router.jsx` is designed so each of us adds one line - that keeps merge
conflicts to a single line instead of a whole file.

---

## Rules we agreed on

1. Migrations are append-only. Never edit a migration someone else has run.
2. Controllers return DTOs, never entities.
3. Ownership checks live in services, never only in React.
4. Only `VERIFIED` certificates are ever shown to employers.
5. No secret is committed - use `application-local.properties`.
6. `TODO MEMBER_n` marks a deliberate boundary. Remove it when you finish it.
