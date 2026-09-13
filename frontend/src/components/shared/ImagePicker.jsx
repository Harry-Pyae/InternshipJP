import { useEffect, useState } from "react";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Choose an image, look at it, then decide.
 *
 * The pattern is the same for a profile photo and a company logo, so it lives
 * in one place: pick a file, see it, confirm or pick another. Sending it the
 * moment it was chosen meant the first sight of an image was after it had
 * already replaced the old one.
 *
 * `shape` only changes the frame - round for a person, square for a company -
 * because a logo cropped to a circle loses its corners.
 */
export default function ImagePicker({
  current,
  fallback,
  shape = "round",
  hint,
  busy = false,
  onConfirm,
  onRemove,
}) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(null);

  // The preview is an object URL we made; release it when it is replaced or
  // the picker unmounts, rather than leaking one per file chosen.
  useEffect(() => {
    return () => {
      if (pending?.preview) URL.revokeObjectURL(pending.preview);
    };
  }, [pending]);

  function choose(event) {
    const file = event.target.files?.[0];
    // Cleared straight away: choosing the same file twice in a row fires no
    // change event otherwise.
    event.target.value = "";
    if (file) setPending({ file, preview: URL.createObjectURL(file) });
  }

  const frame = shape === "square" ? "ijp-pick--square" : "ijp-pick--round";

  return (
    <div className="ijp-photo-row">
      {pending ? (
        <span className={`ijp-pick ijp-pick--pending ${frame}`}>
          <img src={pending.preview} alt={t("The image you chose")} />
        </span>
      ) : current ? (
        <span className={`ijp-pick ${frame}`}>
          <img src={current} alt="" />
        </span>
      ) : (
        fallback
      )}

      <div className="ijp-photo-actions">
        {pending ? (
          <>
            <p className="ijp-photo-question mb-1">{t("Use this image?")}</p>
            <p className="ijp-muted small mb-2">
              {t("Nothing changes until you confirm.")}
              <span className="ijp-photo-file">{pending.file.name}</span>
            </p>
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ijp-primary"
                disabled={busy}
                onClick={async () => {
                  await onConfirm(pending.file);
                  setPending(null);
                }}
              >
                <i className="bi bi-check-lg me-1" aria-hidden="true" />
                {busy ? t("Uploading...") : t("Use this image")}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ijp-quiet"
                disabled={busy}
                onClick={() => setPending(null)}
              >
                {t("Choose a different one")}
              </button>
            </div>
          </>
        ) : (
          <>
            {hint ? <p className="ijp-muted small mb-2">{hint}</p> : null}
            <div className="d-flex flex-wrap gap-2">
              <label className="btn btn-sm btn-ijp-primary mb-0">
                <i className="bi bi-upload me-1" aria-hidden="true" />
                {t("Choose an image")}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="d-none"
                  disabled={busy}
                  onChange={choose}
                />
              </label>
              {onRemove ? (
                <button
                  type="button"
                  className="btn btn-sm btn-ijp-quiet"
                  disabled={busy}
                  onClick={onRemove}
                >
                  {t("Remove")}
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
