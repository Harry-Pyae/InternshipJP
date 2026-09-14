import { useCallback, useEffect, useState } from "react";
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

/**
 * One applicant, in full.
 */
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

/** The ordinary path, shown so the stage after this one is visible. */
/** What choosing each one means, shown on the button itself. */
const MEANS = {
  UNDER_REVIEW: "You are reading the application",
  SHORTLISTED: "Worth taking further",
  INTERVIEW: "You want to meet them",
  ACCEPTED: "Offer the place - this fills a slot",
  REJECTED: "Close it, with a reason below",
};

const JOURNEY = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "ACCEPTED"];

export default function EmployerApplicantDetailPage() {
  const { t } = useLanguage();
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
      setMessageDone(t("Sent. It is in the student's notifications now."));
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setSending(false);
    }
  }

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
            ? `Applied to ${application.internship?.title ?? "an internship"}`
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
                    {student?.headline || "No headline"}
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

            {application.coverLetter ? (
              <SectionCard title={t("Cover letter")}>
                <p className="mb-0" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                  {application.coverLetter}
                </p>
              </SectionCard>
            ) : null}

            <SectionCard title={t("Skills")}>
              {application.skills?.length ? (
                <div className="ijp-pill-row">
                  {application.skills.map((skill) => (
                    <span
                      className="ijp-pill-skill ijp-pill-skill--have"
                      key={skill.id ?? skill.name}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
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
                        <span className="ijp-muted">
                          {certificate.issuingOrganization || t("Issuer not given")}
                          {certificate.issueDate ? ` · ${certificate.issueDate}` : ""}
                          {certificate.issueDate ? ` · ${certificateAge(certificate.issueDate)}` : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ijp-muted mb-0">{t("No verified certificates.")}</p>
              )}
              <p className="ijp-field-hint mt-3 mb-0">
                Only qualifications an administrator has checked against the original
                document appear here. Unverified ones are never sent to employers.
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
                      {" — a stage can be skipped forward, never gone back to."}
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
              />
              <button
                type="button"
                className="btn btn-ijp-primary w-100"
                onClick={saveStatus}
                disabled={busy || status === application.status}
              >
                {busy ? "Saving..." : "Update status"}
              </button>
              {statusDone ? (
                <p className="ijp-state--ok small mt-2 mb-0" role="status">
                  <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                  {statusDone}
                </p>
              ) : null}
            </div>

            <div className="ijp-card p-3 p-md-4">
              <p className="ijp-label mb-2">{t("Ask for more information")}</p>
              <textarea
                aria-label={t("Ask for more information")}
                className="form-control mb-2"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={500}
                placeholder="e.g. Could you send your academic transcript?"
              />
              <p className="ijp-field-hint mb-3">
                Arrives in the student's notifications with your company name and the
                vacancy. They cannot reply here, so ask for something they can act on.
              </p>
              <button
                type="button"
                className="btn btn-ijp-quiet w-100"
                onClick={send}
                disabled={sending || !message.trim()}
              >
                <i className="bi bi-send me-1" aria-hidden="true" />
                {sending ? "Sending..." : t("Send to applicant")}
              </button>
              {messageDone ? (
                <p className="ijp-state--ok small mt-2 mb-0" role="status">
                  <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                  {messageDone}
                </p>
              ) : null}
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
