# database/

Documentation only. **The schema itself lives in the backend**, because Flyway
has to ship with the application:

```text
backend/src/main/resources/db/migration/
├── V1__create_users_and_account_security.sql
├── V2__create_student_tables.sql
├── V3__create_company_and_employer_tables.sql
├── V4__create_internship_and_application_tables.sql
├── V5__create_certificate_and_notification_tables.sql
├── V6__create_ai_tables.sql
└── V7__add_indexes_and_constraints.sql
```

- **`SCHEMA.md`** - every table, column, relationship and delete rule, plus the
  logical owner of each table.

## Creating the database

```sql
CREATE DATABASE internshipjp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Create the database and nothing else. Flyway creates the tables at startup.

## Adding a table or column

1. Add a **new** file `V8__short_description.sql`. Never edit V1 to V7.
2. Add or update the matching JPA entity, with `@Column` names and lengths that
   match the SQL exactly - `ddl-auto=validate` will refuse to start otherwise.
3. Update `SCHEMA.md`.
4. Tell Member 1, who reviews migrations before they are merged.

There is no demo-data migration on purpose: the platform must never show data
nobody entered.
