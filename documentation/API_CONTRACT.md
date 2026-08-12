# API contract

Every endpoint the backend exposes today. React and Spring Boot are written by
different people, so this file is the agreement between them.

Base URL in development: `http://localhost:8080`

---

## Conventions

**Authentication** is a session cookie (`INTERNSHIPJP_SESSION`). Axios must send
`withCredentials: true`.

**CSRF.** Every `POST`, `PUT`, `PATCH` and `DELETE` needs the `X-XSRF-TOKEN`
header. The backend sets an `XSRF-TOKEN` cookie and Axios copies it across
automatically - but the cookie only exists after one GET, so the app calls
`GET /api/auth/csrf` at startup. A missing token gives `403 Forbidden`.

**Roles** are `STUDENT`, `EMPLOYER`, `ADMIN`. "Any" means any signed-in user.

**Errors** always look like this:

```json
{
  "timestamp": "2026-03-04T10:15:30.123",
  "status": 400,
  "error": "Validation Error",
  "message": "Some fields are not valid. Check fieldErrors for details.",
  "path": "/api/auth/register/student",
  "fieldErrors": { "email": "must be a well-formed email address" }
}
```

| Code | Meaning |
| --- | --- |
| 200 / 201 | Success |
| 400 | Validation or business-rule failure |
| 401 | Not signed in, or the session expired |
| 403 | Signed in, but not allowed (or a missing CSRF token) |
| 404 | Not found, or not visible to you |
| 409 | Conflict - duplicate email, duplicate application |
| 413 | Uploaded file too large |
| 503 | An external provider (AI, SMTP) is unavailable |

**Paged lists** all return the same wrapper:

```json
{
  "content": [],
  "page": 0,
  "size": 10,
  "totalElements": 0,
  "totalPages": 0,
  "last": true
}
```

Query parameters: `?page=0&size=10`.

---

## Authentication - Member 2

| Method | Path | Role | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/auth/csrf` | Public | - | `204`, sets the CSRF cookie |
| POST | `/api/auth/register/student` | Public | `RegisterStudentRequest` | `201 AuthUserResponse` |
| POST | `/api/auth/register/employer` | Public | `RegisterEmployerRequest` | `201 AuthUserResponse` |
| POST | `/api/auth/login` | Public | `LoginRequest` | `AuthUserResponse` |
| POST | `/api/auth/logout` | Any | - | `ApiMessageResponse` |
| GET | `/api/auth/me` | Any | - | `AuthUserResponse` |

`RegisterStudentRequest`: `email`, `password` (min 8), `fullName`, `university?`, `degree?`
`RegisterEmployerRequest`: `email`, `password`, `fullName`, `companyName`, `industry?`, `website?`, `jobTitle?`
`AuthUserResponse`: `id`, `email`, `fullName`, `role`, `accountStatus`

> **Not implemented yet (Member 2):** the 2FA login challenge. Login currently
> completes as soon as the password is correct, even if 2FA is enabled.

---

## Account - Member 2

| Method | Path | Role | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/account/me` | Any | - | `AccountResponse` |
| PUT | `/api/account/me` | Any | `UpdateAccountRequest` | `AccountResponse` |
| POST | `/api/account/change-password` | Any | `ChangePasswordRequest` | `ApiMessageResponse` |
| GET | `/api/account/2fa/status` | Any | - | `TwoFactorStatusResponse` |
| POST | `/api/account/2fa/totp/setup` | Any | - | `TotpSetupResponse` |
| POST | `/api/account/2fa/totp/verify` | Any | `TotpVerifyRequest` | `ApiMessageResponse` |
| POST | `/api/account/2fa/totp/disable` | Any | - | `ApiMessageResponse` |
| POST | `/api/account/2fa/email/send` | Any | - | `ApiMessageResponse` |
| POST | `/api/account/2fa/email/verify` | Any | `EmailOtpVerifyRequest` | `ApiMessageResponse` |
| POST | `/api/account/2fa/email/disable` | Any | - | `ApiMessageResponse` |

`TwoFactorStatusResponse`: `totpEnabled`, `emailOtpEnabled`, `preferredMethod`, `totpAvailable`
`TotpSetupResponse`: `secret`, `otpAuthUri`, `issuer`, `accountName`

`totpAvailable` is false when the server has no `TOTP_ENCRYPTION_KEY` - hide the
TOTP option in that case rather than letting the user hit an error.
The secret is returned **once**. Render `otpAuthUri` as a QR code.

---

## Student - Member 2

| Method | Path | Role | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/students/me` | STUDENT | - | `StudentProfileResponse` |
| PUT | `/api/students/me` | STUDENT | `UpdateStudentProfileRequest` | `StudentProfileResponse` |
| GET | `/api/students/me/skills` | STUDENT | - | `StudentSkillResponse[]` |
| POST | `/api/students/me/skills` | STUDENT | `StudentSkillRequest` | `201 StudentSkillResponse` |
| PUT | `/api/students/me/skills/{id}` | STUDENT | `StudentSkillRequest` | `StudentSkillResponse` |
| DELETE | `/api/students/me/skills/{id}` | STUDENT | - | `ApiMessageResponse` |
| GET | `/api/students/me/certificates` | STUDENT | - | `CertificateResponse[]` |
| POST | `/api/students/me/certificates` | STUDENT | multipart | `201 CertificateResponse` |
| GET | `/api/students/me/certificates/{id}` | STUDENT | - | `CertificateResponse` |
| DELETE | `/api/students/me/certificates/{id}` | STUDENT | - | `ApiMessageResponse` |

`StudentSkillRequest`: `name`, `skillType` (`TECHNICAL`\|`SOFT`), `proficiency?` (`BEGINNER`\|`INTERMEDIATE`\|`ADVANCED`)
Adding a skill that already exists returns `409`.

**Certificate upload** is multipart with two parts:

```js
const form = new FormData();
form.append(
  "metadata",
  new Blob([JSON.stringify({ title, issuingOrganization, issueDate })],
           { type: "application/json" })
);
form.append("file", file);
await api.post("/api/students/me/certificates", form);
```

Allowed: PDF, PNG, JPG, max 5 MB. Every upload starts as `PENDING`.

---

## Public internship discovery - Member 3

| Method | Path | Role | Response |
| --- | --- | --- | --- |
| GET | `/api/internships?keyword=&page=0&size=10` | Public | `PageResponse<InternshipSummaryResponse>` |
| GET | `/api/internships/{id}` | Public | `InternshipDetailResponse` |

Only `OPEN` internships are listed. Drafts return `404`.

---

## Student applications - Member 3

| Method | Path | Role | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/internships/{id}/applications` | STUDENT | `CreateApplicationRequest` | `201 ApplicationSummaryResponse` |
| GET | `/api/student/applications` | STUDENT | - | `PageResponse<ApplicationSummaryResponse>` |

`CreateApplicationRequest`: `coverLetter?` (max 3000), `resumeId?`

Refused with `400` if the internship is not `OPEN` or the deadline has passed,
and with `409` if you have already applied.

---

## Employer - Member 3

| Method | Path | Role | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/employer/profile` | EMPLOYER | - | `EmployerProfileResponse` |
| PUT | `/api/employer/profile` | EMPLOYER | `UpdateEmployerProfileRequest` | `EmployerProfileResponse` |
| GET | `/api/employer/company` | EMPLOYER | - | `CompanyResponse` |
| PUT | `/api/employer/company` | EMPLOYER | `UpdateCompanyRequest` | `CompanyResponse` |
| POST | `/api/employer/internships` | EMPLOYER | `InternshipRequest` | `201 InternshipDetailResponse` |
| GET | `/api/employer/internships` | EMPLOYER | - | `PageResponse<InternshipSummaryResponse>` |
| GET | `/api/employer/internships/{id}` | EMPLOYER | - | `InternshipDetailResponse` |
| PUT | `/api/employer/internships/{id}` | EMPLOYER | `InternshipRequest` | `InternshipDetailResponse` |
| GET | `/api/employer/internships/{id}/applications` | EMPLOYER | - | `PageResponse<ApplicationSummaryResponse>` |
| GET | `/api/employer/applications/{id}` | EMPLOYER | - | `ApplicationDetailResponse` |
| PATCH | `/api/employer/applications/{id}/status` | EMPLOYER | `UpdateApplicationStatusRequest` | `ApplicationSummaryResponse` |

`InternshipRequest`: `title`, `description?`, `responsibilities?`, `requirements?`,
`location?`, `workMode?`, `durationMonths?`, `stipendAmount?`, `stipendCurrency?`,
`availablePositions?`, `applicationDeadline?` (`YYYY-MM-DD`), `status?`

Saving a `DRAFT` always works. `status: "OPEN"` returns **403** until an
administrator approves the company.

`ApplicationDetailResponse` includes `verifiedCertificates` - **only** rows with
`verification_status = VERIFIED`. There is no parameter that changes that.

Allowed status transitions:

```text
APPLIED      -> UNDER_REVIEW, SHORTLISTED, REJECTED
UNDER_REVIEW -> SHORTLISTED, INTERVIEW, REJECTED
SHORTLISTED  -> INTERVIEW, ACCEPTED, REJECTED
INTERVIEW    -> ACCEPTED, REJECTED
ACCEPTED / REJECTED / WITHDRAWN  -> final
```

Anything else returns `400`. Every change writes an `application_status_history`
row and notifies the student.

---

## Administration - Member 4

| Method | Path | Role | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/employers/pending` | ADMIN | - | `PageResponse<CompanyResponse>` |
| PATCH | `/api/admin/employers/{id}/approval` | ADMIN | `CompanyApprovalRequest` | `CompanyResponse` |
| GET | `/api/admin/certificates/pending` | ADMIN | - | `PageResponse<CertificateResponse>` |
| GET | `/api/admin/certificates/{id}` | ADMIN | - | `CertificateResponse` |
| PATCH | `/api/admin/certificates/{id}/verification` | ADMIN | `CertificateVerificationRequest` | `CertificateResponse` |
| GET | `/api/admin/users?role=&status=&search=&page=&size=` | ADMIN | - | `PageResponse<AdminUserResponse>` |
| PATCH | `/api/admin/users/{id}/status` | ADMIN | `UpdateUserStatusRequest` | `AdminUserResponse` |

`{id}` in the approval path is the **company** id.

```json
{ "status": "APPROVED", "note": "Company details checked." }
{ "status": "VERIFIED", "note": "Certificate checked and accepted." }
{ "status": "SUSPENDED" }
```

Approving a company also flips its recruiters from `PENDING` to `ACTIVE`.
An administrator cannot change their own account status (`400`).

---

## Certificate files - shared

| Method | Path | Role | Response |
| --- | --- | --- | --- |
| GET | `/api/certificates/{id}/file` | Any signed-in | the file stream |

The single download route for all three roles:

- **Student** - own files only, any status
- **Admin** - any file
- **Employer** - `VERIFIED` only, and only for a student who applied to one of
  their own internships

Anything else returns `403`. The uploads folder is not served statically, so
this endpoint is the only way in.

---

## Notifications - Member 4

| Method | Path | Role | Response |
| --- | --- | --- | --- |
| GET | `/api/notifications?page=0&size=10` | Any | `PageResponse<NotificationResponse>` |
| PATCH | `/api/notifications/{id}/read` | Any | `NotificationResponse` |
| PATCH | `/api/notifications/read-all` | Any | `ApiMessageResponse` |

---

## AI assistant - Member 1

| Method | Path | Role | Request | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/ai/student-chat` | STUDENT | `AiChatRequest` | `AiChatResponse` |
| POST | `/api/ai/employer-chat` | EMPLOYER | `AiChatRequest` | `AiChatResponse` |
| GET | `/api/ai/conversations` | STUDENT, EMPLOYER | - | `AiConversationResponse[]` |
| GET | `/api/ai/conversations/{id}/messages` | STUDENT, EMPLOYER | - | `AiMessageResponse[]` |

`AiChatRequest`: `message` (max 2000), `conversationId?` (null starts a thread),
`internshipId?` (required for employer chat)

`AiChatResponse`: `conversationId`, `answer`, `model`, `degraded`, `createdAt`

**`degraded: true`** means the answer is an explanation, not model output - no
API key, the provider was unreachable, or there was not enough real data yet.
Show it as a notice. It is never an error response.

The assistant only reads. It cannot change an application status, and it only
ever sees data the signed-in user is allowed to see.

---

## Integration tests - Member 1

| Method | Path | Role | Response |
| --- | --- | --- | --- |
| GET | `/api/test/health` | Public | `{"status":"UP","application":"InternshipJP","timestamp":"..."}` |
| GET | `/api/test/database` | Public | `{"connected":true,"database":"internshipjp_db","tableCount":19,"productVersion":"..."}` |
| GET | `/api/test/ai` | Public | `{"provider":"groq","configured":true,"reachable":true,"model":"...","latencyMs":210}` |

All three perform real checks. Disable the whole group in production with
`APP_TEST_ENDPOINTS_ENABLED=false`.

---

## Not built yet

| Area | Owner |
| --- | --- |
| 2FA login challenge | Member 2 |
| Education records, career interests, resume upload endpoints | Member 2 |
| Password reset | Member 2 |
| Internship filtering, required-skills editor | Member 3 |
| Withdraw an application, interview scheduling | Member 3 |
| Reports, activity monitoring, admin audit log | Member 4 |
| Unread notification count endpoint | Member 4 |
