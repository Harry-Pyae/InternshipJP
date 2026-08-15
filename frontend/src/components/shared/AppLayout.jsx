import { Link, NavLink } from "react-router-dom";
import { appConfig } from "../../config/appConfig.js";
import ThemeToggle from "./ThemeToggle.jsx";

/**
 * The frame every page sits inside.
 *
 * Deliberately restrained. Member 4 owns the shared UI, so the role-aware
 * sidebar, notification bell and user menu belong to that work - this is only
 * enough structure that four people do not each invent a different page frame.
 */
export default function AppLayout({ children }) {
  return (
    <>
      <a className="visually-hidden-focusable btn btn-ijp-primary m-2" href="#main">
        Skip to content
      </a>

      <nav className="ijp-navbar navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link className="navbar-brand ijp-brand" to={appConfig.routes.home}>
            Internship<span className="ijp-brand-mark">JP</span>
          </Link>

          <div className="d-flex align-items-center gap-2 order-lg-3">
            <ThemeToggle />
            <button
              className="navbar-toggler border-0"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#ijpNav"
              aria-controls="ijpNav"
              aria-expanded="false"
              aria-label="Show navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>
          </div>

          <div className="collapse navbar-collapse order-lg-2" id="ijpNav">
            <ul className="navbar-nav ms-auto me-lg-3 gap-lg-1">
              <NavItem to={appConfig.routes.integrationStatus} icon="bi-activity">
                Integration status
              </NavItem>
              <NavItem to={appConfig.routes.studentAi} icon="bi-mortarboard">
                Student assistant
              </NavItem>
              <NavItem to={appConfig.routes.employerAi} icon="bi-briefcase">
                Employer assistant
              </NavItem>
            </ul>
          </div>
        </div>
      </nav>

      <main className="ijp-main" id="main">
        <div className="container">{children}</div>
      </main>

      <footer className="container pb-4">
        <div className="border-top pt-3 d-flex flex-wrap justify-content-between gap-2">
          <p className="ijp-muted small mb-0">
            InternshipJP shared foundation. Student, employer and administrator
            screens are built by Members 2, 3 and 4.
          </p>
          <p className="ijp-muted small mb-0">
            <span className="ijp-data">{appConfig.apiBaseUrl}</span>
          </p>
        </div>
      </footer>
    </>
  );
}

function NavItem({ to, icon, children }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        className={({ isActive }) => `nav-link px-3${isActive ? " ijp-nav-active" : ""}`}
      >
        <i className={`bi ${icon} me-2`} aria-hidden="true" />
        {children}
      </NavLink>
    </li>
  );
}
