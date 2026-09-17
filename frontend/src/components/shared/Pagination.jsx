import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Page controls for a list.
 *
 * noun is the singular English word ("application"); the count line is one
 * translatable sentence, because Burmese does not add an "s" for plurals.
 */
export default function Pagination({ page, pageCount, total, onChange, noun = "item" }) {
  const { t, language } = useLanguage();
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className="ijp-pagination" aria-label={t("Pagination")}>
      <button
        type="button"
        className="btn btn-sm btn-ijp-quiet"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
      >
        <i className="bi bi-chevron-left me-1" aria-hidden="true" />
        {t("Previous")}
      </button>

      {/* aria-live so a screen reader hears the page change, which is
          otherwise silent when only the rows above swap out. */}
      <span className="ijp-pagination-count" aria-live="polite">
        {t("Page {page} of {count}", { page: page + 1, count: pageCount })}
        {total != null ? (
          <span className="ijp-muted">
            {" "}
            · {total} {t(total === 1 || language === "my" ? noun : pluralOf(noun))}
          </span>
        ) : null}
      </span>

      <button
        type="button"
        className="btn btn-sm btn-ijp-quiet"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
      >
        {t("Next")}
        <i className="bi bi-chevron-right ms-1" aria-hidden="true" />
      </button>
    </nav>
  );
}

/** English plural of a list noun. Burmese marks no plural, so it keeps the noun. */
function pluralOf(noun) {
  return /[^aeiou]y$/.test(noun) ? `${noun.slice(0, -1)}ies` : `${noun}s`;
}
