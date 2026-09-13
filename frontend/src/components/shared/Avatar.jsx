import { useEffect, useState } from "react";
import { accountApi } from "../../api/accountApi.js";

/**
 * The signed-in user's avatar.
 *
 * One component because the initials used to be computed twice - sidebar and
 * top-right menu - so the same person could show different letters in each.
 */
/**
 * Photos are fetched once per user and kept for the life of the page.
 *
 * The same avatar appears on every row of a table and in the sidebar, so
 * without this the browser would request one person's photo a dozen times.
 * A null entry means "asked, and there is none" - it stops the component
 * asking again on every render.
 */
const photoCache = new Map();

/**
 * Everything currently showing a photo, so a change reaches all of it.
 *
 * The sidebar, the top-right menu, the profile card and every row of the users
 * table are separate components rendering the same person. Clearing the cache
 * alone would not redraw any of them, which is why an upload used to require a
 * refresh before you could see it.
 */
const listeners = new Set();

/** Incremented per user on every change, to defeat the HTTP cache. */
const versions = new Map();

/** Forgets a cached photo and tells every mounted avatar to fetch it again. */
export function invalidatePhoto(userId) {
  const previous = photoCache.get(userId);
  if (previous) {
    // The blob was created by us, so release it rather than leaking one per
    // upload for the life of the page.
    URL.revokeObjectURL(previous);
  }
  photoCache.delete(userId);
  versions.set(userId, (versions.get(userId) ?? 0) + 1);
  listeners.forEach((notify) => notify(userId));
}

export default function Avatar({ name, userId, size = "md", className = "", zoom = true }) {
  const [photo, setPhoto] = useState(() =>
    userId != null && photoCache.has(userId) ? photoCache.get(userId) : null,
  );
  const [open, setOpen] = useState(false);

  // Bumped when this person's photo is invalidated, which re-runs the fetch
  // below. A counter rather than a boolean, so two changes in a row both land.
  const [stale, setStale] = useState(0);

  useEffect(() => {
    if (userId == null) return undefined;
    function onChange(changedId) {
      if (changedId === userId) setStale((n) => n + 1);
    }
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  }, [userId]);

  useEffect(() => {
    if (userId == null || photoCache.has(userId)) {
      if (userId != null) setPhoto(photoCache.get(userId) ?? null);
      return undefined;
    }
    let alive = true;
    accountApi.fetchPhoto(userId, versions.get(userId) ?? 0).then((url) => {
      photoCache.set(userId, url);
      if (alive) setPhoto(url);
    });
    return () => {
      alive = false;
    };
  }, [userId, stale]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sizeClass =
    size === "sm" ? " ijp-avatar--sm" : size === "lg" ? " ijp-avatar--lg" : "";

  const inner = photo ? (
    <img className="ijp-avatar-img" src={photo} alt="" />
  ) : (
    // Initials are the fallback, not a placeholder image: they identify the
    // person, and a generic silhouette does not.
    initialsOf(name)
  );

  // Only a real photo is worth enlarging. Blowing up two letters to fill the
  // screen tells nobody anything, so initials are never clickable.
  if (!photo || !zoom) {
    return (
      <span className={`ijp-avatar${sizeClass} ${className}`.trim()} aria-hidden="true">
        {inner}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`ijp-avatar ijp-avatar--zoom${sizeClass} ${className}`.trim()}
        onClick={(event) => {
          // Rows and cards are often clickable themselves; enlarging a photo
          // should not also open whatever is underneath it.
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={name ? `View photo of ${name}` : "View photo"}
      >
        {inner}
      </button>

      {open ? (
        <div
          className="ijp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={name ? `Photo of ${name}` : "Photo"}
          onClick={() => setOpen(false)}
        >
          <img className="ijp-lightbox-img" src={photo} alt={name ?? ""} />
          <button
            type="button"
            className="ijp-lightbox-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
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
