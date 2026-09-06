import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
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

  useEffect(() => {
    aiApi
      .skillGaps(language)
      .then(setGaps)
      .catch((requestError) => setError(describeApiError(requestError)));
  }, [language]);

  const nextSkill = gaps?.skillsToLearn?.[0];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="An overview of your internship search." />

      <ErrorAlert message={error} />

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
        <LoadingBlock label="Loading your figures..." />
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <StatCard
              label="Profile complete"
              value={gaps ? `${gaps.profileCompleteness}%` : "—"}
              icon="bi-person-check"
              tone={gaps && gaps.profileCompleteness < 70 ? "warn" : "ok"}
              hint={
                gaps && gaps.profileGaps?.length
                  ? t("{n} thing(s) missing", { n: gaps.profileGaps.length })
                  : t("Nothing missing")
              }
            />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard
              label="Applications"
              value={gaps?.applicationCount ?? "—"}
              icon="bi-send"
              hint="Internships you have applied to"
            />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard
              label="Verified certificates"
              value={gaps?.verifiedCertificateCount ?? "—"}
              icon="bi-patch-check"
              tone={gaps && gaps.verifiedCertificateCount === 0 ? "warn" : "ok"}
              hint="Only verified ones reach employers"
            />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard
              label="Open internships"
              value={gaps?.openInternshipCount ?? "—"}
              icon="bi-megaphone"
              hint="Currently accepting applications"
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
