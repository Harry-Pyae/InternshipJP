/**
 * One connection or one lifecycle state, shown with the state rail.
 *
 * The tone always comes from a measured result, never from an assumption:
 *   ok      the call succeeded
 *   warn    it succeeded but the feature is not configured
 *   bad     it failed
 *   unknown not checked yet
 */
export default function StatusCard({
  label,
  icon,
  tone = "unknown",
  value,
  detail,
  rows = [],
  loading = false,
  badge = null,
}) {
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
        {loading ? (
          <span className="spinner-border spinner-border-sm ijp-muted" aria-hidden="true" />
        ) : (
          <i className={`bi ${toneIcon} ijp-state--${tone}`} aria-hidden="true" />
        )}
      </div>

      {loading ? (
        /* A skeleton in the shape of the answer, so the card does not resize
           when the real result lands. */
        <div className="d-grid gap-2" aria-hidden="true">
          <span className="ijp-skeleton" style={{ width: "62%", height: "1rem" }} />
          <span className="ijp-skeleton" style={{ width: "88%" }} />
          <span className="ijp-skeleton" style={{ width: "45%" }} />
        </div>
      ) : (
        <>
          <p className={`ijp-status-value ijp-state--${tone} mb-1 d-flex align-items-center gap-2`}>
            <span>{value}</span>
            {badge}
          </p>
          {detail ? <p className="ijp-muted small mb-0">{detail}</p> : null}
        </>
      )}

      {rows.length > 0 && !loading ? (
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
