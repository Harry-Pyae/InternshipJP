import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { studentApi } from "../../api/studentApi.js";
import { describeApiError } from "../../api/axiosClient.js";

/**
 * Open vacancies a student can apply to.
 */
export default function BrowseInternshipsPage() {
  const [items, setItems] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      const page = await studentApi.listInternships({ keyword: query, size: 50 });
      setItems(page?.content ?? []);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Browse internships"
        subtitle="Every vacancy currently accepting applications."
        action={
          <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <form
        className="d-flex gap-2 mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(keyword.trim());
        }}
      >
        <input
          className="form-control"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search by title, company or location"
          aria-label="Search internships"
        />
        <button className="btn btn-ijp-primary flex-shrink-0" type="submit">
          <i className="bi bi-search me-1" aria-hidden="true" />
          Search
        </button>
      </form>

      <ErrorAlert message={error} onRetry={load} />

      {items === null ? (
        <LoadingBlock label="Loading open internships..." />
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
        <div className="ijp-match-grid">
          {items.map((internship) => (
            <Link
              className="ijp-match ijp-card-link"
              key={internship.id}
              to={`/student/internships/${internship.id}`}
            >
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div style={{ minWidth: 0 }}>
                  <p className="ijp-match-title">{internship.title}</p>
                  <p className="ijp-muted small mb-0">
                    {internship.companyName}
                    {internship.location ? ` · ${internship.location}` : ""}
                  </p>
                </div>
                <StatusBadge value={internship.status} />
              </div>

              <div className="ijp-pill-row">
                {internship.workMode ? (
                  <span className="ijp-issue">
                    <i className="bi bi-geo-alt" aria-hidden="true" />
                    {formatWorkMode(internship.workMode)}
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
                    Closes {internship.applicationDeadline}
                  </span>
                ) : null}
                <span className="ijp-metric-go ms-auto p-0">
                  View and apply
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function formatWorkMode(mode) {
  return mode
    .toLowerCase()
    .replace("_", "-")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
