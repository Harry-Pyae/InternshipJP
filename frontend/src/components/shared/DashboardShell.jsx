import { useState } from "react";
import { NavLink } from "react-router-dom";

/**
 * The frame every role dashboard sits in: a sidebar, a title bar and a content
 * area. Responsive - the sidebar becomes a slide-over on phones.
 *
 * COPY THIS, DO NOT REBUILD IT. Members 2, 3 and 4 each get the same
 * navigation behaviour, the same spacing and dark mode for free, and the four
 * modules end up looking like one product instead of three.
 *
 * Usage:
 *
 *   <DashboardShell
 *     title="Dashboard"
 *     subtitle="Your applications and recommendations"
 *     nav={[
 *       { to: "/student/dashboard",    icon: "bi-grid",        label: "Dashboard" },
 *       { to: "/student/profile",      icon: "bi-person",      label: "My profile" },
 *       { to: "/student/applications", icon: "bi-file-earmark", label: "Applications", badge: 3 },
 *     ]}
 *     actions={<button className="btn btn-ijp-primary btn-sm">New</button>}
 *   >
 *     ...your page...
 *   </DashboardShell>
 *
 * Owner: Member 4 (shared UI) - built by Member 1 to unblock everyone.
 */
export default function DashboardShell({ title, subtitle, nav = [], actions, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ijp-dash">
      {/* Phones: a button that slides the sidebar in, instead of a sidebar
          permanently eating a third of a small screen. */}
      <button
        type="button"
        className="btn btn-ijp-quiet btn-sm d-lg-none mb-3"
        onClick={() => setOpen(true)}
      >
        <i className="bi bi-list me-2" aria-hidden="true" />
        Menu
      </button>

      <div className="ijp-dash-grid">
        <aside className={`ijp-dash-side${open ? " ijp-dash-side--open" : ""}`}>
          <div className="d-flex justify-content-between align-items-center d-lg-none mb-3">
            <span className="ijp-label mb-0">Menu</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />
          </div>

          <nav>
            <ul className="list-unstyled d-grid gap-1 mb-0">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `ijp-dash-link${isActive ? " ijp-dash-link--active" : ""}`
                    }
                    onClick={() => setOpen(false)}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span className="flex-grow-1">{item.label}</span>
                    {item.badge ? (
                      <span className="badge rounded-pill text-bg-secondary">{item.badge}</span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {open ? (
          <button
            type="button"
            className="ijp-dash-scrim d-lg-none"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
        ) : null}

        <div className="ijp-dash-body">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
            <div>
              <h1 className="ijp-page-title">{title}</h1>
              {subtitle ? <p className="ijp-page-subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="d-flex gap-2">{actions}</div> : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
