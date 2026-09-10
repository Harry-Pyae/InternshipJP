import ThemeToggle from "../shared/ThemeToggle.jsx";
import LanguageToggle from "../shared/LanguageToggle.jsx";
import NotificationBell from "../shared/NotificationBell.jsx";
import UserMenu from "./UserMenu.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * The dashboard header.
 *
 * Deliberately thin. The sidebar already carries navigation, so repeating it
 * here would be two controls for one job. What is left is what genuinely
 * belongs at the top: where you are, and who you are.
 */
export default function Topbar({ title, onOpenDrawer, settingsPath, basePath }) {
  const { t } = useLanguage();
  return (
    <header className="ijp-topbar">
      <div className="d-flex align-items-center gap-2 min-w-0">
        <button
          type="button"
          className="ijp-icon-btn d-lg-none"
          onClick={onOpenDrawer}
          aria-label="Open the navigation menu"
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>
        <span className="ijp-topbar-title text-truncate">{t(title)}</span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <LanguageToggle />
        <NotificationBell basePath={basePath} />
        <ThemeToggle />
        <UserMenu settingsPath={settingsPath} />
      </div>
    </header>
  );
}
