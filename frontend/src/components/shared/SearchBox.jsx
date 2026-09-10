import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Filters a list that is already loaded.
 *
 * HONESTY ABOUT SCOPE
 *   This searches what is on screen, not the whole database. Where a page
 *   fetches a fixed number of rows, that is a real limit, so the count beside
 *   the box always says how many of how many are showing. A search box that
 *   quietly searches less than the user assumes is worse than no search box.
 *
 *   The Users page is different - it has a real server-side search - and keeps
 *   its own.
 */
export default function SearchBox({ value, onChange, placeholder, shown, total }) {
  const { t } = useLanguage();

  return (
    <div className="ijp-searchbox">
      <div className="ijp-searchbox-field">
        <i className="bi bi-search ijp-searchbox-icon" aria-hidden="true" />
        <input
          type="search"
          className="form-control"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? t("Search")}
          aria-label={placeholder ?? t("Search")}
        />
        {value ? (
          <button
            type="button"
            className="ijp-searchbox-clear"
            onClick={() => onChange("")}
            aria-label={t("Clear search")}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {value ? (
        <span className="ijp-searchbox-count" role="status">
          {t("{shown} of {total} shown", { shown, total })}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Case-insensitive match across whichever fields a page names.
 *
 * Kept here rather than repeated on each page so every search behaves the
 * same way - the surprise of one table matching partial words and another not
 * is the kind of inconsistency nobody reports but everyone feels.
 */
export function matches(row, term, fields) {
  const needle = term.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return fields.some((field) => {
    const value = typeof field === "function" ? field(row) : row[field];
    return value != null && String(value).toLowerCase().includes(needle);
  });
}
