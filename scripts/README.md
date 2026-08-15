# scripts/

Convenience scripts for development. Nothing here is required — every command
they run is in the root README, and you can always type it yourself.

| Script | What it does |
| --- | --- |
| `start-dev.ps1` | Checks MariaDB, installs frontend dependencies on first run, then opens the backend and frontend in two PowerShell windows |
| `remove-demo-data.ps1` | Deletes every demo account, company and uploaded file. Real data is never matched |
| `list-accounts.ps1` | Shows which accounts exist, and resets a password you have lost |

## Which accounts exist, and what are their passwords?

```powershell
.\scripts\list-accounts.ps1
```

**Passwords cannot be recovered.** `password_hash` holds a BCrypt hash, which is
one-way by design - no query returns the original, for you or for anyone with
full access to the database. That is what protects your users if the database
ever leaks.

So if you have lost one, reset it:

```powershell
.\scripts\list-accounts.ps1 -ResetPassword student@example.com
# then sign in with:  password123
```

Add `-Activate` to set the account to ACTIVE at the same time. The same thing
is available as SQL in `database/reset_password.sql` for phpMyAdmin.

## Removing the demo data

```powershell
.\scripts\remove-demo-data.ps1              # shows counts, asks to confirm
.\scripts\remove-demo-data.ps1 -WhatIfOnly  # counts only, deletes nothing
.\scripts\remove-demo-data.ps1 -Force       # no prompt
```

It matches only accounts whose email ends `@demo.internshipjp.local` and
companies named `Demo ...`, so it is safe to run once real data exists. The
backend does not need to be stopped. The equivalent SQL is in
`database/remove_demo_data.sql` if you would rather run it in phpMyAdmin.

```powershell
# from the repository root
.\scripts\start-dev.ps1
```

If PowerShell refuses to run it, Windows is blocking unsigned scripts. Allow
local scripts for your user once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

MariaDB is not started by the script — use the XAMPP Control Panel, because
XAMPP manages that service itself.
