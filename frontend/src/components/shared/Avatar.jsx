/**
 * The signed-in user's avatar.
 *
 * WHY THIS IS ONE COMPONENT
 *   The initials were computed twice - once in the sidebar footer, once in the
 *   top-right menu - by two separate copies of the same function. Two copies
 *   of one rule is one bug waiting: change how a two-word name is abbreviated
 *   in one place and the same person shows "HW" in the corner and "HT" at the
 *   bottom of the sidebar, with nothing failing to tell you.
 *
 *   There is now one implementation, and both places call it.
 *
 * A photo goes here when profile photos work. The column (users.photo_path)
 * exists, but nothing uploads to it yet, and a broken image is worse than
 * initials - so this deliberately renders text until Member 2 wires uploads.
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
