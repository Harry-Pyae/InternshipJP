import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import FilePreview from "./components/FilePreview.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { appConfig } from "../../config/appConfig.js";

/**
 * Reviewing one certificate.
 */
export default function AdminCertificateReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setCertificate(await adminApi.getCertificate(id));
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(status) {
    if (status === "REJECTED" && !note.trim()) {
      setError("Please write a note explaining the rejection. The student sees it.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminApi.verifyCertificate(id, status, note.trim());
      navigate("/admin/certificates", { replace: true });
    } catch (requestError) {
      setError(describeApiError(requestError));
      setBusy(false);
    }
  }

  if (certificate === null && !error) {
    return <LoadingBlock label="Loading the certificate..." />;
  }

  const decided = certificate && certificate.verificationStatus !== "PENDING";
  const directUrl = `${appConfig.apiBaseUrl}/api/certificates/${id}/file`;

  return (
    <>
      <PageHeader
        title={certificate?.title ?? "Certificate"}
        subtitle={
          certificate?.studentName
            ? `Uploaded by ${certificate.studentName}`
            : "Uploaded certificate"
        }
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/admin/certificates">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            Back to queue
          </Link>
        }
      />

      <ErrorAlert message={error} />

      {certificate ? (
        <>
          {/* Facts first, in one line, so they do not compete with the
              document for a whole column. */}
          <div className="ijp-fact-strip">
            <Fact label="Status">
              <StatusBadge value={certificate.verificationStatus} />
            </Fact>
            <Fact label="Student">{certificate.studentName || "Unknown"}</Fact>
            <Fact label="Issuer">{certificate.issuingOrganization || "Not given"}</Fact>
            <Fact label="Issue date">{certificate.issueDate || "Not given"}</Fact>
            <Fact label="Uploaded">
              {certificate.createdAt?.replace("T", " ").slice(0, 16) || "—"}
            </Fact>
            <Fact label="Size">{formatSize(certificate.fileSize)}</Fact>
          </div>

          <div className="ijp-review-layout">
            <div className="ijp-card p-3 p-md-4">
              <FilePreview
                certificateId={certificate.id}
                fileName={certificate.originalFileName}
                mimeType={certificate.mimeType}
                directUrl={directUrl}
              />
            </div>

            <div className="ijp-review-side">
              {decided ? (
                <div className="ijp-callout">
                  <i className="bi bi-info-circle ijp-callout-icon" aria-hidden="true" />
                  <p className="mb-0">
                    Already reviewed. The decision cannot be changed from here.
                  </p>
                </div>
              ) : (
                <div className="ijp-card p-3 p-md-4">
                  <p className="ijp-label mb-2">Decision</p>
                  <label className="ijp-field-label" htmlFor="reviewNote">
                    Review note
                  </label>
                  <textarea
                    id="reviewNote"
                    className="form-control mb-2"
                    rows={4}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Required when rejecting. The student sees this."
                  />
                  <p className="ijp-field-hint mb-3">
                    Verifying makes this visible to employers who receive an application
                    from this student.
                  </p>

                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-ijp-primary"
                      onClick={() => decide("VERIFIED")}
                      disabled={busy}
                    >
                      <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                      {busy ? "Saving..." : "Verify certificate"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ijp-quiet ijp-btn-danger"
                      onClick={() => decide("REJECTED")}
                      disabled={busy}
                    >
                      <i className="bi bi-x-circle me-1" aria-hidden="true" />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function Fact({ label, children }) {
  return (
    <div className="ijp-fact">
      <span className="ijp-fact-label">{label}</span>
      <span className="ijp-fact-value">{children}</span>
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
