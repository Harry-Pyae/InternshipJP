import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, describeApiError } from "../../api/axiosClient.js";
import { useAuth } from "../../config/authContext.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";

/**
 * Where an employer lands until an administrator approves their company.
 */
export default function PendingApprovalPage() {
  const { user, signOut, refresh } = useAuth();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api
      .get("/api/employer/company")
      .then((response) => setCompany(response.data))
      .catch((requestError) => setError(describeApiError(requestError)));
  }, []);

  /** Re-reads the account, in case an admin approved it while this was open. */
  async function checkAgain() {
    setChecking(true);
    setError(null);
    try {
      const [{ data }] = await Promise.all([api.get("/api/employer/company"), refresh()]);
      setCompany(data);
      if (data.approvalStatus === "APPROVED") {
        navigate("/employer/dashboard", { replace: true });
      }
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setChecking(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/auth/login", { replace: true });
  }

  const status = company?.approvalStatus ?? "PENDING";
  const rejected = status === "REJECTED";
  const needsInfo = status === "MORE_INFO_REQUIRED";

  return (
    <div className="ijp-auth-screen">
      <div className="ijp-card ijp-pending">
        <span
          className={`ijp-placeholder-icon ijp-pending-icon--${
            rejected ? "bad" : needsInfo ? "warn" : "pending"
          }`}
          aria-hidden="true"
        >
          <i className={`bi ${rejected ? "bi-x-octagon" : "bi-hourglass-split"}`} />
        </span>

        <h1 className="ijp-auth-title">
          {rejected
            ? "Your company was not approved"
            : needsInfo
              ? "An administrator needs more information"
              : "Waiting for approval"}
        </h1>

        {company === null && !error ? (
          <LoadingBlock label="Checking your company's status..." />
        ) : (
          <>
            <p className="ijp-muted">
              {rejected ? (
                <>
                  An administrator reviewed <strong>{company?.name}</strong> and did not approve
                  it. Nothing you publish will be visible to students.
                </>
              ) : needsInfo ? (
                <>
                  An administrator has asked for more detail about{" "}
                  <strong>{company?.name}</strong> before approving it.
                </>
              ) : (
                <>
                  <strong>{company?.name ?? "Your company"}</strong> is waiting for an
                  administrator to review it. You can sign in, but your internships stay
                  hidden from students until it is approved.
                </>
              )}
            </p>

            {company?.approvalNote ? (
              <div className="ijp-pending-note">
                <span className="ijp-label d-block mb-1">Note from the administrator</span>
                {company.approvalNote}
              </div>
            ) : null}

            <dl className="ijp-pending-facts">
              <div>
                <dt>Account</dt>
                <dd className="ijp-data">{user?.email}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{company?.name ?? "-"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    className={`ijp-badge ijp-badge--${
                      rejected ? "bad" : needsInfo ? "warn" : "warn"
                    }`}
                  >
                    {status.toLowerCase().replace(/_/g, " ")}
                  </span>
                </dd>
              </div>
            </dl>
          </>
        )}

        {error ? (
          <div className="ijp-auth-error" role="alert">
            <i className="bi bi-exclamation-octagon" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
          <button
            type="button"
            className="btn btn-ijp-primary"
            onClick={checkAgain}
            disabled={checking}
          >
            {checking ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Checking...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
                Check again
              </>
            )}
          </button>
          <button type="button" className="btn btn-ijp-quiet" onClick={handleSignOut}>
            <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
