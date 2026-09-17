import { useLanguage } from "../../config/languageContext.jsx";

/**
 * One consistent way to show a failed request, with an optional retry.
 *
 * The message goes through t(), so an error the interface composes - and any
 * server message with an entry - reads in the chosen language. One without an
 * entry is shown as it came.
 */
export default function ErrorAlert({ message, onRetry }) {
  const { t } = useLanguage();
  if (!message) {
    return null;
  }
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>
        <i className="bi bi-exclamation-octagon me-2" aria-hidden="true" />
        {t(message)}
      </span>
      {onRetry ? (
        <button type="button" className="btn btn-sm btn-ijp-quiet ijp-btn-danger" onClick={onRetry}>
          {t("Try again")}
        </button>
      ) : null}
    </div>
  );
}
