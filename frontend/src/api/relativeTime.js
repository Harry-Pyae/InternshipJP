/**
 * "2 hours ago" from an ISO timestamp.
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
    return "just now";
  }
  if (elapsed > 30 * 24 * 60 * 60 * 1000) {
    return then.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
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
  return Number.isNaN(value.getTime()) ? "" : value.toLocaleString();
}
