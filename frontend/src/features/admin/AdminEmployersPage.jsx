import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import SearchBox, { matches } from "../../components/shared/SearchBox.jsx";
import { useLanguage } from "../../config/languageContext.jsx";
import Pagination from "../../components/shared/Pagination.jsx";

/**
 * Companies waiting for approval.
 *
 * Same change as the certificate queue: a Review button per row rather than a
 * hidden click target that expanded a panel underneath. The decision happens
 * on its own page, so it has a URL and the table is not left on screen
 * competing with it.
 */
export default function AdminEmployersPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.listPendingEmployers({ page: 0, size: 200 }));
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.content ?? [];

  // Filters what is loaded, not the database. The count beside the box

  // says so - a search that quietly covers less than the user assumes

  // is worse than no search at all.

  const visible = (rows ?? []).filter((row) => matches(row, query, ["name", "industry", "registrationNumber", "country"]));

  // Paging and searching both work on the same filtered list, so the
  // page count follows the search rather than ignoring it.
  const PER_PAGE = 15;
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Review company registrations before their recruiter accounts become active."
        action={
          <span className="ijp-badge ijp-badge--warn">
            {data?.totalElements ?? rows.length} pending
          </span>
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

          placeholder={t("Search companies")}

          shown={visible.length}

          total={(rows ?? []).length}

        />
        {loading ? (
          <LoadingBlock label="Loading the queue..." />
        ) : (
                    <>
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Company",
                  render: (row) => <span className="fw-semibold">{row.name}</span>,
                },
                { key: "industry", header: "Industry", render: (row) => row.industry || "—" },
                {
                  key: "registrationNumber",
                  header: "Registration",
                  // The thing an administrator actually checks before approving.
                  render: (row) =>
                    row.registrationNumber ? (
                      <span className="ijp-data">{row.registrationNumber}</span>
                    ) : (
                      <span className="ijp-muted fst-italic">Not given</span>
                    ),
                },
                { key: "country", header: "Country", render: (row) => row.country || "—" },
                {
                  key: "approvalStatus",
                  header: "Status",
                  render: (row) => <StatusBadge value={row.approvalStatus} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="d-flex justify-content-end">
                      <Link className="btn btn-sm btn-ijp-primary" to={`/admin/employers/${row.id}`}>
                        Review
                        <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                      </Link>
                    </div>
                  ),
                },
              ]}
              rows={pageRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-building-check",
                title: "Nothing waiting",
                hint: "Every company registration has been reviewed.",
              }}
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={visible.length}
              onChange={setPage}
              noun="company"
            />
          </>
        )}
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        Approving a company also activates its recruiter accounts and lets them publish
        vacancies.
      </p>
    </>
  );
}
