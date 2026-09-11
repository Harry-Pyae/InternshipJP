import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * What each kind of notification is about, and where the work is done.
 *
 * An administrator reading "Certificate waiting for verification" has to get
 * to the queue to act on it, and previously the page gave them no way through.
 * The destination is the queue rather than the individual record, because a
 * notification carries no reference to the row it was raised for.
 */
const KINDS = {
  CERTIFICATE_VERIFICATION_REQUESTED: {
    group: "certificates",
    icon: "bi-patch-check",
    tone: "signal",
    label: "Certificate review",
    to: "/admin/certificates",
    cta: "Open the certificate queue",
  },
  COMPANY_APPROVAL_REQUESTED: {
    group: "companies",
    icon: "bi-building",
    tone: "pending",
    label: "Company approval",
    to: "/admin/employers",
    cta: "Open the company queue",
  },
  FEEDBACK: {
    group: "feedback",
    icon: "bi-chat-left-text",
    tone: "verified",
    label: "Feedback",
    to: "/admin/faq",
    cta: "Open the feedback inbox",
  },
};

const FALLBACK = {
  group: "other",
  icon: "bi-bell",
  tone: "neutral",
  label: "Platform",
  to: "/admin/dashboard",
  cta: "Open the dashboard",
};

const kindOf = (type) => KINDS[type] ?? FALLBACK;

export default function AdminNotificationsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.listNotifications({ page: 0, size: 50 }));
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id) {
    try {
      await adminApi.markNotificationRead(id);
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }

  async function markAllRead() {
    try {
      await adminApi.markAllNotificationsRead();
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }

  const items = data.content ?? [];

  // Counts drive the filter chips, so a chip never offers an empty view.
  const counts = useMemo(() => {
    const c = { all: items.length, unread: 0, certificates: 0, companies: 0, feedback: 0, other: 0 };
    items.forEach((item) => {
      if (!item.read) c.unread += 1;
      c[kindOf(item.type).group] += 1;
    });
    return c;
  }, [items]);

  const shown = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "unread") return !item.read;
    return kindOf(item.type).group === filter;
  });

  const unread = shown.filter((item) => !item.read);
  const earlier = shown.filter((item) => item.read);

  const chips = [
    ["all", t("All")],
    ["unread", t("Unread")],
    ["certificates", t("Certificates")],
    ["companies", t("Companies")],
    ["feedback", t("Feedback")],
  ].filter(([key]) => key === "all" || counts[key] > 0);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Every item raised for administrators, newest first. Open the queue to act on one."
        action={
          counts.unread > 0 ? (
            <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={markAllRead}>
              <i className="bi bi-check2-all me-1" aria-hidden="true" />
              {t("Mark all read")}
            </button>
          ) : null
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      {loading ? (
        <div className="ijp-card p-4">
          <LoadingBlock label={t("Loading notifications...")} />
        </div>
      ) : (
        <>
          <div className="ijp-anotif-guide">
            <i className="bi bi-info-circle ijp-anotif-guide-icon" aria-hidden="true" />
            <p className="mb-0">
              {t("A notification records that something needs a decision. It is not the decision itself: open the queue it points to, act there, and the item clears from the queue.")}
            </p>
          </div>

          {items.length > 0 ? (
            <div className="ijp-anotif-filters" role="group" aria-label={t("Filter notifications")}>
              {chips.map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={`ijp-anotif-chip${filter === key ? " ijp-anotif-chip--on" : ""}`}
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                >
                  {label}
                  <span className="ijp-anotif-chip-n">{counts[key]}</span>
                </button>
              ))}
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="ijp-card p-4">
              <EmptyState
                icon="bi-bell-slash"
                title={t("Nothing waiting")}
                hint={t("Certificate uploads, company registrations and feedback all appear here.")}
              />
            </div>
          ) : shown.length === 0 ? (
            <div className="ijp-card p-4">
              <p className="ijp-muted mb-0">{t("Nothing in this filter.")}</p>
            </div>
          ) : (
            <>
              <Group
                t={t}
                title={t("Needs your attention")}
                note={t("Unread. Open the queue to deal with it.")}
                items={unread}
                onMarkRead={markRead}
                emptyNote={t("Everything here has been read.")}
              />
              <Group
                t={t}
                title={t("Earlier")}
                note={t("Already read, kept for reference.")}
                items={earlier}
                onMarkRead={markRead}
                muted
              />
            </>
          )}
        </>
      )}
    </>
  );
}

/** One titled block of notifications. */
function Group({ t, title, note, items, onMarkRead, emptyNote, muted }) {
  if (items.length === 0 && !emptyNote) return null;
  return (
    <section className="ijp-anotif-group">
      <div className="ijp-anotif-group-head">
        <h2 className="ijp-anotif-group-title">{title}</h2>
        <span className="ijp-anotif-group-count">{items.length}</span>
        <span className="ijp-anotif-group-note">{note}</span>
      </div>

      {items.length === 0 ? (
        <p className="ijp-muted small mb-0">{emptyNote}</p>
      ) : (
        <ul className="ijp-anotif-list">
          {items.map((item) => (
            <Row
              key={item.id}
              t={t}
              item={item}
              onMarkRead={onMarkRead}
              muted={muted}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One notification, with the route to where the work is actually done. */
function Row({ t, item, onMarkRead, muted }) {
  const kind = kindOf(item.type);
  return (
    <li className={`ijp-anotif ijp-notif--${kind.tone}${muted ? " ijp-anotif--muted" : ""}`}>
      <span className="ijp-anotif-icon" aria-hidden="true">
        <i className={`bi ${kind.icon}`} />
      </span>

      <div className="ijp-anotif-main">
        <p className="ijp-anotif-kicker">{t(kind.label)}</p>
        <p className="ijp-anotif-title">{item.title}</p>
        <p className="ijp-anotif-message">{item.message}</p>
        <p className="ijp-anotif-when">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
        </p>
      </div>

      <div className="ijp-anotif-actions">
        <Link className="btn btn-sm btn-ijp-primary" to={kind.to}>
          {t(kind.cta)}
          <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
        </Link>
        {!item.read ? (
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={() => onMarkRead(item.id)}
          >
            {t("Mark read")}
          </button>
        ) : null}
      </div>
    </li>
  );
}
