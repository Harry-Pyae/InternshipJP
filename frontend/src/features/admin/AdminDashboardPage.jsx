import PageHeader from "../../components/shared/PageHeader.jsx";

/**
 * The administrator's dashboard.
 *
 * TODO MEMBER_4: yours to build - approval counts, the certificate queue,
 * recent registrations, AI usage. Everything you need is already an endpoint:
 * /api/admin/certificates/pending, /api/admin/employers/pending,
 * /api/admin/users, /api/admin/ai/usage/summary.
 */
export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Platform overview." />

      <div className="ijp-card ijp-placeholder">
        <span className="ijp-placeholder-icon" aria-hidden="true">
          <i className="bi bi-grid-1x2" />
        </span>
        <p className="ijp-placeholder-title">Your dashboard is being built</p>
        <p className="ijp-muted mb-0">
          Until then, the AI assistant already shows what is waiting for review
          and how long it has waited.
        </p>
      </div>
    </>
  );
}
