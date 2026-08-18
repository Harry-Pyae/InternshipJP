import PageHeader from "../../components/shared/PageHeader.jsx";

/**
 * The student's dashboard.
 *
 * TODO MEMBER_2: this is deliberately empty. It is yours to build - profile
 * completeness, recent applications, upcoming deadlines - using StatCard,
 * SectionCard and DataTable from components/shared.
 *
 * It shows no numbers on purpose. Inventing "5 applications, 85% profile"
 * would look finished and be a lie; every figure has to come from an endpoint.
 * The student's real, calculated figures already exist on the AI assistant
 * page, which reads them from the backend.
 */
export default function StudentDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your internship search."
      />

      <div className="ijp-card ijp-placeholder">
        <span className="ijp-placeholder-icon" aria-hidden="true">
          <i className="bi bi-grid-1x2" />
        </span>
        <p className="ijp-placeholder-title">Your dashboard is being built</p>
        <p className="ijp-muted mb-0">
          Until then, the AI assistant already shows your real skill gaps and
          matched internships.
        </p>
      </div>
    </>
  );
}
