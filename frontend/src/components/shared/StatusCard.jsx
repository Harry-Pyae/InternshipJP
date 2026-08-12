/**
 * One connection, one card.
 *
 * The tone comes from the measured result, never from an assumption:
 *   ok      the call succeeded
 *   warn    the call succeeded but the feature is not configured
 *   bad     the call failed
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
    <div className={`ijp-card ijp-status-card ijp-status-card--${tone} p-4`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="ijp-status-label">
          <i className={`bi ${icon} me-2`} aria-hidden="true" />
          {label}
        </span>
        <i className={`bi ${toneIcon} ijp-status-value--${tone}`} aria-hidden="true" />
      </div>

      <p className={`ijp-status-value ijp-status-value--${tone} mb-1`}>{value}</p>
      {detail ? <p className="ijp-muted small mb-0">{detail}</p> : null}

      {rows.length > 0 ? (
        <dl className="row small mb-0 mt-3">
          {rows.map((row) => (
            <div className="col-12 d-flex justify-content-between py-1" key={row.label}>
              <dt className="fw-normal ijp-muted">{row.label}</dt>
              <dd className="mb-0 ijp-mono text-end">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
