import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { accountApi } from "../../api/accountApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { timeAgo, exactTime } from "../../api/relativeTime.js";
import { useLanguage } from "../../config/languageContext.jsx";
import Avatar from "../../components/shared/Avatar.jsx";
import Breakable from "../../components/shared/Breakable.jsx";

/**
 * An administrator's own profile.
 *
 * Administrators had no profile page at all, which mattered more once one
 * administrator could invite another: a colleague appearing in the users table
 * as a name and an email is hard to place, and there was nowhere to add
 * anything that would help.
 *
 * The same fields the users table shows other administrators, so what you fill
 * in here is exactly what a colleague will see of you.
 */
export default function AdminProfilePage() {
  const { t } = useLanguage();
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setAccount(await accountApi.me());
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="What other administrators see of you in the users list."
        action={
          <Link className="btn btn-sm btn-ijp-primary" to="/admin/profile/edit">
            <i className="bi bi-pencil me-1" aria-hidden="true" />
            {t("Edit profile")}
          </Link>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      {/* "&& !error" matters: without it a failed request leaves the spinner
          running for ever underneath the error, because account stays null. The
          student and employer profile pages guard it the same way. */}
      {account === null && !error ? (
        <div className="ijp-card p-4">
          <LoadingBlock label={t("Loading profile...")} />
        </div>
      ) : account ? (
        <>
          {/* The same name-and-photo band the student and employer profiles
              open with. The photo is changed on the edit page: a read-only
              page should not be the one place you can alter the most visible
              thing on it. */}
          <div className="ijp-card p-3 p-md-4 mb-4">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <Avatar name={account.fullName} userId={account.id} size="lg" />
              <div style={{ minWidth: 0 }}>
                <p className="h5 mb-1">{account.fullName}</p>
                <p className="ijp-muted mb-0">
                  <Breakable text={account.email} />
                </p>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12">
              <SectionCard title="Details">
                <dl className="ijp-detail-grid ijp-detail mb-0">
                  <div>
                    <dt>{t("Name")}</dt>
                    <dd>
                      {account.fullName || (
                        <span className="ijp-muted">{t("Not set")}</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Email")}</dt>
                    <dd className="ijp-data"><Breakable text={account.email} /></dd>
                  </div>
                  <div>
                    <dt>{t("Phone")}</dt>
                    {/* "Not set", the same words the student and employer
                        profiles use for a gap. Three pages saying "Not given",
                        "Not set" and nothing at all for one situation is three
                        things for a reader to learn. */}
                    <dd>
                      {account.phone || <span className="ijp-muted">{t("Not set")}</span>}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Role")}</dt>
                    <dd>{t(account.role)}</dd>
                  </div>
                  <div>
                    <dt>{t("Status")}</dt>
                    <dd>
                      <StatusBadge value={account.accountStatus} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Last login")}</dt>
                    <dd>
                      {account.lastLoginAt ? (
                        <span title={exactTime(account.lastLoginAt)}>
                          {timeAgo(account.lastLoginAt)}
                        </span>
                      ) : (
                        <span className="ijp-muted">{t("Never signed in")}</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </SectionCard>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
