import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../config/authContext.jsx";

/**
 * The frame every role dashboard sits in.
 *
 * THE SIDEBAR HAS THREE STATES
 *   wide    icon + label. The default on a laptop.
 *   rail    icons only, 4.25rem. For when the content wants the room - a wide
 *           applicant table, a long report.
 *   drawer  slides over the page, below 992px. A fixed sidebar on a phone
 *           leaves nothing for the content.
 *
 *   The wide/rail choice is remembered. A preference you have to set again on
 *   every page load is not a preference.
 *
 * NAV SHAPE
 *   nav = [
 *     { to, icon, label, badge?, end? },
 *     { section: "Reviewing" },          // a heading, not a link
 *     { to, icon, label },
 *   ]
 *
 * COPY THIS, DO NOT REBUILD IT. Members 2, 3 and 4 each get the same
 * behaviour, spacing, dark mode and mobile handling for free.
 *
 * Owner: Member 4 (shared UI).
 */
const STORAGE_KEY = "ijp-sidebar";

export default function DashboardShell({ title, subtitle, nav = [], actions, children }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rail, setRail] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "rail";
    } catch {
      return false;
    }
  });

  const toggleRail = useCallback(() => {
    setRail((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "rail" : "wide");
      } catch {
        /* Private browsing can block storage. The toggle still works. */
      }
      return next;
    });
  }, []);

  // Escape closes the drawer. Anything that covers the page needs a way out
  // that is not hunting for a small button.
  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }
    const onKey = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const initial = (user?.fullName ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div className={`ijp-dash-grid${rail ? " ijp-dash-grid--rail" : ""}`}>
      <aside
        className={`ijp-dash-side${drawerOpen ? " ijp-dash-side--open" : ""}${
          rail ? " ijp-dash-side--rail" : ""
        }`}
      >
        <div className="ijp-side-head">
          <span className="ijp-side-avatar fw-semibold" aria-hidden="true">
            {initial}
          </span>
          <span className="ijp-side-head-text" style={{ minWidth: 0 }}>
            <span className="d-block small fw-semibold text-truncate">
              {user?.fullName ?? "Signed out"}
            </span>
            <span className="d-block ijp-muted text-truncate" style={{ fontSize: "0.72rem" }}>
              {user?.role ? user.role.toLowerCase() : ""}
            </span>
          </span>
          <button
            type="button"
            className="btn-close ms-auto d-lg-none"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          />
        </div>

        <nav className="d-grid gap-1">
          {nav.map((item, index) =>
            item.section ? (
              <p className="ijp-side-section mb-0" key={`section-${index}`}>
                {item.section}
              </p>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={rail ? item.label : undefined}
                className={({ isActive }) =>
                  `ijp-dash-link${isActive ? " ijp-dash-link--active" : ""}`
                }
                onClick={() => setDrawerOpen(false)}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span className="flex-grow-1 text-truncate">{item.label}</span>
                {item.badge ? (
                  <span className="badge rounded-pill text-bg-secondary">{item.badge}</span>
                ) : null}
              </NavLink>
            ),
          )}
        </nav>

        <button
          type="button"
          className="ijp-side-toggle d-none d-lg-flex"
          onClick={toggleRail}
          aria-label={rail ? "Expand the sidebar" : "Collapse the sidebar"}
          title={rail ? "Expand the sidebar" : "Collapse the sidebar"}
        >
          <i
            className={`bi ${rail ? "bi-chevron-double-right" : "bi-chevron-double-left"}`}
            aria-hidden="true"
          />
          {rail ? null : <span>Collapse</span>}
        </button>
      </aside>

      {drawerOpen ? (
        <button
          type="button"
          className="ijp-dash-scrim d-lg-none"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <div className="ijp-dash-body">
        <div className="ijp-dash-head d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
          <div className="d-flex align-items-start gap-3">
            <button
              type="button"
              className="btn btn-ijp-quiet btn-sm d-lg-none"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>
            <div>
              <h1 className="ijp-page-title">{title}</h1>
              {subtitle ? <p className="ijp-page-subtitle">{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        {children}
      </div>
    </div>
  );
}
