import { useEffect, useState } from "react";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  watchSystemTheme,
} from "../../config/theme.js";

const OPTIONS = [
  { value: "light", icon: "bi-sun", label: "Light" },
  { value: "dark", icon: "bi-moon-stars", label: "Dark" },
  { value: "system", icon: "bi-circle-half", label: "Match my device" },
];

/**
 * Light / dark / device theme, as a single dropdown.
 *
 * One control rather than three side-by-side buttons: three buttons take the
 * width of a whole menu item to express one setting, and it is never obvious
 * that they are alternatives rather than three separate actions. A dropdown
 * shows the current choice and hides the rest until asked.
 *
 * "Match my device" keeps following the operating system - change Windows to
 * dark at sunset and the app follows, with no reload.
 */
export default function ThemeToggle() {
  const [choice, setChoice] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(choice);
    if (choice !== "system") {
      return undefined;
    }
    // Only "system" has to listen; the other two are fixed.
    return watchSystemTheme(() => applyTheme("system"));
  }, [choice]);

  function pick(value) {
    setChoice(value);
    storeTheme(value);
  }

  const active = OPTIONS.find((option) => option.value === choice) ?? OPTIONS[2];
  const showing = resolveTheme(choice);

  return (
    <div className="dropdown">
      <button
        className="btn btn-sm btn-ijp-quiet dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label={`Theme: ${active.label}. Change theme`}
      >
        <i className={`bi ${active.icon}`} aria-hidden="true" />
        <span className="d-none d-sm-inline ms-2">Theme</span>
      </button>

      <ul className="dropdown-menu dropdown-menu-end">
        {OPTIONS.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center gap-2${
                option.value === choice ? " active" : ""
              }`}
              onClick={() => pick(option.value)}
            >
              <i className={`bi ${option.icon}`} aria-hidden="true" />
              <span className="flex-grow-1 text-start">{option.label}</span>
              {option.value === choice ? (
                <i className="bi bi-check2" aria-hidden="true" />
              ) : null}
            </button>
          </li>
        ))}
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <span className="dropdown-item-text ijp-muted small">
            Showing {showing}
          </span>
        </li>
      </ul>
    </div>
  );
}
