import { useLanguage } from "../../config/languageContext.jsx";

/**
 * A placeholder while a request is in flight.
 *
 * Two shapes, because it is used for two different things. Inside a card it is
 * a quiet inline row, which is right when the rest of the page is already
 * drawn. As a whole page - waiting on the session before anything can render -
 * the same inline row sat alone in the top-left corner of an empty screen,
 * which reads as a broken page rather than as a pause.
 */
export default function LoadingBlock({ label = "Loading...", variant = "inline" }) {
  const { t } = useLanguage();

  if (variant === "page") {
    return (
      <div className="ijp-loading-page" role="status" aria-live="polite">
        <span className="ijp-loading-mark" aria-hidden="true">
          <span className="ijp-loading-dot" />
          <span className="ijp-loading-dot" />
          <span className="ijp-loading-dot" />
        </span>
        <p className="ijp-loading-label">{t(label)}</p>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-2 ijp-muted py-3">
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{t(label)}</span>
    </div>
  );
}
