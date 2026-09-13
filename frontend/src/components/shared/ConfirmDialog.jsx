import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * A confirmation the product draws itself.
 *
 * `window.confirm` and `window.prompt` are drawn by the operating system, so
 * no stylesheet reaches them: they arrive in a different typeface, ignore the
 * dark theme, and cannot show a reason field alongside the question. They also
 * block the whole tab, which is why a mistyped reason cannot be corrected
 * without starting again.
 *
 * Set `requireReason` and the action stays disabled until something is typed.
 * Set `confirmWord` and the user must type that word exactly - used for
 * deletion, where a dialog dismissed by reflex is not a decision.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  note,
  tone = "danger",
  confirmLabel,
  requireReason = false,
  reasonLabel,
  reasonHint,
  confirmWord,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const firstFieldRef = useRef(null);

  // Reset between openings, or the previous reason is still sitting there the
  // next time somebody is suspended.
  useEffect(() => {
    if (open) {
      setReason("");
      setTyped("");
      const id = window.setTimeout(() => firstFieldRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Escape closes it. A dialog you cannot dismiss from the keyboard is a trap.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const reasonReady = !requireReason || reason.trim().length > 0;
  const wordReady = !confirmWord || typed.trim().toUpperCase() === confirmWord.toUpperCase();
  const ready = reasonReady && wordReady && !busy;

  return (
    <div className="ijp-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ijp-modal-card ijp-confirm">
        <div className={`ijp-confirm-head ijp-confirm-head--${tone}`}>
          <span className="ijp-confirm-icon" aria-hidden="true">
            <i className={`bi ${tone === "danger" ? "bi-exclamation-octagon" : "bi-question-circle"}`} />
          </span>
          <h2 className="ijp-confirm-title">{title}</h2>
        </div>

        <p className="ijp-confirm-message">{message}</p>
        {note ? <p className="ijp-confirm-note">{note}</p> : null}

        {requireReason ? (
          <div className="ijp-confirm-field">
            <label className="form-label" htmlFor="confirmReason">
              {reasonLabel ?? t("Reason")}
            </label>
            <textarea
              id="confirmReason"
              ref={firstFieldRef}
              className="form-control"
              rows="3"
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            {reasonHint ? <p className="ijp-field-note">{reasonHint}</p> : null}
          </div>
        ) : null}

        {confirmWord ? (
          <div className="ijp-confirm-field">
            <label className="form-label" htmlFor="confirmWord">
              {t("Type {word} to confirm", { word: confirmWord })}
            </label>
            <input
              id="confirmWord"
              ref={requireReason ? undefined : firstFieldRef}
              className="form-control"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={confirmWord}
              autoComplete="off"
            />
          </div>
        ) : null}

        <div className="ijp-confirm-actions">
          <button type="button" className="btn btn-ijp-quiet" onClick={onCancel} disabled={busy}>
            {t("Cancel")}
          </button>
          <button
            type="button"
            className={`btn ${tone === "danger" ? "btn-ijp-quiet ijp-btn-danger" : "btn-ijp-primary"}`}
            onClick={() => onConfirm(reason.trim())}
            disabled={!ready}
          >
            {busy ? t("Working...") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
