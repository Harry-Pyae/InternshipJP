/**
 * One connection or one lifecycle state, shown with the state rail.
 *
 * The tone always comes from a measured result, never from an assumption:
 *   ok      the call succeeded
 *   warn    it succeeded but the feature is not configured
 *   bad     it failed
 *   unknown not checked yet
 */
export default function StatusCard({ label, icon, tone = "unknown", value, detail, rows = [] }) {
  const toneIcon = {
    ok: "bi-check-circle-fill",
    warn: "bi-exclamation-triangle-fill",
    bad: "bi-x-circle-fill",
    unknown: "bi-dash-circle",
  }[tone];

  return (
    <div className={`ijp-card ijp-rail ijp-rail--${tone} p-4 h-100`}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="ijp-label">
          <i className={`bi ${icon} me-2`} aria-hidden="true" />
          {label}
        </span>
        <i className={`bi ${toneIcon} ijp-state--${tone}`} aria-hidden="true" />
      </div>

      <p className={`ijp-status-value ijp-state--${tone} mb-1`}>{value}</p>
      {detail ? <p className="ijp-muted small mb-0">{detail}</p> : null}

      {rows.length > 0 ? (
        <dl className="small mb-0 mt-3 pt-3 border-top">
          {rows.map((row) => (
            <div className="d-flex justify-content-between gap-3 py-1" key={row.label}>
              <dt className="fw-normal ijp-muted">{row.label}</dt>
              <dd className="mb-0 ijp-data text-end">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
