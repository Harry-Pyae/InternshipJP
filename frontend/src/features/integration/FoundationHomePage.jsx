import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { platformApi } from "../../api/platformApi.js";
import { appConfig } from "../../config/appConfig.js";

/**
 * Landing page for the shared foundation.
 *
 * Its one job: someone who just cloned this repository should see, without
 * clicking anything, whether the system is actually running and what is theirs
 * to build.
 *
 * The hero is a live system strip rather than a marketing headline, because
 * this is an integration foundation - the most characteristic thing about it
 * is whether the three connections are up. Those pills are real API calls. If
 * the backend is down, the page says so instead of looking healthy.
 *
 * Owner: Member 1. Whoever designs the public product site can replace this.
 */
export default function FoundationHomePage() {
  const [system, setSystem] = useState({ backend: null, database: null, ai: null });

  useEffect(() => {
    let cancelled = false;

    platformApi
      .checkHealth()
      .then(() => {
        if (cancelled) return;
        setSystem((current) => ({ ...current, backend: { tone: "ok", text: "Backend up" } }));

        platformApi
          .checkDatabase()
          .then((data) => {
            if (cancelled) return;
            setSystem((current) => ({
              ...current,
              database: data.connected
                ? { tone: "ok", text: `${data.database} · ${data.tableCount} tables` }
                : { tone: "bad", text: "Database unreachable" },
            }));
          })
          .catch(() => {
            if (!cancelled) {
              setSystem((current) => ({
                ...current,
                database: { tone: "bad", text: "Database check failed" },
              }));
            }
          });

        platformApi
          .checkAi()
          .then((data) => {
            if (cancelled) return;
            setSystem((current) => ({
              ...current,
              ai: !data.configured
                ? { tone: "warn", text: "AI not configured" }
                : data.reachable
                  ? { tone: "ok", text: `AI via ${data.provider}` }
                  : { tone: "bad", text: "AI unreachable" },
            }));
          })
          .catch(() => {
            if (!cancelled) {
              setSystem((current) => ({ ...current, ai: { tone: "bad", text: "AI check failed" } }));
            }
          });
      })
      .catch(() => {
        if (!cancelled) {
          setSystem({
            backend: { tone: "bad", text: "Backend not reachable" },
            database: { tone: "unknown", text: "Database not checked" },
            ai: { tone: "unknown", text: "AI not checked" },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="mb-5">
        <p className="ijp-label mb-2">Shared foundation · four-person build</p>
        <h1 className="fw-bold mb-3" style={{ fontSize: "2.1rem", letterSpacing: "-0.03em" }}>
          InternshipJP
        </h1>
        <p className="ijp-page-subtitle mb-4" style={{ fontSize: "1.05rem" }}>
          An internship platform where students are matched to vacancies on skills they can
          evidence, and employers only ever see qualifications an administrator has verified.
          The backend, database and integration layer run today; the role dashboards are
          still to be built.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <SystemPill state={system.backend} loadingText="Checking backend" icon="bi-hdd-network" />
          <SystemPill state={system.database} loadingText="Checking database" icon="bi-database" />
          <SystemPill state={system.ai} loadingText="Checking AI provider" icon="bi-stars" />
        </div>
      </header>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <section className="ijp-card p-4 h-100">
            <h2 className="ijp-label mb-3">Working today</h2>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              <Ready>Session sign-in with BCrypt, CSRF and CORS</Ready>
              <Ready>
                MariaDB schema owned by Flyway — <span className="ijp-data">19 tables</span>
              </Ready>
              <Ready>Account settings and two-factor endpoints</Ready>
              <Ready>Certificate upload, with employers restricted to verified ones</Ready>
              <Ready>Skill matching and gap analysis, calculated without the AI provider</Ready>
              <Ready>AI assistants for students and employers, with saved history</Ready>
            </ul>
          </section>
        </div>

        <div className="col-12 col-lg-5">
          <section className="ijp-card p-4 h-100">
            <h2 className="ijp-label mb-3">Who builds what next</h2>
            <dl className="mb-3">
              <Owner who="Member 1" area="Integration, database, testing, AI, deployment" done />
              <Owner who="Member 2" area="Authentication, security, student module, 2FA" />
              <Owner who="Member 3" area="Employer, internships, applications, recruitment" />
              <Owner who="Member 4" area="Admin, notifications, certificate review, shared UI" />
            </dl>
            <p className="ijp-muted small mb-0">
              Start with the README in your own feature folder, then{" "}
              <span className="ijp-data">documentation/API_CONTRACT.md</span>.
            </p>
          </section>
        </div>
      </div>

      <section>
        <h2 className="ijp-label mb-3">Start here</h2>
        <div className="row g-3">
          <Tile
            to={appConfig.routes.integrationStatus}
            icon="bi-activity"
            title="Integration status"
            body="Live check of React, Spring Boot, MariaDB and the AI provider. Sign in for testing here too."
          />
          <Tile
            to={appConfig.routes.studentAi}
            icon="bi-mortarboard"
            title="Student assistant"
            body="What to learn next, what is missing from a profile, and which vacancies fit."
          />
          <Tile
            to={appConfig.routes.employerAi}
            icon="bi-briefcase"
            title="Employer assistant"
            body="Compare applicants, or review why a company's own listings are not attracting anyone."
          />
        </div>
      </section>
    </>
  );
}

function SystemPill({ state, loadingText, icon }) {
  if (!state) {
    return (
      <span className="ijp-pill">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        {loadingText}
      </span>
    );
  }
  const toneClass = state.tone === "unknown" ? "" : `ijp-pill--${state.tone}`;
  return (
    <span className={`ijp-pill ${toneClass}`}>
      <i className={`bi ${icon}`} aria-hidden="true" />
      {state.text}
    </span>
  );
}

function Ready({ children }) {
  return (
    <li className="d-flex gap-2">
      <i className="bi bi-check2 ijp-state--ok flex-shrink-0 mt-1" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function Owner({ who, area, done }) {
  return (
    <div className="d-flex flex-wrap gap-2 gap-sm-3 py-2 border-bottom">
      <dt className="fw-semibold" style={{ flex: "0 0 5.5rem" }}>
        {who}
      </dt>
      <dd className="ijp-muted small mb-0 flex-grow-1" style={{ minWidth: "12rem" }}>
        {area}
      </dd>
      {done ? (
        <dd className="mb-0">
          <i className="bi bi-check-circle-fill ijp-state--ok" aria-label="Foundation complete" />
        </dd>
      ) : null}
    </div>
  );
}

function Tile({ to, icon, title, body }) {
  return (
    <div className="col-12 col-md-4">
      <Link to={to} className="ijp-card ijp-tile p-4 h-100">
        <i className={`bi ${icon} fs-5 ijp-brand-mark`} aria-hidden="true" />
        <p className="fw-semibold mb-1 mt-2">{title}</p>
        <p className="ijp-muted small mb-0">{body}</p>
      </Link>
    </div>
  );
}
