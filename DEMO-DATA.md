# Demo data — commands

Everything the seeder creates is marked, so it can always be told apart from
real records:

- accounts end **`@demo.internshipjp.local`**
- companies start **`Demo `**

Nothing outside those two patterns is ever touched.

---

## Clear the old data and create a fresh set

Two steps. Do not use `DEMO_DATA_RESET=true` — see the note at the bottom.

**1. Clear**, with the backend stopped:

```powershell
.\scripts\remove-demo-data.ps1
```

**2. Seed.** In `backend\application-local.properties`:

```properties
DEMO_DATA_ENABLED=true
DEMO_DATA_RESET=false
```

Then start the backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Watch for:

```
Demo data: seeding sample accounts, vacancies and applications...
```

**Set `DEMO_DATA_ENABLED=false` afterwards**, so it does not re-check on every
restart.

---

## Clear demo data permanently, for real data

When real students and employers arrive:

```properties
DEMO_DATA_ENABLED=false
DEMO_DATA_RESET=false
```

Then remove what is already there:

```powershell
.\scripts\remove-demo-data.ps1
```

It prints what it will delete, asks for confirmation, and removes **both the
database rows and the uploaded certificate files**. The files matter — deleting
rows alone leaves orphaned PDFs on disk that nothing points at.

SQL alternative, if you prefer:

```powershell
"C:\xampp\mysql\bin\mysql.exe" -u root internshipjp_db < database\remove_demo_data.sql
```

Note this one does **not** delete the files.

---

## Check what is in the database

```powershell
.\scripts\list-accounts.ps1
```

Every account with its role, status and whether it is demo or real.

---

## Reset a password

```powershell
.\scripts\list-accounts.ps1 -ResetPassword someone@example.com
```

Sets it to `password123`. For demo accounts specifically:

```powershell
.\scripts\list-accounts.ps1 -ResetDemoPasswords
```

Sets every demo account to `demo1234`.

---

## Start completely fresh

If the database is in a state you would rather abandon:

```sql
DROP DATABASE internshipjp_db;
CREATE DATABASE internshipjp_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Start the backend and Flyway rebuilds all eight migrations from nothing. With
`DEMO_DATA_ENABLED=true` you get the sample set as well.

**This deletes real data too.** Only for development.

---

## What the new demo set contains

| | |
| --- | --- |
| Accounts | 1 administrator, 2 employers, 4 students — all `demo1234` |
| Companies | Demo Yangon Tech (approved), Demo Sakura Systems (pending) |
| Internships | 5, including one draft and one with no required skills |
| Applications | 5, across five different statuses |
| Certificates | 3 — two verified, one waiting |

### The change worth knowing about

The old set created everything at one instant, so **every queue item read the
same age** — "21d" beside all of them — and every urgency badge was the same
colour. The screens looked broken rather than busy.

Records are now staggered, so the administrator sees a real spread:

```
CERTIFICATES     9d  red     Intro to Databases        waiting
COMPANIES        6d  amber   Demo Sakura Systems       waiting
STALLED         12d  red     Min -> Intern Wanted

elsewhere in the pipeline
                 2d  green   Min -> Backend Intern     applied
                 5d  amber   Su -> Frontend Intern     under review
                11d  red     Thida -> Backend Intern   shortlisted
                17d  red     Thida -> Frontend Intern  rejected
```

Green, amber and red all appear at once, which is what those colours were built
to distinguish. One application sits past the 7-day stalled threshold and one
sits well inside it, so that panel has content **and** the contrast is visible.

### A demo path that shows the whole product

1. Sign in as `student1@demo.internshipjp.local` — upload a certificate, it
   appears as **Pending**
2. Sign in as `admin@demo.internshipjp.local` — Certificate review shows it with
   the student's name; open the file, verify it
3. Back as the student — it now reads **Verified**
4. Browse internships, open one, apply
5. Sign in as `employer1@demo.internshipjp.local` — the applicant is there;
   shortlist them
6. Back as the student — My applications shows **Shortlisted**

That covers verification, matching, applying and the pipeline in about two
minutes.


---

## Why not `DEMO_DATA_RESET=true`

It deletes through JPA inside the same transaction that seeds. Removing users
that way makes Hibernate reconcile every managed entity in the transaction, and
it fails on a stale reference:

```
TransientObjectException: persistent instance references an unsaved
transient instance of 'com.internshipjp.backend.entity.User'
```

The PowerShell script does the same work in plain SQL through `mysql.exe`, so
Hibernate is never involved and the problem does not arise.

A failed reset is caught and logged rather than stopping the application, but
it will not have cleared anything — use the script.
