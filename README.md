# InternshipJP

An internship recruitment platform for students, employers and administrators,
with an AI assistant that recommends matches and explains them.

This is our **shared foundation**, not the finished app. The backend, database,
security and integration layer run end to end. The role dashboards are the four
of us to build.

**Read this whole page before you start.** It takes ten minutes and saves an
evening of debugging in the group chat.

---

## 1. What to install

Four things, all installed **on your machine**, not inside the project folder.

| Tool | Version | Where to get it |
| --- | --- | --- |
| JDK | 24 (21 also works) | <https://adoptium.net> |
| Node.js | 20 or newer | <https://nodejs.org> (LTS) |
| XAMPP | any recent | <https://www.apachefriends.org> |
| Git | any | <https://git-scm.com> |

**You do not need to install Maven.** The repository includes the Maven wrapper
(`mvnw.cmd`), which downloads Maven for you the first time you run it.

Check all four in PowerShell:

```powershell
java -version
node -v
git --version
```

If `java -version` shows 21, that's fine — open `backend\pom.xml` and change
`<java.version>24</java.version>` to `21`. Don't commit that change.

### Where to put the project

```
C:\Projects\InternshipJP
```

Two places **not** to put it:

- **`C:\xampp\htdocs`** — nothing here is served by Apache. Spring Boot runs its
  own server on `:8080` and Vite serves React on `:5173`. Worse, Apache would
  publish `application-local.properties` as plain text to anyone who asks — that
  file holds your database password and API keys.
- **OneDrive / synced Desktop folders** — sync fights with `node_modules` and
  `target\`, and you get random file-lock errors mid-build.

---

## 2. First-time setup

Do this once. Roughly 15 minutes, mostly downloads.

### 2.1 Clone

```powershell
cd C:\Projects
git clone https://github.com/<owner>/InternshipJP.git
cd InternshipJP
```

### 2.2 Start MariaDB and create the database

Open the **XAMPP Control Panel** and press **Start** next to **MySQL**.
Apache is not needed — leave it stopped.

Then create the database:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
```

The `&` is required in PowerShell because the path contains spaces.

Or use phpMyAdmin at <http://localhost/phpmyadmin> → **SQL** tab → run:

```sql
CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

**Create the database and nothing else.** Do not create tables. Flyway builds
all 19 of them the first time the backend starts.

Confirm it exists:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SHOW DATABASES;"
```

### 2.3 Backend config

```powershell
cd C:\Projects\InternshipJP\backend
copy application-local.example.properties application-local.properties
```

**Copy it — don't rename it.** The `.example` file must stay in Git so everyone
knows which settings exist. Your copy is git-ignored and holds your real values.

With a standard XAMPP install (`root`, blank password) you can leave the copy
untouched for now. Every setting already has a working default.

### 2.4 Frontend config

```powershell
cd C:\Projects\InternshipJP\frontend
copy .env.example .env
npm install
```

`npm install` takes a minute and creates `node_modules\` (git-ignored).

---

## 3. Running it — every day

Three steps, two terminals that stay open while you work.

**Step 1 — XAMPP Control Panel → Start MySQL.** Needed after every Windows
restart.

**Step 2 — Terminal 1, backend:**

```powershell
cd C:\Projects\InternshipJP\backend
.\mvnw.cmd spring-boot:run
```

**Step 3 — Terminal 2, frontend:**

```powershell
cd C:\Projects\InternshipJP\frontend
npm run dev
```

Open <http://localhost:5173>.

### What you should see

The **first** backend run downloads Maven and every dependency — several minutes
and hundreds of `Downloading from central:` lines. That is normal and happens
once. Later runs take about five seconds.

Watch for these three lines:

```
Successfully applied 7 migrations to schema `internshipjp_db`
Tomcat started on port 8080 (http)
Started InternshipJpApplication in 4.2 seconds
```

The Flyway line only appears on the very first run — after that the migrations
are already applied and it says `Current version of schema: 7`.

### Verify

Go to <http://localhost:5173/integration/status>. Three cards, all from real API
calls:

| Card | Expected |
| --- | --- |
| Backend | **Connected** |
| Database | **Connected — internshipjp_db**, 19 tables |
| AI provider | **Not configured** until someone adds a Groq key — that is correct, not a failure |

---

## 4. Important: `mvnw` is the running server, not a build step

If you're coming from PHP, this is the thing that trips everyone up.

`.\mvnw.cmd spring-boot:run` **occupies that terminal**. It sits there printing
log lines. Don't close it, don't type in it.

- **Stop the backend:** `Ctrl+C` in Terminal 1
- **After changing Java code:** `Ctrl+C`, then run it again

Java is compiled, so edits don't take effect until you restart. There is no
"just refresh the page" for backend changes.

The frontend is the opposite — Vite hot-reloads. Save a `.jsx` file and the
browser updates itself. You almost never restart Terminal 2.

---

## 5. Signing in (the login page doesn't exist yet)

There is no login screen — that's Member 2's first task. `POST /api/auth/login`
accepts JSON only, and there is no HTML form at `:8080`. Typing a URL into the
browser and getting

```json
{"status":401,"error":"Unauthorized","path":"/login"}
```

means you hit a URL that doesn't exist.

Until the real screen is built, create an account from the browser console.
Open <http://localhost:5173>, press **F12** → **Console**:

```javascript
// 1. get a CSRF token
await fetch("http://localhost:8080/api/auth/csrf", { credentials: "include" });
const csrf = decodeURIComponent(
  document.cookie.split("; ").find(c => c.startsWith("XSRF-TOKEN=")).split("=")[1]
);
const headers = { "Content-Type": "application/json", "X-XSRF-TOKEN": csrf };

// 2. register (run once — a second time returns 409, which is correct)
await fetch("http://localhost:8080/api/auth/register/student", {
  method: "POST", credentials: "include", headers,
  body: JSON.stringify({
    email: "student@test.local",
    password: "password123",
    fullName: "Test Student",
    university: "Test University"
  })
}).then(r => r.json());

// 3. sign in
await fetch("http://localhost:8080/api/auth/login", {
  method: "POST", credentials: "include", headers,
  body: JSON.stringify({ email: "student@test.local", password: "password123" })
}).then(r => r.json());
```

Now `/ai/student` recognises you.

**Why the CSRF step?** Posting straight to `/api/auth/login` returns 403. The
backend sets an `XSRF-TOKEN` cookie on any GET, and every write request must
send it back as the `X-XSRF-TOKEN` header. In the React app this is invisible —
`App.jsx` fetches the cookie on startup and Axios attaches the header
automatically. It's only manual here because you're bypassing the app.

### Creating an administrator

There is no public admin registration. Create the first one once:

1. In `backend\application-local.properties`:
   ```properties
   BOOTSTRAP_ADMIN_ENABLED=true
   BOOTSTRAP_ADMIN_EMAIL=admin@internshipjp.local
   BOOTSTRAP_ADMIN_PASSWORD=pick-something-long
   ```
2. Restart the backend. Look for `created administrator`.
3. Set `BOOTSTRAP_ADMIN_ENABLED=false` and restart again.

The database ships **empty on purpose** — no fake students, no fake vacancies.
Everything you see is data someone really entered.

---

## 6. Enabling the AI assistant (optional)

The platform runs fine without it. To turn it on:

1. Get a free key at <https://console.groq.com> (starts with `gsk_`)
2. In `backend\application-local.properties`, fill in the existing line:
   ```properties
   GROQ_API_KEY=gsk_your_key_here
   ```
3. Restart the backend — config is read at startup

The AI card on `/integration/status` should go green with a model and latency.

**The key goes only in that file.** Never in `frontend\.env` — anything with a
`VITE_` prefix is compiled into the JavaScript bundle and visible to anyone who
opens dev tools. React asks our backend; our backend asks Groq.

---

## 7. When something breaks

| Message | Cause | Fix |
| --- | --- | --- |
| `Unknown database 'internshipjp_db'` | You skipped section 2.2 | Create the database |
| `Communications link failure` / `Connection refused` | MySQL isn't running | XAMPP → Start MySQL |
| `Port 8080 was already in use` | A backend is still running elsewhere | `Ctrl+C` in that terminal |
| `Port 3306 already in use` | A separate MySQL Windows service clashes with XAMPP | Stop it in `services.msc`, or set `DB_PORT=3307` |
| `Validation failed ... found [x], but expecting [y]` | An entity no longer matches its table | Whoever changed the entity or migration fixes it — the message names the exact table and column |
| `403 Forbidden` on a POST | Missing CSRF token | Load a page first so the cookie exists; in code, use `api` from `axiosClient.js` |
| `401 Unauthorized` | Not signed in, or session expired | Sign in again (section 5) |
| `mvnw.cmd is not recognized` | Wrong folder | You must be in `backend\` |

Full reset of the database:

```sql
DROP DATABASE internshipjp_db;
CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Restart the backend and Flyway rebuilds all 19 tables.

---

## 8. Who builds what

| Member | Area | Start here |
| --- | --- | --- |
| **Member 1** | Integration, database, testing, AI, deployment | `features/integration/`, `features/ai/` (built) |
| **Member 2** | Auth, security, student module, 2FA | `frontend/src/features/auth/README.md` |
| **Member 3** | Employer, internships, applications, recruitment | `frontend/src/features/employer/README.md` |
| **Member 4** | Admin, notifications, certificate verification, shared UI | `frontend/src/features/admin/README.md` |

**Read your own feature README first.** Each one lists your pages, your routes,
which backend endpoints already work, and what's still missing.

Then:

- `documentation/TEAM_OWNERSHIP.md` — exact file and table ownership
- `documentation/API_CONTRACT.md` — every endpoint, role, request and response
- `documentation/FRONTEND_OWNERSHIP.md` — the full route map and how to add a page
- `database/SCHEMA.md` — every table and relationship

---

## 9. Branches

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

---

## 10. Rules that keep four people out of each other's way

1. **Never edit migrations V1–V7.** Once a migration is pushed and someone has
   run it, it is frozen — editing it makes Flyway fail on every other machine
   with a checksum error. Add `V8__your_change.sql` instead, and tell Member 1.
2. **Never commit `application-local.properties`.** It holds passwords and API
   keys. It's git-ignored — keep it that way.
3. **Controllers return DTOs, never entities.**
4. **Never trust an id from the browser.** Use `CurrentUserService` to get the
   signed-in user. `/api/students/me`, not `/api/students/{id}`.
5. **Authorisation is a backend job.** Hiding a button in React is not security —
   anyone can call the API directly.
6. **Only `VERIFIED` certificates reach employers.** Enforced in
   `CertificateService`. Don't add a route around it.
7. **Add API calls to `src/api/*.js`,** not `axios` inside a component.
8. **Announce changes to shared files** before you make them: `pom.xml`,
   `application.yml`, `SecurityConfig.java`, `GlobalExceptionHandler.java`,
   `axiosClient.js`, `router.jsx`, `styles/app.css`.
9. **Use `TODO MEMBER_n`** to mark a boundary you're deliberately leaving.

---

## 11. Testing

```powershell
cd backend
.\mvnw.cmd test                        # fast unit tests, no database needed
.\mvnw.cmd test -Dgroups=requires-db   # needs MySQL running
.\mvnw.cmd clean package               # full build

cd ..\frontend
npm run build
```

The `requires-db` group starts the whole application context, which is the
quickest way to prove your entities still match the schema after a change.

---

## 12. Known gaps

Be aware of these before you demo anything:

- **The 2FA login challenge is not wired in.** Enabling and disabling TOTP and
  email OTP works, but login completes on the password alone even when 2FA is
  on. Marked `TODO MEMBER_2` in `AuthService`.
- **No login or registration screen** — Member 2's first task.
- **Education records, career interests and resume upload** have tables,
  entities and repositories but no endpoints yet — Member 2.
- **Internship filtering and the required-skills editor** aren't built —
  Member 3.
- **Spring Boot 3.5.16** is past its open-source support date. It was chosen
  because it supports JDK 24 and because nearly every tutorial you'll read is
  written for Spring Boot 3. Reasoning is in `pom.xml`; upgrade notes are in
  `documentation/DEPLOYMENT.md`.

---

## 13. Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite, React Router, Bootstrap 5, Bootstrap Icons, Axios, plain JavaScript |
| Backend | Java 24, Spring Boot 3.5.16 (Web, Data JPA, Security, Validation, Mail) |
| Database | MariaDB via XAMPP, schema owned by Flyway |
| AI | Groq, behind a provider interface |
| Auth | Server sessions + BCrypt + CSRF tokens (not JWT) |

No Docker, no TypeScript, no Lombok.
