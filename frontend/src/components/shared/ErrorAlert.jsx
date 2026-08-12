/** One consistent way to show a failed request, with an optional retry. */
export default function ErrorAlert({ message, onRetry }) {
  if (!message) {
    return null;
  }
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>
        <i className="bi bi-exclamation-octagon me-2" aria-hidden="true" />
        {message}
      </span>
      {onRetry ? (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
