# InternshipJP

An internship recruitment platform for students, employers and administrators,
with an AI assistant that recommends matches and explains them.

This repository is the **shared foundation** for our four-person project. It is
deliberately not the finished application: the backend, database and integration
layer work end to end, and each member's feature modules are left to be built.

---

## 1. Technology

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite, React Router, Bootstrap 5, Bootstrap Icons, Axios, plain JavaScript |
| Backend | Java 24, Spring Boot 3.5.16 (Web, Data JPA, Security, Validation, Mail) |
| Database | MariaDB via XAMPP, schema owned by Flyway |
| AI | Groq, behind a provider interface |
| Build | Maven (backend), npm (frontend) |

No Docker, no TypeScript, no Lombok, no JWT. Sessions and cookies, not tokens.

> **Note on the Spring Boot version.** 3.5.16 is the last patch of the 3.5 line
> and supports JDK 24. Spring Boot 4.x is newer but renames starters, moves to
> Jackson 3 / Hibernate 7 / Spring Security 7 and changes CSRF defaults. We
> stayed on 3.5 because almost every tutorial and answer the team will read is
> written for Spring Boot 3. See `documentation/DEPLOYMENT.md` for the upgrade
> notes.

---

## 2. Team

| Member | Area |
| --- | --- |
| **Member 1** | Integration, database coordination, testing, AI, deployment |
| **Member 2** | Authentication, security, student module, password, 2FA |
| **Member 3** | Employer, company, internships, applications, recruitment |
| **Member 4** | Administration, notifications, certificate verification, shared frontend |

Full detail in `documentation/TEAM_OWNERSHIP.md`.

---

## 3. What you need installed

- **JDK 24** (JDK 21 also works - change `<java.version>` in `backend/pom.xml`)
- **Maven 3.9+**
- **Node.js 20+** and npm
- **XAMPP** with MySQL/MariaDB

Check everything at once:

```bat
java -version
mvn -v
node -v
```

---

## 4. First-time setup

### 4.1 Start MariaDB and create the database

Open the XAMPP Control Panel and press **Start** next to **MySQL**. Apache is
not needed.

Then create the empty database. Either use phpMyAdmin
(<http://localhost/phpmyadmin>) and run:

```sql
CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

or from the command line:

```bat
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4;"
```

**Do not create any tables yourself.** Flyway creates all 19 tables the first
time the backend starts.

### 4.2 Configure the backend

```bat
cd backend
copy application-local.example.properties application-local.properties
```

Open `application-local.properties` and fill in what you need. The defaults
already match a standard XAMPP install (`root`, blank password), so for a plain
run you can leave it untouched. That file is git-ignored - **never commit it**.

### 4.3 Configure the frontend

```bat
cd frontend
copy .env.example .env
npm install
```

`.env` only needs `VITE_API_BASE_URL`, and only if your backend is not on 8080.

---

## 5. Running the project

Two terminals.

**Terminal 1 - backend**

```bat
cd backend
mvn spring-boot:run
```

Serves <http://localhost:8080>.

**Terminal 2 - frontend**

```bat
cd frontend
npm run dev
```

Serves <http://localhost:5173>.

Open <http://localhost:5173/integration/status>. Three cards should report the
backend, the database (naming `internshipjp_db`) and the AI provider.

### Adding the Maven wrapper (optional)

This repository does not ship `mvnw`. If you want it so nobody has to install
Maven, generate it once and commit the result:

```bat
cd backend
mvn wrapper:wrapper
```

After that `mvnw.cmd spring-boot:run` works too.

---

## 6. Creating the first accounts

There is **no public admin registration** - that would be an open door. Create
the first administrator once:

1. In `backend/application-local.properties` set

   ```properties
   BOOTSTRAP_ADMIN_ENABLED=true
   BOOTSTRAP_ADMIN_EMAIL=admin@internshipjp.local
   BOOTSTRAP_ADMIN_PASSWORD=choose-something-long
   ```

2. Start the backend once. It logs `created administrator ...`.
3. Set `BOOTSTRAP_ADMIN_ENABLED=false` again.

Students and employers register through the API:

```
POST /api/auth/register/student
POST /api/auth/register/employer
```

An employer account and its company both start as `PENDING`. The employer can
sign in but cannot publish an internship until an administrator approves the
company.

The database ships **empty on purpose**: no fake students, no fake vacancies.
Everything you see in the UI is data someone really entered.

---

## 7. Flyway - how the schema works

- Migrations live in `backend/src/main/resources/db/migration`.
- They run automatically at startup, in version order.
- `spring.jpa.hibernate.ddl-auto=validate`, so Hibernate checks the entities
  against the tables and **never** changes the schema itself.

**The rule everyone must follow:** once a migration has been pushed and someone
else has pulled it, it is frozen. Never edit `V1..V7`. Add `V8__...sql`,
`V9__...sql` and so on. Editing a shared migration makes Flyway fail on every
other machine with a checksum mismatch.

If you need to start over locally:

```sql
DROP DATABASE internshipjp_db;
CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4;
```

Table-by-table documentation: `database/SCHEMA.md`.

---

## 8. Testing

```bat
cd backend

mvn test                          :: fast unit tests, no database needed
mvn test -Dgroups=requires-db     :: tests that need MariaDB running
mvn clean package                 :: full build
```

The database-backed group includes the application-context test, which is the
quickest way to prove your entities still match the schema.

```bat
cd frontend
npm run build
```

Manual check order (also in `documentation/API_CONTRACT.md`):

| # | Check | Expected |
| --- | --- | --- |
| 1 | MariaDB running, `internshipjp_db` exists | - |
| 2 | `GET http://localhost:8080/api/test/health` | `{"status":"UP","application":"InternshipJP"}` |
| 3 | `GET http://localhost:8080/api/test/database` | `connected: true`, `database: internshipjp_db` |
| 4 | `GET http://localhost:8080/api/test/ai` | `configured` / `reachable` reflect your key |
| 5 | `http://localhost:5173/integration/status` | three cards, all live calls |

Turn the test endpoints off in production with
`APP_TEST_ENDPOINTS_ENABLED=false` - the controller then disappears entirely.

---

## 9. Environment variables

Nothing secret is committed. Every value below comes from
`backend/application-local.properties` or from the real environment.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_HOST` | `localhost` | MariaDB host |
| `DB_PORT` | `3306` | MariaDB port |
| `DB_NAME` | `internshipjp_db` | Database name |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `UPLOAD_ROOT` | `./uploads` | Where uploaded files are stored |
| `APP_TEST_ENDPOINTS_ENABLED` | `true` | Enables `/api/test/**` |
| `GROQ_API_KEY` | *(empty)* | AI provider key - backend only |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | AI model |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | AI endpoint |
| `MAIL_MODE` | `console` | `console` prints the OTP, `smtp` emails it |
| `MAIL_FROM` | `no-reply@internshipjp.local` | Sender address |
| `TOTP_ENCRYPTION_KEY` | *(empty)* | Base64 AES key for 2FA secrets |
| `BOOTSTRAP_ADMIN_*` | disabled | First administrator account |

Frontend: `VITE_API_BASE_URL` only. Never put a key in a `VITE_` variable - it
ends up in the JavaScript bundle.

---

## 10. Repository layout

```text
InternshipJP/
├── backend/            Spring Boot REST API
│   ├── src/main/java/com/internshipjp/backend/
│   │   ├── config/     typed settings, first-admin bootstrap
│   │   ├── security/   Spring Security, CSRF, current-user helper
│   │   ├── controller/ HTTP endpoints
│   │   ├── service/    business rules
│   │   ├── repository/ Spring Data JPA
│   │   ├── entity/     JPA model + enums
│   │   ├── dto/        request/ and response/ - the public API shape
│   │   ├── exception/  error types + global handler
│   │   ├── storage/    file storage on disk
│   │   ├── ai/         provider abstraction, Groq client, AI services
│   │   ├── mapper/     entity -> DTO
│   │   └── util/       dates, secret encryption
│   └── src/main/resources/db/migration/   Flyway V1..V7
├── frontend/           React + Vite
│   └── src/
│       ├── api/        axios client + one module per area
│       ├── components/shared/
│       ├── features/   integration/ and ai/ built; others are README-only
│       ├── routes/     router.jsx
│       └── styles/
├── database/           SCHEMA.md
├── documentation/      ownership, API contract, frontend map, deployment
├── screenshots/
└── README.md
```

---

## 11. Branches

```text
main            only reviewed, working code
└── develop     integration branch - open pull requests into this
```

Feature branches:

```text
feature/database-integration     Member 1
feature/ai                       Member 1
feature/deployment               Member 1
feature/auth-student             Member 2
feature/employer-recruitment     Member 3
feature/admin-notifications-ui   Member 4
```

Never push unfinished work to `main`. Create your branch from `develop`:

```bat
git checkout develop
git pull
git checkout -b feature/auth-student
```

---

## 12. Conventions worth knowing before you write code

1. **Controllers never return entities.** Always a DTO from `dto/response`.
2. **Never trust an id from the browser.** Use `CurrentUserService` to get the
   signed-in user, then load that user's data. `/api/students/me`, not
   `/api/students/{id}`.
3. **Authorisation is a backend job.** Hiding a button in React is not security.
4. **Only `VERIFIED` certificates reach employers.** Enforced in
   `CertificateService`. Do not add a route around it.
5. **Add new calls to `src/api/*.js`,** not `axios` inside a component.
6. **Use `TODO MEMBER_n`** to mark a boundary you are deliberately leaving.
