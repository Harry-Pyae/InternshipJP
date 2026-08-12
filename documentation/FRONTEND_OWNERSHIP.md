# Frontend ownership and route map

The intended shape of the React application. Only the routes marked **built**
exist today - everything else is a teammate's assignment, deliberately left
empty so each person designs their own screens.

---

## Route map

### Public

| Route | Page | Owner | Status |
| --- | --- | --- | --- |
| `/` | Foundation home | Member 1 | **built** (replace when the real landing page is designed) |
| `/auth/login` | Sign in | Member 2 | to build |
| `/auth/register/student` | Student sign-up | Member 2 | to build |
| `/auth/register/employer` | Employer sign-up | Member 2 | to build |
| `/auth/2fa` | Second-factor challenge | Member 2 | to build |
| `/internships` | Public vacancy list | Member 3 | to build (backend ready) |
| `/internships/:id` | Vacancy detail + apply | Member 3 | to build (backend ready) |

### Student - Member 2

| Route | Page |
| --- | --- |
| `/student/dashboard` | Overview: profile completeness, applications, recommendations |
| `/student/profile` | Edit profile, education, skills, interests |
| `/student/applications` | Application history and status |
| `/student/certificates` | Upload certificates and see verification status |
| `/student/settings` | Profile / Change password / 2FA |

### Employer - Member 3

| Route | Page |
| --- | --- |
| `/employer/dashboard` | Open vacancies, applicant counts, statistics |
| `/employer/profile` | Recruiter details and company profile |
| `/employer/internships` | List, create and edit vacancies |
| `/employer/internships/:id` | Vacancy detail and its applicants |
| `/employer/applications` | All applicants across vacancies |
| `/employer/settings` | Profile / Change password / 2FA |

### Administrator - Member 4

| Route | Page |
| --- | --- |
| `/admin/dashboard` | Pending approvals, pending certificates, counts |
| `/admin/users` | User list, suspend and reactivate |
| `/admin/employers` | Company approval queue |
| `/admin/certificates` | Certificate verification queue |
| `/admin/reports` | Platform reports |
| `/admin/settings` | Profile / Change password / 2FA |

### AI and integration - Member 1

| Route | Page | Status |
| --- | --- | --- |
| `/ai/student` | Student career assistant | **built** |
| `/ai/employer` | Candidate comparison assistant | **built** |
| `/integration/status` | Live backend / database / AI check | **built** |

### Notifications - Member 4

| Route | Page |
| --- | --- |
| `/notifications` | Notification centre (plus the bell in the navbar) |

---

## The three settings pages

`/student/settings`, `/employer/settings` and `/admin/settings` each contain the
same three sections:

1. **Profile** - `GET/PUT /api/account/me`
2. **Change password** - `POST /api/account/change-password`
3. **Two-factor authentication** - `GET /api/account/2fa/status` plus the
   `/api/account/2fa/**` endpoints

The backend is identical for all three roles, so the sensible approach is one
shared `AccountSettings` component that each dashboard renders inside its own
layout. Member 2 owns the component; Members 3 and 4 place it.

---

## Folder layout

```text
frontend/src/
├── api/                    Member 1 - one module per area, all using axiosClient
│   ├── axiosClient.js      shared instance: credentials, CSRF, error text
│   ├── authApi.js          me(), logout()  -> Member 2 adds login/register
│   ├── platformApi.js      the three /api/test endpoints
│   └── aiApi.js            the AI endpoints
├── components/shared/      Member 4 from now on
│   ├── AppLayout.jsx       navbar + container
│   ├── PageHeader.jsx      title + subtitle + action
│   ├── StatusCard.jsx      one measured status
│   ├── LoadingBlock.jsx
│   ├── EmptyState.jsx
│   └── ErrorAlert.jsx
├── config/appConfig.js     Member 1 - API base URL and route constants
├── features/
│   ├── integration/        Member 1 - BUILT
│   ├── ai/                 Member 1 - BUILT
│   ├── auth/               Member 2 - README only
│   ├── student/            Member 2 - README only
│   ├── employer/           Member 3 - README only
│   ├── admin/              Member 4 - README only
│   └── notifications/      Member 4 - README only
├── routes/router.jsx       shared - add one line per page
├── styles/app.css          shared - the --ijp-* design tokens
├── App.jsx                 shell; fetches the CSRF cookie on startup
└── main.jsx                entry point; imports Bootstrap then app.css
```

---

## How to add your first page

1. Create `src/features/<area>/MyPage.jsx`.
2. Import it in `src/routes/router.jsx` and add one `<Route>` line.
3. Fetch data through a module in `src/api/` - never call `axios` directly.
4. Reuse `PageHeader`, `LoadingBlock`, `EmptyState` and `ErrorAlert` so all four
   modules handle loading and failure the same way.

```jsx
import { useEffect, useState } from "react";
import { api } from "../../api/axiosClient.js";
import { describeApiError } from "../../api/axiosClient.js";
import PageHeader from "../../components/shared/PageHeader.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";

export default function MyPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/api/students/me")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(describeApiError(requestError)));
  }, []);

  if (error) return <ErrorAlert message={error} />;
  if (!data) return <LoadingBlock />;

  return (
    <>
      <PageHeader title="My page" subtitle="What this screen is for." />
      <div className="ijp-card p-4">{data.fullName}</div>
    </>
  );
}
```

---

## Visual direction

Agreed for the whole project, so the four modules look like one product:

- clean white surfaces on a very light grey page
- subtle blue (`--ijp-blue`) and teal (`--ijp-teal`) accents, used sparingly
- Bootstrap cards with a 1px border, no heavy shadows
- consistent spacing - `p-4` inside cards, `g-4` between grid items
- responsive down to a phone
- **no decorative animation.** Spinners for real waiting, nothing else

Use the CSS variables in `styles/app.css` rather than raw hex values, and
`.ijp-card` rather than a new card class. If you need a new token, add it to
`app.css` so everyone gets it.

Accessibility floor: every input has a `<label>`, every icon-only control has
`aria-label`, and icons that are purely decorative get `aria-hidden="true"`.

---

## Things the frontend must never do

1. **Never store a secret.** Anything in a `VITE_` variable ships to the
   browser. The Groq key lives on the backend only.
2. **Never rely on hiding a control for security.** Hide the admin button by all
   means, but the backend is what actually refuses the request.
3. **Never assume a certificate is verified.** Read `verificationStatus`.
   Employer endpoints only ever return verified ones.
4. **Never fake a success state.** If a request fails, say so - the integration
   page is the model to copy.
