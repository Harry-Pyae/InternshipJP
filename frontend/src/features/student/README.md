# Student screens

**Owner: Member 2**

This folder is intentionally empty. These pages are yours to build.

## Expected work

- Student dashboard (profile completeness, recent applications, recommendations)
- Profile editor
- Skills manager (add / edit / remove)
- Certificate upload and status list
- Application history
- Account settings: profile, change password, 2FA

## Intended routes

`/student/dashboard`, `/student/profile`, `/student/applications`,
`/student/certificates`, `/student/settings`

## Backend endpoints already working

| Method | Path |
| --- | --- |
| GET / PUT | `/api/students/me` |
| GET / POST | `/api/students/me/skills` |
| PUT / DELETE | `/api/students/me/skills/{id}` |
| GET / POST | `/api/students/me/certificates` |
| GET / DELETE | `/api/students/me/certificates/{id}` |
| GET | `/api/certificates/{id}/file` (secured download) |
| GET | `/api/student/applications` |
| POST | `/api/internships/{id}/applications` |
| GET / PUT | `/api/account/me` |
| POST | `/api/account/change-password` |
| GET | `/api/account/2fa/status` and the `/api/account/2fa/**` endpoints |

Certificate upload is a multipart request with two parts, `metadata` (JSON) and
`file` - the exact snippet is in the comment at the top of
`StudentCertificateController.java`.

## Still to build in the backend (also yours)

Education records and career interests have tables, entities and repositories
but no endpoints yet. Resume upload can reuse `FileStorageService` exactly the
way certificates do.

## Recommended components

`ProfileForm`, `SkillList`, `SkillFormModal`, `CertificateUploadForm`,
`CertificateStatusBadge`, `ApplicationTimeline`.
