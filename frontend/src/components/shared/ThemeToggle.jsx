import { useEffect, useState } from "react";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  watchSystemTheme,
} from "../../config/theme.js";

/*
 * System first, because it is the sensible default and the one most people
 * want - a theme that follows the machine they are already using.
 */
const OPTIONS = [
  { value: "system", icon: "bi-laptop", label: "System", hint: "Follows your device" },
  { value: "light", icon: "bi-sun", label: "Light" },
  { value: "dark", icon: "bi-moon-stars", label: "Dark" },
];

/**
 * Light / dark / device theme, as a single dropdown.
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

  const active = OPTIONS.find((option) => option.value === choice) ?? OPTIONS[0];
  const showing = resolveTheme(choice);

  return (
    <div className="dropdown">
      <button
        className="ijp-icon-btn ijp-theme-btn"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label={`Theme: ${active.label}. Change theme`}
      >
        {/* Icon only. The word "Theme" beside a sun told you nothing the sun
            did not, and the pair sat awkwardly next to the account control -
            one labelled, one not. The icon already says which mode is on, and
            aria-label carries the name for anyone who needs it. */}
        <i className={`bi ${active.icon}`} aria-hidden="true" />
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
              <span className="flex-grow-1 text-start">
                {option.label}
                {option.hint ? (
                  <span className="d-block ijp-muted" style={{ fontSize: "0.72rem" }}>
                    {option.hint}
                  </span>
                ) : null}
              </span>
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
