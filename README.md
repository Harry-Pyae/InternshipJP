# InternshipJP

A web platform that connects students to internships, where an administrator
verifies a student's certificates before an employer can see them.

## About the project

A final-year group project for **CST-6108**, Third Year, Section B, Semester
VI, at the University of Information Technology, supervised by **Dr. Ei Moh Moh
Aung**.

Four members, each owning a vertical slice of the system, with one horizontal
role holding it together:

| | Responsibility |
| --- | --- |
| **Member 1** | Foundation and integration - database schema and migrations, shared components, the bilingual layer, matching and analysis services, testing and tooling, and the work of making four separately built modules behave as one application |
| **Member 2** | Authentication and the student module |
| **Member 3** | The employer module |
| **Member 4** | The administration module |

The migration sequence in `database/SCHEMA.md` records which member owns each
version, so the schema history doubles as a record of who built what.

### The problem it addresses

Internship platforms ask employers to trust claims they cannot check. A student
types a qualification into a profile and an employer has no way to tell it from
a real one. What an employer can verify is the university, the connections and
how polished the profile looks - none of which is the qualification, and all of
which favour applicants who were already advantaged.

The project asks whether putting a person in that gap changes the outcome: an
administrator reads the actual document before an employer ever sees it.

### What it sets out to show

- That verification can be a **routine step rather than a special case**, fast
  enough that an administrator can clear a queue of them
- That a match can be **explained in terms the applicant can act on**, rather
  than produced by a score nobody can question
- That a bilingual interface is achievable without a translation library, and
  that it has to include **text the server composes**, not only the labels
- That four people building separate modules can produce **one coherent
  application** if the shared layer is designed first

### Scope

Built and demonstrated locally. It is a working system rather than a
prototype - real file storage, real sessions, real verification - but it is
not deployed, has no email verification at registration, and keeps its
sign-in lockout in memory. Those limits are recorded in the report rather than
hidden.

## What the project is for

Most internship platforms take a student's word for their qualifications. An
employer reading a profile cannot tell a real certificate from a typed claim,
so in practice they fall back on whatever they already trust: the university
name, a shared connection, how active the profile looks.

InternshipJP moves the checking to the front. A student uploads the document, a
person reads it, and only then does it reach an employer. Everything else
follows from that one decision:

- **A missing certificate means something.** Because only verified ones are
  ever sent, an employer can read an absence as informative rather than as
  ambiguous.
- **Matching uses skills and nothing else.** Institution, connections and
  profile activity play no part, so the ranking does not quietly reward
  advantages the applicant already had.
- **Every score can be argued with.** A match names the skills you have and the
  ones you lack, so a student who disagrees has something specific to correct.
- **Exposure follows consent.** A profile reaches an employer only when the
  student applies. No employer can search the student population.
- **It works in two languages.** Burmese and English across every page a
  student, employer or administrator uses - including dates and relative times,
  and the reports the assistants compose on the server - and selectable before
  you sign in rather than buried in a setting. Three things stay in English:
  the body of a notification, which the server writes (its title is
  translated when it has fixed wording); server error messages that have no
  entry; and the developer diagnostics pages.

## The assistants

Three role-aware assistants share one provider interface with two
implementations, Groq and Google Gemini, chosen by configuration.

**Four features involve no model call at all** - plain Java over the database,
working with no API key and no internet:

| Feature | What it computes |
| --- | --- |
| Skill gaps | What to learn next, ranked by how many open vacancies ask for it |
| Matches | Vacancies scored against verified skills, with the score explained |
| Company review | Why a listing is not attracting applicants |
| Admin workload | What is waiting, how long, and who is blocked by it |

The chat assistant is the one that calls out. Matching is offline; chat is not,
and they are separate features.

## Built with

```
Backend    Java 24 · Spring Boot 3.5.16 · MariaDB · Flyway · Maven
Frontend   React 19.2 · Vite 8.2 · React Router 7.18 · Axios · Bootstrap 5.3
```

Sessions rather than tokens, deliberately: signing out ends a real server
session, which matters for a system holding identity documents.

---

# Running it

Three things start in order: the database, the backend, then the frontend.

## 1. The database

MariaDB or MySQL on the usual port. With XAMPP, start **MySQL** from the
control panel. As a Windows service:

```powershell
Get-Service | Where-Object { $_.Name -like "*maria*" -or $_.Name -like "*mysql*" }
Start-Service MariaDB          # or whatever name that prints
```

Create the database once. The tables are not made by hand - Flyway builds them
on first start.

```sql
CREATE DATABASE internshipjp_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

`utf8mb4` matters: Burmese text does not fit in the older `utf8`.

Check it is listening before going on:

```powershell
Test-NetConnection localhost -Port 3306
```

`TcpTestSucceeded : True` means you are ready.

## 2. The backend

Credentials live in `backend/application-local.properties`, which is not in
version control. Copy `application-local.example.properties` beside it and fill
in your own:

```properties
DB_USERNAME=root
DB_PASSWORD=
```

Then, from `backend/`:

```powershell
.\mvnw.cmd -q clean test-compile
.\mvnw.cmd spring-boot:run
```

It serves on **http://localhost:8080**.

**Run `test-compile`, not `compile`.** The tests build in a separate Maven
phase that `compile` skips, so a change that breaks them stays hidden until you
run the application.

### The tests

```powershell
.\mvnw.cmd test                       # 90 tests, no database needed
.\mvnw.cmd test -Dgroups=requires-db   # the other 12, against a real MariaDB
```

The second group starts the whole Spring context and drives the real HTTP
layer, so it needs `internshipjp_db` to exist. Each test rolls back what it
writes, so running them does not leave test rows behind.

**That second command used to run nothing at all.** Surefire applies includes
and excludes together, and the build excluded `requires-db` unconditionally, so
asking for the tag gave the intersection of the two - no tests - and still
printed `BUILD SUCCESS`. Selecting a group now clears the exclusion, through
the `db-tests` profile in `pom.xml`. Two of those twelve tests had been failing
the whole time they were unreachable.

On first start Flyway applies eleven migrations and creates twenty-one tables. The
log says `Successfully validated 11 migrations`.

## 3. The frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

It serves on **http://localhost:5173** and expects the backend on 8080.

The two run on different origins, which is why the API client sends
`withCredentials` and `withXSRFToken`. Change the ports and you must change
`app.frontend-origin` too, or every write will be refused.

## 4. The assistants, optional

Everything runs without this. The chat reports "not configured" and the four
calculated features keep working, because they never call a provider.

```properties
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.6-flash
```

Providers retire models often, so confirm the name against your own key:

```powershell
$k = "your_key"
(Invoke-RestMethod "https://generativelanguage.googleapis.com/v1beta/models?key=$k").models.name
```

Groq works the same way with `AI_PROVIDER=groq` and `GROQ_API_KEY`.

---

# Demo data

The application starts with an empty database and no way in - there is no
public route to register an administrator. Demo data solves that for testing:
seven accounts with realistic profiles, certificates in every verification
state, open vacancies and applications already in progress.

## Turning it on

In `backend/application-local.properties`:

```properties
app.demo-data.enabled=true
app.demo-data.reset=true
```

Start the backend once, then **set `reset` back to `false`**. Left on, it wipes
and rebuilds the demo rows on every restart, including anything you created by
hand while testing.

Two things worth knowing:

- The file lives at `backend/application-local.properties`, beside `pom.xml`,
  **not** inside `src`. It is imported as `optional:`, so a file in the wrong
  place produces no error at all - just no demo data.
- Comments in `DemoDataSeeder` name the environment variables
  (`DEMO_DATA_ENABLED`). In a properties file you want the property path shown
  above.

## The accounts

Every one uses the same password:

```
Practice-77x
```

| Role | Email | What it is for |
| --- | --- | --- |
| Administrator | `admin@demo.internshipjp.local` | Verification queue, company approvals, user management |
| Employer | `employer1@demo.internshipjp.local` | Company approved - can post and review |
| Employer | `employer2@demo.internshipjp.local` | Company still pending - shows what an employer sees while waiting |
| Student | `student1@demo.internshipjp.local` | Full profile, verified certificate, applications in progress |
| Student | `student2@demo.internshipjp.local` | Data-science profile, matches different vacancies |
| Student | `student3@demo.internshipjp.local` | Frontend profile |
| Student | `student4@demo.internshipjp.local` | Empty on purpose - shows the empty states and a 0% profile |

The seeder prints this list to the console on every start, so you never have to
come back here for it.

`student4` is not an oversight. Every screen has to be legible before anybody
has typed anything, and an account that has done nothing is the only way to
check that.

## A tour in five minutes

The shortest path through the idea the project is about:

1. Sign in as **student1**, upload a certificate
2. Sign in as **admin**, find it in the verification queue, verify it
3. Sign in as **employer1**, post a vacancy with **1 place**
4. Back as **student1**, browse and apply
5. As **employer1**, move the application through to **Accepted**

At step 5 the vacancy fills: it leaves the student browse list, refuses new
applications, and everybody else who applied is told the position has gone.

## A real administrator, without demo data

On a clean database you can create the first administrator once:

```properties
app.bootstrap-admin.enabled=true
app.bootstrap-admin.email=you@example.com
app.bootstrap-admin.password=Your-Pass1!
```

Start the application once, then **set `enabled` back to `false`**. After that,
administrators are created by invitation from an existing one.

## A note on passwords

Eight characters or more, with an uppercase letter, a lowercase letter, a digit
and a symbol. There is also a short denylist - `Password123!` satisfies every
composition rule and is refused, as is anything containing your own name or
email address.

The demo password obeys the same rule it is used to demonstrate.

---

# Troubleshooting

**`Socket fail to connect to localhost. Connection refused`**
The database is not running. Start MariaDB and try again - nothing is wrong
with the code.

**`ClassNotFoundException` for a class you can see in the source**
A stale `target/`. Maven decided nothing needed rebuilding and it was wrong:

```powershell
Remove-Item -Recurse -Force target
.\mvnw.cmd -q clean test-compile
```

**Every write returns 403**
The frontend origin does not match `app.frontend-origin`. The CSRF token is
attached per-origin, so a mismatch fails silently on reads and loudly on
writes.

**Demo data does not appear**
Check the file is at `backend/application-local.properties` and the keys are
`app.demo-data.enabled`, not `DEMO_DATA_ENABLED`.

**Locked out after failed sign-ins**
Five failures lock an address for fifteen minutes. An administrator can clear
it from the account panel, or restart the backend - the lock is held in memory.

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
    db/migration/ Flyway V1-V11

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

---

# Checks

Four scripts catch faults that have actually cost time on this project:

One of them needs a package, and says so plainly if it is missing:

```powershell
python -m pip install javalang
```

```powershell
cd backend\src\main\java\com\internshipjp\backend
python ..\..\..\..\..\..\check-annotations.py     # stacked @Transactional
python ..\..\..\..\..\..\check-lambda-capture.py  # a reassigned local in a lambda

cd backend\src
python ..\check-wiring.py                           # undeclared fields, test arity

cd frontend
python check-styles.py                               # overridden CSS, classes with no rule
```

Each catches something the compiler either cannot see or reports too late. If
you add one of your own, **feed it a known fault before trusting a zero** -
three of these reported success while standing on ground they never examined.
