import { useCallback, useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";

/**
 * "What are we missing as an employer?"
 *
 * The counterpart to the student's skill gap panel. It reviews the company's
 * own listings and pipeline, not the applicants: which vacancies are missing
 * information, how many applicants have never been reviewed, and which
 * required skills almost no student on the platform actually has.
 *
 * That last figure is the one an employer cannot get anywhere else. If a
 * vacancy demands a skill two students out of forty possess, the requirement
 * is the problem - waiting longer will not fix it.
 *
 * All calculated. No AI provider call.
 *
 * Owner: Member 1.
 */
export default function CompanyInsightPanel({ onAsk }) {
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setInsight(await aiApi.companyInsights());
    } catch (loadError) {
      setError(describeApiError(loadError));
    }
  }, []);

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
      <h2 className="ijp-label mb-3">Your company at a glance</h2>

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
          <p className="small fw-semibold mb-1">Skills you require that students rarely have</p>
          <ul className="small ps-3 mb-3">
            {insight.hardToFillSkills.map((item) => (
              <li key={item.skill}>
                <span className="fw-semibold">{item.skill}</span>
                <span className="ijp-muted">
                  {" "}
                  — only {item.studentsWithSkill} student
                  {item.studentsWithSkill === 1 ? "" : "s"} on the platform list this
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {insight.listingIssues.length > 0 ? (
        <>
          <p className="small fw-semibold mb-2">Listings that need attention</p>
          <ul className="list-unstyled d-grid gap-2 mb-3">
            {insight.listingIssues.map((issue) => (
              <li key={issue.internshipId} className="border rounded p-2">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="small fw-semibold">{issue.title}</span>
                  <span className="badge text-bg-light border flex-shrink-0">
                    {issue.applicationCount} applicant
                    {issue.applicationCount === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="small ijp-muted ps-3 mb-0 mt-1">
                  {issue.issues.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {insight.recommendations.length > 0 ? (
        <>
          <p className="small fw-semibold mb-1">Suggested fixes</p>
          <ol className="small ps-3 mb-3">
            {insight.recommendations.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
        </>
      ) : null}

      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAsk}>
        Ask the assistant to explain this
      </button>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="col-6 col-xl-3">
      <div className="border rounded py-2">
        <div className={`fw-semibold ${tone ? `ijp-status-value--${tone}` : ""}`}>{value}</div>
        <div className="ijp-muted" style={{ fontSize: "0.75rem" }}>
          {label}
        </div>
      </div>
    </div>
  );
}
