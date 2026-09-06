import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Select from "../../components/shared/Select.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { timeAgo, exactTime } from "../../api/relativeTime.js";

/**
 * Who applied, per vacancy.
 */
export default function ApplicantsPage() {
  const [params, setParams] = useSearchParams();
  const internshipId = params.get("internshipId") ?? "";

  const [internships, setInternships] = useState([]);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    employerApi
      .listInternships()
      .then((page) => {
        const list = page?.content ?? [];
        setInternships(list);
        if (!internshipId && list.length > 0) {
          setParams({ internshipId: String(list[0].id) }, { replace: true });
        }
      })
      .catch((requestError) => setError(describeApiError(requestError)));
    // Only on mount: re-running when the id changes would fight the redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!internshipId) {
      return;
    }
    setRows(null);
    setError(null);
    try {
      const page = await employerApi.listApplications({ internshipId });
      setRows(page?.content ?? []);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [internshipId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Applicants"
        subtitle="Everyone who applied, and where each one stands."
        action={
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={load}
            disabled={!internshipId}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-card p-3 p-md-4 mb-4">
        <label className="ijp-field-label" htmlFor="internshipPicker">
          Internship
        </label>
        <Select
          value={internshipId}
          onChange={(value) => setParams({ internshipId: value })}
          groups={[
            {
              label: null,
              items: internships.map((internship) => ({
                value: internship.id,
                label: internship.title,
              })),
            },
          ]}
          placeholder={internships.length ? "Choose an internship..." : "No internships yet"}
          disabled={internships.length === 0}
          ariaLabel="Which internship"
        />
      </div>

      <div className="ijp-card p-3 p-md-4">
        {!internshipId ? (
          <EmptyState
            icon="bi-megaphone"
            title="No internships yet"
            hint="Post a vacancy first, and applicants will appear here."
          />
        ) : rows === null ? (
          <LoadingBlock label="Loading applicants..." />
        ) : (
          <DataTable
            columns={[
              {
                key: "studentName",
                header: "Student",
                render: (row) => <span className="fw-semibold">{row.studentName ?? "—"}</span>,
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
                render: (row) => (
                  <div className="d-flex justify-content-end">
                    <Link
                      className="btn btn-sm btn-ijp-primary"
                      to={`/employer/applications/${row.id}`}
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
              icon: "bi-people",
              title: "Nobody has applied yet",
              hint: "Applications for this vacancy will appear here.",
            }}
          />
        )}
      </div>
    </>
  );
}
