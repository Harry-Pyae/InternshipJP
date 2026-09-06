import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * The employer's dashboard.
 */
export default function EmployerDashboardPage() {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDashboard(await employerApi.getDashboard());
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your hiring."
        action={
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={load}
            disabled={dashboard === null && !error}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-hero">
        <div>
          <p className="ijp-hero-title">{t("Welcome back")}</p>
          <p className="ijp-hero-text">{t("Here is what is happening with your hiring today.")}</p>
        </div>
        <i className="bi bi-briefcase ijp-hero-art" aria-hidden="true" />
      </div>

      {dashboard === null && !error ? (
        <LoadingBlock label="Loading your figures..." />
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <StatCard
              label="Open vacancies"
              value={dashboard?.openVacancies ?? "—"}
              icon="bi-megaphone"
              hint="Currently accepting applications"
            />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard
              label="Total applicants"
              value={dashboard?.totalApplicants ?? "—"}
              icon="bi-people"
              hint="Applications received"
            />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard
              label="Accepted"
              value={dashboard?.acceptedApplicants ?? "—"}
              icon="bi-check2-circle"
              tone="ok"
              hint="Candidates accepted"
            />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard
              label="Conversion"
              value={
                dashboard?.conversionRate != null
                  ? `${dashboard.conversionRate.toFixed(1)}%`
                  : "—"
              }
              icon="bi-graph-up"
              hint="Applicants accepted"
            />
          </div>
        </div>
      )}

      <h2 className="ijp-label mb-2">{t("Quick actions")}</h2>
      <div className="ijp-quick-actions">
        <Link className="ijp-quick" to="/employer/internships/new">
          <span className="ijp-quick-icon">
            <i className="bi bi-plus-square" aria-hidden="true" />
          </span>
          <span className="ijp-quick-body">
            <span className="ijp-quick-title">{t("Post an internship")}</span>
            <span className="ijp-quick-text">{t("Create a vacancy and publish it once your company is approved.")}</span>
          </span>
          <i className="bi bi-arrow-right ijp-quick-go" aria-hidden="true" />
        </Link>

        <Link className="ijp-quick" to="/employer/applications">
          <span className="ijp-quick-icon">
            <i className="bi bi-people" aria-hidden="true" />
          </span>
          <span className="ijp-quick-body">
            <span className="ijp-quick-title">{t("Review applicants")}</span>
            <span className="ijp-quick-text">{t("Shortlist, accept or reject the people who applied.")}</span>
          </span>
          <i className="bi bi-arrow-right ijp-quick-go" aria-hidden="true" />
        </Link>

        <Link className="ijp-quick" to="/employer/ai">
          <span className="ijp-quick-icon">
            <i className="bi bi-stars" aria-hidden="true" />
          </span>
          <span className="ijp-quick-body">
            <span className="ijp-quick-title">{t("Ask the assistant")}</span>
            <span className="ijp-quick-text">{t("Compare candidates, or find out why nobody is applying.")}</span>
          </span>
          <i className="bi bi-arrow-right ijp-quick-go" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
