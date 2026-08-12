# Authentication screens

**Owner: Member 2**

Do not expect anyone else to add files here. This folder is intentionally empty
so you can design these screens yourself.

## Expected work

- Login page (email + password, then the 2FA challenge if enabled)
- Student registration page
- Employer registration page (also collects the company name)
- Logout handling and a "session expired" redirect
- A route guard that keeps signed-out visitors out of the dashboards
- 2FA challenge screen (authenticator code or emailed code)

## Intended routes

| Route | Purpose |
| --- | --- |
| `/auth/login` | Sign in |
| `/auth/register/student` | Student sign-up |
| `/auth/register/employer` | Employer sign-up |
| `/auth/2fa` | Second-factor challenge |

## Backend endpoints already working

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/auth/csrf` | Already called once by `App.jsx` |
| POST | `/api/auth/register/student` | 201 on success |
| POST | `/api/auth/register/employer` | Creates user + company (both PENDING) |
| POST | `/api/auth/login` | Starts the session |
| POST | `/api/auth/logout` | Ends the session |
| GET | `/api/auth/me` | Current user, or 401 |

The 2FA **login challenge** is not implemented yet - see the `TODO MEMBER_2`
notes in `AuthService` and `TwoFactorService`. Enabling and disabling 2FA
already works through `/api/account/2fa/**`.

## Recommended components

`LoginForm`, `RegisterStudentForm`, `RegisterEmployerForm`, `TwoFactorChallenge`,
`RequireAuth` (route guard), `RequireRole`.

## Please reuse

- `src/api/axiosClient.js` - add new calls to `src/api/authApi.js`, don't call axios directly
- `src/components/shared/*` - `PageHeader`, `ErrorAlert`, `LoadingBlock`, `EmptyState`
- `src/styles/app.css` - the `--ijp-*` variables and `.ijp-card`
