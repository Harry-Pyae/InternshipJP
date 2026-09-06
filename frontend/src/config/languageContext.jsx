import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { strings } from "./strings.js";

/**
 * Which language the interface is in.
 */
const STORAGE_KEY = "internshipjp-language";

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "my" ? "my" : "en";
    } catch {
      // Private browsing can refuse localStorage. English is a safe default.
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Not being able to remember the choice is not a reason to break.
    }
    // Screen readers and browser translation both read this, and Burmese needs
    // it to pick the right font fallback.
    document.documentElement.lang = language === "my" ? "my" : "en";
    document.documentElement.dataset.lang = language;
  }, [language]);

  const setLanguage = useCallback((next) => {
    setLanguageState(next === "my" ? "my" : "en");
  }, []);

  /**
   * Looks up a string. An unknown key returns the key itself rather than
   * blank, so a missing translation shows up as "nav.dashboard" on screen
   * instead of a gap nobody notices.
   */
  /**
   * Looks up a string, and fills {placeholders} from params.
   *
   * Burmese puts numbers and nouns in a different order from English, so
   * "required by 3 of 5" cannot be built by concatenating fragments - the
   * whole sentence has to be one translatable string with holes in it.
   */
  const t = useCallback(
    (key, params) => {
      // Anything that is not a plain string comes straight back: these
      // components accept elements and numbers for the same props, and a
      // lookup on a React element would return undefined and blank the page.
      if (typeof key !== "string") {
        return key;
      }
      const table = strings[language] ?? strings.en;
      const found = table[key] ?? strings.en[key] ?? key;
      if (!params) {
        return found;
      }
      return found.replace(/\{(\w+)\}/g, (whole, name) =>
        params[name] === undefined ? whole : String(params[name]),
      );
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
