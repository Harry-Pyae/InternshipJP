# Administrator screens

**Owner: Member 4**

The brief for this folder used to say it was "intentionally empty" and listed
the pages as expected work. They are built. This is what is here now.

## Pages

| Route | File |
| --- | --- |
| `/admin/dashboard` | `AdminDashboardPage.jsx` |
| `/admin/users` | `AdminUsersPage.jsx` |
| `/admin/employers` | `AdminEmployersPage.jsx` |
| `/admin/employers/:id` | `AdminEmployerReviewPage.jsx` |
| `/admin/certificates` | `AdminCertificatesPage.jsx` |
| `/admin/certificates/:id` | `AdminCertificateReviewPage.jsx` |
| `/admin/internships` | `AdminInternshipsPage.jsx` |
| `/admin/internships/:id` | `AdminInternshipDetailPage.jsx` |
| `/admin/reports` | `AdminReportsPage.jsx` |
| `/admin/profile` | `AdminProfilePage.jsx` |
| `/admin/profile/edit` | `AdminProfileEditPage.jsx` |
| `/admin/settings` | `AdminSettingsPage.jsx` |

`/admin/notifications` and `/admin/faq` are the shared pages under
`features/shared`, the same components the student and employer shells use.

## Settings is the shared page

`AdminSettingsPage` is a wrapper. It renders `features/shared/AccountSettingsPage`
and passes one administrator-only card into it. It used to be a second
implementation of the same two forms, and the copies had drifted apart:
different validation, a success banner in a different place, no password rules
shown, and no way to delete the account - which the FAQ tells every role,
administrators included, to do from Settings.

**Add a role-specific section by passing `extra`, not by forking the page.**

## Platform data

`components/DataMaintenanceCard.jsx`, on the Settings screen, is the only place
either operation is reachable from.

- **Download data** - the whole database as one JSON file, tables ordered
  parents-first. It contains password hashes; treat the file as a copy of the
  database, because that is what it is.
- **Compact old data** - removes spent sign-in codes, AI telemetry, read
  notifications and untouched AI chat threads past a retention window. Never
  accounts, companies, internships, applications or certificates.

The counts shown before the confirmation come from the same server code that
does the deleting, so the number on the dialog is the number that will go.

## Backend endpoints

| Method | Path |
| --- | --- |
| GET | `/api/admin/employers/pending` |
| PATCH | `/api/admin/employers/{id}/approval` |
| GET | `/api/admin/certificates/pending` |
| GET | `/api/admin/certificates/{id}` |
| PATCH | `/api/admin/certificates/{id}/verification` |
| GET | `/api/admin/users`, `/api/admin/users/{id}` |
| PATCH | `/api/admin/users/{id}/status` |
| POST | `/api/admin/users/{id}/message`, `/api/admin/users/{id}/unlock` |
| DELETE | `/api/admin/users/{id}` |
| POST | `/api/admin/invites` |
| GET | `/api/admin/internships`, `/api/admin/internships/{id}` |
| GET | `/api/admin/ai/usage`, `/api/admin/ai/usage/summary` |
| GET | `/api/admin/data/export` |
| GET, POST | `/api/admin/data/compaction?days=` |
| GET | `/api/certificates/{id}/file` (admins may open any file) |

Approval body: `{ "status": "APPROVED", "note": "..." }`
Verification body: `{ "status": "VERIFIED", "note": "Certificate checked and accepted." }`

Account settings go through `accountApi`, not `adminApi`. `/api/account/**` is
the same endpoint for every role, and having two clients for it is how the
administrator screen ended up behaving differently from the other two.

## Why the certificate queue matters

Approving a certificate is what makes it visible to employers. Nothing else in
the system can do that. The queue is the platform's integrity check, so the UI
makes it easy to open the file and see who uploaded it before deciding.

Approving a **company** also activates its recruiter accounts, which start as
`PENDING` at registration.

## There is no admin registration endpoint

Create the first administrator with the bootstrap runner - see
`BOOTSTRAP_ADMIN_ENABLED` in `backend/application-local.example.properties`.
After that, one administrator invites another from the Users screen; the invitee
sets their own password, so no one ever knows somebody else's.

## Components in this folder

`UserTable`, `UserDetailModal`, `StatusToggle`, `FilePreview`,
`DataMaintenanceCard`. Everything else - `StatCard`, `DataTable`, `Pagination`,
`ConfirmDialog`, `SectionCard`, `Select` - is shared, and should stay shared.
