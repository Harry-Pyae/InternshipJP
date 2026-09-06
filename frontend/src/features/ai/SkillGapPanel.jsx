import { useCallback, useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * "What should I learn to get hired?" - the student assistant's core answer.
 */
export default function SkillGapPanel({ onAsk }) {
  const { t, language } = useLanguage();
  const [gaps, setGaps] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setGaps(await aiApi.skillGaps(language));
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
      <h2 className="ijp-label mb-3">{t("What to learn next")}</h2>

      <div className="ijp-callout">
        <i className="bi bi-lightbulb ijp-callout-icon" aria-hidden="true" />
        <p className="mb-0">{gaps.summary}</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="small fw-semibold">{t("Profile completeness")}</span>
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
          <p className="small fw-semibold mb-1">{t("Fix these first")}</p>
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
            <ul className="ijp-gap-grid">
              {gaps.skillsToLearn.map((item) => (
                <li key={item.skill} className="ijp-gap-row">
                  <span className="ijp-gap-text">
                    <span className="ijp-gap-skill">{item.skill}</span>
                    <span className="ijp-muted">
                      {t("required by {n} of {total} open internships", {
                        n: item.openInternshipsRequiring,
                        total: gaps.openInternshipCount,
                      })}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-ijp-quiet ijp-gap-action flex-shrink-0"
                    onClick={() => onAsk(item)}
                  >{t("Learn how")}<i className="bi bi-arrow-right ms-1" aria-hidden="true" />
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
          <p className="small fw-semibold mb-1">{t("Employers are asking for what you have")}</p>
            <div className="ijp-pill-row mb-3">
              {gaps.strengths.map((item) => (
                <span className="ijp-pill-skill ijp-pill-skill--have" key={item.skill}>
                  <i className="bi bi-check2" aria-hidden="true" />
                  {item.skill}
                  <span className="ijp-pill-count">{item.openInternshipsRequiring}</span>
                </span>
              ))}
            </div>
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
