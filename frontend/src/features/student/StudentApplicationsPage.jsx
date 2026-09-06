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

/**
 * Everything this student has applied to.
 */
export default function StudentApplicationsPage() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      const page = await studentApi.listApplications({ size: 50 });
      setRows(page?.content ?? []);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        {rows === null ? (
          <LoadingBlock label="Loading your applications..." />
        ) : (
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
            rows={rows}
            rowKey={(row) => row.id}
            empty={{
              icon: "bi-send",
              title: "You have not applied to anything yet",
              hint: "Browse open internships and apply — your applications appear here.",
            }}
          />
        )}
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        Only the employer can change an application's status. You will get a notification
        when one of these moves.
      </p>
    </>
  );
}
