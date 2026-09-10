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
 * The certificate verification queue.
 */
export default function AdminCertificatesPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.listPendingCertificates({ page: 0, size: 200 }));
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

  const visible = (rows ?? []).filter((row) => matches(row, query, ["title", "studentName", "issuingOrganization"]));

  // Paging and searching both work on the same filtered list, so the
  // page count follows the search rather than ignoring it.
  const PER_PAGE = 15;
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  return (
    <>
      <PageHeader
        title="Certificate review"
        subtitle="Open the uploaded file and verify the qualification before employers can see it."
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

          placeholder={t("Search certificates")}

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
                  key: "title",
                  header: "Certificate",
                  render: (row) => <span className="fw-semibold">{row.title}</span>,
                },
                {
                  key: "studentName",
                  header: "Student",
                  render: (row) => row.studentName || "—",
                },
                {
                  key: "issuingOrganization",
                  header: "Issuer",
                  render: (row) => row.issuingOrganization || "—",
                },
                {
                  key: "verificationStatus",
                  header: "Status",
                  render: (row) => <StatusBadge value={row.verificationStatus} />,
                },
                {
                  key: "createdAt",
                  header: "Waiting since",
                  render: (row) => (row.createdAt ? row.createdAt.slice(0, 10) : "—"),
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="d-flex justify-content-end">
                      <Link
                        className="btn btn-sm btn-ijp-primary"
                        to={`/admin/certificates/${row.id}`}
                      >
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
                icon: "bi-patch-check",
                title: "Nothing waiting",
                hint: "Every uploaded certificate has been reviewed.",
              }}
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={visible.length}
              onChange={setPage}
              noun="certificate"
            />
          </>
        )}
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        Verifying a certificate is what makes it visible to employers. Nothing else in the
        system can.
      </p>
    </>
  );
}
