import PageHeader from "../../components/shared/PageHeader.jsx";

/**
 * The employer's dashboard.
 *
 * TODO MEMBER_3: yours to build - open vacancies, applicant counts,
 * conversion. No invented statistics: every number must come from an endpoint.
 * The company review on the AI page already computes real ones.
 */
export default function EmployerDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="An overview of your hiring." />

      <div className="ijp-card ijp-placeholder">
        <span className="ijp-placeholder-icon" aria-hidden="true">
          <i className="bi bi-grid-1x2" />
        </span>
        <p className="ijp-placeholder-title">Your dashboard is being built</p>
        <p className="ijp-muted mb-0">
          Until then, the AI assistant already reviews your listings and pipeline
          from real data.
        </p>
      </div>
    </>
  );
}
