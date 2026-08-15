-- ===========================================================================
-- Look at the accounts in the database, and reset a password you have lost.
--
-- WHY YOU CANNOT SIMPLY READ A PASSWORD BACK
--   password_hash holds a BCrypt hash, which is one-way by design. There is no
--   query that recovers the original password - not for you, not for an
--   administrator, not for anyone with full database access. That is the point
--   of hashing: if this database leaked, the passwords would still be safe.
--   The only options are to reset a password or to register a new account.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. WHAT ACCOUNTS EXIST?
-- ---------------------------------------------------------------------------
SELECT id,
       email,
       full_name,
       role,
       account_status,
       DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created,
       DATE_FORMAT(last_login_at, '%Y-%m-%d %H:%i') AS last_login
FROM users
ORDER BY id;

-- ---------------------------------------------------------------------------
-- 2. RESET ONE PASSWORD TO:  password123
--
--    Change the email on the WHERE line to the account you want, then run it.
--    The hash below was generated with BCrypt (cost 10, $2a variant), which is
--    exactly what Spring Security's BCryptPasswordEncoder produces and reads.
-- ---------------------------------------------------------------------------
UPDATE users
SET password_hash = '$2a$10$/8pE/69fZYUnePzMx4Lt8eNzHW7Xs9QVpX0v0MXDSfS2mE3yPxbbS',
    updated_at = NOW(6)
WHERE email = 'change.me@example.com';

-- Confirm one row was changed, then sign in with:  password123
SELECT email, role, account_status FROM users WHERE email = 'change.me@example.com';

-- ---------------------------------------------------------------------------
-- 3. RESET EVERY ACCOUNT (development databases only)
--
--    Uncomment to give every account the password  password123 .
--    Never run this anywhere with real users.
-- ---------------------------------------------------------------------------
-- UPDATE users SET password_hash = '$2a$10$/8pE/69fZYUnePzMx4Lt8eNzHW7Xs9QVpX0v0MXDSfS2mE3yPxbbS', updated_at = NOW(6);

-- ---------------------------------------------------------------------------
-- 4. UNLOCK AN ACCOUNT
--    A SUSPENDED account cannot sign in at all; a PENDING employer can sign in
--    but cannot publish until their company is approved.
-- ---------------------------------------------------------------------------
-- UPDATE users SET account_status = 'ACTIVE' WHERE email = 'change.me@example.com';
-- UPDATE companies SET approval_status = 'APPROVED' WHERE name = 'Your Company';
