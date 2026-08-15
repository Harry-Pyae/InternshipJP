/**
 * One number with a label. The building block of every dashboard's top row.
 *
 *   <div className="row g-3">
 *     <div className="col-6 col-lg-3"><StatCard label="Applications" value={5} icon="bi-file-earmark" /></div>
 *     <div className="col-6 col-lg-3"><StatCard label="Interviews" value={2} icon="bi-calendar" tone="ok" /></div>
 *   </div>
 *
 * The value is set in the data face with tabular figures, so a row of cards
 * lines up instead of wobbling.
 *
 * Owner: Member 4.
 */
export default function StatCard({ label, value, icon, tone, hint }) {
  return (
    <div className={`ijp-card p-3 h-100${tone ? ` ijp-rail ijp-rail--${tone}` : ""}`}>
      <div className="d-flex justify-content-between align-items-start gap-2">
        <span className="ijp-label">{label}</span>
        {icon ? <i className={`bi ${icon} ijp-muted`} aria-hidden="true" /> : null}
      </div>
      <p className={`ijp-score mt-2 mb-0${tone ? ` ijp-state--${tone}` : ""}`}>{value}</p>
      {hint ? <p className="ijp-muted small mb-0 mt-1">{hint}</p> : null}
    </div>
  );
}
