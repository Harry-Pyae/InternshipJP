# Shared components

**Owner: Member 4** (built by Member 1 to unblock everyone).

Copy these into your pages instead of building your own. You get identical
navigation behaviour, spacing, dark mode and mobile layout for free — and the
four modules end up looking like one product rather than three.

## What is here

| Component | For |
| --- | --- |
| `DashboardShell` | sidebar + title bar + content. The frame for every role dashboard |
| `StatCard` | one number with a label — the top row of a dashboard |
| `SectionCard` | a titled block with an optional link on the right |
| `DataTable` | a table on desktop, stacked cards on a phone, from one definition |
| `StatusBadge` | any status string → a consistently coloured badge |
| `PageHeader` | title + subtitle + action, for pages outside a dashboard |
| `EmptyState` | what to show when there is nothing, with a hint on how to fix it |
| `ErrorAlert` | a failed request, with an optional retry |
| `LoadingBlock` | a request in flight |
| `ThemeToggle` | light / dark / system (already in the navbar) |

## Copy-paste starting point

This is a complete, working dashboard page. Change the nav, the stats and the
API call, and it is yours.

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, describeApiError } from "../../api/axiosClient.js";
import DashboardShell from "../../components/shared/DashboardShell.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";

const NAV = [
  { to: "/student/dashboard",    icon: "bi-grid",         label: "Dashboard", end: true },
  { to: "/student/profile",      icon: "bi-person",       label: "My profile" },
  { to: "/student/applications", icon: "bi-file-earmark", label: "Applications" },
  { to: "/student/certificates", icon: "bi-patch-check",  label: "Certificates" },
  { to: "/student/settings",     icon: "bi-gear",         label: "Settings" },
];

export default function StudentDashboard() {
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/api/student/applications", { params: { size: 5 } })
      .then((response) => setApplications(response.data))
      .catch((requestError) => setError(describeApiError(requestError)));
  }, []);

  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Your applications and what to do next"
      nav={NAV}
      actions={
        <Link className="btn btn-ijp-primary btn-sm" to="/internships">
          Browse internships
        </Link>
      }
    >
      <ErrorAlert message={error} />

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Applications" value={applications?.totalElements ?? "-"} icon="bi-send" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Shortlisted" value={0} icon="bi-star" tone="ok" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Certificates" value={0} icon="bi-patch-check" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Profile" value="86%" icon="bi-person-check" tone="warn" hint="Add a photo" />
        </div>
      </div>

      <SectionCard
        title="Recent applications"
        action={<Link to="/student/applications">View all</Link>}
      >
        {applications === null ? (
          <LoadingBlock />
        ) : (
          <DataTable
            columns={[
              { key: "internshipTitle", header: "Internship" },
              { key: "companyName", header: "Company" },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
              { key: "createdAt", header: "Applied", render: (row) => row.createdAt?.slice(0, 10) },
            ]}
            rows={applications.content}
            rowKey={(row) => row.id}
            empty={{
              title: "No applications yet",
              hint: "Browse internships and apply — they will appear here.",
            }}
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
```

Then add one line to `src/routes/router.jsx`:

```jsx
<Route path="/student/dashboard" element={<StudentDashboard />} />
```

## Rules that keep the four modules consistent

1. **Never hard-code a colour.** Use the `--ijp-*` variables in
   `styles/app.css`, or a component that already does. Anything built with them
   works in dark mode with no extra effort.
2. **Never write your own status colours.** `StatusBadge` maps every status in
   the product. Amber means "waiting on someone" on every screen.
3. **Use `DataTable` rather than a raw `<table>`.** A table squeezed onto a
   phone is unreadable, and horizontal scrolling inside a page is worse.
4. **Every list needs an `EmptyState` with a hint.** An empty screen should say
   what would put something on it.
5. **Call the API through `src/api/*.js`,** never `axios` inside a component.
6. **Check it at 380px wide** before you push. Chrome dev tools, Ctrl+Shift+M.

## Adding a component here

If you need something more than once, add it to this folder with a comment
explaining what it is for, and tell the group. Two people building the same
card twice is how four modules stop matching.
