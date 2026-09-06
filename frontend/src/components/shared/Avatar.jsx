/**
 * The signed-in user's avatar.
 *
 * One component because the initials used to be computed twice - sidebar and
 * top-right menu - so the same person could show different letters in each.
 */
export default function Avatar({ name, size = "md", className = "" }) {
  return (
    <span
      className={`ijp-avatar${size === "sm" ? " ijp-avatar--sm" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

/**
 * First letter of the first word, plus first letter of the last - so
 * "Hnin Wai Thaw" is HT, not HW. Middle names are dropped deliberately: the
 * pair people recognise is the one they sign with.
 */
export function initialsOf(name) {
  if (!name || !name.trim()) {
    return "?";
  }
  const parts = name.trim().split(/\s+/);
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
