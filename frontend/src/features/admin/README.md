# Administrator screens

**Owner: Member 4**

This folder is intentionally empty. These pages are yours to build.

## Expected work

- Admin dashboard (pending approvals, pending certificates, user counts)
- User management with suspend / reactivate
- Company approval queue
- Certificate verification queue, including viewing the uploaded file
- Reports and activity monitoring
- Account settings: profile, change password, 2FA

## Intended routes

`/admin/dashboard`, `/admin/users`, `/admin/employers`, `/admin/certificates`,
`/admin/reports`, `/admin/settings`

## Backend endpoints already working

| Method | Path |
| --- | --- |
| GET | `/api/admin/employers/pending` |
| PATCH | `/api/admin/employers/{id}/approval` |
| GET | `/api/admin/certificates/pending` |
| GET | `/api/admin/certificates/{id}` |
| PATCH | `/api/admin/certificates/{id}/verification` |
| GET | `/api/admin/users` |
| PATCH | `/api/admin/users/{id}/status` |
| GET | `/api/certificates/{id}/file` (admins may open any file) |

Approval body: `{ "status": "APPROVED", "note": "..." }`
Verification body: `{ "status": "VERIFIED", "note": "Certificate checked and accepted." }`

## Why the certificate queue matters

Approving a certificate is what makes it visible to employers. Nothing else in
the system can do that. The queue is the platform's integrity check, so the UI
should make it easy to open the file and see who uploaded it before deciding.

Approving a **company** also activates its recruiter accounts, which start as
`PENDING` at registration.

## There is no admin registration endpoint

Create the first administrator with the bootstrap runner - see
`BOOTSTRAP_ADMIN_ENABLED` in `backend/application-local.example.properties`.

## Recommended components

`ApprovalQueue`, `UserTable`, `StatusToggle`, `CertificateReviewPanel`,
`FilePreview`, `StatCard`.
