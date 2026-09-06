import { useLanguage } from "../../config/languageContext.jsx";

/** A quiet placeholder while a request is in flight. */
export default function LoadingBlock({ label = "Loading..." }) {
  const { t } = useLanguage();
  return (
    <div className="d-flex align-items-center gap-2 ijp-muted py-3">
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{t(label)}</span>
    </div>
  );
}
