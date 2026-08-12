# Deployment notes

**Nothing is deployed yet.** This file is the checklist for when we are ready,
plus the placeholders to fill in. Owner: **Member 1**.

---

## 1. Placeholders to fill in

| Item | Value |
| --- | --- |
| Production frontend URL | `https://__________` |
| Production backend URL | `https://__________` |
| Database host / port | `__________ : 3306` |
| Database name | `internshipjp_db` |
| Database user | `__________` (not `root`) |
| Upload storage path | `__________` |
| SMTP host / port | `__________ : 587` |
| Sender address | `no-reply@__________` |
| Groq key holder | `__________` |
| Backup location | `__________` |
| Backup schedule | `__________` |

---

## 2. Build

```bash
cd backend
mvn clean package
# -> target/backend-0.1.0.jar
java -jar target/backend-0.1.0.jar

cd ../frontend
npm ci
npm run build
# -> dist/  (static files for any web server)
```

The frontend `dist/` folder is plain static content. Because React Router uses
real paths, the web server must fall back to `index.html` for unknown routes,
otherwise a refresh on `/admin/users` returns 404.

Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 3. Environment for production

Set these as real environment variables or in a systemd unit - never in a file
inside the repository.

```bash
SPRING_PROFILES_ACTIVE=prod

DB_HOST=...
DB_PORT=3306
DB_NAME=internshipjp_db
DB_USERNAME=internshipjp_app      # not root
DB_PASSWORD=...                   # long and random

FRONTEND_ORIGIN=https://the-real-frontend-url
UPLOAD_ROOT=/var/lib/internshipjp/uploads

APP_TEST_ENDPOINTS_ENABLED=false  # important

GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

MAIL_MODE=smtp                    # console mode is refused under the prod profile
MAIL_FROM=no-reply@...
SPRING_MAIL_HOST=...
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=...
SPRING_MAIL_PASSWORD=...

TOTP_ENCRYPTION_KEY=...           # openssl rand -base64 32

BOOTSTRAP_ADMIN_ENABLED=false     # only true for the very first boot
```

---

## 4. Go-live checklist

**Security**

- [ ] `APP_TEST_ENDPOINTS_ENABLED=false` - `/api/test/**` must not be public
- [ ] `SPRING_PROFILES_ACTIVE=prod` - this is what refuses `MAIL_MODE=console`,
      so OTP codes can never reach a log file
- [ ] HTTPS everywhere, and `server.servlet.session.cookie.secure=true`
- [ ] `FRONTEND_ORIGIN` is the exact production origin. `*` will not work
      anyway: CORS with credentials requires a specific origin
- [ ] A dedicated database user with rights on `internshipjp_db` only
- [ ] `TOTP_ENCRYPTION_KEY` set and backed up. **If it is lost, every stored TOTP
      secret becomes undecryptable and all users must re-enrol**
- [ ] `BOOTSTRAP_ADMIN_ENABLED=false` after the first administrator exists
- [ ] No `application-local.properties` in the deployed artefact
- [ ] `git log -p` checked once for an accidentally committed key

**Database**

- [ ] `internshipjp_db` exists and is empty on first deploy
- [ ] Flyway runs at startup - check the log for `Successfully applied 7 migrations`
- [ ] `ddl-auto` stays `validate`. Never `update` in production
- [ ] Automated backup configured and a restore actually tested

**Uploads**

- [ ] `UPLOAD_ROOT` is outside the deployment folder, so a redeploy cannot wipe it
- [ ] The folder is writable by the application user and **not** served by the
      web server. Files must only come through `/api/certificates/{id}/file`
- [ ] Included in the backup - the database rows are useless without the files

**Application**

- [ ] `/api/test/health` returns 200 before traffic is sent (then disabled)
- [ ] Log level `INFO`, and log files rotated
- [ ] Session timeout suits the users (30 minutes today)

---

## 5. Backups

Two things must be backed up together, or a restore produces certificate rows
pointing at files that no longer exist:

```bash
mysqldump -u backup_user -p internshipjp_db > internshipjp_db_$(date +%F).sql
tar -czf uploads_$(date +%F).tar.gz -C /var/lib/internshipjp uploads
```

Keep the `TOTP_ENCRYPTION_KEY` somewhere separate from the database backup.
Restoring the data without the key leaves every 2FA account locked out.

---

## 6. Upgrading Spring Boot

We are on **3.5.16**, the final patch of the 3.5 line, chosen because the team's
reference material is written for Spring Boot 3 and because 3.5 supports JDK 24.
Open-source support for 3.5 ended in mid-2026, so a future upgrade to 4.x is
worth planning. It is **not** a version-number change - expect this:

| Change | Impact |
| --- | --- |
| `spring-boot-starter-web` renamed to `spring-boot-starter-webmvc` | `pom.xml` |
| Modules re-namespaced under `org.springframework.boot.<module>` | imports across the project |
| Jackson 2 to Jackson 3 | JSON configuration, any custom serialiser |
| Hibernate 6 to 7 (Jakarta Persistence 3.2) | entity mappings, `validate` behaviour |
| Spring Security 6 to 7 | `SecurityConfig`, and **CSRF defaults change** - re-test the SPA token flow first |

Suggested order: upgrade on a branch, run `mvn test -Dgroups=requires-db` (the
context test will catch mapping breakage immediately), then manually re-test
login, an upload, and one POST to confirm CSRF still works.

---

## 7. Things we chose not to do yet

| Not done | Why | When it would matter |
| --- | --- | --- |
| Docker | The brief excluded it; XAMPP is the agreed dev setup | If we deploy to a container platform |
| JWT | Sessions are simpler and logout really ends the session | If a mobile client is added |
| Rate limiting on login | Out of scope for the assignment | Before any public deployment |
| Virus scanning of uploads | Out of scope | If uploads are ever shared between users |
| Redis / caching | Premature at this size | Only if a real bottleneck is measured |
| Multiple app instances | Sessions are in memory | Would need sticky sessions or a session store |
