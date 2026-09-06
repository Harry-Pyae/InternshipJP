/**
 * Page controls for a list.
 */
export default function Pagination({ page, pageCount, total, onChange, noun = "item" }) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className="ijp-pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-sm btn-ijp-quiet"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
      >
        <i className="bi bi-chevron-left me-1" aria-hidden="true" />
        Previous
      </button>

      {/* aria-live so a screen reader hears the page change, which is
          otherwise silent when only the rows above swap out. */}
      <span className="ijp-pagination-count" aria-live="polite">
        Page {page + 1} of {pageCount}
        {total != null ? (
          <span className="ijp-muted">
            {" "}
            · {total} {noun}
            {total === 1 ? "" : "s"}
          </span>
        ) : null}
      </span>

      <button
        type="button"
        className="btn btn-sm btn-ijp-quiet"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
      >
        Next
        <i className="bi bi-chevron-right ms-1" aria-hidden="true" />
      </button>
    </nav>
  );
}
