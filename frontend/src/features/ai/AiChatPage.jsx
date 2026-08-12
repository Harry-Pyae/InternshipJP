import { useCallback, useEffect, useRef, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { authApi } from "../../api/authApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import PageHeader from "../../components/shared/PageHeader.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";

/**
 * The AI assistant - Member 1's vertical slice.
 *
 * One component serves both audiences because the shapes are identical; only
 * the endpoint and the copy differ:
 *   audience="student"   career guidance from the signed-in student's profile
 *   audience="employer"  candidate comparison for one internship they own
 *
 * WHAT THIS PAGE DOES NOT DO
 *   It never invents a reply. If the backend answers with degraded: true
 *   (no API key, provider unreachable, or not enough profile data), that exact
 *   explanation is shown as a notice. Nothing is presented as an AI answer
 *   unless the model produced it.
 */
export default function AiChatPage({ audience }) {
  const isEmployer = audience === "employer";

  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [draft, setDraft] = useState("");
  const [internshipId, setInternshipId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await aiApi.conversations());
    } catch {
      // History is a convenience; failing to load it must not block the chat.
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function openConversation(id) {
    setError(null);
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

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  async function send(event) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || sending) {
      return;
    }
    if (isEmployer && !internshipId.trim()) {
      setError("Enter the id of the internship you want to discuss.");
      return;
    }

    setError(null);
    setSending(true);
    setMessages((current) => [...current, { role: "user", text: question, notice: false }]);
    setDraft("");

    try {
      const payload = isEmployer
        ? { message: question, conversationId, internshipId: Number(internshipId) }
        : { message: question, conversationId };
      const response = isEmployer
        ? await aiApi.employerChat(payload)
        : await aiApi.studentChat(payload);

      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: response.answer, notice: Boolean(response.degraded) },
      ]);
      loadConversations();
    } catch (sendError) {
      setError(describeApiError(sendError));
    } finally {
      setSending(false);
    }
  }

  if (checkingUser) {
    return <LoadingBlock label="Checking your session..." />;
  }

  if (!user) {
    return (
      <>
        <PageHeader title={isEmployer ? "Employer assistant" : "Student assistant"} />
        <div className="ijp-card p-4">
          <EmptyState
            icon="bi-person-lock"
            title="Sign in to use the assistant"
            hint="The assistant only ever reads data belonging to the signed-in user, so it needs a session. The login screen is Member 2's work; until it exists you can sign in with POST /api/auth/login."
          />
        </div>
      </>
    );
  }

  const wrongRole = isEmployer ? user.role !== "EMPLOYER" : user.role !== "STUDENT";
  if (wrongRole) {
    return (
      <>
        <PageHeader title={isEmployer ? "Employer assistant" : "Student assistant"} />
        <div className="ijp-card p-4">
          <EmptyState
            icon="bi-shield-exclamation"
            title="This assistant is for a different role"
            hint={`You are signed in as ${user.role}. ${
              isEmployer ? "The employer assistant" : "The student assistant"
            } is only available to ${isEmployer ? "employers" : "students"}.`}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isEmployer ? "Employer assistant" : "Student assistant"}
        subtitle={
          isEmployer
            ? "Compare the people who applied to one of your internships, using verified information only."
            : "Ask about internships that match your profile, and what to improve."
        }
        action={
          <button type="button" className="btn btn-outline-secondary" onClick={startNewConversation}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            New conversation
          </button>
        }
      />

      <div className="row g-4">
        <div className="col-12 col-lg-4 order-lg-2">
          <div className="ijp-card p-4">
            <h2 className="ijp-status-label mb-3">Your conversations</h2>
            {conversations.length === 0 ? (
              <p className="ijp-muted small mb-0">Nothing yet. Ask a question to start one.</p>
            ) : (
              <ul className="list-unstyled d-grid gap-2 mb-0">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      className={`btn btn-sm w-100 text-start ${
                        conversation.id === conversationId ? "btn-ijp-primary" : "btn-outline-secondary"
                      }`}
                      onClick={() => openConversation(conversation.id)}
                    >
                      <span className="d-block text-truncate">
                        {conversation.title ?? "Conversation"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-8 order-lg-1">
          <div className="ijp-card p-4">
            <ErrorAlert message={error} />

            <div className="ijp-chat-scroll d-grid gap-3 mb-3" ref={scrollRef}>
              {messages.length === 0 ? (
                <EmptyState
                  icon="bi-chat-dots"
                  title="Ask the assistant a question"
                  hint={
                    isEmployer
                      ? "For example: which of these candidates best matches the required skills, and what should I ask them?"
                      : "For example: which open internships suit my skills, and what should I learn next?"
                  }
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
                    }`}
                  >
                    {message.notice ? (
                      <i className="bi bi-info-circle me-2" aria-hidden="true" />
                    ) : null}
                    {message.text}
                  </div>
                ))
              )}
              {sending ? <LoadingBlock label="The assistant is thinking..." /> : null}
            </div>

            <form onSubmit={send} className="d-grid gap-2">
              {isEmployer ? (
                <div>
                  <label className="form-label small fw-semibold" htmlFor="internshipId">
                    Internship id
                  </label>
                  <input
                    id="internshipId"
                    className="form-control"
                    inputMode="numeric"
                    value={internshipId}
                    onChange={(event) => setInternshipId(event.target.value)}
                    placeholder="e.g. 3"
                  />
                  <p className="ijp-muted small mb-0 mt-1">
                    Only internships owned by your company can be discussed. The employer
                    internship list is Member 3&apos;s screen; until it exists, take the id from
                    GET /api/employer/internships.
                  </p>
                </div>
              ) : null}

              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type your question"
                  aria-label="Your question"
                />
                <button className="btn btn-ijp-primary" type="submit" disabled={sending}>
                  <i className="bi bi-send me-1" aria-hidden="true" />
                  Send
                </button>
              </div>
            </form>

            <p className="ijp-muted small mb-0 mt-3">
              The assistant gives advice only. It cannot accept or reject anyone, change an
              application, or see unverified certificates.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
