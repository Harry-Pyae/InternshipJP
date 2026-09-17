import { currentLanguage, translate } from "../config/languageContext.jsx";

/** The locale for dates and relative times: the interface language, not the browser's. */
function locale() {
  return currentLanguage() === "my" ? "my" : "en";
}

/**
 * "2 hours ago" from an ISO timestamp, in the interface language.
 */
const UNITS = [
  { unit: "second", ms: 1000 },
  { unit: "minute", ms: 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
];

export function timeAgo(isoString) {
  if (!isoString) {
    return "";
  }
  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) {
    return "";
  }

  const elapsed = Date.now() - then.getTime();
  if (elapsed < 45 * 1000) {
    return translate("just now");
  }
  if (elapsed > 30 * 24 * 60 * 60 * 1000) {
    return then.toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
  }

  const formatter = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
  let chosen = UNITS[0];
  for (const candidate of UNITS) {
    if (elapsed >= candidate.ms) {
      chosen = candidate;
    }
  }
  return formatter.format(-Math.round(elapsed / chosen.ms), chosen.unit);
}

/** The full timestamp, for a tooltip beside the relative one. */
export function exactTime(isoString) {
  if (!isoString) {
    return "";
  }
  const value = new Date(isoString);
  return Number.isNaN(value.getTime()) ? "" : value.toLocaleString(locale());
}

/**
 * How old a qualification is, as a short phrase.
 *
 * The platform verifies that a document is genuine, not that it is still
 * current: a language score from four years ago was real then and may not mean
 * the same now. Rather than invent expiry rules per qualification, the age is
 * stated and the reader judges. Nothing is hidden and nothing is downgraded.
 *
 * Months are reported below a year. An earlier version showed whole years
 * only, so every certificate under twelve months old displayed nothing at all
 * and the feature looked broken rather than quiet.
 */
export function certificateAge(issueDate) {
  if (!issueDate) return "";
  const issued = new Date(issueDate);
  if (Number.isNaN(issued.getTime())) return "";

  const months = Math.floor((Date.now() - issued.getTime()) / (30.44 * 24 * 3600 * 1000));
  if (months < 1) return translate("issued this month");
  if (months < 12) return translate(months === 1 ? "{n} month old" : "{n} months old", { n: months });

  const years = Math.floor(months / 12);
  return translate(years === 1 ? "{n} year old" : "{n} years old", { n: years });
}
