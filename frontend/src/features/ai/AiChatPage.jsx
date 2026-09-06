import { useCallback, useEffect, useRef, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { useLanguage } from "../../config/languageContext.jsx";
import { authApi } from "../../api/authApi.js";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import PageHeader from "../../components/shared/PageHeader.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import RecommendationsPanel from "./RecommendationsPanel.jsx";
import SkillGapPanel from "./SkillGapPanel.jsx";
import CompanyInsightPanel from "./CompanyInsightPanel.jsx";
import AdminWorkloadPanel from "./AdminWorkloadPanel.jsx";
import ThinkingIndicator from "./ThinkingIndicator.jsx";
import RevealingText from "./RevealingText.jsx";
import AnswerBlocks from "./AnswerBlocks.jsx";
import Select from "../../components/shared/Select.jsx";
import { timeAgo, exactTime } from "../../api/relativeTime.js";

/**
 * The AI assistant - Member 1's vertical slice.
 */
export default function AiChatPage({ audience, initialTab = "chat" }) {
  const { t } = useLanguage();
  const { language } = useLanguage();
  const isEmployer = audience === "employer";
  const isAdmin = audience === "admin";

  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [tab, setTab] = useState(initialTab);

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Employers have two different jobs: read the applicants of one vacancy, or
  // review their own listings. Leaving internshipId out selects the second.
  const [employerMode, setEmployerMode] = useState("candidates");
  const [internshipId, setInternshipId] = useState("");
  const [internships, setInternships] = useState([]);

  const logRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await aiApi.conversations());
    } catch {
      // History is a convenience. Failing to load it must not block the chat.
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (!cancelled) {
          setUser(me);
          loadConversations();
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingUser(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  // The dropdown only ever contains vacancies this employer's company owns -
  // the backend cannot return anyone else's.
  useEffect(() => {
    if (!isEmployer || !user || user.role !== "EMPLOYER") {
      return undefined;
    }
    let cancelled = false;
    employerApi
      .listInternships({ size: 50 })
      .then((page) => {
        if (!cancelled) {
          setInternships(page.content ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInternships([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isEmployer, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setError(null);
    setTab("chat");
  }

  async function openConversation(id) {
    setError(null);
    setTab("chat");
    try {
      const history = await aiApi.messages(id);
      setConversationId(id);
      setMessages(
        history.map((item) => ({
          role: item.messageRole === "USER" ? "user" : "assistant",
          text: item.content,
          notice: false,
        })),
      );
    } catch (loadError) {
      setError(describeApiError(loadError));
    }
  }

  async function removeConversation(id) {
    try {
      await aiApi.deleteConversation(id);
      if (id === conversationId) {
        startNewConversation();
      }
      loadConversations();
    } catch (deleteError) {
      setError(describeApiError(deleteError));
    }
  }

  function askThis(question) {
    setDraft(question);
    setTab("chat");
  }

  /** From the skill gap tab: "how do I learn this?" */
  function askAboutSkill(item) {
    askThis(
      `${item.skill} is required by ${item.openInternshipsRequiring} of the open internships ` +
        `and I don't have it. How should I learn it, roughly how long will it take, and what ` +
        `small project would prove it to an employer?`,
    );
  }

  /** From a "to learn" badge on a match card. */
  function askAboutMissingSkill(skill, match) {
    askThis(
      `"${match.title}" at ${match.companyName} asks for ${skill} and I do not have it yet. ` +
        `How do I learn it, roughly how long will it take, and what small project would ` +
        `prove it to that employer?`,
    );
  }

  /** From the matches tab: "why this score?" */
  function discussMatch(match) {
    askThis(
      `Tell me more about "${match.title}" at ${match.companyName}. ` +
        `My match score is ${match.matchScore}%. What should I improve before applying?`,
    );
  }

  /** From one row of an admin queue. */
  function askAboutQueueItem(queue, item) {
    askThis(
      `Under "${queue}": "${item.label}" (${item.detail}) has been waiting ` +
        `${item.daysWaiting} days. Who is being held up by this, and what should ` +
        `I do about it?`,
    );
  }

  /** From the admin "Today" tab. */
  function askAboutWorkload() {
    askThis(
      "Looking at what is waiting for review, what should I do first in this session, " +
        "and who is being held up by each delay?",
    );
  }

  /**
   * From the company tab. A specific suggested fix can be passed in, so
   * "Ask AI" on one row asks about that row rather than repeating the same
   * general question every time.
   */
  function askAboutCompany(recommendation) {
    setEmployerMode("company");
    setInternshipId("");
    askThis(
      typeof recommendation === "string" && recommendation.trim()
        ? `About this suggestion: "${recommendation}" - why does it matter, and ` +
            `what exactly should I change?`
        : "Based on the review of our listings and pipeline, why are we not getting the " +
            "applicants we want, and what should we change first?",
    );
  }

  async function send(event) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || sending) {
      return;
    }
    if (isEmployer && employerMode === "candidates" && !internshipId.trim()) {
      setError('Choose which internship to discuss, or switch to "My company".');
      return;
    }

    setError(null);
    setSending(true);
    setMessages((current) => [...current, { role: "user", text: question, notice: false }]);
    setDraft("");

    try {
      // The interface language rides along with every message, so the
      // assistant follows the EN / မြန်မာ toggle instead of needing
      // "in burmese please" typed each time. The backend appends the
      // instruction only when this is "my".
      const payload =
        isEmployer && employerMode === "candidates"
          ? {
              message: question,
              conversationId,
              internshipId: Number(internshipId),
              language,
            }
          : { message: question, conversationId, language };
      const response = isAdmin
        ? await aiApi.adminChat(payload)
        : isEmployer
          ? await aiApi.employerChat(payload)
          : await aiApi.studentChat(payload);

      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: response.answer,
          notice: Boolean(response.degraded),
          fresh: true,
        },
      ]);
      loadConversations();
    } catch (sendError) {
      setError(describeApiError(sendError));
    } finally {
      setSending(false);
    }
  }

  // ---------------------------------------------------------------- guards

  if (checkingUser) {
    return <LoadingBlock label="Checking your session..." />;
  }

  const title = isAdmin
    ? "AI administrative assistant"
    : isEmployer
      ? "AI recruitment assistant"
      : "AI career assistant";

  if (!user) {
    return (
      <div className="ijp-chat-shell">
        <PageHeader title={title} />
        <div className="ijp-card p-4">
          <EmptyState
            icon="bi-person-lock"
            title={t("Sign in to use the assistant")}
            hint="It only ever reads data belonging to the signed-in user, so it needs a session. The real login screen is Member 2's work; until then, use the Session panel on the Integration status page."
          />
        </div>
      </div>
    );
  }

  const expectedRole = isAdmin ? "ADMIN" : isEmployer ? "EMPLOYER" : "STUDENT";
  const wrongRole = user.role !== expectedRole;
  if (wrongRole) {
    return (
      <div className="ijp-chat-shell">
        <PageHeader title={title} />
        <div className="ijp-card p-4">
          <EmptyState
            icon="bi-shield-exclamation"
            title={t("This assistant is for a different role")}
            hint={`You are signed in as ${user.role}. ${title} is only available to ${expectedRole.toLowerCase()} accounts.`}
          />
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ view

  const tabs = isAdmin
    ? [
        { key: "chat", icon: "bi-chat-dots", label: t("Chat") },
        { key: "today", icon: "bi-list-check", label: t("Today") },
        { key: "history", icon: "bi-clock-history", label: t("History"), count: conversations.length },
      ]
    : isEmployer
    ? [
        { key: "chat", icon: "bi-chat-dots", label: t("Chat") },
        { key: "company", icon: "bi-building-gear", label: t("My company") },
        { key: "history", icon: "bi-clock-history", label: t("History"), count: conversations.length },
      ]
    : [
        { key: "chat", icon: "bi-chat-dots", label: t("Chat") },
        { key: "learn", icon: "bi-lightbulb", label: t("What to learn") },
        { key: "matches", icon: "bi-ui-checks-grid", label: t("Matches") },
        { key: "history", icon: "bi-clock-history", label: t("History"), count: conversations.length },
      ];

  const starters = isAdmin
    ? [
        "What should I work on first today?",
        "Which reviews have been waiting too long, and who is that holding up?",
        "Is the certificate queue growing or shrinking?",
      ]
    : isEmployer
    ? employerMode === "company"
      ? [
          "Why are we not getting applicants?",
          "Which listing is weakest, and what should I rewrite?",
          "Are we asking for skills students actually have?",
        ]
      : [
          "Who matches this internship best?",
          "Compare these candidates for me",
          "What skill gaps should I review?",
          "What should I ask them in an interview?",
        ]
    : [
        "Which internships fit my profile?",
        "What skills should I improve?",
        "What is missing from my profile?",
        "What should I learn next?",
      ];

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={
          isAdmin
            ? "What is waiting for review, what has waited too long, and who it is holding up."
            : isEmployer
            ? employerMode === "company"
              ? "Why your listings are not attracting applicants, and what to change."
              : "Compare applicants against what the vacancy asked for. Verified evidence only."
            : "Internship suggestions, profile guidance and skill-development advice."
        }
        action={
          <button type="button" className="btn btn-ijp-quiet btn-sm" onClick={startNewConversation}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />{t("New conversation")}</button>
        }
      />

      <div className="ijp-card overflow-hidden">
        <div className="d-flex ijp-tabs px-2 overflow-auto" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={`ijp-tab${tab === item.key ? " ijp-tab--active" : ""}`}
              onClick={() => setTab(item.key)}
            >
              <i className={`bi ${item.icon} me-2`} aria-hidden="true" />
              {item.label}
              {item.count ? <span className="ijp-tab-count">{item.count}</span> : null}
            </button>
          ))}
        </div>

        <div className="p-3 p-md-4">
          {tab === "chat" ? (
            <ChatTab
              isEmployer={isEmployer && !isAdmin}
              employerMode={employerMode}
              setEmployerMode={setEmployerMode}
              internships={internships}
              internshipId={internshipId}
              setInternshipId={setInternshipId}
              messages={messages}
              sending={sending}
              error={error}
              draft={draft}
              setDraft={setDraft}
              starters={starters}
              onSend={send}
              logRef={logRef}
            />
          ) : null}

          {tab === "learn" ? <SkillGapPanel onAsk={askAboutSkill} /> : null}
          {tab === "matches" ? (
            <RecommendationsPanel onDiscuss={discussMatch} onLearnSkill={askAboutMissingSkill} />
          ) : null}
          {tab === "company" ? <CompanyInsightPanel onAsk={askAboutCompany} /> : null}
          {tab === "today" ? (
            <AdminWorkloadPanel onAsk={askAboutWorkload} onAskItem={askAboutQueueItem} />
          ) : null}
          {tab === "history" ? (
            <HistoryTab
              conversations={conversations}
              conversationId={conversationId}
              onOpen={openConversation}
              onDelete={removeConversation}
            />
          ) : null}
        </div>
      </div>

      <p className="ijp-muted small mt-3 mb-0">
        {t("The assistant gives advice only. It cannot accept or reject anyone, change an application, or see unverified certificates.")}
      </p>
    </div>
  );
}

function ChatTab({
  isEmployer,
  employerMode,
  setEmployerMode,
  internships,
  internshipId,
  setInternshipId,
  messages,
  sending,
  error,
  draft,
  setDraft,
  starters,
  onSend,
  logRef,
}) {
  const { t } = useLanguage();
  const thinkingMode = !isEmployer
    ? "student"
    : employerMode === "company"
      ? "employer-company"
      : "employer-candidates";

  function followScroll() {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }

  return (
    <div className="ijp-chat-panel">
      {isEmployer ? (
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <div className="btn-group btn-group-sm" role="group" aria-label="Assistant mode">
            <button
              type="button"
              className={`btn ${
                employerMode === "candidates" ? "btn-ijp-primary" : "btn-ijp-quiet"
              }`}
              onClick={() => setEmployerMode("candidates")}
            >
              <i className="bi bi-people me-1" aria-hidden="true" />
              Applicants
            </button>
            <button
              type="button"
              className={`btn ${employerMode === "company" ? "btn-ijp-primary" : "btn-ijp-quiet"}`}
              onClick={() => setEmployerMode("company")}
            >
              <i className="bi bi-building-gear me-1" aria-hidden="true" />{t("My company")}</button>
          </div>

          {employerMode === "candidates" ? (
            <Select
              className="flex-grow-1"
              value={internshipId}
              onChange={setInternshipId}
              groups={groupByStatus(internships)}
              placeholder="Choose an internship..."
              ariaLabel="Which internship"
            />
          ) : null}
        </div>
      ) : null}

      <ErrorAlert message={error} />

      <div className="ijp-chat-log mb-3" ref={logRef}>
        {messages.length === 0 && !sending ? (
          <EmptyState
            icon="bi-chat-dots"
            title="Ask the assistant a question"
            hint="Or pick one of the suggestions below to get started."
          />
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`ijp-bubble ${
                message.role === "user"
                  ? "ijp-bubble--user"
                  : message.notice
                    ? "ijp-bubble--notice"
                    : "ijp-bubble--assistant"
              }${message.fresh ? " ijp-bubble--fresh" : ""}`}
            >
              {message.notice ? (
                <i className="bi bi-info-circle me-2" aria-hidden="true" />
              ) : null}
              {message.role !== "assistant" ? (
                message.text
              ) : message.fresh ? (
                <RevealingText text={message.text} onProgress={followScroll}>
                  {(shown, done) => <AnswerBlocks text={shown} typing={!done} />}
                </RevealingText>
              ) : (
                <AnswerBlocks text={message.text} />
              )}
            </div>
          ))
        )}
        {sending ? <ThinkingIndicator mode={thinkingMode} /> : null}
      </div>

      {/* Suggestions sit directly above the composer, where someone looks when
          they do not know what to type. They disappear once the conversation
          has started - by then the question is in their head, not ours. */}
      {messages.length === 0 ? (
        <div className="ijp-starters">
          {starters.map((question) => (
            <button
              key={question}
              type="button"
              className="ijp-chip"
              onClick={() => setDraft(question)}
            >
              <i className="bi bi-arrow-return-right" aria-hidden="true" />
              <span>{question}</span>
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={onSend} className="d-flex gap-2">
        <input
          className="form-control ijp-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask a question"
          aria-label="Your question"
          disabled={sending}
        />
        <button className="btn btn-ijp-primary flex-shrink-0" type="submit" disabled={sending}>
          <i className="bi bi-send" aria-hidden="true" />
          <span className="d-none d-sm-inline ms-2">{t("Send")}</span>
        </button>
      </form>
    </div>
  );
}

function HistoryTab({ conversations, conversationId, onOpen, onDelete }) {
  const { t } = useLanguage();
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="bi-clock-history"
        title={t("No conversations yet")}
        hint="Ask a question and it will be saved here."
      />
    );
  }

  return (
    <ul className="ijp-history">
      {conversations.map((conversation) => {
        const active = conversation.id === conversationId;
        // updatedAt, not createdAt: what matters is when you last used a
        // thread, which is also the order the list is sorted in.
        const stamp = conversation.updatedAt ?? conversation.createdAt;

        return (
          <li
            key={conversation.id}
            className={`ijp-history-item${active ? " ijp-history-item--active" : ""}`}
          >
            <button
              type="button"
              className="ijp-history-open"
              onClick={() => onOpen(conversation.id)}
            >
              <span className="ijp-history-title">
                {conversation.title ?? "Conversation"}
              </span>
              <span className="ijp-history-meta" title={exactTime(stamp)}>
                <i className="bi bi-clock" aria-hidden="true" />
                {timeAgo(stamp)}
              </span>
            </button>

            {/*
              A 2.5rem target rather than a bare icon. A delete control that is
              hard to hit is a delete control that gets hit by accident, and
              this one removes a whole thread.
            */}
            <button
              type="button"
              className="ijp-history-delete"
              onClick={() => onDelete(conversation.id)}
              aria-label={`Delete conversation: ${conversation.title ?? "Conversation"}`}
              title={t("Delete this conversation")}
            >
              <i className="bi bi-trash" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Splits vacancies into labelled groups for the picker.
 *
 * Open first, because that is what an employer almost always wants to discuss.
 * A status the backend adds later still appears, under its own heading, rather
 * than vanishing from the list.
 */
const STATUS_ORDER = ["OPEN", "DRAFT", "CLOSED", "FILLED"];

function groupByStatus(internships) {
  const buckets = new Map();
  for (const internship of internships) {
    const status = internship.status ?? "OTHER";
    if (!buckets.has(status)) {
      buckets.set(status, []);
    }
    buckets.get(status).push(internship);
  }

  return [...buckets.entries()]
    .sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a[0]);
      const bi = STATUS_ORDER.indexOf(b[0]);
      // Unknown statuses sort last rather than first.
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([status, items]) => ({
      status,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      items: items.map((internship) => ({
        value: internship.id,
        label: internship.title,
      })),
    }));
}
