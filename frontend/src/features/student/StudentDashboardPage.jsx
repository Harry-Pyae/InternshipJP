import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import MetricCard from "../../components/shared/MetricCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * The student's dashboard.
 */
export default function StudentDashboardPage() {
  const { t, language } = useLanguage();
  const [gaps, setGaps] = useState(null);
  const [error, setError] = useState(null);

  // The summary sentence is written server-side, so a language change has to
  // refetch rather than re-render.
  const load = useCallback(async () => {
    setError(null);
    try {
      setGaps(await aiApi.skillGaps(language));
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [language]);

  useEffect(() => {
    load();
  }, [load]);

  const nextSkill = gaps?.skillsToLearn?.[0];

  return (
    <>
      <PageHeader
        title={t("Dashboard")}
        subtitle={t("An overview of your internship search.")}
        action={
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={load}
            disabled={gaps === null && !error}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />{t("Refresh")}</button>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-hero">
        <div>
          <p className="ijp-hero-title">{t("Welcome back")}</p>
          <p className="ijp-hero-text">
            {gaps?.summary ?? t("Here is where your internship search stands.")}
          </p>
        </div>
        <i className="bi bi-mortarboard ijp-hero-art" aria-hidden="true" />
      </div>

      {gaps === null && !error ? (
        <LoadingBlock label={t("Loading your figures...")} />
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <MetricCard
              label={t("Profile complete")}
              value={gaps ? `${gaps.profileCompleteness}%` : "—"}
              icon="bi-person-check"
              tone={gaps && gaps.profileCompleteness < 70 ? "warning" : "ok"}
              description={
                gaps && gaps.profileGaps?.length
                  ? t("{n} thing(s) missing", { n: gaps.profileGaps.length })
                  : t("Nothing missing")
              }
              href="/student/profile"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <MetricCard
              label={t("Applications")}
              value={gaps?.applicationCount ?? "—"}
              icon="bi-send"
              description="Internships you have applied to"
              href="/student/applications"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <MetricCard
              label={t("Verified certificates")}
              value={gaps?.verifiedCertificateCount ?? "—"}
              icon="bi-patch-check"
              tone={gaps && gaps.verifiedCertificateCount === 0 ? "warning" : "ok"}
              description="Only verified ones reach employers"
              href="/student/certificates"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <MetricCard
              label={t("Open internships")}
              value={gaps?.openInternshipCount ?? "—"}
              icon="bi-megaphone"
              description="Currently accepting applications"
              href="/student/internships"
            />
          </div>
        </div>
      )}

      {nextSkill ? (
        <div className="ijp-callout">
          <i className="bi bi-lightbulb ijp-callout-icon" aria-hidden="true" />
          <p className="mb-0">
            {t("The skill most worth learning next is {skill}, asked for by {n} of the {total} open internships.", {
              skill: nextSkill.skill,
              n: nextSkill.openInternshipsRequiring,
              total: gaps.openInternshipCount,
            })}
          </p>
        </div>
      ) : null}

      <h2 className="ijp-label mb-2">{t("Quick actions")}</h2>
      <div className="ijp-quick-actions">
        <Link className="ijp-quick" to="/student/internships">
          <span className="ijp-quick-icon">
            <i className="bi bi-search" aria-hidden="true" />
          </span>
          <span className="ijp-quick-body">
            <span className="ijp-quick-title">{t("Browse internships")}</span>
            <span className="ijp-quick-text">{t("Find open vacancies and apply.")}</span>
          </span>
          <i className="bi bi-arrow-right ijp-quick-go" aria-hidden="true" />
        </Link>

        <Link className="ijp-quick" to="/student/certificates">
          <span className="ijp-quick-icon">
            <i className="bi bi-patch-check" aria-hidden="true" />
          </span>
          <span className="ijp-quick-body">
            <span className="ijp-quick-title">{t("Upload a certificate")}</span>
            <span className="ijp-quick-text">{t("Employers only see qualifications an administrator has verified.")}</span>
          </span>
          <i className="bi bi-arrow-right ijp-quick-go" aria-hidden="true" />
        </Link>

        <Link className="ijp-quick" to="/student/ai">
          <span className="ijp-quick-icon">
            <i className="bi bi-stars" aria-hidden="true" />
          </span>
          <span className="ijp-quick-body">
            <span className="ijp-quick-title">{t("Ask the assistant")}</span>
            <span className="ijp-quick-text">{t("What to learn next, and which vacancies fit.")}</span>
          </span>
          <i className="bi bi-arrow-right ijp-quick-go" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
