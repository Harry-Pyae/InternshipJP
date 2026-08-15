import { useCallback, useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";

/**
 * "What should I learn to get hired?" - the student assistant's core answer.
 *
 * Every number here is counted from the platform: how many open internships
 * require each skill, and which of those this student has. No AI provider is
 * involved, so this panel works with no API key and shows the same answer
 * every time.
 *
 * The chat sits next to it for the follow-up: how to learn it, in what order,
 * and what a first project would look like.
 *
 * Owner: Member 1.
 */
export default function SkillGapPanel({ onAsk }) {
  const [gaps, setGaps] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setGaps(await aiApi.skillGaps());
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
  if (gaps === null) {
    return (
      <div>
        <LoadingBlock label="Working out your skill gaps..." />
      </div>
    );
  }

  const completenessTone =
    gaps.profileCompleteness >= 80 ? "ok" : gaps.profileCompleteness >= 50 ? "warn" : "bad";

  return (
    <div>
      <h2 className="ijp-label mb-3">What to learn next</h2>

      <p className="small mb-3">{gaps.summary}</p>

      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="small fw-semibold">Profile completeness</span>
        <span className={`ijp-status-value--${completenessTone} fw-semibold`}>
          {gaps.profileCompleteness}%
        </span>
      </div>
      <div className="progress mb-3" style={{ height: "4px" }}>
        <div
          className="progress-bar"
          style={{ width: `${gaps.profileCompleteness}%` }}
          role="progressbar"
          aria-valuenow={gaps.profileCompleteness}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completeness"
        />
      </div>

      {gaps.profileGaps.length > 0 ? (
        <>
          <p className="small fw-semibold mb-1">Fix these first</p>
          <ul className="small ijp-muted ps-3 mb-3">
            {gaps.profileGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </>
      ) : null}

      {gaps.skillsToLearn.length > 0 ? (
        <>
          <p className="small fw-semibold mb-2">
            Most requested skills you don&apos;t have yet
          </p>
          <ul className="list-unstyled d-grid gap-2 mb-3">
            {gaps.skillsToLearn.map((item) => (
              <li key={item.skill} className="d-flex justify-content-between align-items-center gap-2">
                <span className="small">
                  <span className="fw-semibold">{item.skill}</span>
                  <span className="ijp-muted">
                    {" "}
                    — {item.openInternshipsRequiring} of {gaps.openInternshipCount} open
                    internships
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary flex-shrink-0"
                  onClick={() => onAsk(item)}
                >
                  How?
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="ijp-muted small mb-3">
          {gaps.openInternshipCount === 0
            ? "No employer has listed required skills yet, so there is nothing to compare against."
            : "You already list every skill the open internships ask for."}
        </p>
      )}

      {gaps.strengths.length > 0 ? (
        <>
          <p className="small fw-semibold mb-1">Employers are asking for what you have</p>
          <p className="small mb-3">
            {gaps.strengths.map((item) => (
              <span className="badge text-bg-light border me-1" key={item.skill}>
                {item.skill} · {item.openInternshipsRequiring}
              </span>
            ))}
          </p>
        </>
      ) : null}

      {gaps.skillsNotInDemand.length > 0 ? (
        <p className="ijp-muted small mb-0">
          Not currently requested by any open internship:{" "}
          {gaps.skillsNotInDemand.join(", ")}. Keep them — this only reflects the vacancies
          on the platform right now.
        </p>
      ) : null}
    </div>
  );
}
