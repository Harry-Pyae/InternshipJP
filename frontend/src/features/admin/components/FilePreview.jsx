import { useEffect, useState } from "react";
import LoadingBlock from "../../../components/shared/LoadingBlock.jsx";
import { adminApi } from "../../../api/adminApi.js";
import { describeApiError } from "../../../api/axiosClient.js";

/**
 * Shows an uploaded certificate.
 */
export default function FilePreview({ certificateId, fileName, mimeType, directUrl }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await adminApi.getCertificateFile(certificateId);
        const typed = new Blob([response.data], {
          type: mimeType || response.data?.type || "application/octet-stream",
        });
        objectUrl = URL.createObjectURL(typed);
        if (!cancelled) {
          setUrl(objectUrl);
        }
      } catch (requestError) {
        // With responseType "blob" the ERROR body is a Blob too, so the usual
        // handling finds no .message on it and falls back to "could not reach
        // the backend" - which sends you looking for a server that is running.
        let message = describeApiError(requestError);
        const body = requestError?.response?.data;
        if (body instanceof Blob) {
          try {
            const parsed = JSON.parse(await body.text());
            message = parsed.message || parsed.error || message;
          } catch {
            message = "The stored file could not be read. It may have been moved or deleted.";
          }
        } else if (!requestError?.response) {
          // Everything else on this page loaded, so blaming the whole backend
          // would be misleading. Only this request failed.
          message = "The file could not be loaded. It may be missing from the server's storage.";
        }
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [certificateId, mimeType]);

  const isPdf = mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");
  const isImage = mimeType?.startsWith("image/");

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div style={{ minWidth: 0 }}>
          <p className="ijp-label mb-1">Uploaded file</p>
          <p className="small mb-0 text-truncate" title={fileName}>
            {fileName || "Certificate file"}
          </p>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          {/* Points at the endpoint, not a blob. A top-level navigation DOES
              carry the SameSite=Lax session cookie, which an iframe does not -
              so this can work even when the embedded preview cannot. */}
          {directUrl ? (
            <a
              className="btn btn-sm btn-ijp-quiet"
              href={directUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
              Open in a tab
            </a>
          ) : null}
          {url ? (
            <a className="btn btn-sm btn-ijp-quiet" href={url} download={fileName}>
              <i className="bi bi-download me-1" aria-hidden="true" />
              Download
            </a>
          ) : null}
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Opening the certificate..." />
      ) : error ? (
        <div className="ijp-file-fallback">
          <i className="bi bi-file-earmark-x" aria-hidden="true" />
          <p className="fw-semibold mb-1">Cannot show this file here</p>
          <p className="ijp-muted small mb-0">{error}</p>
        </div>
      ) : isPdf ? (
        <iframe className="ijp-file-frame" title={fileName || "Certificate"} src={url} />
      ) : isImage ? (
        <img className="ijp-file-image" alt={fileName || "Certificate"} src={url} />
      ) : (
        <div className="ijp-file-fallback">
          <i className="bi bi-file-earmark-arrow-down" aria-hidden="true" />
          <p className="fw-semibold mb-1">No preview for this file type</p>
          <p className="ijp-muted small mb-0">Download it to check the qualification.</p>
        </div>
      )}
    </>
  );
}
