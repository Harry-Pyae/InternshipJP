import { useCallback, useEffect, useState } from "react";

import SectionCard from "../../../components/shared/SectionCard.jsx";
import Select from "../../../components/shared/Select.jsx";
import ConfirmDialog from "../../../components/shared/ConfirmDialog.jsx";
import ErrorAlert from "../../../components/shared/ErrorAlert.jsx";

import { adminApi } from "../../../api/adminApi.js";
import { describeApiError } from "../../../api/axiosClient.js";
import { useLanguage } from "../../../config/languageContext.jsx";

/**
 * Taking a copy of the platform's data, and reclaiming the space old records
 * hold. Administrator only, and the only screen either operation is on.
 *
 * WHY THE TWO SIT TOGETHER
 *   Compacting is only a reasonable thing to offer somebody who can take a
 *   backup first. Putting the download anywhere else would mean an
 *   administrator reading about deletion with no idea a copy was available.
 *
 * WHAT COMPACTION REMOVES is decided on the server, in DataMaintenanceService.
 * This screen never sends a list of tables; it sends a number of days. The
 * counts shown come from the same code that does the deleting, so the figure
 * on the confirmation is the figure that will go.
 */

/** The windows the screen offers. The server accepts 30 to 3650. */
const RETENTION_CHOICES = [30, 90, 180, 365];
const DEFAULT_RETENTION = 90;

export default function DataMaintenanceCard() {
  const { t } = useLanguage();

  const [days, setDays] = useState(String(DEFAULT_RETENTION));
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [compacting, setCompacting] = useState(false);

  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const loadPreview = useCallback(async () => {
    setPreviewing(true);
    setError("");
    try {
      setPreview(await adminApi.previewCompaction(Number(days)));
    } catch (requestError) {
      setError(describeApiError(requestError));
      // Cleared rather than left showing the previous window's counts, which
      // would be a number the administrator could act on and that no longer
      // describes anything.
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }, [days]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  async function download() {
    setDownloading(true);
    setError("");
    setDone("");
    try {
      const response = await adminApi.exportData();
      saveBlob(response.data, fileNameFrom(response));
      setDone("The backup was downloaded.");
    } catch (requestError) {
      setError(await describeBlobError(requestError));
    } finally {
      setDownloading(false);
    }
  }

  async function compact() {
    setCompacting(true);
    setError("");
    setDone("");
    try {
      const result = await adminApi.compactData(Number(days));
      setConfirming(false);
      setDone(
        result.totalRows > 0
          ? t("{n} row(s) were removed.", { n: result.totalRows })
          : "There was nothing to remove.",
      );
      // The counts on screen describe a database that no longer exists, so
      // they are refetched rather than zeroed by hand.
      await loadPreview();
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setCompacting(false);
    }
  }

  const rows = preview
    ? [
        { label: "Spent sign-in codes", value: preview.expiredOtpChallenges },
        { label: "AI usage log entries", value: preview.aiUsageLogs },
        { label: "Read notifications", value: preview.readNotifications },
        { label: "AI conversations", value: preview.aiConversations },
        { label: "AI messages", value: preview.aiMessages },
      ]
    : [];

  const nothingToRemove = preview != null && preview.totalRows === 0;

  return (
    <SectionCard title={t("Platform data")}>
      <ErrorAlert message={error} />
      {done ? (
        <div className="alert alert-success" role="status">
          <i className="bi bi-check2-circle me-2" aria-hidden="true" />
          {t(done)}
        </div>
      ) : null}

      <div className="row g-4">
        {/* ---------------------------------------------------------- BACKUP */}
        <div className="col-12 col-xl-6">
          <div className="ijp-card-sunken p-3 h-100 d-flex flex-column">
            <p className="ijp-label mb-2">
              <i className="bi bi-download me-2" aria-hidden="true" />
              {t("Download a backup")}
            </p>
            <p className="ijp-muted small mb-2">
              {t("Every table, every row, as one JSON file. Tables are written parents first, so the file can be loaded back in the order it gives without breaking a foreign key.")}
            </p>
            <p className="ijp-field-hint mb-3">
              {t("It contains accounts and password hashes. Keep it somewhere only administrators can reach, the same as the database itself.")}
            </p>
            <div className="mt-auto">
              <button
                type="button"
                className="btn btn-ijp-primary"
                onClick={download}
                disabled={downloading}
              >
                <i className="bi bi-download me-1" aria-hidden="true" />
                {t(downloading ? "Preparing..." : "Download data")}
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------- COMPACTION */}
        <div className="col-12 col-xl-6">
          <div className="ijp-card-sunken p-3 h-100 d-flex flex-column">
            <p className="ijp-label mb-2">
              <i className="bi bi-archive me-2" aria-hidden="true" />
              {t("Compact old data")}
            </p>
            <p className="ijp-muted small mb-3">
              {t("Frees space by removing spent sign-in codes, old AI telemetry, notifications already read, and AI chat threads nobody has touched. Accounts, companies, internships, applications and certificates are never touched.")}
            </p>

            {/* Select draws its own control and takes no id, so the label is
                not bound with htmlFor; ariaLabel names it instead. */}
            <p className="ijp-label mb-2">{t("Keep history for")}</p>
            <Select
              className="mb-3"
              value={days}
              onChange={setDays}
              ariaLabel={t("Keep history for")}
              disabled={compacting}
              groups={[
                {
                  label: null,
                  items: RETENTION_CHOICES.map((choice) => ({
                    value: String(choice),
                    label: t("{n} days", { n: choice }),
                  })),
                },
              ]}
            />

            {previewing && !preview ? (
              <p className="ijp-muted small mb-3">{t("Counting...")}</p>
            ) : preview ? (
              <div className="mb-3">
                {rows.map((row) => (
                  <div className="ijp-mini-row" key={row.label}>
                    <span className="ijp-mini-label">{t(row.label)}</span>
                    <span className="ijp-mini-value">{row.value}</span>
                  </div>
                ))}
                <div className="ijp-mini-row">
                  <span className="ijp-mini-label fw-semibold">{t("Rows that would go")}</span>
                  <span className="ijp-mini-value">{preview.totalRows}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-auto">
              <button
                type="button"
                className="btn btn-ijp-quiet ijp-btn-danger"
                onClick={() => setConfirming(true)}
                // !preview covers a failed count. Without it the button stayed
                // live with nothing on screen, and the confirmation offered to
                // remove "0 rows" - a number nobody had any reason to trust.
                disabled={compacting || previewing || !preview || nothingToRemove}
              >
                <i className="bi bi-archive me-1" aria-hidden="true" />
                {t("Compact now")}
              </button>
              {nothingToRemove ? (
                <p className="ijp-field-hint mb-0 mt-2">
                  {t("Nothing is old enough to remove yet.")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Compact the database?"
        message={t("{n} row(s) will be removed and cannot be recovered without a backup.", {
          n: preview?.totalRows ?? 0,
        })}
        note="Download a backup first if you have not taken one today."
        confirmWord="COMPACT"
        confirmLabel="Compact now"
        busy={compacting}
        onConfirm={compact}
        onCancel={() => setConfirming(false)}
      />
    </SectionCard>
  );
}

/**
 * The filename the server chose, or a sensible one if it did not reach us.
 *
 * Content-Disposition is only readable across origins because SecurityConfig
 * lists it under exposed headers. In development React is on :5173 and Spring
 * on :8080, so without that line this would always fall through to the
 * default - which is why the fallback is a real filename and not "download".
 */
function fileNameFrom(response) {
  const header = response?.headers?.["content-disposition"] ?? "";
  const match = /filename="?([^";]+)"?/i.exec(header);
  if (match) {
    return match[1];
  }
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return `internshipjp-backup-${stamp}.json`;
}

/** Hands a blob to the browser as a file, and cleans up after itself. */
function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick, not immediately: Firefox cancels a download
  // whose object URL is released in the same frame as the click.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * The message from a failed request that asked for a blob.
 *
 * With responseType "blob" the ERROR body is a Blob too, so the usual handling
 * finds no .message on it and falls back to "could not reach the backend" -
 * which sends you looking for a server that is running. Same problem, and the
 * same fix, as FilePreview.
 */
async function describeBlobError(requestError) {
  const body = requestError?.response?.data;
  if (body instanceof Blob) {
    try {
      const parsed = JSON.parse(await body.text());
      return parsed.message || parsed.error || describeApiError(requestError);
    } catch {
      return "The backup could not be built. Check the backend log for the reason.";
    }
  }
  return describeApiError(requestError);
}
