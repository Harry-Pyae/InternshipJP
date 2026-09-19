import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import SearchBox, { matches } from "../../components/shared/SearchBox.jsx";
import { useLanguage } from "../../config/languageContext.jsx";
import Pagination from "../../components/shared/Pagination.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";

/**
 * Every vacancy this employer's company owns.
 */
export default function ManageInternshipsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [internships, setInternships] = useState(null);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await employerApi.listInternships();
      setInternships(data?.content ?? []);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filters what is loaded, not the database. The count beside the box

  // says so - a search that quietly covers less than the user assumes

  // is worse than no search at all.

  const visible = (internships ?? []).filter((row) => matches(row, query, ["title", "location", "status"]));

  // Paging and searching both work on the same filtered list, so the
  // page count follows the search rather than ignoring it.
  const PER_PAGE = 10;
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  return (
    <>
      <PageHeader
        title={t("Manage internships")}
        subtitle={t("Every vacancy your company owns, and where each one stands.")}
        action={
          <Link className="btn btn-ijp-primary btn-sm" to="/employer/internships/new">
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />{t("Post internship")}</Link>
        }
      />

      {notice ? (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      ) : null}

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-card p-3 p-md-4">
        <SearchBox
          value={query}
          onChange={(value) => {
              setQuery(value);
              setPage(0);
            }}
          placeholder={t("Search internships")}
          shown={visible.length}
          total={(internships ?? []).length}
        />
        {internships === null && !error ? (
          <LoadingBlock label={t("Loading your internships...")} />
        ) : (
                    <>
            <DataTable
              columns={[
                {
                  key: "title",
                  header: "Title",
                  render: (row) => (
                    <span className="fw-semibold">{row.title || t("Untitled internship")}</span>
                  ),
                },
                { key: "location", header: "Location", render: (row) => row.location || "—" },
                {
                  key: "workMode",
                  header: "Work mode",
                  render: (row) => t(formatWorkMode(row.workMode)),
                },
                {
                  key: "durationMonths",
                  header: "Duration",
                  render: (row) =>
                    row.durationMonths ? `${row.durationMonths} months` : "—",
                },
                {
                  key: "availablePositions",
                  header: "Positions",
                  render: (row) => (
                    <span className="ijp-data">{row.availablePositions ?? "—"}</span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  // The shared badge, so DRAFT is the same amber here as on the
                  // administrator's queue rather than a grey Bootstrap pill.
                  render: (row) => <StatusBadge value={row.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="d-flex gap-1 justify-content-end">
                      <Link
                        className="btn btn-sm btn-ijp-quiet"
                        to={`/employer/internships/${row.id}/edit`}
                        title={t("Edit this internship")}
                      >
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </Link>
                      {/* Removing a vacancy.
                          What actually happens depends on whether anybody has
                          applied, so the confirmation says which before it
                          does anything rather than after. */}
                      <button
                        type="button"
                        className="btn btn-sm btn-ijp-quiet ijp-btn-danger"
                        onClick={() => setRemoving(row)}
                        title={t("Remove this internship")}
                      >
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                      <Link
                        className="btn btn-sm btn-ijp-quiet"
                        to={`/employer/applications?internshipId=${row.id}`}
                        title={t("View applicants")}
                      >
                        <i className="bi bi-people" aria-hidden="true" />
                      </Link>
                    </div>
                  ),
                },
              ]}
              rows={pageRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-megaphone",
                title: "No internships yet",
                hint: "Post one to start receiving applications. It stays a draft until you publish it.",
              }}
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={visible.length}
              onChange={setPage}
              noun={t("internship")}
            />
          </>
        )}

        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={load}
            disabled={internships === null}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />{t("Refresh")}</button>
        </div>
      </div>

      <p className="ijp-muted small mt-3 mb-0">{t("A draft is not visible to students. Publishing needs your company to be approved by an administrator.")}</p>
      <ConfirmDialog
        open={Boolean(removing)}
        tone="danger"
        title={removing ? t("Remove \"{title}\"?", { title: removing.title }) : ""}
        message={
          removing && (removing.applicationCount ?? 0) > 0
            ? t("Somebody has already applied, so this vacancy will be archived rather than deleted. It leaves your list and stops taking applications, and the applications already sent to it are kept.")
            : t("Nobody has applied to this vacancy, so it will be deleted outright.")
        }
        confirmLabel={t("Remove")}
        busy={busy}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          setBusy(true);
          setError(null);
          try {
            const result = await employerApi.removeInternship(removing.id);
            setNotice(result?.message ?? t("Removed."));
            setRemoving(null);
            await load();
          } catch (requestError) {
            setError(describeApiError(requestError));
          } finally {
            setBusy(false);
          }
        }}
      />

    </>
  );
}

/** The label for a work mode. The enum value is ONSITE, not ON_SITE, so it is mapped rather than reformatted. */
function formatWorkMode(workMode) {
  if (!workMode) {
    return "—";
  }
  return { ONSITE: "On-site", REMOTE: "Remote", HYBRID: "Hybrid" }[workMode] ?? workMode;
}
