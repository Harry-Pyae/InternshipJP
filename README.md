# InternshipJP

An internship platform where students are matched to vacancies on skills they
can evidence, employers only ever see qualifications an administrator has
verified, and an AI assistant explains the matches on both sides.

This repository is our **shared foundation**, not the finished app. The
backend, database, security, AI and integration layer run end to end today. The
four role modules are ours to build.

**Read this whole page before you start.** Ten minutes here saves an evening of
debugging in the group chat.

---

## Contents

1. [What to install](#1-what-to-install)
2. [First-time setup](#2-first-time-setup)
3. [Running it every day](#3-running-it-every-day)
4. [Getting signed in](#4-getting-signed-in)
5. [Sample data for testing](#5-sample-data-for-testing)
6. [What you should build](#6-what-you-should-build)
7. [How to build a page](#7-how-to-build-a-page)
8. [Project structure](#8-project-structure)
9. [Git workflow](#9-git-workflow)
10. [Rules that keep four people out of each other's way](#10-rules-that-keep-four-people-out-of-each-others-way)
11. [Testing](#11-testing)
12. [When something breaks](#12-when-something-breaks)
13. [Known gaps](#13-known-gaps)
14. [Tech stack](#14-tech-stack)

---

## 1. What to install

Four things, all installed **on your machine**, not inside the project folder.

| Tool | Version | Where |
| --- | --- | --- |
| JDK | 24 (21 also works) | <https://adoptium.net> |
| Node.js | 20 or newer | <https://nodejs.org> (LTS) |
| XAMPP | any recent | <https://www.apachefriends.org> |
| Git | any | <https://git-scm.com> |

**You do not need Maven.** The repository includes the Maven wrapper
(`mvnw.cmd`), which downloads Maven itself on first run.

Check everything in PowerShell:

```powershell
java -version
node -v
git --version
```

If `java -version` reports 21, that is fine — open `backend\pom.xml` and change
`<java.version>24</java.version>` to `21`. Don't commit that change.

### Where to put the project

```
C:\Projects\InternshipJP
```

Two places **not** to put it:

- **`C:\xampp\htdocs`** — nothing here is served by Apache. Spring Boot runs its
  own server on `:8080`, Vite serves React on `:5173`. Worse, Apache would
  publish `application-local.properties` as plain text to anyone who asks, and
  that file holds your database password and API key.
- **OneDrive or a synced Desktop** — sync fights with `node_modules` and
  `target\`, and you get random file-lock errors mid-build.

---

## 2. First-time setup

Once, about 15 minutes, mostly downloads.

### 2.1 Clone

```powershell
cd C:\Projects
git clone https://github.com/Harry-Pyae/InternshipJP.git
cd InternshipJP
```

### 2.2 Start MariaDB and create the database

Open the **XAMPP Control Panel** and press **Start** next to **MySQL**.
Apache is not needed — leave it stopped.

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
```

The `&` is required in PowerShell because the path contains spaces. Or use
phpMyAdmin at <http://localhost/phpmyadmin> → **SQL** tab and run the same
`CREATE DATABASE` line.

**Create the database and nothing else.** Do not create tables — Flyway builds
all 19 the first time the backend starts.

### 2.3 Backend config

```powershell
cd C:\Projects\InternshipJP\backend
copy application-local.example.properties application-local.properties
```

**Copy it, don't rename it.** The `.example` file must stay in Git so everyone
knows which settings exist; your copy is git-ignored and holds real values.

With a standard XAMPP install (`root`, blank password) you can leave the copy
untouched. Every setting already has a working default.

### 2.4 Frontend config

```powershell
cd C:\Projects\InternshipJP\frontend
copy .env.example .env
npm install
```

---

## 3. Running it every day

**The short way:**

```powershell
cd C:\Projects\InternshipJP
.\scripts\start-dev.ps1
```

It checks MariaDB, installs frontend dependencies on first run, and opens both
servers in their own windows. Start MySQL in XAMPP first — the script cannot do
that for you.

**Or by hand, two terminals:**

```powershell
# Terminal 1
cd C:\Projects\InternshipJP\backend
.\mvnw.cmd spring-boot:run

# Terminal 2
cd C:\Projects\InternshipJP\frontend
npm run dev
```

Then open <http://localhost:5173>.

### What you should see

The **first** backend run downloads Maven and every dependency — several
minutes and hundreds of `Downloading from central:` lines. Normal, and it
happens once. Later runs take about five seconds.

Watch for:

```
Successfully applied 8 migrations to schema `internshipjp_db`
Tomcat started on port 8080 (http)
Started InternshipJpApplication in 4.2 seconds
```

The Flyway line only appears on a fresh database. After that it says
`Current version of schema: 8`.

### `mvnw` is the running server, not a build step

If you are coming from PHP, this is what trips everyone up.

`.\mvnw.cmd spring-boot:run` **occupies that terminal**. It sits there printing
logs. Don't close it, don't type in it.

- **Stop the backend:** `Ctrl+C` in Terminal 1
- **After changing Java code:** `Ctrl+C`, then run it again

Java is compiled — edits do nothing until you restart. There is no "just
refresh the page" for backend changes.

The frontend is the opposite. Vite hot-reloads: save a `.jsx` file and the
browser updates itself. You almost never restart Terminal 2.

### Verify it works

Go to <http://localhost:5173/integration/status>. Three cards, all real API
calls:

| Card | Expected |
| --- | --- |
| Backend | **Connected** |
| Database | **Connected — internshipjp_db**, 19 tables |
| AI provider | **Not configured** until someone adds a Groq key. That is correct, not a failure |

There is also a **light / dark / system** switch in the navbar. It remembers
your choice, and "system" follows Windows live.

---

## 4. Getting signed in

**There is no login screen yet** — that is Member 2's first task. Until it
exists, use the **Session** panel at the bottom of
<http://localhost:5173/integration/status>.

1. **Create a test account** → choose Student → email, password (8+ characters),
   name → it registers and signs you in.
2. Open **Student assistant**. It now recognises you.

That panel is a developer tool, not the product login. It has no branding, no
2FA and no password reset, and it is compiled out of production builds
entirely. Member 2 deletes it once `/auth/login` works.

### Creating an administrator

There is no public admin registration — that would be an open door. Create the
first one once:

1. In `backend\application-local.properties`:
   ```properties
   BOOTSTRAP_ADMIN_ENABLED=true
   BOOTSTRAP_ADMIN_EMAIL=admin@internshipjp.local
   BOOTSTRAP_ADMIN_PASSWORD=pick-something-long
   ```
2. Restart the backend. Look for `created administrator`.
3. Set `BOOTSTRAP_ADMIN_ENABLED=false` and restart again.

### If you forget a password

You cannot look it up. `password_hash` holds a **BCrypt hash**, which is
one-way by design — no query recovers the original, not for you, not for an
admin, not for anyone holding the whole database. That is exactly what protects
users if it ever leaks.

So reset it instead:

```powershell
.\scripts\list-accounts.ps1                                    # what accounts exist
.\scripts\list-accounts.ps1 -ResetPassword you@example.com     # sets it to: password123
```

Add `-Activate` to set the account to ACTIVE at the same time.

---

## 5. Sample data for testing

The database starts **empty on purpose** — no invented students, no invented
vacancies. But an empty database makes the AI and the matching impossible to
try, so there is an opt-in seeder.

### Turn it on once

In `backend\application-local.properties`:

```properties
DEMO_DATA_ENABLED=true
```

Restart the backend, read the accounts printed in the console, then set it back
to `false`.

**Password for every demo account: `demo1234`**

| Account | Notes |
| --- | --- |
| `admin@demo.internshipjp.local` | certificate and company approval queues |
| `employer1@demo.internshipjp.local` | company approved, 5 vacancies |
| `employer2@demo.internshipjp.local` | company still PENDING |
| `student1@demo.internshipjp.local` | full profile, verified certificate |
| `student2@demo.internshipjp.local` | data-science profile |
| `student3@demo.internshipjp.local` | frontend profile |
| `student4@demo.internshipjp.local` | empty profile, on purpose |

The data is deliberately **imperfect**: an unapproved company, a draft vacancy,
a listing with no stipend or required skills, one demanding a skill almost
nobody has, and unreviewed applicants. Tidy data would make the employer
insight report say "no problems found", which looks like a broken feature.

### Fill in your own account instead

To test the assistant as yourself:

```properties
DEMO_DATA_ENABLED=true
DEMO_DATA_ATTACH_STUDENT=your.email@example.com
```

Restart once. That account gets a realistic profile and five skills —
deliberately partial, so the assistant has a real gap to advise on.

### Remove it all when real data arrives

```powershell
.\scripts\remove-demo-data.ps1              # shows counts, asks to confirm
.\scripts\remove-demo-data.ps1 -WhatIfOnly  # counts only, deletes nothing
```

It matches only emails ending `@demo.internshipjp.local` and companies named
`Demo ...`, so it is safe to run once you have real accounts. It removes the
uploaded demo files too.

---

## 6. What you should build

Read **your own** feature README first — each lists your pages, your routes,
which endpoints already work, and what is missing:

```
frontend/src/features/auth/README.md          Member 2
frontend/src/features/student/README.md       Member 2
frontend/src/features/employer/README.md      Member 3
frontend/src/features/admin/README.md         Member 4
frontend/src/features/notifications/README.md Member 4
```

Then `documentation/API_CONTRACT.md` for every endpoint, its role and its shape.

### Member 1 — Integration, database, testing, AI, deployment

**Done:** Flyway migrations, security foundation, file storage, the AI package
(two specialised assistants plus calculated skill-gap and company reports), the
integration page, the test suite, the shared component kit, deployment config.

**Next:** end-to-end tests as the modules land, schema review for everyone's
migrations, deployment.

### Member 2 — Authentication, security, student module

**Start with the login screen.** Everyone else is using a developer panel until
it exists.

| # | Build | Backend |
| --- | --- | --- |
| 1 | `/auth/login` | ready |
| 2 | `/auth/register/student` and `/auth/register/employer` | ready |
| 3 | A route guard keeping signed-out visitors out of dashboards | yours |
| 4 | `/student/dashboard`, `/student/profile` | ready |
| 5 | Skills manager (add / edit / remove) | ready |
| 6 | Certificate upload and status list | ready |
| 7 | `/student/applications` | ready |
| 8 | `/student/settings` — profile, password, 2FA | ready |
| 9 | **The 2FA login challenge** | `TODO MEMBER_2` in `AuthService` |
| 10 | Education, interests, resume upload endpoints | tables exist, endpoints yours |

The profile now has `headline`, `date_of_birth`, `currently_attending`,
`country`, `github_url`, `preferred_work_mode`, `available_from` and a photo
path. `UpdateStudentProfileRequest` already accepts all of them.

**Note:** the API returns `age`, but the database stores `date_of_birth`. A
stored age is wrong the day after a birthday, so the mapper subtracts it on
every read. Send `dateOfBirth` from your form.

### Member 3 — Employer, internships, applications, recruitment

| # | Build | Backend |
| --- | --- | --- |
| 1 | `/internships` and `/internships/:id` (public) | ready |
| 2 | `/employer/dashboard` | ready |
| 3 | `/employer/internships` — list, create, edit | ready |
| 4 | Applicant list per vacancy | ready |
| 5 | Applicant detail with shortlist / accept / reject | ready |
| 6 | `/employer/profile` — recruiter and company details | ready |
| 7 | Advanced filtering, required-skills editor | `TODO MEMBER_3` |
| 8 | Withdraw an application, interview scheduling | yours |

Two rules the backend enforces for you:

- **Publishing needs approval.** Saving a `DRAFT` always works; setting `OPEN`
  returns 403 until an administrator approves the company.
- **Only verified certificates are visible.** `GET /api/employer/applications/{id}`
  returns `verifiedCertificates`, which can only ever contain `VERIFIED` rows.
  Don't build a UI implying you can see pending ones — you cannot, by design.

Companies gained `company_size`, `founded_year`, `registration_number`,
`contact_email`, `contact_phone`, `linkedin_url`, `address` and `country`.
`UpdateCompanyRequest` accepts them all; the form is yours.

### Member 4 — Admin, notifications, certificate verification, shared UI

| # | Build | Backend |
| --- | --- | --- |
| 1 | `/admin/certificates` — the verification queue | ready |
| 2 | `/admin/employers` — company approval queue | ready |
| 3 | `/admin/users` — list, suspend, reactivate | ready |
| 4 | `/admin/dashboard` | ready |
| 5 | Notification bell with unread count, `/notifications` | ready |
| 6 | AI oversight panel (`/api/admin/ai/usage` and `/usage/summary`) | ready |
| 7 | Reports, activity monitoring, admin audit log | yours |
| 8 | **Own `frontend/src/components/shared/`** | started, yours now |

The certificate queue matters most — approving a certificate is what makes it
visible to employers, and nothing else in the system can. Approving a
**company** also activates its recruiter accounts.

`registration_number` is on companies now, because that is what you actually
check before approving one.

---

## 7. How to build a page

**Don't start from a blank file.** `frontend/src/components/shared/README.md`
contains a complete, working dashboard page — copy it, change the nav and the
API call, and it is yours.

| Component | For |
| --- | --- |
| `DashboardShell` | sidebar + title bar + content. Slide-over sidebar on phones |
| `StatCard` | one number with a label — the top row of a dashboard |
| `SectionCard` | a titled block with a link on the right |
| `DataTable` | a table on desktop, stacked cards on a phone, from one definition |
| `StatusBadge` | any status string → a consistent colour |
| `PageHeader`, `EmptyState`, `ErrorAlert`, `LoadingBlock` | the small pieces |

Three steps to add a page:

1. Create `src/features/<your-area>/YourPage.jsx`
2. Import it in `src/routes/router.jsx` and add one `<Route>` line
3. Fetch through a module in `src/api/`, never `axios` inside a component

Use the `--ijp-*` CSS variables rather than hex colours and your page gets dark
mode for free. Check it at 380px wide before you push (Ctrl+Shift+M in Chrome).

---

## 8. Project structure

```text
InternshipJP/
├── backend/                     Spring Boot REST API
│   ├── src/main/java/com/internshipjp/backend/
│   │   ├── config/              typed settings, first-admin, demo seeder
│   │   ├── security/            Spring Security, CSRF, current-user helper
│   │   ├── controller/          HTTP endpoints
│   │   ├── service/             business rules
│   │   ├── repository/          Spring Data JPA
│   │   ├── entity/              JPA model + enums
│   │   ├── dto/request|response the public API shape
│   │   ├── exception/           error types + global handler
│   │   ├── storage/             files on disk
│   │   ├── ai/                  provider abstraction, Groq client, analysis
│   │   ├── mapper/              entity → DTO
│   │   └── util/                dates, secret encryption
│   └── src/main/resources/db/migration/   Flyway V1..V8
├── frontend/
│   └── src/
│       ├── api/                 axios client + one module per area
│       ├── components/shared/   the component kit — read its README
│       ├── config/              API base URL, theme
│       ├── features/            integration + ai built; others README-only
│       ├── routes/router.jsx    every route, one line each
│       └── styles/app.css       design tokens, light and dark
├── database/                    SCHEMA.md, maintenance SQL
├── documentation/               ownership, API contract, routes, deployment
├── scripts/                     start-dev, list-accounts, remove-demo-data
└── screenshots/
```

---

## 9. Git workflow

```
main       reviewed, working code only
develop    integration branch — open pull requests into this
```

Always branch from `develop`:

```powershell
git checkout develop
git pull
git checkout -b feature/auth-student
```

Branch names: `feature/auth-student`, `feature/employer-recruitment`,
`feature/admin-notifications-ui`, `feature/ai`, `feature/database-integration`,
`feature/deployment`.

Never push unfinished work to `main`.

Before every push:

```powershell
git pull origin develop     # take other people's work first
cd backend
.\mvnw.cmd test             # your change did not break anyone
cd ..\frontend
npm run build               # the frontend still compiles
```

---

## 10. Rules that keep four people out of each other's way

1. **Never edit migrations V1–V8.** Once a migration is pushed and someone has
   run it, it is frozen — editing it makes Flyway fail on every other machine
   with a checksum error. Add `V9__your_change.sql`, and tell Member 1.
2. **Never commit `application-local.properties`.** It holds passwords and API
   keys. It is git-ignored — keep it that way.
3. **Controllers return DTOs, never entities.**
4. **Never trust an id from the browser.** Use `CurrentUserService`.
   `/api/students/me`, not `/api/students/{id}`.
5. **Authorisation is a backend job.** Hiding a button in React is not
   security — anyone can call the API directly.
6. **Only `VERIFIED` certificates reach employers.** Enforced in
   `CertificateService`. Don't add a route around it.
7. **Add API calls to `src/api/*.js`,** not `axios` inside a component.
8. **Use the shared components and the `--ijp-*` variables.** Never hard-code a
   colour.
9. **Announce changes to shared files first:** `pom.xml`, `application.yml`,
   `SecurityConfig.java`, `GlobalExceptionHandler.java`, `axiosClient.js`,
   `router.jsx`, `styles/app.css`, `components/shared/*`.
10. **Use `TODO MEMBER_n`** to mark a boundary you are deliberately leaving.

---

## 11. Testing

```powershell
cd backend
.\mvnw.cmd test                        # fast unit tests, no database
.\mvnw.cmd test -Dgroups=requires-db   # needs MySQL running
.\mvnw.cmd clean package               # full build

cd ..\frontend
npm run build
```

The `requires-db` group starts the whole application context, which is the
fastest way to prove your entities still match the schema after a change. It
also runs the end-to-end test: register → sign in → apply → duplicate rejected
→ sign out.

---

## 12. When something breaks

| Message | Cause | Fix |
| --- | --- | --- |
| `Unknown database 'internshipjp_db'` | You skipped section 2.2 | Create the database |
| `Communications link failure` / `Connection refused` | MySQL isn't running | XAMPP → Start MySQL |
| `Port 8080 was already in use` | A backend is still running elsewhere | `Ctrl+C` in that terminal |
| `Port 3306 already in use` | A separate MySQL Windows service clashes with XAMPP | Stop it in `services.msc`, or set `DB_PORT=3307` |
| `Validation failed ... found [x], but expecting [y]` | An entity no longer matches its table | The message names the table and column. Whoever changed it fixes it |
| `Migration checksum mismatch` | Someone edited a migration that had already run | Restore the original file. Never edit a shared migration |
| `403 Forbidden` on a POST | Missing CSRF token | Use `api` from `axiosClient.js`. Calling by hand: GET first for the cookie, then send `X-XSRF-TOKEN` |
| `401 Unauthorized` | Not signed in, or the session expired | Sign in again (section 4) |
| `mvnw.cmd is not recognized` | Wrong folder | You must be in `backend\` |
| Nothing renders after `npm run dev` | Dependencies missing | `npm install` in `frontend\` |

Full reset of the database:

```sql
DROP DATABASE internshipjp_db;
CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Restart the backend and Flyway rebuilds all 19 tables.

---

## 13. Known gaps

Be aware of these before you demo anything:

- **No login or registration screen.** Member 2's first task. Use the Session
  panel on the integration page meanwhile.
- **The 2FA login challenge is not wired in.** Enabling and disabling TOTP and
  email OTP works, but sign-in completes on the password alone even when 2FA is
  on. `TODO MEMBER_2` in `AuthService`.
- **Education, interests and resume upload** have tables, entities and
  repositories but no endpoints — Member 2.
- **Internship filtering and the required-skills editor** are not built —
  Member 3.
- **Reports and the admin audit log** are not built — Member 4.
- **The AI chat needs a Groq key.** Without one it degrades with a readable
  message. The *calculated* parts — skill gaps, match scores, company
  insights — work with no key at all, because they are plain Java.
- **Spring Boot 3.5.16** is past its open-source support date. Chosen because
  it supports JDK 24 and because nearly every tutorial you will read is written
  for Spring Boot 3. Reasoning in `pom.xml`, upgrade notes in
  `documentation/DEPLOYMENT.md`.

---

## 14. Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite, React Router, Bootstrap 5, Bootstrap Icons, Axios, plain JavaScript |
| Backend | Java 24, Spring Boot 3.5.16 (Web, Data JPA, Security, Validation, Mail) |
| Database | MariaDB via XAMPP, schema owned by Flyway |
| AI | Groq, behind a provider interface, with the analysis calculated in Java |
| Auth | Server sessions + BCrypt + CSRF tokens (not JWT) |

No Docker, no TypeScript, no Lombok.

---

## Who to ask

| Topic | Ask |
| --- | --- |
| Setup won't work, database, migrations, API shape, AI | Member 1 |
| Login, sessions, student module, 2FA | Member 2 |
| Employers, vacancies, applications | Member 3 |
| Admin, notifications, shared components | Member 4 |

If you are stuck for more than twenty minutes, paste the **whole** error into
the group chat. The first line of a Java stack trace is rarely the useful one.
