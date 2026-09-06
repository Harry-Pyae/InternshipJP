import { useLanguage } from "../../config/languageContext.jsx";

/**
 * EN / မြန်မာ.
 */
export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="ijp-lang-toggle"
      role="group"
      aria-label="Interface language / ဘာသာစကား"
    >
      <button
        type="button"
        className={`ijp-lang-option${language === "en" ? " ijp-lang-option--on" : ""}`}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={`ijp-lang-option${language === "my" ? " ijp-lang-option--on" : ""}`}
        onClick={() => setLanguage("my")}
        aria-pressed={language === "my"}
        lang="my"
      >
        မြန်မာ
      </button>
    </div>
  );
}
