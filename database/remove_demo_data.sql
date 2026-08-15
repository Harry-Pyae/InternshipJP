-- ===========================================================================
-- Remove every row created by DemoDataSeeder.
--
-- SAFE TO RUN ON A DATABASE WITH REAL DATA. It only touches rows carrying the
-- demo markers:
--     users.email     ending  '@demo.internshipjp.local'
--     companies.name  starting 'Demo '
-- Nothing else is matched, so real accounts and real companies are untouched.
--
-- ORDER MATTERS
--   Users go first. Deleting a user cascades to their student profile,
--   employer profile, applications, certificates, notifications, AI
--   conversations and two-factor rows.
--   Companies go second, because employer_profiles.company_id is ON DELETE
--   RESTRICT - a company with recruiters still attached cannot be deleted.
--   Once the demo recruiters are gone, the company can go, taking its
--   internships and their applications with it.
--
-- HOW TO RUN
--     scripts\remove-demo-data.ps1                (recommended - also deletes
--                                                  the uploaded demo files)
--     "C:\xampp\mysql\bin\mysql.exe" -u root internshipjp_db < database\remove_demo_data.sql
--
-- This is NOT a Flyway migration and must never become one. Migrations run on
-- everyone's database automatically; this is a tool you choose to run.
-- ===========================================================================

-- What is about to be removed.
SELECT 'demo accounts' AS item, COUNT(*) AS rows_found
FROM users WHERE email LIKE '%@demo.internshipjp.local'
UNION ALL
SELECT 'demo companies', COUNT(*)
FROM companies WHERE name LIKE 'Demo %'
UNION ALL
SELECT 'internships at demo companies', COUNT(*)
FROM internships i JOIN companies c ON c.id = i.company_id
WHERE c.name LIKE 'Demo %';

-- 1. Accounts (cascades to profiles, applications, certificates, notifications).
DELETE FROM users WHERE email LIKE '%@demo.internshipjp.local';

-- 2. Companies (cascades to internships and their applications).
DELETE FROM companies WHERE name LIKE 'Demo %';

-- What is left. Both counts must be zero.
SELECT 'demo accounts remaining' AS item, COUNT(*) AS rows_left
FROM users WHERE email LIKE '%@demo.internshipjp.local'
UNION ALL
SELECT 'demo companies remaining', COUNT(*)
FROM companies WHERE name LIKE 'Demo %';

-- Real data is untouched - this should still show your own accounts.
SELECT role, account_status, COUNT(*) AS remaining_real_accounts
FROM users GROUP BY role, account_status;
