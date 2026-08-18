# Shared components

**Owner: Member 4** (built by Member 1 to unblock everyone).

Copy these into your pages instead of building your own. You get identical
navigation behaviour, spacing, dark mode and mobile layout for free — and the
four modules end up looking like one product rather than three.

## What is here

| Component | For |
| --- | --- |
| `PageHeader` | title, subtitle and an optional action. **Start every page with this** |
| `StatCard` | one number with a label — the top row of a dashboard |
| `SectionCard` | a titled block with an optional link on the right |
| `DataTable` | a table on desktop, stacked cards on a phone, from one definition |
| `StatusBadge` | any status string → a consistently coloured badge |
| `PageHeader` | title + subtitle + action, for pages outside a dashboard |
| `EmptyState` | what to show when there is nothing, with a hint on how to fix it |
| `ErrorAlert` | a failed request, with an optional retry |
| `LoadingBlock` | a request in flight |
| `ThemeToggle` | light / dark / system (already in the navbar) |

## The shell is already there

You do **not** build a sidebar or a header. `RoleLayout` provides both, and
your page renders inside it through `<Outlet />`. A page is just content.

Adding a page is three steps:

1. Build it under `src/features/<your-area>/YourPage.jsx`
2. Add the link to `src/config/navigation.js`
3. In `src/routes/router.jsx`, replace the matching `<FeaturePlaceholder>`
   with your component — keep the path

## Copy-paste starting point

```jsx
import { useEffect, useState } from "react";
import { api, describeApiError } from "../../api/axiosClient.js";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";

export default function ApplicationsPage() {
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/api/student/applications")
      .then((response) => setPage(response.data))
      .catch((requestError) => setError(describeApiError(requestError)));
  }, []);

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Every internship you have applied to."
      />

      <ErrorAlert message={error} />

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Total" value={page?.totalElements ?? "-"} icon="bi-send" />
        </div>
      </div>

      <SectionCard title="Your applications">
        {page === null ? (
          <LoadingBlock />
        ) : (
          <DataTable
            columns={[
              { key: "internshipTitle", header: "Internship" },
              { key: "companyName", header: "Company" },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge value={row.status} />,
              },
            ]}
            rows={page.content}
            rowKey={(row) => row.id}
            empty={{
              title: "No applications yet",
              hint: "Browse internships and apply - they will appear here.",
            }}
          />
        )}
      </SectionCard>
    </>
  );
}
```

Notice what is **not** in it: no sidebar, no header bar, no page wrapper, no
width constraint. The layout owns all of that.

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
