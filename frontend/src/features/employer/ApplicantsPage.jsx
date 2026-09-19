import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Select from "../../components/shared/Select.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import Pagination from "../../components/shared/Pagination.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { timeAgo, exactTime } from "../../api/relativeTime.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Who applied, per vacancy.
 */
export default function ApplicantsPage() {
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const internshipId = params.get("internshipId") ?? "";

  const [internships, setInternships] = useState([]);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  // Paged by the server. Fetching one large page capped the list at the
  // server's limit of 50, so a 51st applicant was never shown anywhere.
  const PER_PAGE = 10;
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    employerApi
      .listInternships()
      .then((page) => {
        const list = page?.content ?? [];
        setInternships(list);
        // No redirect to the first vacancy any more. An empty selection now
        // means "all", which is a better place to land than whichever opening
        // happens to be newest.
      })
      .catch((requestError) => setError(describeApiError(requestError)));
    // Only on mount: re-running when the id changes would fight the redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      const result = await employerApi.listApplications({ internshipId, page, size: PER_PAGE });
      setRows(result?.content ?? []);
      setPageCount(result?.totalPages ?? 0);
      setTotal(result?.totalElements ?? 0);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [internshipId, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title={t("Applicants")}
        subtitle={t("Everyone who applied, and where each one stands.")}
        action={
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={load}
            disabled={rows === null}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />{t("Refresh")}</button>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-card p-3 p-md-4 mb-4">
        <label className="ijp-field-label" htmlFor="internshipPicker">{t("Internship")}</label>
        <Select
          value={internshipId}
          onChange={(value) => {
            setPage(0);
            setParams({ internshipId: value });
          }}
          groups={[
            {
              label: null,
              items: [
                // First, because "who has applied at all" is where an employer
                // with several openings starts. The empty value is what the
                // api module reads as "all".
                { value: "", label: t("All vacancies") },
                ...internships.map((internship) => ({
                  value: internship.id,
                  label: internship.title,
                })),
              ],
            },
          ]}
          placeholder={t(internships.length ? "All vacancies" : "No internships yet")}
          disabled={internships.length === 0}
          ariaLabel={t("Which vacancy")}
        />
      </div>

      <div className="ijp-card p-3 p-md-4">
        {/* The condition is "no vacancies exist", not "none is selected".
            An empty selection now means All, and short-circuiting on it sent
            the one view that shows everything to an empty state. */}
        {internships.length === 0 ? (
          <EmptyState
            icon="bi-megaphone"
            title={t("No internships yet")}
            hint={t("Post a vacancy first, and applicants will appear here.")}
          />
        ) : rows === null && !error ? (
          <LoadingBlock label={t("Loading applicants...")} />
        ) : (
          <>
          <DataTable
            columns={[
              {
                key: "studentName",
                header: "Student",
                // With All selected the rows come from several vacancies, so
                // the name alone does not say what the person applied to. The
                // response has always carried the title; nothing showed it.
                render: (row) => (
                  <span className="ijp-person">
                    <span className="ijp-person-name">{row.studentName ?? "—"}</span>
                    {internshipId ? null : (
                      <span className="ijp-person-email">{row.internshipTitle}</span>
                    )}
                  </span>
                ),
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
                    >{t("Review")}<i className="bi bi-arrow-right ms-1" aria-hidden="true" />
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
              // The wording follows the selection, because "for this vacancy"
              // is wrong when the selection is all of them.
              hint: internshipId
                ? "Applications for this vacancy will appear here."
                : "Applications to any of your vacancies will appear here.",
            }}
          />
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            onChange={setPage}
            noun="applicant"
          />
          </>
        )}
      </div>
    </>
  );
}
