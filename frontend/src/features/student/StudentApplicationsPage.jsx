import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
 * The statuses a student may still withdraw from.
 *
 * The same four as WITHDRAWABLE in ApplicationService. The server is what
 * decides; this only decides whether to draw the button, so that nobody is
 * offered an action that comes back refused.
 */
const WITHDRAWABLE = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW"];

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
  // Opens at the newest message rather than the oldest. A conversation you
  // have to scroll to the bottom of is showing you the part you have already
  // read.
  const threadEnd = useRef(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");
  // Which application is being withdrawn, and whether that call is in flight.
  const [withdrawing, setWithdrawing] = useState(null);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  // The application a notification was about, marked in the list.
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [arrived, setArrived] = useState(null);

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

  function openConversation(row) {
    setSent("");
    setReplyTo(row);
    setThread([]);
    studentApi
      .applicationMessages(row.id)
      .then(setThread)
      .catch(() => setThread([]));
  }

  // Filters what is loaded, not the database. The count beside the box

  // says so - a search that quietly covers less than the user assumes

  // is worse than no search at all.

  const visible = (rows ?? []).filter((row) => matches(row, query, ["internshipTitle", "companyName", "status"]));

  // Paging and searching both work on the same filtered list, so the
  // page count follows the search rather than ignoring it.
  const PER_PAGE = 10;
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  // Arriving from a notification: ?open=<application id>. The list is paged
  // and searchable, so the one clicked could be anywhere in it - clear the
  // search, go to its page and mark it. A message notification (#messages)
  // also opens the conversation, which is what the notification was about.
  // The parameter is used once, so refreshing or closing the dialog does not
  // bring it back.
  useEffect(() => {
    const openId = params.get("open");
    if (!openId || rows === null) {
      return;
    }
    setParams({}, { replace: true });
    const index = rows.findIndex((row) => String(row.id) === openId);
    if (index === -1) {
      return;
    }
    const row = rows[index];
    setQuery("");
    setPage(Math.floor(index / PER_PAGE));
    setArrived(row.id);
    if (location.hash === "#messages" && row.status !== "REJECTED" && row.status !== "WITHDRAWN") {
      openConversation(row);
    }
  }, [params, rows]);

  useEffect(() => {
    if (thread.length) {
      threadEnd.current?.scrollIntoView({ block: "nearest" });
    }
  }, [thread]);

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
        {rows === null && !error ? (
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
                          onClick={() => openConversation(row)}
                        >
                          <i className="bi bi-reply me-1" aria-hidden="true" />{t("Reply")}</button>
                      )}
                      {/* Only while it is still open. Once the employer has
                          accepted or rejected it, or it has been withdrawn
                          already, there is nothing to take back - and the
                          server refuses it on the same rule, so the button is
                          hidden rather than offered and then denied. */}
                      {WITHDRAWABLE.includes(row.status) ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-ijp-quiet"
                          onClick={() => setWithdrawing(row)}
                        >
                          <i className="bi bi-x-circle me-1" aria-hidden="true" />{t("Withdraw")}</button>
                      ) : null}
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
              highlightKey={arrived}
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

      {/* This used to read "Only the employer can change an application's
          status", which stopped being true when Withdraw was added - and it
          is the one change a student CAN make, so leaving it would have told
          them the opposite of what the button next to it does. */}
      <p className="ijp-muted small mt-3 mb-0">{t("Withdrawing is the only change you can make yourself; every other move is the employer's. You will get a notification when one of these moves.")}</p>
      <ConfirmDialog
        open={Boolean(replyTo)}
        tone="neutral"
        title={replyTo ? `Reply about ${replyTo.internshipTitle}` : ""}
        message={replyTo ? t("Your reply goes to {company}.", { company: replyTo.companyName }) : ""}
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
              <li ref={threadEnd} aria-hidden="true" />
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
            setSent(t("Your reply was sent."));
            setReplyTo(null);
          } catch (requestError) {
            setError(describeApiError(requestError));
          } finally {
            setSending(false);
          }
        }}
      />

      {/*
        Withdrawing cannot be undone, and the reason is worth stating rather
        than hinting at: one application per person per vacancy is a database
        constraint, so the row cannot be replaced with a fresh one afterwards.
        Somebody should know that before they press it, not after.
      */}
      <ConfirmDialog
        open={Boolean(withdrawing)}
        tone="danger"
        title={t("Withdraw this application?")}
        message={
          withdrawing
            ? t("{company} will be told you are no longer applying for {role}.", {
                company: withdrawing.companyName,
                role: withdrawing.internshipTitle,
              })
            : ""
        }
        note={t("This cannot be undone, and you cannot apply to this vacancy again.")}
        confirmLabel={t("Withdraw application")}
        busy={withdrawBusy}
        onCancel={() => setWithdrawing(null)}
        onConfirm={async () => {
          setWithdrawBusy(true);
          setError(null);
          try {
            await studentApi.withdrawApplication(withdrawing.id);
            setSent(t("Your application was withdrawn."));
            setWithdrawing(null);
            await load();
          } catch (requestError) {
            setError(describeApiError(requestError));
          } finally {
            setWithdrawBusy(false);
          }
        }}
      />
    </>
  );
}
