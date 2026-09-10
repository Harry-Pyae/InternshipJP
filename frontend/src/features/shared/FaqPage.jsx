import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { accountApi, notificationApi } from "../../api/accountApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import { useAuth } from "../../config/authContext.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import { timeAgo, exactTime } from "../../api/relativeTime.js";
import SearchBox, { matches } from "../../components/shared/SearchBox.jsx";

/**
 * Questions people actually ask, and a way to say something we did not answer.
 *
 * The questions are role-specific. A student asking why an employer cannot see
 * their certificate and an administrator asking what the assistant is allowed
 * to decide are different questions, and one shared list would answer neither
 * well.
 *
 * Answers are ENGLISH SOURCE strings passed through t(), so a translation is a
 * line in strings.js rather than a change here.
 */
const COMMON = [
  {
    q: "Is the AI assistant deciding anything?",
    a: "No. It reads data you already have access to and offers advice. It cannot accept or reject an application, verify a certificate, approve a company, or change any record. Every decision on this platform is made by a person.",
  },
  {
    q: "Does the assistant need an internet connection?",
    a: "The chat does. The calculated features - skill matching, what to learn next, the company review, the administrator workload - are worked out from the database in plain code, so they keep working with no API key and no connection.",
  },
  {
    q: "Why is some of the interface still in English?",
    a: "Anything a person typed - a certificate title, a company name, a cover letter - is shown exactly as written, because translating someone's own words would misrepresent them. Product names such as MariaDB and technical terms that Myanmar workplaces use in English are also left alone.",
  },
  {
    q: "How do I switch between English and Burmese?",
    a: "The EN / မြန်မာ toggle at the top right, available before you sign in as well as after. The assistant follows it too, so questions asked with Burmese selected are answered in Burmese.",
  },
  {
    q: "How do I change my password?",
    a: "Settings, under Account. You need your current password, which is why someone who finds your computer unlocked still cannot lock you out of your own account.",
  },
  {
    q: "Is my data shared with anyone?",
    a: "Your profile is visible to an employer only when you apply to their vacancy. Certificates are visible only after an administrator has verified them. Nothing is shared with anyone you have not applied to.",
  },
];

const BY_ROLE = {
  STUDENT: [
    {
      q: "Why can't employers see my certificate?",
      a: "Only verified certificates are ever sent to employers. After you upload one it waits for an administrator to open the file and check it against the qualification it claims. That check is the whole point of the platform.",
    },
    {
      q: "My certificate was rejected. What now?",
      a: "The rejection comes with a note explaining why. Fix what it describes and upload again - there is no limit on attempts.",
    },
    {
      q: "How are internships matched to me?",
      a: "Each vacancy lists required skills. Your profile is scored against that list and the score is explained, so you can see exactly which skill made the difference rather than trusting a number.",
    },
    {
      q: "I applied but nothing has happened.",
      a: "Employers review applications themselves, and the platform cannot make them faster. Your status changes as soon as they act, and you are notified when it does. An administrator can see applications no employer has opened for over seven days.",
    },
    {
      q: "An employer asked me for more information. How do I reply?",
      a: "Not through the platform - the request is one-way by design. Contact them using the details on the internship listing, or attach what they asked for to your profile so it is there next time.",
    },
    {
      q: "What does the profile completeness percentage mean?",
      a: "How much of your profile an employer would actually see: your details, education, skills and at least one verified certificate. It is a prompt, not a score anyone judges you against.",
    },
  ],
  EMPLOYER: [
    {
      q: "Why can't I publish an internship?",
      a: "Vacancies stay as drafts until an administrator approves your company. Until then no student can see them. You are emailed and notified the moment that happens.",
    },
    {
      q: "Nobody is applying to my vacancy. Why?",
      a: "Ask the assistant - the My company tab lists what each listing is missing. The usual causes are no required skills, so students cannot be matched to it, and no stipend information.",
    },
    {
      q: "Can I message an applicant?",
      a: "You can send one request for more information, which arrives in their notifications. It is one-way: they cannot reply through the platform, so ask for something they can act on.",
    },
    {
      q: "Are the certificates I see real?",
      a: "Every certificate on an applicant's profile has been opened and checked by an administrator against the qualification it claims. Unverified ones are never sent to you, which is the main thing this platform offers over a CV.",
    },
    {
      q: "Why does the assistant say a skill is hard to fill?",
      a: "Because it counted how many students on the platform list it. If almost none do, requiring it will keep the vacancy empty - consider marking it nice-to-have, or accepting a related skill.",
    },
    {
      q: "Can I edit a vacancy after publishing it?",
      a: "Yes, from Manage internships. Applications already received are kept.",
    },
  ],
  ADMIN: [
    {
      q: "What happens when I verify a certificate?",
      a: "It becomes visible to every employer who receives an application from that student. Nothing else in the system can make that happen, which is why the queue matters.",
    },
    {
      q: "What does approving a company do?",
      a: "It activates the recruiter accounts attached to it and lets their vacancies be published. They are emailed and notified.",
    },
    {
      q: "Should I suspend or delete an account?",
      a: "Suspend, almost always. It is reversible and keeps the person's history. Deleting is permanent and removes their applications and certificates - it is for duplicates and test accounts.",
    },
    {
      q: "What does 'stalled' mean on the dashboard?",
      a: "An application no employer has opened for over seven days. You cannot decide it for them, but you can see who is holding someone up.",
    },
    {
      q: "Can the assistant approve anything for me?",
      a: "No. It can tell you what is waiting and what is most urgent, and it can explain why. Every approval, rejection and verification is yours.",
    },
    {
      q: "Where does user feedback arrive?",
      a: "As a notification to every administrator, including this one. It is delivered rather than stored, so it cannot yet be marked resolved or replied to.",
    },
  ],
};

export default function FaqPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [open, setOpen] = useState(0);

  const questions = useMemo(
    () => [...(BY_ROLE[user?.role] ?? []), ...COMMON],
    [user?.role],
  );


  return (
    <>
      <PageHeader
        title="Help and FAQ"
        subtitle="Common questions, and a way to ask something we have not answered."
      />

      <SectionCard
        title="Frequently asked questions"
        action={
          <span className="ijp-muted small">
            {t("{n} questions", { n: questions.length })}
          </span>
        }
      >
        <ul className="ijp-faq-list">
          {questions.map((item, index) => {
            const isOpen = open === index;
            return (
              <li className={`ijp-faq${isOpen ? " ijp-faq--open" : ""}`} key={item.q}>
                {/* One open at a time: a page of expanded answers is just the
                    wall of text the accordion existed to avoid. */}
                <button
                  type="button"
                  className="ijp-faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  {/* Numbered so the list has a visible length. Without it
                      there is no way to tell whether you have read them all. */}
                  <span className="ijp-faq-n">{index + 1}</span>
                  <span className="ijp-faq-text">{t(item.q)}</span>
                  <i
                    className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"} ijp-faq-chevron`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? <p className="ijp-faq-a">{t(item.a)}</p> : null}
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <div className="mt-4">
        {isAdmin ? <FeedbackInbox /> : <FeedbackForm />}
      </div>
    </>
  );
}

/**
 * What a student or employer sends.
 */
function FeedbackForm() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!message.trim()) {
      setError("Write something before sending it.");
      return;
    }
    setSending(true);
    setError(null);
    setSent("");
    try {
      const result = await accountApi.sendFeedback(message.trim());
      setMessage("");
      setSent(result?.message ?? "Thank you. Your feedback was sent to the team.");
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setSending(false);
    }
  }

  return (
    <SectionCard title="Leave feedback">
      <ErrorAlert message={error} />
      <p className="ijp-field-hint mb-2">
        {t("This goes to the administrators as a notification. Tell us what is confusing, broken, or missing.")}
      </p>
      <textarea
        className="form-control mb-2"
        rows={4}
        value={message}
        maxLength={2000}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={t("What would you change?")}
      />
      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          className="btn btn-ijp-primary"
          onClick={send}
          disabled={sending || !message.trim()}
        >
          <i className="bi bi-send me-1" aria-hidden="true" />
          {sending ? t("Sending...") : t("Send feedback")}
        </button>
        {sent ? (
          <span className="ijp-state--ok small" role="status">
            <i className="bi bi-check2-circle me-1" aria-hidden="true" />
            {sent}
          </span>
        ) : null}
      </div>
    </SectionCard>
  );
}

/**
 * What an administrator reads.
 *
 * Feedback arrives as a notification of type FEEDBACK, so this is the existing
 * notification list filtered to that one type. No new endpoint and no table -
 * the messages were already being delivered here, they just had nowhere to be
 * read together.
 */
/**
 * Splits a feedback notification back into its parts.
 *
 * FeedbackController writes "{name} ({role}) wrote: {text}" into one string,
 * because a notification only knows who is RECEIVING it - the sender has to be
 * carried in the message itself. This undoes that so the detail view can show
 * who wrote it separately from what they wrote.
 *
 * Anything that does not match is shown whole rather than mangled, which
 * covers older rows and any notification that acquires the type later.
 */
function parseFeedback(item) {
  const match = /^(.+?)\s+\((student|employer|admin)\)\s+wrote:\s*([\s\S]*)$/i.exec(
    item.message ?? "",
  );
  if (!match) {
    return { name: null, role: null, text: item.message ?? "" };
  }
  return { name: match[1], role: match[2].toUpperCase(), text: match[3] };
}

function FeedbackInbox() {
  const { t } = useLanguage();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await notificationApi.list({ size: 50 });
      setItems((page?.content ?? []).filter((item) => item.type === "FEEDBACK"));
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleFeedback = (items ?? []).filter((item) =>

    matches(item, query, ["message", "title"]),

  );

  return (
    <SectionCard
      title="Feedback from users"
      action={
        <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
          {t("action.refresh")}
        </button>
      }
    >
      <ErrorAlert message={error} onRetry={load} />

      {/* Every piece of feedback is already in memory here, so unlike the
          table searches this one really does cover everything. */}
      {items !== null && items.length > 0 ? (
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t("Search feedback")}
          shown={visibleFeedback.length}
          total={items.length}
        />
      ) : null}

      {items === null ? (
        <LoadingBlock label="Loading feedback..." />
      ) : visibleFeedback.length === 0 ? (
        <EmptyState
          icon="bi-chat-left-text"
          title="No feedback yet"
          hint="Messages sent from the FAQ page on the student and employer sites arrive here."
        />
      ) : (
        <ul className="ijp-feedback-list">
          {visibleFeedback.map((item) => (
            <li
              className={`ijp-feedback${item.read ? "" : " ijp-feedback--unread"}`}
              key={item.id}
            >
              <button
                type="button"
                className="ijp-feedback-hit"
                onClick={() => {
                  setOpen(item);
                  if (!item.read) {
                    // Optimistic: opening it is reading it, and the panel
                    // should not wait on a round trip to say so.
                    setItems((current) =>
                      current.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
                    );
                    notificationApi.markRead(item.id).catch(() => {});
                  }
                }}
              >
                <span className="ijp-feedback-who">
                  {parseFeedback(item).name ?? t("Someone")}
                  {parseFeedback(item).role ? (
                    <span className={`ijp-role ijp-role--${parseFeedback(item).role.toLowerCase()}`}>
                      {t(parseFeedback(item).role)}
                    </span>
                  ) : null}
                </span>
                {/* Clamped to three lines. 2000 characters in a list is a wall,
                    and the detail view exists for the whole thing. */}
                <span className="ijp-feedback-text">{parseFeedback(item).text}</span>
                <span className="ijp-feedback-meta" title={exactTime(item.createdAt)}>
                  <span className="ijp-feedback-when">
                    <i className="bi bi-clock" aria-hidden="true" />
                    {timeAgo(item.createdAt)}
                  </span>
                  <span className="ijp-feedback-more">
                    {t("View details")}
                    <i className="bi bi-chevron-right ms-1" aria-hidden="true" />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="ijp-field-hint mt-3 mb-0">
        {t("Feedback is delivered as a notification rather than stored as its own record, so it cannot yet be marked resolved or replied to.")}
      </p>

      {open ? <FeedbackDetail item={open} onClose={() => setOpen(null)} /> : null}
    </SectionCard>
  );
}

/**
 * One piece of feedback, in full.
 *
 * Worth a panel where a plain notification was not: the message can run to
 * 2000 characters, and the sender is welded into the text rather than stored
 * beside it. Here it is unpacked - who wrote it, in what role, when exactly,
 * and the whole thing unclamped.
 */
function FeedbackDetail({ item, onClose }) {
  const { t } = useLanguage();
  const { name, role, text } = parseFeedback(item);

  return (
    <div className="ijp-modal" role="dialog" aria-modal="true" aria-label={t("Feedback")}>
      <div className="ijp-modal-card">
        <div className="ijp-modal-head">
          <div style={{ minWidth: 0 }}>
            <p className="h6 mb-1 text-truncate">{name ?? t("Someone")}</p>
            <p className="ijp-muted small mb-0" title={exactTime(item.createdAt)}>
              {timeAgo(item.createdAt)}
            </p>
          </div>
          <button type="button" className="ijp-icon-btn" onClick={onClose} aria-label={t("Close")}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3 p-md-4">
          {role ? (
            <p className="mb-3">
              <span className={`ijp-role ijp-role--${role.toLowerCase()}`}>{t(role)}</span>
            </p>
          ) : null}

          <p className="ijp-feedback-full mb-0">{text}</p>

          <p className="ijp-field-hint mt-4 mb-0">
            {t("There is no reply channel. Contact them directly if you need to follow up.")}
          </p>
        </div>
      </div>
    </div>
  );
}
