import { useCallback, useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";

/**
 * "What should I work on today?" - the administrator's calculated report.
 *
 * WHY EVERY ROW SHOWS AN AGE
 *   A queue length tells you almost nothing. Five pending certificates could
 *   be five minutes old. What matters is that one has been waiting eleven
 *   days - because for eleven days a student has been unable to show that
 *   qualification to any employer. The delay is ours; the cost is theirs.
 *
 * No AI provider call. This works with no API key.
 *
 * Owner: Member 1 (AI). Member 4 owns the admin screens that use it.
 */
export default function AdminWorkloadPanel({ onAsk, onAskItem }) {
  const [workload, setWorkload] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setWorkload(await aiApi.adminWorkload());
    } catch (loadError) {
      setError(describeApiError(loadError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorAlert message={error} onRetry={load} />;
  }
  if (workload === null) {
    return <LoadingBlock label="Checking what is waiting for you..." />;
  }

  // Amber only when something has actually crossed the overdue threshold. A
  // banner that is permanently yellow stops being a signal.
  const overdue = [
    ...workload.oldestCertificates,
    ...workload.oldestCompanies,
    ...workload.stalledApplications,
  ].some((item) => item.urgency === "bad");

  return (
    <div>
      <div className={`ijp-callout${overdue ? " ijp-callout--warn" : ""}`}>
        <i
          className={`bi ${overdue ? "bi-clock-history" : "bi-info-circle"} ijp-callout-icon`}
          aria-hidden="true"
        />
        <p className="mb-0">{workload.summary}</p>
      </div>

      <div className="row g-3 ijp-workload-stats">
        <Stat label="Certificates" value={workload.certificatesPending} />
        <Stat label="Companies" value={workload.companiesPending} />
        <Stat label="Stalled" value={workload.applicationsStalled} />
        <Stat label="Suspended" value={workload.suspendedAccounts} />
      </div>

      <Queue
        title="Certificates waiting longest"
        onAskItem={onAskItem}
        items={workload.oldestCertificates}
        emptyText="Nothing waiting. The verification queue is clear."
      />
      <Queue
        title="Companies waiting for approval"
        onAskItem={onAskItem}
        items={workload.oldestCompanies}
        emptyText="Nothing waiting. No company is blocked from publishing."
      />
      <Queue
        title="Applications no employer has opened"
        onAskItem={onAskItem}
        items={workload.stalledApplications}
        emptyText="None. Employers are responding to applicants."
        note="You cannot decide these - only the employer can. Worth a reminder."
      />

      {workload.priorities.length > 0 ? (
        <>
          <p className="ijp-label mb-2">Suggested order</p>
          <ol className="small ps-3 mb-3">
            {workload.priorities.map((item) => (
              <li key={item} className="mb-1">
                {item}
              </li>
            ))}
          </ol>
        </>
      ) : null}

      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
          Refresh
        </button>
        <button type="button" className="btn btn-sm btn-ijp-quiet" onClick={onAsk}>
          Ask the assistant to plan my session
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="col-6 col-xl-3">
      <div className="ijp-card-sunken ijp-stat">
        <div className="ijp-stat-value">{value}</div>
        <div className="ijp-stat-label">{label}</div>
      </div>
    </div>
  );
}

function Queue({ title, items, emptyText, note, onAskItem }) {
  return (
    <div className="mb-4">
      <p className="ijp-label mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="ijp-muted small mb-0">{emptyText}</p>
      ) : (
        <ul className="ijp-queue-grid">
          {items.map((item) => (
            <li
              key={`${title}-${item.id}`}
              className={`ijp-card-sunken ijp-rail ijp-rail--${item.urgency} ijp-queue-item`}
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <p className="small fw-semibold mb-0">{item.label}</p>
                  <p className="ijp-muted mb-0" style={{ fontSize: "0.78rem" }}>
                    {item.detail}
                  </p>
                </div>
                <span className={`ijp-badge ijp-badge--${item.urgency} ijp-days flex-shrink-0`}>
                  {item.daysWaiting}d
                </span>
              </div>
              {onAskItem ? (
                <button
                  type="button"
                  className="btn btn-sm btn-ijp-quiet ijp-queue-action"
                  onClick={() => onAskItem(title, item)}
                >
                  <i className="bi bi-stars me-1" aria-hidden="true" />
                  Ask AI
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="ijp-muted small mb-0 mt-2">{note}</p> : null}
    </div>
  );
}
