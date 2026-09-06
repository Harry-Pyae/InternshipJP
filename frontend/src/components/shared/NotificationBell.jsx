import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { notificationApi } from "../../api/accountApi.js";
import { useLanguage } from "../../config/languageContext.jsx";
import { timeAgo } from "../../api/relativeTime.js";

/**
 * The unread indicator and a peek at the newest notifications.
 */
const POLL_MS = 60000;

export default function NotificationBell({ basePath }) {
  const { t } = useLanguage();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const rootRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const result = await notificationApi.unreadCount();
      setUnread(result?.unread ?? 0);
    } catch {
      // A failed poll is not worth telling anyone about. The next one may work,
      // and an error toast every minute would be worse than a stale number.
    }
  }, []);

  useEffect(() => {
    refreshCount();
    let timer = window.setInterval(refreshCount, POLL_MS);

    function onVisibility() {
      window.clearInterval(timer);
      if (!document.hidden) {
        refreshCount();
        timer = window.setInterval(refreshCount, POLL_MS);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshCount]);

  // Reading the notifications page is the most likely way the count changes,
  // so re-check whenever the route does.
  useEffect(() => {
    refreshCount();
  }, [location.pathname, refreshCount]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKey(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setItems(null);
    try {
      const page = await notificationApi.list({ size: 5 });
      setItems(page?.content ?? []);
    } catch {
      setItems([]);
    }
  }

  return (
    <div className="ijp-bell" ref={rootRef}>
      <button
        type="button"
        className="ijp-icon-btn ijp-bell-btn"
        onClick={toggle}
        aria-expanded={open}
        aria-label={
          unread > 0 ? `${t("bell.title")} — ${unread} ${t("bell.unread")}` : t("bell.title")
        }
      >
        <i className={`bi ${unread > 0 ? "bi-bell-fill" : "bi-bell"}`} aria-hidden="true" />
        {unread > 0 ? (
          <span className="ijp-bell-dot">{unread > 9 ? "9+" : unread}</span>
        ) : null}
      </button>

      {open ? (
        <div className="ijp-bell-panel" role="dialog" aria-label={t("bell.title")}>
          <div className="ijp-bell-head">
            <span className="ijp-label mb-0">{t("bell.title")}</span>
            {unread > 0 ? (
              <button
                type="button"
                className="btn btn-sm btn-ijp-quiet"
                onClick={async () => {
                  await notificationApi.markAllRead();
                  setUnread(0);
                  setItems((current) =>
                    (current ?? []).map((item) => ({ ...item, read: true })),
                  );
                }}
              >
                {t("action.markAllRead")}
              </button>
            ) : null}
          </div>

          {items === null ? (
            <p className="ijp-muted small p-3 mb-0">...</p>
          ) : items.length === 0 ? (
            <p className="ijp-muted small p-3 mb-0">{t("bell.empty")}</p>
          ) : (
            <ul className="ijp-bell-list">
              {items.map((item) => (
                <li key={item.id} className={item.read ? "" : "ijp-bell-item--unread"}>
                  <span className="ijp-bell-text">{t(item.title) || item.message}</span>
                  <span className="ijp-bell-time">{timeAgo(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}

          <Link
            className="ijp-bell-foot"
            to={`${basePath}/notifications`}
            onClick={() => setOpen(false)}
          >
            {t("bell.viewAll")}
            <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
