import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { studentApi } from "../../api/studentApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { timeAgo, exactTime } from "../../api/relativeTime.js";
import SearchBox, { matches } from "../../components/shared/SearchBox.jsx";
import { useLanguage } from "../../config/languageContext.jsx";
import Pagination from "../../components/shared/Pagination.jsx";

/**
 * Everything this student has applied to.
 */
export default function StudentApplicationsPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      const page = await studentApi.listApplications({ size: 200 });
      setRows(page?.content ?? []);
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

  const visible = (rows ?? []).filter((row) => matches(row, query, ["internshipTitle", "companyName", "status"]));

  // Paging and searching both work on the same filtered list, so the
  // page count follows the search rather than ignoring it.
  const PER_PAGE = 15;
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  return (
    <>
      <PageHeader
        title="My applications"
        subtitle="Every internship you have applied to, and where it stands."
        action={
          <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-card p-3 p-md-4">
        <SearchBox
          value={query}
          onChange={(value) => {
              setQuery(value);
              setPage(0);
            }}
          placeholder={t("Search applications")}
          shown={visible.length}
          total={(rows ?? []).length}
        />
        {rows === null ? (
          <LoadingBlock label="Loading your applications..." />
        ) : (
                    <>
            <DataTable
              columns={[
                {
                  key: "internshipTitle",
                  header: "Internship",
                  render: (row) => (
                    <span className="fw-semibold">{row.internshipTitle ?? "—"}</span>
                  ),
                },
                {
                  key: "companyName",
                  header: "Company",
                  render: (row) => row.companyName ?? "—",
                },
                {
                  key: "createdAt",
                  header: "Applied",
                  render: (row) => (
                    <span title={exactTime(row.createdAt)}>{timeAgo(row.createdAt)}</span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge value={row.status} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) =>
                    row.internshipId ? (
                      <div className="d-flex justify-content-end">
                        <Link
                          className="btn btn-sm btn-ijp-quiet"
                          to={`/student/internships/${row.internshipId}`}
                        >
                          View
                          <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                        </Link>
                      </div>
                    ) : null,
                },
              ]}
              rows={pageRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-send",
                title: "You have not applied to anything yet",
                hint: "Browse open internships and apply — your applications appear here.",
              }}
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={visible.length}
              onChange={setPage}
              noun="application"
            />
          </>
        )}
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        Only the employer can change an application's status. You will get a notification
        when one of these moves.
      </p>
    </>
  );
}
