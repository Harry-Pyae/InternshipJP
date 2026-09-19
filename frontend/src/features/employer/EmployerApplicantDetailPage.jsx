import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import Avatar from "../../components/shared/Avatar.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { timeAgo, exactTime } from "../../api/relativeTime.js";
import { certificateAge } from "../../api/relativeTime.js";
import { useLanguage } from "../../config/languageContext.jsx";
import FilePreview from "../admin/components/FilePreview.jsx";
import CharCount from "../../components/shared/CharCount.jsx";
import { useAuth } from "../../config/authContext.jsx";

/**
 * One applicant, in full.
 */
const SKILL_GROUPS = [
  { type: "PROGRAMMING_LANGUAGE", label: "Programming languages" },
  { type: "TECHNICAL", label: "Technical" },
  { type: "SOFT", label: "Soft skills" },
  { type: "SPOKEN_LANGUAGE", label: "Languages" },
];

const LABELS = {
  APPLIED: "Applied",
  UNDER_REVIEW: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

/**
 * Where an application can go from where it is.
 *
 * The same table the server enforces. The dropdown used to offer all five
 * statuses whatever stage the application was at, so it looked as though an
 * employer could jump straight from Applied to Accepted - and the server
 * refused it after they tried. Offering only what is possible says the rule
 * without anybody having to read it.
 */
const NEXT = {
  APPLIED: ["UNDER_REVIEW", "SHORTLISTED", "REJECTED"],
  UNDER_REVIEW: ["SHORTLISTED", "INTERVIEW", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "ACCEPTED", "REJECTED"],
  INTERVIEW: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/** What choosing each one means, shown on the button itself. */
const MEANS = {
  UNDER_REVIEW: "You are reading the application",
  SHORTLISTED: "Worth taking further",
  INTERVIEW: "You want to meet them",
  ACCEPTED: "Offer the place - this fills a slot",
  REJECTED: "Close it, with a reason below",
};

/** The ordinary path, shown so the stage after this one is visible. */
const JOURNEY = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "ACCEPTED"];

export default function EmployerApplicantDetailPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  // Which certificate is open in the viewer, if any.
  const [viewing, setViewing] = useState(null);
  // The exchange about this application. It has its own table, because a
  // notification belongs to one recipient and an inbox therefore holds only
  // half a conversation.
  const [thread, setThread] = useState([]);
  // Opens at the newest message rather than the oldest. A conversation you
  // have to scroll to the bottom of is showing you the part you have already
  // read.
  const threadEnd = useRef(null);
  // True when the employer arrived here from a message notification. The page
  // is long, and landing at the top with the reply three screens down is how
  // somebody concludes the reply is not there.
  const [cameForMessage] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#messages",
  );
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  // One shared "done" made a status change look like the message had been
  // sent, because both fed the same banner at the top of the page. Each
  // action now reports beside its own control.
  const [statusDone, setStatusDone] = useState("");
  const [messageDone, setMessageDone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await employerApi.getApplication(id);
      setApplication(data);
      employerApi.applicationMessages(id).then(setThread).catch(() => setThread([]));
      if (cameForMessage) {
        // After the thread has rendered, not before.
        window.setTimeout(() => {
          document.getElementById("messages")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
      setStatus(data.status);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveStatus() {
    setBusy(true);
    setError(null);
    setStatusDone("");
    try {
      await employerApi.setApplicationStatus(id, status, note.trim());
      setNote("");
      // Accurate, and worth saying: updateStatus in ApplicationService creates
      // an APPLICATION_STATUS_CHANGED notification itself. The employer did
      // not send anything - the platform did, automatically.
      setStatusDone(t("Status saved. The student is notified automatically."));
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!message.trim()) {
      setError(t("Write a message before sending it."));
      return;
    }
    setSending(true);
    setError(null);
    setMessageDone("");
    try {
      await employerApi.messageApplicant(id, message.trim());
      setMessage("");
      // The conversation above the box has to show what was just sent.
      employerApi.applicationMessages(id).then(setThread).catch(() => {});
      setMessageDone(t("Sent. It is in the student's notifications now."));
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setSending(false);
    }
  }

  // Above the early return below: a hook after it would run on some renders
  // and not others, and React fails the page when the count changes.
  useEffect(() => {
    if (thread.length) {
      threadEnd.current?.scrollIntoView({ block: "nearest" });
    }
  }, [thread]);

  if (application === null && !error) {
    return <LoadingBlock label={t("Loading the application...")} />;
  }

  const student = application?.student;
  const certificates = application?.verifiedCertificates ?? [];

  return (
    <>
      <PageHeader
        title={student?.fullName ?? "Applicant"}
        subtitle={
          application
            ? t("Applied to {title}", { title: application.internship?.title ?? t("an internship") })
            : ""
        }
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/employer/applications">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            {t("Back to applicants")}
          </Link>
        }
      />

      <ErrorAlert message={error} />

      {application ? (
        <div className="ijp-review-layout">
          <div className="d-grid gap-4">
            <div className="ijp-card p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 flex-wrap mb-3">
                <Avatar name={student?.fullName} />
                <div style={{ minWidth: 0 }}>
                  <p className="h6 mb-1">{student?.fullName}</p>
                  <p className="ijp-muted small mb-0">
                    {student?.headline || t("No headline")}
                  </p>
                </div>
                <StatusBadge value={application.status} />
              </div>

              <dl className="ijp-detail-grid ijp-detail mb-0">
                <Row label={t("Email")} value={student?.email} mono />
                <Row label={t("Location")} value={student?.location} />
                <Row label={t("Country")} value={student?.country} />
                <Row label={t("Available from")} value={student?.availableFrom} mono />
                <Row label={t("Applied")} value={timeAgo(application.createdAt)} />
                <Row label={t("Preferred work mode")} value={student?.preferredWorkMode} />
              </dl>
            </div>

            {/* The conversation, near the top rather than buried.
                It sat inside the decision panel at the foot of a long page, so
                an employer clicking a reply landed three screens above it.
                Somewhere you have to scroll to find is somewhere you can
                reasonably conclude is not there. */}
            <div className="col-12" id="messages">
              <SectionCard title={t("Conversation")}>
                {cameForMessage ? (
                  <p className="ijp-arrived" role="status">
                    <i className="bi bi-chat-left-text me-2" aria-hidden="true" />
                    {t("This is the message you were sent.")}
                  </p>
                ) : null}

                {thread.length ? (
                  <ol className={`ijp-thread${cameForMessage ? " ijp-thread--arrived" : ""}`}>
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
                ) : (
                  <p className="ijp-field-note">
                    {t("Nothing has been said about this application yet.")}
                  </p>
                )}
                {/* The composer, in the conversation rather than in a card of
                    its own further down. A message box separated from the
                    messages is how somebody writes a reply without having read
                    what they are replying to. */}
                <div className="ijp-composer">
                  <textarea
                    aria-label={t("Write a message")}
                    className="form-control"
                    rows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={500}
                    placeholder={t("Write a message to this applicant...")}
                  />
                  <CharCount value={message} max={500} />
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="ijp-field-note mb-0">
                      {t("Arrives in their notifications. They can reply here.")}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ijp-primary"
                      onClick={send}
                      disabled={sending || !message.trim()}
                    >
                      <i className="bi bi-send me-1" aria-hidden="true" />
                      {sending ? t("Sending...") : t("Send")}
                    </button>
                  </div>
                  {messageDone ? (
                    <p className="ijp-state--ok small mt-2 mb-0" role="status">
                      <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                      {messageDone}
                    </p>
                  ) : null}
                </div>
              </SectionCard>
            </div>

            {application.coverLetter ? (
              <SectionCard title={t("Cover letter")}>
                <p className="mb-0" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                  {application.coverLetter}
                </p>
              </SectionCard>
            ) : null}

            <SectionCard title={t("Skills")}>
              {application.skills?.length ? (
                  <>
                    {/* Grouped and coloured the same way the student sees them,
                        so a category means the same thing on both sides. */}
                    {SKILL_GROUPS.map((group) => {
                      const inGroup = application.skills.filter(
                        (skill) => skill.skillType === group.type,
                      );
                      if (inGroup.length === 0) return null;
                      return (
                        <div className="mb-3" key={group.type}>
                          <p className="ijp-label mb-2">{t(group.label)}</p>
                          <div className="ijp-pill-row">
                            {inGroup.map((skill) => (
                              <span
                                className={`ijp-pill-skill ijp-pill-skill--${group.type.toLowerCase()}`}
                                key={skill.id ?? skill.name}
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <p className="ijp-field-note mb-0">
                      {t("These are the skills recorded when the application was sent. Anything added since is not shown here.")}
                    </p>
                  </>
              ) : (
                <p className="ijp-muted mb-0">{t("This student has not listed any skills.")}</p>
              )}
            </SectionCard>

            <SectionCard title={t("Verified certificates")}>
              {certificates.length ? (
                <ul className="ijp-gap-grid mb-0">
                  {certificates.map((certificate) => (
                    <li className="ijp-gap-row" key={certificate.id}>
                      <span className="ijp-gap-text">
                        <span className="ijp-gap-skill">
                          <i
                            className="bi bi-patch-check-fill ijp-state--ok me-1"
                            aria-hidden="true"
                          />
                          {certificate.title}
                        </span>
                        {/* Each part is its own unbreakable span.
                            As one text run it broke wherever the column ran
                            out - "8 months" on one line and "old" on the next,
                            which reads as a different thing entirely. It can
                            still wrap between the parts, just never inside
                            one. */}
                        <span className="ijp-muted ijp-meta-row">
                          <span className="ijp-meta-part">
                            {certificate.issuingOrganization || t("Issuer not given")}
                          </span>
                          {certificate.issueDate ? (
                            <span className="ijp-meta-part">{certificate.issueDate}</span>
                          ) : null}
                          {certificate.issueDate ? (
                            <span className="ijp-meta-part">
                              {certificateAge(certificate.issueDate)}
                            </span>
                          ) : null}
                        </span>
                      </span>

                      {/* The document itself.
                          CertificateFileController has always let an employer
                          download a verified certificate belonging to one of
                          their own applicants - the interface simply never
                          offered it, so the whole point of verification stopped
                          at a title and a tick. */}
                      <button
                        type="button"
                        className="btn btn-sm btn-ijp-quiet ijp-gap-action"
                        onClick={() => setViewing(certificate)}
                      >
                        <i className="bi bi-file-earmark-text me-1" aria-hidden="true" />
                        {t("Open")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ijp-muted mb-0">{t("No verified certificates.")}</p>
              )}
              <p className="ijp-field-hint mt-3 mb-0">
                {t("Only qualifications an administrator has checked against the original document appear here. Unverified ones are never sent to employers.")}
              </p>
            </SectionCard>

            {application.statusHistory?.length ? (
              <SectionCard title={t("History")}>
                <ul className="ijp-fix-list mb-0">
                  {application.statusHistory.map((entry, index) => (
                    <li className="ijp-fix" key={entry.id ?? index}>
                      <span className="ijp-fix-number">{index + 1}</span>
                      <span className="ijp-fix-text">
                        {entry.fromStatus ? `${entry.fromStatus} → ` : ""}
                        <strong>{entry.toStatus}</strong>
                        {entry.note ? ` — ${entry.note}` : ""}
                        <span className="ijp-muted d-block small" title={exactTime(entry.createdAt)}>
                          {timeAgo(entry.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </div>

          <div className="ijp-review-side d-grid gap-3">
            <div className="ijp-card p-3 p-md-4">
              <p className="ijp-label mb-1">{t("Decision")}</p>
              <p className="ijp-field-hint mb-3">
                {t("Changing the status notifies the student on its own. You do not need to send a message as well.")}
              </p>
              {/* Buttons, not a dropdown.
                  A dropdown asks somebody to open it, read a list, choose, and
                  then find the save button - four steps to answer one question.
                  There are at most three answers, so each is a button that says
                  what choosing it means. */}
              <p className="ijp-field-label">{t("Where does this go next?")}</p>

              {(NEXT[application.status] ?? []).length === 0 ? (
                <p className="ijp-field-note mb-0">
                  {application.status === "ACCEPTED"
                    ? t("This applicant was accepted. Nothing further to set.")
                    : t("This application was closed. A closed application cannot be reopened.")}
                </p>
              ) : (
                <>
                  <div className="ijp-decide">
                    {(NEXT[application.status] ?? []).map((next) => (
                      <button
                        type="button"
                        key={next}
                        className={`ijp-decide-option${
                          status === next ? " ijp-decide-option--on" : ""
                        }${next === "REJECTED" ? " ijp-decide-option--no" : ""}`}
                        onClick={() => setStatus(next)}
                      >
                        <span className="ijp-decide-name">{t(LABELS[next])}</span>
                        <span className="ijp-decide-why">{t(MEANS[next])}</span>
                      </button>
                    ))}
                  </div>

                  {/* The path sits after the choice, not before it. The decision
                      is what the employer came here to make; the stages are
                      context for it. */}
                  <p className="ijp-decide-path">
                    {JOURNEY.map((stage, index) => (
                      <span key={stage}>
                        {index > 0 ? <span className="ijp-decide-arrow"> › </span> : null}
                        <span
                          className={stage === application.status ? "ijp-decide-here" : undefined}
                        >
                          {t(LABELS[stage])}
                        </span>
                      </span>
                    ))}
                    <span className="ijp-decide-note">
                      {` ${t("- a stage can be skipped forward, never gone back to.")}`}
                    </span>
                  </p>
                </>
              )}

              <label className="ijp-field-label" htmlFor="statusNote">
                {t("Note")} <span className="ijp-muted fw-normal">{t("(optional)")}</span>
              </label>
              <textarea
                id="statusNote"
                className="form-control mb-3"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("Kept with the application history.")}
                maxLength={500}
              />
              <CharCount value={note} max={500} />
              <button
                type="button"
                className="btn btn-ijp-primary w-100"
                onClick={saveStatus}
                disabled={busy || status === application.status}
              >
                {t(busy ? "Saving..." : "Update status")}
              </button>
              {statusDone ? (
                <p className="ijp-state--ok small mt-2 mb-0" role="status">
                  <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                  {statusDone}
                </p>
              ) : null}
            </div>

          </div>
        </div>
      ) : null}
      {viewing ? (
        <div
          className="ijp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={viewing.title}
          onClick={() => setViewing(null)}
        >
          <div className="ijp-doc-panel" onClick={(event) => event.stopPropagation()}>
            <div className="ijp-doc-head">
              <p className="fw-semibold mb-0 text-truncate">{viewing.title}</p>
              <button
                type="button"
                className="btn btn-sm btn-ijp-quiet ijp-gap-action"
                onClick={() => setViewing(null)}
              >
                {t("Close")}
              </button>
            </div>
            <div className="ijp-doc-body">
            <FilePreview
              certificateId={viewing.id}
              fileName={viewing.originalFileName || viewing.title}
              mimeType={viewing.mimeType}
            />
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}

function Row({ label, value, mono }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt>{label}</dt>
      {empty ? <dd className="ijp-detail--empty" /> : <dd className={mono ? "ijp-data" : undefined}>{String(value)}</dd>}
    </div>
  );
}
