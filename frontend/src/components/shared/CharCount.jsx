import { useLanguage } from "../../config/languageContext.jsx";

/**
 * How much room is left in a field.
 *
 * WHY IT ONLY APPEARS NEAR THE LIMIT
 *   A hard maxLength stops typing with no explanation, and somebody at the end
 *   of a cover letter has no way to tell a full field from a broken keyboard.
 *   A counter on every field at all times is noise; a counter that appears when
 *   it starts to matter is an answer to a question the person is about to ask.
 *
 *   The threshold is a fifth of the limit, or eighty characters, whichever is
 *   smaller - so a 3000-character letter warns at 2920 rather than at 2400.
 *
 * WHY SHORT FIELDS NEVER GET ONE
 *   A fifth of a small limit is a tiny number, so a phone box capped at 16
 *   started counting down at 13 and a four-digit year at 3 - warning people
 *   about a limit they could see the end of anyway, on the fields where they
 *   are typing something whose length they already know. Below the floor the
 *   field speaks for itself and the counter is only noise.
 */
const SHORT_FIELD = 25;

export default function CharCount({ value, max }) {
  const { t } = useLanguage();

  // A caller with no limit to report. Without this the arithmetic below is
  // NaN, and NaN is never greater than the threshold, so the component
  // rendered "NaN characters left" rather than nothing.
  if (!max || max <= SHORT_FIELD) {
    return null;
  }

  const used = String(value ?? "").length;
  const left = max - used;
  const threshold = Math.min(Math.round(max / 5), 80);

  if (left > threshold) {
    return null;
  }

  return (
    <span className={`ijp-charcount${left <= 0 ? " ijp-charcount--full" : ""}`} aria-live="polite">
      {left <= 0
        ? t("Full - no more characters fit.")
        : `${left} ${t("characters left")}`}
    </span>
  );
}
