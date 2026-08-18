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
export default function AdminWorkloadPanel({ onAsk }) {
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

  return (
    <div>
      <p className="small mb-3">{workload.summary}</p>

      <div className="row g-2 mb-4">
        <Stat label="Certificates" value={workload.certificatesPending} />
        <Stat label="Companies" value={workload.companiesPending} />
        <Stat label="Stalled" value={workload.applicationsStalled} />
        <Stat label="Suspended" value={workload.suspendedAccounts} />
      </div>

      <Queue
        title="Certificates waiting longest"
        items={workload.oldestCertificates}
        emptyText="Nothing waiting. The verification queue is clear."
      />
      <Queue
        title="Companies waiting for approval"
        items={workload.oldestCompanies}
        emptyText="Nothing waiting. No company is blocked from publishing."
      />
      <Queue
        title="Applications no employer has opened"
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
      <div className="ijp-card-sunken p-2 text-center">
        <div className="ijp-score">{value}</div>
        <div className="ijp-muted" style={{ fontSize: "0.72rem" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function Queue({ title, items, emptyText, note }) {
  return (
    <div className="mb-4">
      <p className="ijp-label mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="ijp-muted small mb-0">{emptyText}</p>
      ) : (
        <ul className="list-unstyled d-grid gap-2 mb-0">
          {items.map((item) => (
            <li
              key={`${title}-${item.id}`}
              className={`ijp-card-sunken ijp-rail ijp-rail--${item.urgency} p-2 ps-3`}
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <p className="small fw-semibold mb-0">{item.label}</p>
                  <p className="ijp-muted mb-0" style={{ fontSize: "0.78rem" }}>
                    {item.detail}
                  </p>
                </div>
                <span className={`ijp-badge ijp-badge--${item.urgency} flex-shrink-0`}>
                  {item.daysWaiting}d
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="ijp-muted small mb-0 mt-2">{note}</p> : null}
    </div>
  );
}
