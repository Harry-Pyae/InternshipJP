import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import { appConfig } from "../../config/appConfig.js";

/**
 * Landing page for the shared foundation.
 *
 * It exists so a teammate who has just cloned the repository can see, in one
 * screen, what already runs and what is theirs to build. It is not the
 * finished product's home page - whoever owns the public site can replace it.
 */
export default function FoundationHomePage() {
  return (
    <>
      <PageHeader
        title="InternshipJP shared foundation"
        subtitle="The backend, database and integration layer are in place. The role dashboards are not built yet."
      />

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="ijp-card p-4 h-100">
            <h2 className="h6 text-uppercase ijp-status-label mb-3">Ready to use</h2>
            <ul className="list-unstyled mb-4 d-grid gap-2">
              <ReadyItem>Session authentication, BCrypt, CSRF and CORS</ReadyItem>
              <ReadyItem>MariaDB schema created by Flyway (19 tables)</ReadyItem>
              <ReadyItem>Account and two-factor endpoints</ReadyItem>
              <ReadyItem>Certificate upload with verified-only employer access</ReadyItem>
              <ReadyItem>AI assistant with conversation history</ReadyItem>
            </ul>
            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-ijp-primary" to={appConfig.routes.integrationStatus}>
                <i className="bi bi-activity me-1" aria-hidden="true" />
                Check integration status
              </Link>
              <Link className="btn btn-outline-secondary" to={appConfig.routes.studentAi}>
                Open the student assistant
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="ijp-card p-4 h-100">
            <h2 className="h6 text-uppercase ijp-status-label mb-3">Who builds what next</h2>
            <dl className="row mb-0 small">
              <Owner who="Member 1" area="Integration, database, testing, AI, deployment" />
              <Owner who="Member 2" area="Authentication, security, student module, 2FA screens" />
              <Owner who="Member 3" area="Employer, company, internships, applications, recruitment" />
              <Owner who="Member 4" area="Admin, notifications, certificate review, shared UI" />
            </dl>
            <p className="ijp-muted small mb-0 mt-3">
              Full route map and endpoint list:
              <span className="ijp-mono"> documentation/FRONTEND_OWNERSHIP.md</span> and
              <span className="ijp-mono"> documentation/API_CONTRACT.md</span>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ReadyItem({ children }) {
  return (
    <li className="d-flex gap-2">
      <i className="bi bi-check2-circle ijp-accent-teal" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function Owner({ who, area }) {
  return (
    <>
      <dt className="col-4 fw-semibold">{who}</dt>
      <dd className="col-8 ijp-muted">{area}</dd>
    </>
  );
}
