import { useLanguage } from "../../../config/languageContext.jsx";

/**
 * Suspend or reactivate, as an icon.
 *
 * The word used to sit in the table and wrapped to "Suspen / d" whenever the
 * column narrowed. Three icon buttons in a row also read as one group of
 * actions rather than a sentence competing with the data beside it - the label
 * is still there as a tooltip and for screen readers.
 *
 * Administrator accounts are deliberately not changeable here: an
 * administrator suspending the last administrator locks everyone out, and the
 * server refuses it too.
 */
export default function StatusToggle({ user, busy, onToggle }) {
  const { t } = useLanguage();
  const suspended = user.accountStatus === "SUSPENDED";
  const isAdmin = user.role === "ADMIN";

  const label = isAdmin
    ? t("Administrator accounts cannot be changed from this screen.")
    : suspended
      ? t("Reactivate account")
      : t("Suspend account");

  return (
    <button
      type="button"
      className={`btn btn-sm ${suspended ? "btn-ijp-primary" : "btn-ijp-quiet"}`}
      disabled={busy || isAdmin}
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(user);
      }}
    >
      <i
        className={`bi ${busy ? "bi-hourglass-split" : suspended ? "bi-play-circle" : "bi-pause-circle"}`}
        aria-hidden="true"
      />
    </button>
  );
}
