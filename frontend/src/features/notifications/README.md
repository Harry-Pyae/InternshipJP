# Notifications

**Owner: Member 4**

This folder is intentionally empty. The notification UI is yours to build.

## Expected work

- Notification bell with an unread count in the shared layout
- Notification centre / dropdown list
- Mark one as read, mark all as read
- Optional: grouping by type, notification preferences

## Intended route

`/notifications` (plus the bell in the shared navbar)

## Backend endpoints already working

| Method | Path |
| --- | --- |
| GET | `/api/notifications?page=0&size=10` |
| PATCH | `/api/notifications/{id}/read` |
| PATCH | `/api/notifications/read-all` |

## Notifications the backend already creates

| Type | When | Who receives it |
| --- | --- | --- |
| `COMPANY_APPROVAL_REQUESTED` | An employer registers | All administrators |
| `CERTIFICATE_VERIFICATION_REQUESTED` | A student uploads a certificate | All administrators |
| `CERTIFICATE_VERIFIED` / `CERTIFICATE_REJECTED` | An admin reviews a certificate | The student |
| `COMPANY_APPROVED` / `COMPANY_REJECTED` | An admin decides on a company | The company's recruiters |
| `APPLICATION_STATUS_CHANGED` | An employer changes an application status | The student |
| `ACCOUNT_STATUS_CHANGED` | An admin suspends or reactivates an account | That user |

`type` is a plain string column, so you can add new kinds without a migration.
To raise one from your own code, inject `NotificationService` and call
`create(user, type, title, message)`.
