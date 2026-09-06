import { useLanguage } from "../../config/languageContext.jsx";

/** Title, one line of explanation, and an optional action on the right. */
export default function PageHeader({ title, subtitle, action }) {
  const { t } = useLanguage();
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
      <div>
        <h1 className="ijp-page-title">{t(title)}</h1>
        {subtitle ? <p className="ijp-page-subtitle">{t(subtitle)}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
