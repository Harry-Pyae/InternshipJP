import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import Pagination from "../../components/shared/Pagination.jsx";
import { studentApi } from "../../api/studentApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { timeAgo, exactTime } from "../../api/relativeTime.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Uploading qualifications, and seeing whether they have been verified.
 */
export default function StudentCertificatesPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const fileInput = useRef(null);
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState(null);

  // Paged in the browser rather than the server: a student has a handful of
  // certificates, so fetching them all once and slicing is fewer requests and
  // keeps the pending count above accurate across pages.
  const PER_PAGE = 5;

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await studentApi.getCertificates();
      const body = response?.data ?? response;
      setRows(Array.isArray(body) ? body : (body?.content ?? []));
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(event) {
    event.preventDefault();
    if (!title.trim() || !file) {
      setError("Give the certificate a name and choose a file.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone("");
    try {
      // The endpoint takes TWO named parts, not loose form fields:
      //   metadata - JSON matching CertificateUploadRequest
      //   file     - the document itself
      //
      // Sending "title" as a plain field left "metadata" missing, which is why
      // the server returned an error rather than saving anything. The Blob
      // wrapper is what makes the browser label that part application/json;
      // a plain string would arrive as text/plain and fail to bind.
      const metadata = new Blob([JSON.stringify({ title: title.trim() })], {
        type: "application/json",
      });
      const form = new FormData();
      form.append("metadata", metadata);
      form.append("file", file);
      await studentApi.uploadCertificate(form);
      setTitle("");
      setFile(null);
      if (fileInput.current) {
        fileInput.current.value = "";
      }
      setDone("Uploaded. An administrator will review it before employers can see it.");
      setPage(0);
      await load();
    } catch (requestError) {
      const status = requestError?.response?.status;
      setError(
        status === 413
          ? "That file is larger than the 5 MB limit."
          : describeApiError(requestError),
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await studentApi.deleteCertificate(row.id);
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }

  /**
   * Opens the certificate in a modal rather than a new tab.
   *
   * window.open() on a blob URL makes Chrome DOWNLOAD a PDF instead of showing
   * it - which is what was happening. An iframe renders the same blob inline,
   * and Download stays an explicit choice rather than a side effect of looking.
   */
  async function view(row) {
    setError(null);
    try {
      const response = await studentApi.getCertificateFile(row.id);
      const typed = new Blob([response.data], {
        type: row.mimeType || response.data?.type || "application/pdf",
      });
      setPreview({ url: URL.createObjectURL(typed), row });
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }

  function closePreview() {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  }

  const pending = rows?.filter((row) => row.verificationStatus === "PENDING").length ?? 0;
  const pageCount = rows ? Math.max(1, Math.ceil(rows.length / PER_PAGE)) : 1;
  const shown = useMemo(
    () => (rows ?? []).slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE),
    [rows, page],
  );

  return (
    <>
      <PageHeader
        title="Certificates"
        subtitle="Upload a qualification, and an administrator verifies it before employers see it."
      />

      <ErrorAlert message={error} />

      {pending > 0 ? (
        <div className="ijp-callout ijp-callout--warn">
          <i className="bi bi-hourglass-split ijp-callout-icon" aria-hidden="true" />
          <p className="mb-0">
            {t("{n} certificate(s) are waiting to be reviewed. Until then they are not visible to employers.", { n: pending })}
          </p>
        </div>
      ) : null}

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <SectionCard title="Upload a certificate">
            <form onSubmit={upload} className="d-grid gap-3">
              <div>
                <label className="ijp-field-label" htmlFor="certTitle">{t("Certificate name")}</label>
                <input
                  id="certTitle"
                  className="form-control"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Oracle Java Foundations"
                />
              </div>

              <div>
                <label className="ijp-field-label" htmlFor="certFile">{t("Certificate file")}</label>
                {/* The native file input renders as an unstyleable grey button,
                    so it is hidden and a real one triggers it. */}
                <input
                  id="certFile"
                  ref={fileInput}
                  type="file"
                  className="visually-hidden"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-ijp-quiet btn-sm flex-shrink-0"
                    onClick={() => fileInput.current?.click()}
                  >
                    <i className="bi bi-paperclip me-1" aria-hidden="true" />{t("Choose file")}</button>
                  <span className={`small text-truncate ${file ? "" : "ijp-muted"}`}>
                    {file ? file.name : t("No file chosen")}
                  </span>
                </div>
                <p className="ijp-field-hint">{t("PDF, PNG or JPG.")}</p>
              </div>

              <button className="btn btn-ijp-primary" type="submit" disabled={busy}>
                {busy ? "Uploading..." : "Upload certificate"}
              </button>

              {done ? (
                <p className="ijp-state--ok small mb-0">
                  <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                  {done}
                </p>
              ) : null}
            </form>
          </SectionCard>
        </div>

        <div className="col-12 col-xl-7">
          <SectionCard title="My certificates">
            {rows === null ? (
              <LoadingBlock label={t("Loading your certificates...")} />
            ) : (
              <DataTable
                columns={[
                  {
                    key: "title",
                    header: "Certificate",
                    render: (row) => <span className="fw-semibold">{row.title}</span>,
                  },
                  {
                    key: "verificationStatus",
                    header: "Status",
                    render: (row) => <StatusBadge value={row.verificationStatus} />,
                  },
                  {
                    key: "createdAt",
                    header: "Uploaded",
                    render: (row) => (
                      <span title={exactTime(row.createdAt)}>{timeAgo(row.createdAt)}</span>
                    ),
                  },
                  {
                    key: "actions",
                    header: "",
                    render: (row) => (
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-ijp-quiet"
                          onClick={() => view(row)}
                          title="Open the uploaded file"
                        >
                          <i className="bi bi-eye" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ijp-quiet ijp-btn-danger"
                          onClick={() => remove(row)}
                          title="Delete this certificate"
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </div>
                    ),
                  },
                ]}
                rows={shown}
                rowKey={(row) => row.id}
                empty={{
                  icon: "bi-patch-check",
                  title: "No certificates yet",
                  hint: "Upload one and it goes to an administrator for verification.",
                }}
              />
            )}

            <Pagination
              page={page}
              pageCount={pageCount}
              total={rows?.length}
              onChange={setPage}
              noun="certificate"
            />
          </SectionCard>
        </div>
      </div>

      {preview ? (
        <div className="ijp-modal" role="dialog" aria-modal="true" aria-label="Certificate preview">
          <div className="ijp-modal-card">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <p className="fw-semibold mb-0 text-truncate">{preview.row.title}</p>
              <div className="d-flex gap-2 flex-shrink-0">
                <a
                  className="btn btn-sm btn-ijp-quiet"
                  href={preview.url}
                  download={preview.row.originalFileName || preview.row.title}
                >
                  <i className="bi bi-download me-1" aria-hidden="true" />{t("Download")}</a>
                <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={closePreview}>{t("Close")}</button>
              </div>
            </div>
            <iframe className="ijp-file-frame" title={preview.row.title} src={preview.url} />
          </div>
        </div>
      ) : null}

      <p className="ijp-muted small mt-4 mb-0">
        A rejected certificate comes back with a note explaining why, so you can correct it
        and upload again.
      </p>
    </>
  );
}
