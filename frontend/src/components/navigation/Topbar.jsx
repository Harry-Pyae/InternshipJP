import ThemeToggle from "../shared/ThemeToggle.jsx";
import UserMenu from "./UserMenu.jsx";

/**
 * The dashboard header.
 *
 * Deliberately thin. The sidebar already carries navigation, so repeating it
 * here would be two controls for one job. What is left is what genuinely
 * belongs at the top: where you are, and who you are.
 */
export default function Topbar({ title, onOpenDrawer, settingsPath }) {
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
        <span className="ijp-topbar-title text-truncate">{title}</span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <ThemeToggle />
        <UserMenu settingsPath={settingsPath} />
      </div>
    </header>
  );
}
