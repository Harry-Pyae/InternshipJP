import { useCallback, useEffect, useState } from "react";

import PageHeader from "../../components/shared/PageHeader.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";

import { adminApi } from "../../api/adminApi.js";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

export default function AdminReportsPage() {
  const { t, language } = useLanguage();
  const [workload, setWorkload] = useState(null);
  const [summary, setSummary] = useState(null);
  const [usage, setUsage] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [workloadResult, summaryResult, usageResult] = await Promise.all([
        aiApi.adminWorkload(language),
        adminApi.getAiUsageSummary(),
        adminApi.getAiUsage({ page: 0, size: 20 }),
      ]);
      setWorkload(workloadResult);
      setSummary(summaryResult);
      setUsage(usageResult);
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoading(false);
    }
    // The workload sentences are built server-side, so a language change
    // has to refetch.
  }, [language]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Platform workload, review queues and AI operational activity."
        action={<button type="button" className="btn btn-sm btn-ijp-quiet" onClick={load}>Refresh</button>}
      />

      <ErrorAlert message={error} onRetry={load} />

      {loading && !workload ? <LoadingBlock label="Loading reports..." /> : null}

      {workload && summary ? (
        <>
          {/*
            Four bands, each with its own heading OUTSIDE the grid. The first
            version put the headings inside a column, so "Review queues" sat
            above one card while the card beside it had no heading at all -
            which is what made the page feel cramped and misaligned.
          */}
          <section className="ijp-report-section">
            <div className="ijp-section-head">
              <h2 className="ijp-section-title">{t("Platform")}</h2>
              <p className="ijp-section-note">{t("Who is on it, and what is stuck.")}</p>
            </div>
            <div className="row g-3">
              <div className="col-6 col-xl-3">
                <StatCard label="Students" value={workload.totalStudents} icon="bi-mortarboard" />
              </div>
              <div className="col-6 col-xl-3">
                <StatCard label="Employers" value={workload.totalEmployers} icon="bi-briefcase" />
              </div>
              <div className="col-6 col-xl-3">
                <StatCard
                  label="Suspended"
                  value={workload.suspendedAccounts}
                  icon="bi-person-x"
                  tone={workload.suspendedAccounts ? "bad" : "ok"}
                />
              </div>
              <div className="col-6 col-xl-3">
                <StatCard
                  label="Stalled applications"
                  value={workload.applicationsStalled}
                  icon="bi-hourglass-split"
                  tone={workload.applicationsStalled ? "warn" : "ok"}
                />
              </div>
            </div>
          </section>

          <section className="ijp-report-section">
            <div className="ijp-section-head">
              <h2 className="ijp-section-title">{t("Review queues")}</h2>
              <p className="ijp-section-note">{t("What is waiting for a decision, and for how long.")}</p>
            </div>
            <div className="row g-4">
              <div className="col-12 col-xl-6">
                <SectionCard title="Workload">
                  <p className="mb-3">{workload.summary}</p>
                  <div className="row g-2 mb-4">
                    <MiniStat label="Certificates pending" value={workload.certificatesPending} />
                    <MiniStat label="Companies pending" value={workload.companiesPending} />
                  </div>
                  <p className="ijp-label mb-2">Priorities</p>
                  <ol className="ijp-fix-list mb-0">
                    {workload.priorities.map((item, index) => (
                      <li className="ijp-fix" key={item}>
                        <span className="ijp-fix-number">{index + 1}</span>
                        <span className="ijp-fix-text">{item}</span>
                      </li>
                    ))}
                  </ol>
                </SectionCard>
              </div>

              <div className="col-12 col-xl-6">
                <SectionCard title="AI usage">
                  <div className="row g-2">
                    <MiniStat label="Total calls" value={summary.totalCalls} />
                    <MiniStat label="Successful" value={summary.successfulCalls} />
                    <MiniStat label="Failed" value={summary.failedCalls} />
                    <MiniStat label="Provider" value={summary.provider || "—"} />
                  </div>
                  <p className="ijp-muted small mt-3 mb-0">
                    {summary.configured
                      ? "The configured AI provider is available to the backend."
                      : "The AI provider is not configured."}
                  </p>
                </SectionCard>
              </div>
            </div>
          </section>

          <section className="ijp-report-section">
            <div className="ijp-section-head">
              <h2 className="ijp-section-title">{t("Oldest pending work")}</h2>
              <p className="ijp-section-note">{t("The item in each queue that has waited longest.")}</p>
            </div>
            <div className="row g-4">
              <Queue title={t("Certificates")} items={workload.oldestCertificates} />
              <Queue title={t("Companies")} items={workload.oldestCompanies} />
              <Queue title={t("Stalled applications")} items={workload.stalledApplications} />
            </div>
          </section>

          <section className="ijp-report-section">
            <div className="ijp-section-head">
              <h2 className="ijp-section-title">{t("AI activity")}</h2>
              <p className="ijp-section-note">{t("Every call the assistants made, and whether it succeeded.")}</p>
            </div>
            <div className="ijp-card p-3 p-md-4">
              <DataTable
                columns={[
                  { key: "feature", header: "Feature" },
                  { key: "provider", header: "Provider" },
                  { key: "model", header: "Model", render: (row) => row.model || "—" },
                  {
                    key: "success",
                    header: "Result",
                    render: (row) => <StatusBadge value={row.success ? "ACTIVE" : "REJECTED"} />,
                  },
                  { key: "totalTokens", header: "Tokens", render: (row) => row.totalTokens ?? "—" },
                  {
                    key: "durationMs",
                    header: "Duration",
                    render: (row) => (row.durationMs == null ? "—" : `${row.durationMs} ms`),
                  },
                  { key: "createdAt", header: "Time", render: (row) => formatDate(row.createdAt) },
                ]}
                rows={usage.content}
                rowKey={(row) => row.id}
                empty={{
                  icon: "bi-stars",
                  title: "No AI usage recorded",
                  hint: "Provider calls appear here once the assistants are used.",
                }}
              />
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="col-6">
      <div className="ijp-card-sunken p-3 h-100">
        <p className="ijp-label mb-1">{label}</p>
        <div className="ijp-score">{value}</div>
      </div>
    </div>
  );
}

function Queue({ title, items = [] }) {
  const { t } = useLanguage();
  return (
    <div className="col-12 col-lg-4">
      <p className="ijp-label mb-2">{title}</p>
      {items.length === 0 ? <p className="ijp-muted small mb-0">{t("Nothing waiting.")}</p> : (
        <div className="d-grid gap-2">
          {items.map((item) => (
            <div key={`${title}-${item.id}`} className={`ijp-card-sunken ijp-rail ijp-rail--${item.urgency} p-3`}>
              <div className="d-flex justify-content-between gap-2">
                <div>
                  <div className="small fw-semibold">{item.label}</div>
                  <div className="ijp-muted" style={{ fontSize: "0.78rem" }}>{item.detail}</div>
                </div>
                <span className={`ijp-badge ijp-badge--${item.urgency}`}>{item.daysWaiting}d</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}
