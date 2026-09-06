import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { notificationApi } from "../../api/accountApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import { useAuth } from "../../config/authContext.jsx";
import { timeAgo, exactTime } from "../../api/relativeTime.js";

/**
 * The notification feed.
 *
 * Clicking a notification takes you to the thing it is about, rather than to a
 * page about the notification. A row carries a type, a title, a message and a
 * timestamp - all four already visible in the list - so a detail page would
 * have shown the same words in a larger font.
 *
 * The destination is derived from the type, because a notification stores no
 * reference to the record that caused it. That means you land on the right
 * queue rather than the exact row. Adding a reference_id column would fix
 * that; it is a schema change, and noted rather than done.
 */
const ROUTES = {
  CERTIFICATE_VERIFICATION_REQUESTED: { ADMIN: "/admin/certificates" },
  COMPANY_APPROVAL_REQUESTED: { ADMIN: "/admin/employers" },
  CERTIFICATE_VERIFIED: { STUDENT: "/student/certificates" },
  CERTIFICATE_REJECTED: { STUDENT: "/student/certificates" },
  APPLICATION_STATUS_CHANGED: { STUDENT: "/student/applications" },
  APPLICATION_MESSAGE: { STUDENT: "/student/applications" },
  ACCOUNT_STATUS_CHANGED: {
    STUDENT: "/student/settings",
    EMPLOYER: "/employer/settings",
    ADMIN: "/admin/settings",
  },
};

/** Icon and tone per family, so a glance is enough to sort them. */
const LOOKS = [
  { match: /CERTIFICATE/, icon: "bi-patch-check", tone: "ok", group: "Certificates" },
  { match: /APPLICATION/, icon: "bi-send", tone: "signal", group: "Applications" },
  { match: /COMPANY/, icon: "bi-building", tone: "warn", group: "Companies" },
  { match: /ACCOUNT/, icon: "bi-person-gear", tone: "unknown", group: "Account" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "applications", label: "Applications" },
  { key: "system", label: "System" },
];

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await notificationApi.list({ size: 50 });
      setItems(page?.content ?? []);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    if (!items) {
      return [];
    }
    if (tab === "unread") {
      return items.filter((n) => !n.read);
    }
    if (tab === "applications") {
      return items.filter((n) => /APPLICATION/i.test(n.type ?? ""));
    }
    if (tab === "system") {
      return items.filter((n) => !/APPLICATION/i.test(n.type ?? ""));
    }
    return items;
  }, [items, tab]);

  /**
   * Today / This week / Earlier.
   *
   * A flat list of fifty rows all saying "3 weeks ago" is hard to scan; the
   * bands answer "is any of this recent?" before you read a single one.
   */
  const groups = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(startOfToday.getTime() - 6 * 86400000);
    const buckets = { Today: [], "This week": [], Earlier: [] };
    for (const item of shown) {
      const when = item.createdAt ? new Date(item.createdAt) : null;
      if (when && when >= startOfToday) {
        buckets.Today.push(item);
      } else if (when && when >= weekAgo) {
        buckets["This week"].push(item);
      } else {
        buckets.Earlier.push(item);
      }
    }
    return Object.entries(buckets).filter(([, list]) => list.length > 0);
  }, [shown]);

  const unread = items ? items.filter((n) => !n.read).length : 0;

  async function open(item) {
    // Mark read optimistically: the row should respond to the click, not wait
    // for a round trip before the page changes underneath it.
    if (!item.read) {
      setItems((current) =>
        current.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
      notificationApi.markRead(item.id).catch(() => {
        // If it fails the row reappears as unread on the next load, which is
        // the honest outcome - better than a toast nobody can act on.
      });
    }
    const target = ROUTES[item.type]?.[user?.role];
    if (target) {
      navigate(target);
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Updates on your applications, approvals and account."
        action={
          unread > 0 ? (
            <button
              type="button"
              className="btn btn-sm btn-ijp-quiet"
              onClick={async () => {
                await notificationApi.markAllRead();
                setItems((current) => current.map((n) => ({ ...n, read: true })));
              }}
            >
              <i className="bi bi-check2-all me-1" aria-hidden="true" />
              {t("action.markAllRead")}
            </button>
          ) : null
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      <div className="ijp-card overflow-hidden">
        <div className="d-flex ijp-tabs px-2 overflow-auto" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={`ijp-tab${tab === item.key ? " ijp-tab--active" : ""}`}
              onClick={() => setTab(item.key)}
            >
              {t(item.label)}
              {item.key === "unread" && unread > 0 ? (
                <span className="ijp-tab-count">{unread}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="p-3 p-md-4">
          {items === null ? (
            <LoadingBlock label="Loading your notifications..." />
          ) : shown.length === 0 ? (
            <EmptyState
              icon="bi-bell"
              title={tab === "unread" ? "Nothing unread" : "No notifications yet"}
              hint={
                tab === "unread"
                  ? "You are up to date."
                  : "Updates about your applications and approvals will appear here."
              }
            />
          ) : (
            groups.map(([band, list]) => (
              <div className="mb-4" key={band}>
                <p className="ijp-label mb-2">{t(band)}</p>
                <ul className="ijp-notif-list">
                  {list.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onOpen={open}
                      clickable={Boolean(ROUTES[item.type]?.[user?.role])}
                    />
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function NotificationRow({ item, onOpen, clickable }) {
  const { t } = useLanguage();
  const look = LOOKS.find((l) => l.match.test(item.type ?? "")) ?? {
    icon: "bi-bell",
    tone: "unknown",
    group: "System",
  };

  return (
    <li className={`ijp-notif${item.read ? "" : " ijp-notif--unread"}`}>
      {/* The whole row is the control when there is somewhere to go, and a
          plain <li> when there is not - so nothing looks clickable and then
          does nothing. */}
      <button
        type="button"
        className={`ijp-notif-hit${clickable ? " ijp-notif-hit--link" : ""}`}
        onClick={() => onOpen(item)}
        disabled={!clickable && item.read}
      >
        <span className={`ijp-notif-icon ijp-notif-icon--${look.tone}`}>
          <i className={`bi ${look.icon}`} aria-hidden="true" />
        </span>

        <span className="ijp-notif-body">
          {item.title ? <span className="ijp-notif-title">{t(item.title)}</span> : null}
          <span className="ijp-notif-text">{item.message}</span>
          <span className="ijp-notif-meta" title={exactTime(item.createdAt)}>
            <i className="bi bi-clock" aria-hidden="true" />
            {timeAgo(item.createdAt)}
            <span className="ijp-notif-type">{t(look.group)}</span>
          </span>
        </span>

        {clickable ? (
          <i className="bi bi-chevron-right ijp-notif-go" aria-hidden="true" />
        ) : null}
      </button>
    </li>
  );
}
