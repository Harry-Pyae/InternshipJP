import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";

/**
 * Every vacancy this employer's company owns.
 */
export default function ManageInternshipsPage() {
  const [internships, setInternships] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <>
      <PageHeader
        title="Manage internships"
        subtitle="Every vacancy your company owns, and where each one stands."
        action={
          <Link className="btn btn-ijp-primary btn-sm" to="/employer/internships/new">
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            Post internship
          </Link>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-card p-3 p-md-4">
        {internships === null ? (
          <LoadingBlock label="Loading your internships..." />
        ) : (
          <DataTable
            columns={[
              {
                key: "title",
                header: "Title",
                render: (row) => (
                  <span className="fw-semibold">{row.title || "Untitled internship"}</span>
                ),
              },
              { key: "location", header: "Location", render: (row) => row.location || "—" },
              {
                key: "workMode",
                header: "Work mode",
                render: (row) => formatWorkMode(row.workMode),
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
                      title="Edit this internship"
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </Link>
                    <Link
                      className="btn btn-sm btn-ijp-quiet"
                      to={`/employer/applications?internshipId=${row.id}`}
                      title="View applicants"
                    >
                      <i className="bi bi-people" aria-hidden="true" />
                    </Link>
                  </div>
                ),
              },
            ]}
            rows={internships}
            rowKey={(row) => row.id}
            empty={{
              icon: "bi-megaphone",
              title: "No internships yet",
              hint: "Post one to start receiving applications. It stays a draft until you publish it.",
            }}
          />
        )}

        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={load}
            disabled={internships === null}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        A draft is not visible to students. Publishing needs your company to be approved
        by an administrator.
      </p>
    </>
  );
}

function formatWorkMode(workMode) {
  if (!workMode) {
    return "—";
  }
  return workMode
    .toLowerCase()
    .replace("_", "-")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
