import { useCallback, useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * "What are we missing as an employer?"
 */
export default function CompanyInsightPanel({ onAsk }) {
  const { t, language } = useLanguage();
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setInsight(await aiApi.companyInsights(language));
    } catch (loadError) {
      setError(describeApiError(loadError));
    }
  }, [language]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div>
        <ErrorAlert message={error} onRetry={load} />
      </div>
    );
  }
  if (insight === null) {
    return (
      <div>
        <LoadingBlock label="Reviewing your listings and pipeline..." />
      </div>
    );
  }

  return (
    <div>
      <h2 className="ijp-label mb-3">{t("Your company at a glance")}</h2>

      <p className="small mb-3">{insight.summary}</p>

      {insight.approvalStatus !== "APPROVED" ? (
        <div className="alert alert-warning py-2 px-3 small">
          Your company is <strong>{insight.approvalStatus}</strong>, so students cannot see
          anything you publish yet.
        </div>
      ) : null}

      <div className="row g-2 text-center mb-3">
        <Stat label="Open" value={insight.openInternships} />
        <Stat label="Drafts" value={insight.draftInternships} />
        <Stat label="Applicants" value={insight.totalApplications} />
        <Stat
          label="Unreviewed"
          value={insight.awaitingReview}
          tone={insight.awaitingReview > 0 ? "bad" : "ok"}
        />
      </div>

      {insight.hardToFillSkills.length > 0 ? (
        <>
          <p className="small fw-semibold mb-1">{t("Skills you require that students rarely have")}</p>
          <div className="ijp-scarce-grid">
            {insight.hardToFillSkills.map((item) => (
              <div className="ijp-scarce-card" key={item.skill}>
                <span className="ijp-scarce-skill">{item.skill}</span>
                <span className="ijp-scarce-count">
                  {t("{n} student(s)", { n: item.studentsWithSkill })}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {insight.listingIssues.length > 0 ? (
        <>
          <p className="small fw-semibold mb-2">{t("Listings that need attention")}</p>
          <ul className="list-unstyled d-grid gap-2 mb-3">
            {insight.listingIssues.map((issue) => (
              <li key={issue.internshipId} className="ijp-listing-issue">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="small fw-semibold">{issue.title}</span>
                  <span className="badge text-bg-light border flex-shrink-0">
                    {issue.applicationCount} applicant
                    {issue.applicationCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="ijp-issue-list">
                  {issue.issues.map((item) => (
                    <IssueBadge key={item.code ?? item.text} issue={item} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {insight.recommendations.length > 0 ? (
        <>
          <p className="small fw-semibold mb-2">{t("Suggested fixes")}</p>
          <ol className="ijp-fix-list">
            {insight.recommendations.map((text, index) => (
              <li className="ijp-fix" key={text}>
                <span className="ijp-fix-number">{index + 1}</span>
                <span className="ijp-fix-text">{text}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-ijp-quiet ijp-fix-action"
                  onClick={() => onAsk(text)}
                >
                  <i className="bi bi-stars me-1" aria-hidden="true" />{t("Ask AI")}</button>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAsk}>{t("Ask the assistant to explain this")}</button>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="col-6 col-xl-3">
      <div className="ijp-card-sunken ijp-stat">
        <div className={`ijp-stat-value ${tone ? `ijp-state--${tone}` : ""}`}>{value}</div>
        <div className="ijp-stat-label">{label}</div>
      </div>
    </div>
  );
}

/**
 * One problem with a listing, as a badge.
 */
const ISSUE_STYLES = {
  NO_SKILLS: { icon: "bi-ui-checks-grid", tone: "bad" },
  NO_APPLICANTS: { icon: "bi-person-x", tone: "bad" },
  DEADLINE_PASSED: { icon: "bi-calendar-x", tone: "bad" },
  DRAFT: { icon: "bi-eye-slash", tone: "warn" },
  NO_DESCRIPTION: { icon: "bi-file-text", tone: "warn" },
  NO_REQUIREMENTS: { icon: "bi-list-check", tone: "warn" },
  NO_RESPONSIBILITIES: { icon: "bi-list-task", tone: "warn" },
  NO_STIPEND: { icon: "bi-cash-coin", tone: "warn" },
  NO_DEADLINE: { icon: "bi-calendar-event", tone: "warn" },
};

function IssueBadge({ issue }) {
  const { t } = useLanguage();
  const style = ISSUE_STYLES[issue.code] ?? { icon: "bi-dash-circle", tone: "unknown" };
  return (
    <span className={`ijp-issue ijp-issue--${style.tone}`}>
      <i className={`bi ${style.icon}`} aria-hidden="true" />
      {t(issue.text)}
    </span>
  );
}
