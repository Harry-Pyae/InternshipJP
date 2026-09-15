import { useLanguage } from "../../config/languageContext.jsx";

/**
 * A Myanmar phone number, with the country code shown rather than typed.
 *
 * WHY NOT A COUNTRY DROPDOWN
 *   A list of every country, each needing a Burmese name, to support one. This
 *   platform is for Myanmar students and Myanmar employers, and +95 is the only
 *   prefix the validator accepts. A label says the rule; a dropdown would ask
 *   somebody to choose the only option.
 *
 * The value stored is still the full +959XXXXXXXX that the server validates.
 * Only the display is split, so nothing downstream has to know about this.
 */
export default function PhoneField({ id, label, value, onChange, hint, required }) {
  const { t } = useLanguage();

  // The field shows the digits after +95; the value keeps the whole number.
  const digits = (value ?? "").replace(/^\+95/, "");

  return (
    <div className="ijp-field">
      <label className="ijp-field-label" htmlFor={id}>
        {t(label)}
        {required ? <span className="ijp-required"> *</span> : null}
      </label>

      <div className="ijp-phone">
        <span className="ijp-phone-code" aria-hidden="true">
          +95
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          className="form-control"
          value={digits}
          placeholder="9795123456"
          // Digits only. Somebody typing their number as 09 7xx or +95 9 7xx
          // should not be corrected at them afterwards - the field simply keeps
          // what is a number and drops the rest.
          onChange={(event) => {
            const typed = event.target.value.replace(/\D/g, "").slice(0, 10);
            onChange(typed ? `+95${typed}` : "");
          }}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      </div>

      <p className="ijp-field-msg ijp-field-hint" id={`${id}-hint`}>
        {hint ? t(hint) : t("7 to 10 digits, without the leading zero.")}
      </p>
    </div>
  );
}
