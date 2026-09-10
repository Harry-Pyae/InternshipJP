import { Link } from "react-router-dom";
import StatusBadge from "../../../components/shared/StatusBadge.jsx";
import { useLanguage } from "../../../config/languageContext.jsx";

/**
 * Everything known about one account, and every action, in one place.
 *
 * The table truncates and spreads actions across a row. This gathers them so
 * an administrator deciding what to do about someone can see who they are
 * while deciding.
 *
 * ROLE IS SHOWN, NOT EDITED - deliberately. A student has a student_profiles
 * row keyed uniquely to their user id, and an employer has an employer_profiles
 * row pointing at a company. Switching the role would leave the old profile
 * orphaned and the new one absent, and every page for the new role would fail
 * on a profile that is not there. Correcting a wrong role means deleting the
 * account and registering again, which is what the note says.
 */
export default function UserDetailModal({ user, busy, onClose, onToggle, onDelete }) {
  const { t } = useLanguage();
  if (!user) {
    return null;
  }

  const suspended = user.accountStatus === "SUSPENDED";

  return (
    <div className="ijp-modal" role="dialog" aria-modal="true" aria-label={t("Account details")}>
      <div className="ijp-modal-card">
        <div className="ijp-modal-head">
          <div style={{ minWidth: 0 }}>
            <p className="h6 mb-1 text-truncate">{user.fullName || t("Unnamed account")}</p>
            <p className="ijp-muted small mb-0 text-truncate">{user.email}</p>
          </div>
          <button
            type="button"
            className="ijp-icon-btn"
            onClick={onClose}
            aria-label={t("Close")}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3 p-md-4">
          <dl className="ijp-detail-grid ijp-detail mb-4">
            <div>
              <dt>{t("Status")}</dt>
              <dd><StatusBadge value={user.accountStatus} /></dd>
            </div>
            <div>
              <dt>{t("Role")}</dt>
              <dd>{t(user.role)}</dd>
            </div>
            <div>
              <dt>{t("Email")}</dt>
              <dd className="ijp-data">{user.email}</dd>
            </div>
            <div>
              <dt>{t("Registered")}</dt>
              <dd className="ijp-data">
                {user.createdAt?.replace("T", " ").slice(0, 16) || "—"}
              </dd>
            </div>
            <div>
              <dt>{t("Last login")}</dt>
              <dd className="ijp-data">
                {user.lastLoginAt?.replace("T", " ").slice(0, 16) || t("Never signed in")}
              </dd>
            </div>
            <div>
              <dt>{t("Account ID")}</dt>
              <dd className="ijp-data">{user.id}</dd>
            </div>
          </dl>

          {/* Where the rest of this person's records live. */}
          {user.role === "EMPLOYER" ? (
            <Link className="btn btn-sm btn-ijp-quiet mb-4" to="/admin/employers">
              <i className="bi bi-building me-1" aria-hidden="true" />
              {t("Companies")}
            </Link>
          ) : null}
          {user.role === "STUDENT" ? (
            <Link className="btn btn-sm btn-ijp-quiet mb-4" to="/admin/certificates">
              <i className="bi bi-patch-check me-1" aria-hidden="true" />
              {t("Certificate review")}
            </Link>
          ) : null}

          <p className="ijp-label mb-2">{t("Actions")}</p>
          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn btn-ijp-quiet"
              onClick={() => onToggle(user)}
              disabled={busy}
            >
              <i
                className={`bi ${suspended ? "bi-play-circle" : "bi-pause-circle"} me-1`}
                aria-hidden="true"
              />
              {suspended ? t("Reactivate account") : t("Suspend account")}
            </button>

            <button
              type="button"
              className="btn btn-ijp-quiet ijp-btn-danger"
              onClick={() => onDelete(user)}
              disabled={busy}
            >
              <i className="bi bi-trash me-1" aria-hidden="true" />
              {t("Delete account")}
            </button>
          </div>

          <p className="ijp-field-hint mt-3 mb-0">
            {t("Suspending is reversible and keeps the person's records. Deleting is permanent.")}
          </p>
          <p className="ijp-field-hint mt-2 mb-0">
            {t("A role cannot be changed after registration: the profile and its records are tied to it. Delete the account and register again instead.")}
          </p>
        </div>
      </div>
    </div>
  );
}
