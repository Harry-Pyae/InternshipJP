# Employer screens

**Owner: Member 3**

This folder is intentionally empty. These pages are yours to build.

## Expected work

- Employer dashboard (open vacancies, applicant counts, statistics)
- Company profile editor
- Internship list, create and edit forms
- Applicant list per internship
- Applicant detail with shortlist / accept / reject
- Account settings: profile, change password, 2FA

## Intended routes

`/employer/dashboard`, `/employer/profile`, `/employer/internships`,
`/employer/internships/:id`, `/employer/applications`, `/employer/settings`

## Backend endpoints already working

| Method | Path |
| --- | --- |
| GET / PUT | `/api/employer/profile` |
| GET / PUT | `/api/employer/company` |
| GET / POST | `/api/employer/internships` |
| GET / PUT | `/api/employer/internships/{id}` |
| GET | `/api/employer/internships/{id}/applications` |
| GET | `/api/employer/applications/{id}` |
| PATCH | `/api/employer/applications/{id}/status` |
| GET | `/api/internships` and `/api/internships/{id}` (public list) |

## Two rules the backend enforces for you

1. **Publishing needs approval.** Saving a `DRAFT` always works; setting the
   status to `OPEN` returns 403 until an administrator approves the company.
2. **Only verified certificates are visible.** `GET /api/employer/applications/{id}`
   returns `verifiedCertificates`, which can only ever contain `VERIFIED` rows.
   Do not build a UI that implies you can see pending ones - you cannot, by design.

## Still to build in the backend (also yours)

Advanced filtering (work mode, location, stipend, skills), the required-skills
editor for an internship, withdrawing an application, and the "positions filled"
rule. Look for `TODO MEMBER_3` in `InternshipService` and `ApplicationService`.

## Recommended components

`InternshipForm`, `InternshipCard`, `ApplicantTable`, `ApplicantDetailPanel`,
`StatusChangeDialog`, `VerifiedCertificateList`.
