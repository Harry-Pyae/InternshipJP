/**
 * Light / dark / system theme.
 */

const STORAGE_KEY = "ijp-theme";

export const THEMES = ["light", "dark", "system"];

/** What the user chose. Not necessarily what is on screen - see resolveTheme. */
export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : "system";
  } catch {
    // Private browsing can block storage. Never let that break the page.
    return "system";
  }
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* Preference is lost on reload, which is acceptable. */
  }
}

/** Turns a choice into the theme actually shown. */
export function resolveTheme(choice) {
  if (choice === "system") {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return choice;
}

export function applyTheme(choice) {
  document.documentElement.setAttribute("data-bs-theme", resolveTheme(choice));
}

/**
 * Calls back when the operating system theme changes, so "system" stays live.
 * Returns an unsubscribe function.
 */
export function watchSystemTheme(onChange) {
  if (!window.matchMedia) {
    return () => {};
  }
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onChange();
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}
