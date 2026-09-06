import { useState } from "react";
import StatusBadge from "../../../components/shared/StatusBadge.jsx";
import FilePreview from "./FilePreview.jsx";

export default function CertificateReviewPanel({ certificate, busy, onDecision, onClose }) {
  const [note, setNote] = useState("");

  if (!certificate) return null;

  return (
    <div className="ijp-card p-4 mt-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="ijp-label mb-1">Certificate review</p>
          <h2 className="h4 mb-1">{certificate.title}</h2>
          <p className="ijp-muted mb-0">
            Uploaded by <strong>{certificate.studentName || "Student information unavailable"}</strong>
          </p>
        </div>
        <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="row g-3 mb-4">
        <Info label="Issuer" value={certificate.issuingOrganization} />
        <Info label="Issue date" value={certificate.issueDate} />
        <Info label="Status" value={<StatusBadge value={certificate.verificationStatus} />} />
        <Info label="Uploaded" value={formatDate(certificate.createdAt)} />
        <Info label="File" value={certificate.originalFileName} />
        <Info label="Size" value={formatBytes(certificate.fileSize)} />
      </div>

      <FilePreview
        certificateId={certificate.id}
        fileName={certificate.originalFileName}
        mimeType={certificate.mimeType}
      />

      <hr className="my-4" />

      <div>
        <label className="ijp-label mb-2" htmlFor="certificate-review-note">
          Review note
        </label>
        <textarea
          id="certificate-review-note"
          className="form-control"
          rows="3"
          maxLength="500"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Explain your decision, especially when rejecting a certificate."
        />
      </div>

      <div className="d-flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          className="btn btn-ijp-primary"
          disabled={busy}
          onClick={() => onDecision("VERIFIED", note)}
        >
          <i className="bi bi-check2-circle me-1" aria-hidden="true" />
          {busy ? "Saving..." : "Verify certificate"}
        </button>
        <button
          type="button"
          className="btn btn-ijp-quiet"
          disabled={busy}
          onClick={() => onDecision("REJECTED", note)}
        >
          <i className="bi bi-x-circle me-1" aria-hidden="true" />
          Reject certificate
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="col-12 col-md-6 col-xl-4">
      <div className="ijp-card-sunken p-3 h-100">
        <p className="ijp-label mb-1">{label}</p>
        <div className="small">{value || "—"}</div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatBytes(value) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
