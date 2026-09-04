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
    <li className="ijp-match">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div style={{ minWidth: 0 }}>
          <p className="ijp-match-title">{match.title}</p>
          <p className="ijp-muted small mb-0">
            {match.companyName}
            {match.location ? ` · ${match.location}` : ""} · {match.workMode.toLowerCase()}
          </p>
        </div>
        <span className={`ijp-score ijp-state--${tone} flex-shrink-0`}>{match.matchScore}%</span>
      </div>

      {/* The bar carries the same colour as the number, so the two cannot
          disagree about how good a match is. */}
      <div
        className={`ijp-meter ijp-meter--${tone} mt-3`}
        role="progressbar"
        aria-valuenow={match.matchScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Match score for ${match.title}`}
      >
        <span style={{ width: `${match.matchScore}%` }} />
      </div>

      <p className="ijp-match-explain">{match.explanation}</p>

      {/* These two lists used identical styling, which hid the one thing the
          card exists to say. Filled for what you have, dashed outline for
          what you do not. */}
      {match.matchedSkills.length > 0 ? (
        <div className="ijp-match-skills">
          <span className="ijp-match-skills-label">You have</span>
          <div className="ijp-pill-row">
            {match.matchedSkills.map((skill) => (
              <span className="ijp-pill-skill ijp-pill-skill--have" key={skill}>
                <i className="bi bi-check2" aria-hidden="true" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {match.missingSkills.length > 0 ? (
        <div className="ijp-match-skills">
          <span className="ijp-match-skills-label">To learn</span>
          <div className="ijp-pill-row">
            {match.missingSkills.map((skill) => (
              <span className="ijp-pill-skill ijp-pill-skill--learn" key={skill}>
                <i className="bi bi-plus-lg" aria-hidden="true" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ijp-match-foot">
        {match.alreadyApplied ? (
          <span className="ijp-badge ijp-badge--ok">
            <i className="bi bi-check2-circle me-1" aria-hidden="true" />
            Applied
          </span>
        ) : null}
        {match.applicationDeadline ? (
          <span className="ijp-muted small">
            <i className="bi bi-calendar-event me-1" aria-hidden="true" />
            Closes {match.applicationDeadline}
          </span>
        ) : null}
        <button
          type="button"
          className="btn btn-sm btn-ijp-quiet ms-auto"
          onClick={() => onDiscuss(match)}
        >
          Ask about this
          <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
