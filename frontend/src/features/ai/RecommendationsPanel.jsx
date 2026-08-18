import { useCallback, useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";

/**
 * Internship matches for the signed-in student, with the reasoning shown.
 *
 * WHY THIS SITS NEXT TO THE CHAT
 *   The score comes from the backend's plain-Java comparison of skills, not
 *   from the language model. So this panel works with no API key, costs
 *   nothing, and gives the same answer twice. The chat is for the follow-up
 *   question - "why is this one only 40%, and what should I learn first?"
 *
 *   Every number is accompanied by which skills matched and which did not, so
 *   a student is never shown a percentage they cannot interrogate.
 *
 * Owner: Member 1.
 */
export default function RecommendationsPanel({ onDiscuss }) {
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMatches(await aiApi.recommendations(5));
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

  if (matches === null) {
    return (
      <div>
        <LoadingBlock label="Finding internships that match your skills..." />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="ijp-label mb-0">Matched to your skills</h2>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={load}>
          <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          <span className="visually-hidden">Refresh recommendations</span>
        </button>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon="bi-search"
          title="No open internships to match yet"
          hint="Once employers publish vacancies, they will be scored against the skills on your profile."
        />
      ) : (
        <ul className="list-unstyled d-grid gap-3 mb-0">
          {matches.map((match) => (
            <MatchRow key={match.internshipId} match={match} onDiscuss={onDiscuss} />
          ))}
        </ul>
      )}

      <p className="ijp-muted small mb-0 mt-3">
        Scores are calculated by comparing your listed skills with each internship&apos;s
        requirements. Adding skills to your profile changes them immediately.
      </p>
    </div>
  );
}

function MatchRow({ match, onDiscuss }) {
  // Colour follows the number, and the number follows the data.
  const tone = match.matchScore >= 67 ? "ok" : match.matchScore >= 34 ? "warn" : "bad";

  return (
    <li className="border rounded p-3">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <p className="fw-semibold mb-1">{match.title}</p>
          <p className="ijp-muted small mb-0">
            {match.companyName}
            {match.location ? ` · ${match.location}` : ""} · {match.workMode.toLowerCase()}
          </p>
        </div>
        <span className={`ijp-status-value ijp-status-value--${tone}`}>{match.matchScore}%</span>
      </div>

      <div className="progress mt-2" style={{ height: "4px" }}>
        <div
          className="progress-bar"
          style={{ width: `${match.matchScore}%` }}
          role="progressbar"
          aria-valuenow={match.matchScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Match score for ${match.title}`}
        />
      </div>

      <p className="small mb-2 mt-2">{match.explanation}</p>

      {match.matchedSkills.length > 0 ? (
        <p className="small mb-1">
          <span className="ijp-muted">You have: </span>
          {match.matchedSkills.map((skill) => (
            <span className="badge text-bg-light border me-1" key={skill}>
              {skill}
            </span>
          ))}
        </p>
      ) : null}

      {match.missingSkills.length > 0 ? (
        <p className="small mb-2">
          <span className="ijp-muted">To learn: </span>
          {match.missingSkills.map((skill) => (
            <span className="badge text-bg-light border me-1" key={skill}>
              {skill}
            </span>
          ))}
        </p>
      ) : null}

      <div className="d-flex flex-wrap align-items-center gap-2">
        {match.alreadyApplied ? (
          <span className="badge text-bg-secondary">Applied</span>
        ) : null}
        {match.applicationDeadline ? (
          <span className="ijp-muted small">Closes {match.applicationDeadline}</span>
        ) : null}
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary ms-auto"
          onClick={() => onDiscuss(match)}
        >
          Ask about this
        </button>
      </div>
    </li>
  );
}
