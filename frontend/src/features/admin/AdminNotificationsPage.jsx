import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/shared/PageHeader.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";

export default function AdminNotificationsPage() {
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await adminApi.listNotifications({ page: 0, size: 30 })); }
    catch (requestError) { setError(describeApiError(requestError)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id) {
    try { await adminApi.markNotificationRead(id); await load(); }
    catch (requestError) { setError(describeApiError(requestError)); }
  }

  async function markAllRead() {
    try { await adminApi.markAllNotificationsRead(); await load(); }
    catch (requestError) { setError(describeApiError(requestError)); }
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Approval decisions and platform events for your administrator account." action={<button type="button" className="btn btn-sm btn-ijp-quiet" onClick={markAllRead}>Mark all read</button>} />
      <ErrorAlert message={error} onRetry={load} />
      <div className="ijp-card p-4">
        {loading ? <LoadingBlock label="Loading notifications..." /> : data.content.length === 0 ? <p className="ijp-muted mb-0">No notifications.</p> : (
          <div className="d-grid gap-2">
            {data.content.map((item) => (
              <div key={item.id} className={`ijp-card-sunken p-3${item.read ? "" : " ijp-rail ijp-rail--warn"}`}>
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1"><strong>{item.title}</strong>{item.read ? null : <StatusBadge value="PENDING" />}</div>
                    <p className="small mb-1">{item.message}</p>
                    <p className="ijp-muted mb-0" style={{ fontSize: "0.78rem" }}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
                  </div>
                  {!item.read ? <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={() => markRead(item.id)}>Mark read</button> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
