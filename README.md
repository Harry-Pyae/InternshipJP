# InternshipJP

A web platform that connects university students with internship placements,
built around one idea: **an employer should be able to trust what a student's
profile claims.**

Anyone can write "IELTS 7.5" on a CV. On InternshipJP a student uploads the
certificate, an administrator opens the file and checks it, and only then does
any employer see it. Everything else — the matching, the AI guidance, the
application pipeline — is built on top of that verified data.

---

## What it does

**Students** build a profile with skills, education and certificates, browse
open internships, and apply. An assistant reads their actual profile and tells
them what to learn next, and which vacancies fit.

**Employers** register a company, wait for approval, publish internships and
review applicants. An assistant explains why a listing is not attracting people
— missing skills, no deadline, a stipend left blank.

**Administrators** verify certificates, approve companies, manage accounts, and
see what is waiting and how long it has waited.

### The AI assistant

Three role-aware assistants share one provider interface with two
implementations, Groq and Google Gemini, chosen by configuration.

Four of its features involve **no model call at all** — they are plain Java
over the database, so they work with no API key and no internet:

| Feature | What it computes |
| --- | --- |
| Skill gaps | What to learn next, ranked by how many open vacancies ask for it |
| Matches | Vacancies scored against verified skills, with the score explained |
| Company review | Why a listing is not attracting applicants |
| Admin workload | What is waiting, how long, and who is blocked by it |

### English and Burmese

The whole interface switches between English and မြန်မာ, including text
generated on the server. The assistant follows the toggle: ask a question with
Burmese selected and the answer comes back in Burmese.

---

## Built with

| Layer | Technology |
| --- | --- |
| Backend | Java 24, Spring Boot 3.5.16, Spring Security, Spring Data JPA, Bean Validation |
| Database | MariaDB 10.4+, schema managed by Flyway (8 migrations) |
| Frontend | React 19.2, Vite 8, React Router 7, Bootstrap 5.3, Axios |
| Auth | Server-side sessions with an HTTP-only cookie and CSRF protection |
| AI | Groq or Google Gemini, behind one interface |

Roughly 187 Java files, 34 React pages, 75 API endpoints and 466 translated
strings.

**Sessions rather than JWT** is a deliberate choice: logging out genuinely ends
the session on the server, which a self-contained token cannot do without extra
machinery.

---

## Running it

### 1. Install these first

| | Version | Where |
| --- | --- | --- |
| **JDK** | 21 or newer (24 recommended) | https://adoptium.net |
| **Node.js** | 20 or newer | https://nodejs.org |
| **MariaDB** | 10.4 or newer | https://mariadb.org, or XAMPP which bundles it |

Check all three before going further:

```powershell
java -version     # should print 21+
node -v           # should print v20+
npm -v
```

Maven is **not** required — the project includes the Maven wrapper
(`mvnw.cmd`), which downloads the right version itself.

### 2. Create the database

Start MariaDB, then create an empty database:

```sql
CREATE DATABASE internshipjp_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Nothing else. **Flyway creates every table on first start** from the migrations
in `backend/src/main/resources/db/migration`.

`utf8mb4` matters — Burmese text will not store correctly without it.

### 3. Configure the backend

```powershell
cd backend
copy application-local.example.properties application-local.properties
```

Open the copy and set your database password:

```properties
DB_USERNAME=root
DB_PASSWORD=your_password_here
```

That is the minimum. This file is git-ignored, so your credentials never leave
your machine.

**To create the first administrator**, add these, start the app once, then set
`enabled` back to `false`:

```properties
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_EMAIL=admin@internshipjp.local
BOOTSTRAP_ADMIN_PASSWORD=choose-a-password
```

There is no public admin registration endpoint, by design.

**For sample data** to explore with, add `DEMO_DATA_ENABLED=true`. What that
creates, and how to remove it later, is in
[Demo data](#demo-data) below.

### 4. Enable the AI (optional)

Everything runs without this. The chat reports "not configured" and the four
calculated features above keep working, because they never call a provider.

To enable it, get a key and add:

```properties
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
```

Providers retire models often, so confirm the name against your own key rather
than trusting the default:

```powershell
$k = "your_key"
(Invoke-RestMethod "https://generativelanguage.googleapis.com/v1beta/models?key=$k").models.name
```

Groq works the same way with `AI_PROVIDER=groq` and `GROQ_API_KEY`.

### 5. Start it

Two terminals.

**Terminal 1 — backend:**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

First run takes a few minutes while Maven downloads dependencies. Wait for
`Started InternshipJpApplication`.

**Terminal 2 — frontend:**

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## Checking it works

Visit **http://localhost:5173/integration/status**. It tests five things live
and reports each with its latency:

```
Frontend      React rendered this page
Backend API   Spring Boot answered the health check
MariaDB       a real query ran against the schema
AI provider   the key was accepted
Session       the cookie made a round trip
```

If something is wrong, this page says which layer — far quicker than reading a
stack trace.

---

## Demo data

The project ships with a seeder that creates sample students, employers,
vacancies, applications and certificates, so you can see every screen with
something in it before any real data exists.

Everything it creates is **marked**, so it can always be told apart from real
records:

- accounts end **`@demo.internshipjp.local`**
- companies start **`Demo `**

Nothing outside those two patterns is ever touched.

### Turn it on

In `backend/application-local.properties`:

```properties
DEMO_DATA_ENABLED=true
```

Start the backend once. You get:

| | |
| --- | --- |
| Accounts | 1 administrator, 2 employers, 4 students — all with the password `demo1234` |
| Companies | Demo Yangon Tech (approved), Demo Sakura Systems (awaiting approval) |
| Internships | 5, including one draft and one with no required skills |
| Applications | 5, across five different statuses |
| Certificates | 3 — two verified, one waiting for review |

Records are deliberately **staggered in age**, so the administrator's queues
show a realistic spread rather than every item reporting the same number of
days:

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

Green, amber and red all appear at once, which is what those colours exist to
distinguish.

### Rebuild it from scratch

Clear first, then seed — two steps, with the backend stopped for the first.

```powershell
.\scripts\remove-demo-data.ps1
```

Then set `DEMO_DATA_ENABLED=true` and start the backend. Set it back to `false`
once the data is in, so it does not re-check on every restart.

> **Do not use `DEMO_DATA_RESET=true`.** It deletes through JPA in the same
> transaction that seeds, and fails on a stale entity reference. The script
> above does the same job in plain SQL and is not affected. A failed reset is
> caught and logged rather than stopping the application, but it will not have
> cleared anything.

### Remove it, for real data

```properties
DEMO_DATA_ENABLED=false
```

```powershell
.\scripts\remove-demo-data.ps1
```

It prints what it will delete, asks for confirmation, and removes both the
database rows and the uploaded certificate files. The files matter — deleting
rows alone leaves orphaned PDFs on disk that nothing points at.

SQL alternative, which does **not** delete the files:

```powershell
"C:\xampp\mysql\bin\mysql.exe" -u root internshipjp_db < database\remove_demo_data.sql
```

### Start completely fresh

If the database is in a state you would rather abandon:

```sql
DROP DATABASE internshipjp_db;
CREATE DATABASE internshipjp_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Start the backend and Flyway rebuilds all eight migrations from nothing.
**This deletes real data too** — development only.

---

## A tour in two minutes

With demo data loaded, this walks through verification, applying and the
hiring pipeline — the three things the platform exists to do.

1. Sign in as **`student1@demo.internshipjp.local`** (`demo1234`).
   Go to **Certificates**, upload any PDF. It appears as **Pending**.

2. Sign out, sign in as **`admin@demo.internshipjp.local`**.
   **Certificate review** shows it with the student's name. Press **Review**,
   open the file, then **Verify**.

3. Back as the student — the certificate now reads **Verified**, and the
   waiting banner is gone.

4. Still as the student: **Browse internships**, open one, write a line and
   **Apply**.

5. Sign in as **`employer1@demo.internshipjp.local`**.
   **Applicants** shows the new application. Press **Review** — the student's
   profile, skills and *verified* certificates are all there. Set the status to
   **Shortlisted**.

6. Back as the student — **My applications** shows **Shortlisted**, and the
   notification bell has a count.

Switch the **EN / မြန်မာ** toggle at any point; the interface and the
assistant's answers both follow it.

---

## Common problems

**`Port 8080 was already in use`** — an earlier backend is still running.

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen |
  ForEach-Object { Get-Process -Id $_.OwningProcess } |
  Select-Object Id, ProcessName
Stop-Process -Id <the-id>
```

Closing the terminal window does not always stop it. Use **Ctrl+C**.

**`Access denied for user 'root'`** — the password in
`application-local.properties` does not match MariaDB.

**`Unknown database 'internshipjp_db'`** — step 2 was skipped. Flyway creates
tables, not the database itself.

**PowerShell refuses to run the scripts:**

```powershell
Get-ChildItem .\scripts\*.ps1 | Unblock-File
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**A page is blank** — hard-refresh with **Ctrl+Shift+R**. Vite caches modules,
and a failed one can persist after the fix.

---

## Project layout

```
backend/
  src/main/java/com/internshipjp/backend/
    ai/           the assistants and both provider clients
    config/       properties, startup, demo data
    controller/   REST endpoints
    dto/          request and response shapes
    entity/       JPA entities
    mapper/       entity to DTO
    repository/   Spring Data interfaces
    security/     session, CSRF, authorisation
    service/      business rules
  src/main/resources/
    application.yml
    db/migration/ Flyway V1-V8

frontend/src/
  api/          one module per area, no axios calls in components
  components/   shared UI used by every page
  config/       theme, language, auth context
  features/     pages, grouped by role
  layouts/      the app shell and the auth shell
  routes/       routing
  styles/       one stylesheet, CSS custom properties

database/       schema notes and helper SQL
documentation/  API contract, architecture, deployment
scripts/        PowerShell helpers
```

---

## Useful scripts

```powershell
.\scripts\start-dev.ps1                      # both servers at once
.\scripts\list-accounts.ps1                  # every account and its role
.\scripts\list-accounts.ps1 -ResetPassword email@example.com
.\scripts\remove-demo-data.ps1               # delete demo records only
```

---

## Notes for anyone reading the code

- **`.\mvnw.cmd -q compile`** before running catches argument and import
  mistakes in seconds.
- **Nothing calls axios directly from a component.** Every request goes through
  a module in `frontend/src/api/`.
- **Interface text lives in one file**, `frontend/src/config/strings.js`. A
  string with no translation falls back to English rather than breaking.
- **Never edit V1–V8.** Flyway checksums them; a change breaks startup on every
  machine that already ran them. Add V9 instead.
