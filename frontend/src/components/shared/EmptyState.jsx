/**
 * What to show when there is nothing to show.
 *
 * An empty screen should tell the reader what would put something on it, so
 * this takes a hint rather than only an apology.
 */
export default function EmptyState({ icon = "bi-inbox", title, hint }) {
  return (
    <div className="text-center py-5">
      <i className={`bi ${icon} fs-2 ijp-muted`} aria-hidden="true" />
      <p className="fw-semibold mt-2 mb-1">{title}</p>
      {hint ? <p className="ijp-muted small mb-0">{hint}</p> : null}
    </div>
  );
}
