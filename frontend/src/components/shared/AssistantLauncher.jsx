import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * The "ask our AI" bar, bottom right.
 *
 * Retractable, and it remembers: someone who collapses a floating element does
 * not want to collapse it again on every page, so the choice is kept in
 * localStorage rather than in component state.
 *
 * It hides itself on the assistant page. A shortcut to the page you are
 * already on is clutter that also covers the message box.
 */
const STORAGE_KEY = "internshipjp-assistant-launcher";

export default function AssistantLauncher({ basePath }) {
  const { t } = useLanguage();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "collapsed";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "open");
    } catch {
      // Private browsing can refuse storage. Not remembering is survivable.
    }
  }, [collapsed]);

  if (location.pathname.startsWith(`${basePath}/ai`)) {
    return null;
  }

  if (collapsed) {
    return (
      <button
        type="button"
        className="ijp-launcher-tab"
        onClick={() => setCollapsed(false)}
        aria-label={t("Ask the assistant")}
      >
        <i className="bi bi-stars" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="ijp-launcher">
      <Link className="ijp-launcher-main" to={`${basePath}/ai`}>
        <i className="bi bi-stars ijp-launcher-icon" aria-hidden="true" />
        <span className="ijp-launcher-text">{t("Ask our AI for more questions")}</span>
      </Link>
      <button
        type="button"
        className="ijp-launcher-hide"
        onClick={() => setCollapsed(true)}
        aria-label={t("Hide")}
        title={t("Hide")}
      >
        <i className="bi bi-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}
