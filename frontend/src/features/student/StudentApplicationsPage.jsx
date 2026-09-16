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
import SearchBox, { matches } from "../../components/shared/SearchBox.jsx";
import { useLanguage } from "../../config/languageContext.jsx";
import Pagination from "../../components/shared/Pagination.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import { useAuth } from "../../config/authContext.jsx";

/**
 * Everything this student has applied to.
 */
export default function StudentApplicationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  // Which application is being replied to, and whether the send is in flight.
  const [replyTo, setReplyTo] = useState(null);
  // The exchange about the application being replied to. Without it a student
  // could send a reply and never see it again, and could read what the employer
  // wrote only as a notification.
  const [thread, setThread] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      const page = await studentApi.listApplications({ size: 200 });
      setRows(page?.content ?? []);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filters what is loaded, not the database. The count beside the box

  // says so - a search that quietly covers less than the user assumes

  // is worse than no search at all.

  const visible = (rows ?? []).filter((row) => matches(row, query, ["internshipTitle", "companyName", "status"]));

  // Paging and searching both work on the same filtered list, so the
  // page count follows the search rather than ignoring it.
  const PER_PAGE = 15;
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  return (
    <>
      <PageHeader
        title={t("My applications")}
        subtitle={t("Every internship you have applied to, and where it stands.")}
        action={
          <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />{t("Refresh")}</button>
        }
      />

      {sent ? (
        <div className="alert alert-success" role="status">
          {sent}
        </div>
      ) : null}

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-card p-3 p-md-4">
        <SearchBox
          value={query}
          onChange={(value) => {
              setQuery(value);
              setPage(0);
            }}
          placeholder={t("Search applications")}
          shown={visible.length}
          total={(rows ?? []).length}
        />
        {rows === null ? (
          <LoadingBlock label={t("Loading your applications...")} />
        ) : (
                    <>
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
                  render: (row) => (
                    <div className="d-flex justify-content-end gap-2">
                      {/* An employer can ask a question on an application and
                          there was no way to answer it here. A closed
                          application is not a conversation any more, so the
                          reply goes with it. */}
                      {row.status === "REJECTED" || row.status === "WITHDRAWN" ? null : (
                        <button
                          type="button"
                          className="btn btn-sm btn-ijp-quiet"
                          onClick={() => {
                            setSent("");
                            setReplyTo(row);
                            setThread([]);
                            studentApi
                              .applicationMessages(row.id)
                              .then(setThread)
                              .catch(() => setThread([]));
                          }}
                        >
                          <i className="bi bi-reply me-1" aria-hidden="true" />{t("Reply")}</button>
                      )}
                      {row.internshipId ? (
                        <Link
                          className="btn btn-sm btn-ijp-quiet"
                          to={`/student/internships/${row.internshipId}`}
                        >{t("View")}<i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  ),
                },
              ]}
              rows={pageRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-send",
                title: "You have not applied to anything yet",
                hint: "Browse open internships and apply — your applications appear here.",
              }}
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={visible.length}
              onChange={setPage}
              noun={t("application")}
            />
          </>
        )}
      </div>

      <p className="ijp-muted small mt-3 mb-0">{t("Only the employer can change an application's status. You will get a notification when one of these moves.")}</p>
      <ConfirmDialog
        open={Boolean(replyTo)}
        tone="neutral"
        title={replyTo ? `Reply about ${replyTo.internshipTitle}` : ""}
        message={replyTo ? `Your reply goes to ${replyTo.companyName}.` : ""}
        note={t("They see it as a notification, the same way you see theirs.")}
        body={
          thread.length ? (
            <ol className="ijp-thread mb-3">
              {thread.map((entry) => (
                <li
                  className={`ijp-thread-item ijp-thread-item--${
                          entry.senderRole === user?.role ? "mine" : "theirs"
                        }`}
                  key={entry.id}
                >
                  <p className="ijp-thread-who">
                    {entry.senderName}
                    <span className="ijp-thread-when">{timeAgo(entry.createdAt)}</span>
                  </p>
                  <p className="ijp-thread-body">{entry.body}</p>
                </li>
              ))}
            </ol>
          ) : null
        }
        confirmLabel={t("Send reply")}
        requireReason
        reasonLabel={t("Your reply")}
        busy={sending}
        onCancel={() => setReplyTo(null)}
        onConfirm={async (text) => {
          setSending(true);
          setError(null);
          try {
            await studentApi.replyToEmployer(replyTo.id, text);
            setSent("Your reply was sent.");
            setReplyTo(null);
          } catch (requestError) {
            setError(describeApiError(requestError));
          } finally {
            setSending(false);
          }
        }}
      />

    </>
  );
}
