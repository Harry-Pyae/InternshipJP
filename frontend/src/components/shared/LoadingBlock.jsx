/** A quiet placeholder while a request is in flight. */
export default function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="d-flex align-items-center gap-2 ijp-muted py-3">
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
