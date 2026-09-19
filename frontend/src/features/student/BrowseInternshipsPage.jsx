import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { studentApi } from "../../api/studentApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import CharCount from "../../components/shared/CharCount.jsx";
import Pagination from "../../components/shared/Pagination.jsx";

/**
 * Open vacancies a student can apply to.
 */
export default function BrowseInternshipsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  // Paged by the server, twelve cards at a time. One page of 50 was the
  // server's cap, so any vacancy past it could not be found by browsing.
  const PER_PAGE = 12;
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      const result = await studentApi.listInternships({ keyword: query, page, size: PER_PAGE });
      setItems(result?.content ?? []);
      setPageCount(result?.totalPages ?? 0);
      setTotal(result?.totalElements ?? 0);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title={t("Browse internships")}
        subtitle={t("Every vacancy currently accepting applications.")}
        action={
          <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />{t("Refresh")}</button>
        }
      />

      <form
        className="d-flex gap-2 mb-4 align-items-start"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(0);
          setQuery(keyword.trim());
        }}
      >
        {/* The counter goes under the box, not beside it. As a direct child of
            this flex row it became a third item the moment it appeared, and
            pushed the Search button off the end of a narrow screen. */}
        <div className="flex-grow-1">
          <input
            className="form-control"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("Search by title, company or location")}
            aria-label={t("Search internships")}
            maxLength={150}
          />
          <CharCount value={keyword} max={150} />
        </div>
        <button className="btn btn-ijp-primary flex-shrink-0" type="submit">
          <i className="bi bi-search me-1" aria-hidden="true" />{t("Search")}</button>
      </form>

      <ErrorAlert message={error} onRetry={load} />

      {items === null ? (
        <LoadingBlock label={t("Loading open internships...")} />
      ) : items.length === 0 ? (
        <div className="ijp-card">
          <EmptyState
            icon="bi-search"
            title={query ? "Nothing matched that search" : "No open internships yet"}
            hint={
              query
                ? "Try a shorter keyword, or clear the search to see everything."
                : "Vacancies appear here once employers publish them."
            }
          />
        </div>
      ) : (
        <>
        <div className="ijp-match-grid">
          {items.map((internship) => (
            <Link
              className="ijp-match ijp-card-link"
              key={internship.id}
              to={`/student/internships/${internship.id}`}
            >
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div style={{ minWidth: 0 }}>
                  {/* The company sits with the title, not under it as a footnote.
                      Two firms advertise "Software Engineering Intern" and the
                      cards were telling them apart in muted 12px. */}
                  <p className="ijp-match-title">{internship.title}</p>
                  <p className="ijp-match-company">
                    <i className="bi bi-building me-1" aria-hidden="true" />
                    {internship.companyName}
                  </p>
                  <p className="ijp-muted small mb-0">
                    {internship.location}
                  </p>
                </div>
                <StatusBadge value={internship.status} />
              </div>

              <div className="ijp-pill-row">
                {internship.workMode ? (
                  <span className="ijp-issue">
                    <i className="bi bi-geo-alt" aria-hidden="true" />
                    {t(formatWorkMode(internship.workMode))}
                  </span>
                ) : null}
                {internship.durationMonths ? (
                  <span className="ijp-issue">
                    <i className="bi bi-clock" aria-hidden="true" />
                    {internship.durationMonths} months
                  </span>
                ) : null}
                {internship.availablePositions ? (
                  <span className="ijp-issue">
                    <i className="bi bi-people" aria-hidden="true" />
                    {internship.availablePositions} position
                    {internship.availablePositions === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <div className="ijp-match-foot">
                {internship.applicationDeadline ? (
                  <span className="ijp-muted small">
                    <i className="bi bi-calendar-event me-1" aria-hidden="true" />
                    {t("Closes {date}", { date: internship.applicationDeadline })}
                  </span>
                ) : null}
                <span className="ijp-metric-go ms-auto p-0">{t("View and apply")}<i className="bi bi-arrow-right" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          onChange={(next) => {
            setPage(next);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          noun="internship"
        />
        </>
      )}
    </>
  );
}

/** The label for a work mode. The enum value is ONSITE, not ON_SITE, so it is mapped rather than reformatted. */
function formatWorkMode(mode) {
  return { ONSITE: "On-site", REMOTE: "Remote", HYBRID: "Hybrid" }[mode] ?? mode;
}
