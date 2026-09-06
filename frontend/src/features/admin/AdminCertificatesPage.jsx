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
 * The certificate verification queue.
 */
export default function AdminCertificatesPage() {
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.listPendingCertificates({ page: 0, size: 20 }));
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
        {loading ? (
          <LoadingBlock label="Loading the queue..." />
        ) : (
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
            rows={rows}
            rowKey={(row) => row.id}
            empty={{
              icon: "bi-patch-check",
              title: "Nothing waiting",
              hint: "Every uploaded certificate has been reviewed.",
            }}
          />
        )}
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        Verifying a certificate is what makes it visible to employers. Nothing else in the
        system can.
      </p>
    </>
  );
}
