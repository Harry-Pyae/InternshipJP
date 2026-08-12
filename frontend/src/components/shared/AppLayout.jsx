import { Link, NavLink } from "react-router-dom";
import { appConfig } from "../../config/appConfig.js";

/**
 * The frame every page sits inside: a top bar and a centred container.
 *
 * Deliberately minimal. Member 4 owns the shared UI, so the role-aware
 * sidebar, the notification bell and the user menu belong to that work - this
 * is only enough structure to stop each of us inventing a different page frame.
 */
export default function AppLayout({ children }) {
  return (
    <>
      <nav className="ijp-navbar navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link className="navbar-brand ijp-brand" to={appConfig.routes.home}>
            Internship<span className="ijp-brand-mark">JP</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#ijpNav"
            aria-controls="ijpNav"
            aria-expanded="false"
            aria-label="Show navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="ijpNav">
            <ul className="navbar-nav ms-auto">
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

      <main className="ijp-main">
        <div className="container">{children}</div>
      </main>

      <footer className="container pb-4">
        <p className="ijp-muted small mb-0">
          InternshipJP shared foundation. Student, employer and administrator
          screens are built by Members 2, 3 and 4.
        </p>
      </footer>
    </>
  );
}

function NavItem({ to, icon, children }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        className={({ isActive }) => `nav-link${isActive ? " fw-semibold text-primary" : ""}`}
      >
        <i className={`bi ${icon} me-1`} aria-hidden="true" />
        {children}
      </NavLink>
    </li>
  );
}
