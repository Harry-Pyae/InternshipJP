import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";

/**
 * Companies waiting for approval.
 *
 * Same change as the certificate queue: a Review button per row rather than a
 * hidden click target that expanded a panel underneath. The decision happens
 * on its own page, so it has a URL and the table is not left on screen
 * competing with it.
 */
export default function AdminEmployersPage() {
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.listPendingEmployers({ page: 0, size: 20 }));
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
        {loading ? (
          <LoadingBlock label="Loading the queue..." />
        ) : (
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
            rows={rows}
            rowKey={(row) => row.id}
            empty={{
              icon: "bi-building-check",
              title: "Nothing waiting",
              hint: "Every company registration has been reviewed.",
            }}
          />
        )}
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        Approving a company also activates its recruiter accounts and lets them publish
        vacancies.
      </p>
    </>
  );
}
