import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import DataTable from "../../components/shared/DataTable.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";

import { adminApi } from "../../api/adminApi.js";
import { aiApi } from "../../api/aiApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

function getTotal(pageResult) {
  if (!pageResult) return 0;

  if (typeof pageResult.totalElements === "number") {
    return pageResult.totalElements;
  }

  if (typeof pageResult.total === "number") {
    return pageResult.total;
  }

  if (Array.isArray(pageResult.content)) {
    return pageResult.content.length;
  }

  if (Array.isArray(pageResult.items)) {
    return pageResult.items.length;
  }

  return 0;
}

function getRows(pageResult) {
  if (!pageResult) return [];

  if (Array.isArray(pageResult.content)) {
    return pageResult.content;
  }

  if (Array.isArray(pageResult.items)) {
    return pageResult.items;
  }

  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

/**
 * One figure on the dashboard.
 */
function DashboardStat({
  label,
  value,
  icon,
  description,
  href,
  tone = "normal",
}) {
  const { t } = useLanguage();
  const toneClass =
    tone === "warning" ? "ijp-state--warn" : tone === "danger" ? "ijp-state--bad" : "";

  const content = (
    <>
      <div className="ijp-metric-head">
        <span className="ijp-label">{t(label)}</span>
        <span className={`ijp-metric-icon${toneClass ? ` ijp-metric-icon--${tone}` : ""}`}>
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
      </div>

      <p className={`ijp-metric-value ${toneClass}`}>{value}</p>

      <p className="ijp-metric-desc">{t(description)}</p>

      {href ? (
        <span className="ijp-metric-go">
          {t("action.view")}
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link to={href} className="ijp-metric ijp-metric--link">
        {content}
      </Link>
    );
  }

  return <div className="ijp-metric">{content}</div>;
}

export default function AdminDashboardPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const results = await Promise.allSettled([
        // 0 - all students
        adminApi.listUsers({
          role: "STUDENT",
          page: 0,
          size: 1,
        }),

        // 1 - all employers
        adminApi.listUsers({
          role: "EMPLOYER",
          page: 0,
          size: 1,
        }),

        // 2 - all administrators
        adminApi.listUsers({
          role: "ADMIN",
          page: 0,
          size: 1,
        }),

        // 3 - suspended accounts
        adminApi.listUsers({
          status: "SUSPENDED",
          page: 0,
          size: 1,
        }),

        // 4 - recent users
        adminApi.listUsers({
          page: 0,
          size: 5,
        }),

        // 5 - pending companies
        adminApi.listPendingEmployers({
          page: 0,
          size: 1,
        }),

        // 6 - pending certificates
        adminApi.listPendingCertificates({
          page: 0,
          size: 1,
        }),

        // 7 - workload
        aiApi.adminWorkload(language),

        // 8 - AI usage summary
        adminApi.getAiUsageSummary(),
      ]);

      const valueAt = (index) =>
        results[index].status === "fulfilled"
          ? results[index].value
          : null;

      const students = valueAt(0);
      const employers = valueAt(1);
      const admins = valueAt(2);
      const suspended = valueAt(3);
      const recentUsers = valueAt(4);
      const companies = valueAt(5);
      const certificates = valueAt(6);
      const workload = valueAt(7);
      const aiUsage = valueAt(8);

      const failedRequests = results.filter(
        (result) => result.status === "rejected",
      );

      if (failedRequests.length > 0) {
        console.warn(
          "Some administrator dashboard requests failed:",
          failedRequests,
        );
      }

      setData({
        students,
        employers,
        admins,
        suspended,
        recentUsers,
        companies,
        certificates,
        workload,
        aiUsage,
      });
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // language is a dependency because the workload sentences are built on
    // the server - without it the panel keeps the old language until reload.
  }, [language]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const counts = useMemo(() => {
    if (!data) {
      return {
        students: 0,
        employers: 0,
        admins: 0,
        suspended: 0,
        companies: 0,
        certificates: 0,
      };
    }

    return {
      students: getTotal(data.students),
      employers: getTotal(data.employers),
      admins: getTotal(data.admins),
      suspended: getTotal(data.suspended),
      companies: getTotal(data.companies),
      certificates: getTotal(data.certificates),
    };
  }, [data]);

  if (loading && !data) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Platform overview and work waiting for review."
        />

        <LoadingBlock label="Loading administrator dashboard..." />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Platform overview and work waiting for review."
        />

        <ErrorAlert
          message={error || "Unable to load the administrator dashboard."}
          onRetry={loadDashboard}
        />
      </>
    );
  }

  const workload = data.workload || {};
  const aiUsage = data.aiUsage || {};

  const pendingCompaniesRows = getRows(data.companies);
  const pendingCertificateRows = getRows(data.certificates);
  const recentUserRows = getRows(data.recentUsers);

  const stalledApplications =
    typeof workload.applicationsStalled === "number"
      ? workload.applicationsStalled
      : "Unavailable";

  const aiCalls =
    typeof aiUsage.totalCalls === "number"
      ? aiUsage.totalCalls
      : "Unavailable";

  const aiProvider =
    aiUsage.provider ||
    (aiUsage.configured === false ? "Not configured" : "Unavailable");

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and work waiting for review."
        action={
          <button
            type="button"
            className="btn btn-sm btn-ijp-quiet"
            onClick={refresh}
            disabled={refreshing}
          >
            <i
              className="bi bi-arrow-clockwise me-1"
              aria-hidden="true"
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      {error ? (
        <ErrorAlert
          message={`${error} Some dashboard sections may be unavailable.`}
          onRetry={loadDashboard}
        />
      ) : null}

      {/* ============================================================
          ACCOUNT OVERVIEW
          These counts come directly from /api/admin/users.
          They are NOT taken from AdminWorkloadService.
          ============================================================ */}

      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="Students"
            value={counts.students}
            icon="bi-mortarboard"
            description="All registered student accounts"
            href="/admin/users"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="Employers"
            value={counts.employers}
            icon="bi-briefcase"
            description="All registered employer accounts"
            href="/admin/users"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="Administrators"
            value={counts.admins}
            icon="bi-shield-lock"
            description="Administrator accounts"
            href="/admin/users"
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="Suspended accounts"
            value={counts.suspended}
            icon="bi-person-x"
            description="Accounts currently suspended"
            href="/admin/users"
            tone={counts.suspended > 0 ? "danger" : "normal"}
          />
        </div>
      </div>

      {/* ============================================================
          APPROVAL / VERIFICATION
          ============================================================ */}

      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="Pending companies"
            value={counts.companies}
            icon="bi-building-check"
            description="Companies waiting for approval"
            href="/admin/employers"
            tone={counts.companies > 0 ? "warning" : "normal"}
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="Pending certificates"
            value={counts.certificates}
            icon="bi-patch-check"
            description="Certificates waiting for verification"
            href="/admin/certificates"
            tone={counts.certificates > 0 ? "warning" : "normal"}
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="Stalled applications"
            value={stalledApplications}
            icon="bi-hourglass-split"
            description="No employer activity for 7+ days"
            href="/admin/reports"
            tone={
              typeof stalledApplications === "number" &&
              stalledApplications > 0
                ? "warning"
                : "normal"
            }
          />
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <DashboardStat
            label="AI calls"
            value={aiCalls}
            icon="bi-stars"
            description={
              aiUsage.successfulCalls != null
                ? `${aiUsage.successfulCalls} successful · ${aiUsage.failedCalls ?? 0} failed`
                : "AI usage information"
            }
            href="/admin/reports"
          />
        </div>
      </div>

      {/* ============================================================
          PENDING COMPANY QUEUE
          ============================================================ */}

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-6">
          <SectionCard
            title="Pending company approvals"
            action={
              <Link
                to="/admin/employers"
                className="btn btn-sm btn-ijp-quiet"
              >
                View all
              </Link>
            }
          >
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Company",
                  render: (row) => row.name || "—",
                },
                {
                  key: "industry",
                  header: "Industry",
                  render: (row) => row.industry || "—",
                },
                {
                  key: "approvalStatus",
                  header: "Status",
                  render: (row) => (
                    <StatusBadge value={row.approvalStatus} />
                  ),
                },
              ]}
              rows={pendingCompaniesRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-building-check",
                title: "No pending companies",
                hint: "The company approval queue is clear.",
              }}
            />
          </SectionCard>
        </div>

        {/* ============================================================
            CERTIFICATE QUEUE
            ============================================================ */}

        <div className="col-12 col-xl-6">
          <SectionCard
            title="Certificate verification queue"
            action={
              <Link
                to="/admin/certificates"
                className="btn btn-sm btn-ijp-quiet"
              >
                View all
              </Link>
            }
          >
            <DataTable
              columns={[
                {
                  key: "title",
                  header: "Certificate",
                  render: (row) => row.title || "—",
                },
                {
                  key: "studentName",
                  header: "Student",
                  render: (row) => row.studentName || "—",
                },
                {
                  key: "verificationStatus",
                  header: "Status",
                  render: (row) => (
                    <StatusBadge value={row.verificationStatus} />
                  ),
                },
              ]}
              rows={pendingCertificateRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-patch-check",
                title: "No pending certificates",
                hint: "The certificate verification queue is clear.",
              }}
            />
          </SectionCard>
        </div>
      </div>

      {/* ============================================================
          RECENT REGISTRATIONS
          ============================================================ */}

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-8">
          <SectionCard
            title="Recent registrations"
            action={
              <Link
                to="/admin/users"
                className="btn btn-sm btn-ijp-quiet"
              >
                User management
              </Link>
            }
          >
            <DataTable
              columns={[
                {
                  key: "fullName",
                  header: "Name",
                  render: (row) => row.fullName || "—",
                },
                {
                  key: "email",
                  header: "Email",
                  render: (row) => row.email || "—",
                },
                {
                  key: "role",
                  header: "Role",
                  render: (row) => row.role || "—",
                },
                {
                  key: "accountStatus",
                  header: "Status",
                  render: (row) => (
                    <StatusBadge value={row.accountStatus} />
                  ),
                },
                {
                  key: "createdAt",
                  header: "Registered",
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
              rows={recentUserRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-people",
                title: "No users found",
                hint: "Registered users will appear here.",
              }}
            />
          </SectionCard>
        </div>

        {/* ============================================================
            AI SUMMARY
            ============================================================ */}

        <div className="col-12 col-xl-4">
          <SectionCard
            title="AI usage"
            action={
              <Link
                to="/admin/reports"
                className="btn btn-sm btn-ijp-quiet"
              >
                Details
              </Link>
            }
          >
            <div className="d-flex flex-column gap-3">
              <div className="ijp-mini-row">
                <span className="ijp-mini-label">{t("Provider")}</span>
                <span className="ijp-mini-value">{aiProvider}</span>
              </div>

              <div className="ijp-mini-row">
                <span className="ijp-mini-label">{t("Total calls")}</span>
                <span className="ijp-mini-value">{aiCalls}</span>
              </div>

              <div className="ijp-mini-row">
                <span className="ijp-mini-label">{t("Successful")}</span>
                <span className="ijp-mini-value ijp-state--ok">
                  {aiUsage.successfulCalls ?? "—"}
                </span>
              </div>

              <div className="ijp-mini-row">
                <span className="ijp-mini-label">{t("Failed")}</span>
                <span
                  className={`ijp-mini-value${aiUsage.failedCalls ? " ijp-state--bad" : ""}`}
                >
                  {aiUsage.failedCalls ?? "—"}
                </span>
              </div>


              {aiUsage.configured != null ? (
                <div>
                  <div className="small opacity-75">Configuration</div>
                  <div className="mt-1">
                    <StatusBadge
                      value={
                        aiUsage.configured
                          ? "CONFIGURED"
                          : "NOT_CONFIGURED"
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ============================================================
          ADMIN WORKLOAD
          ============================================================ */}

      <div className="row g-4">
        <div className="col-12">
          <SectionCard title="What needs attention">
              {workload.summary ? (
                <div className="ijp-callout">
                  <i className="bi bi-clock-history ijp-callout-icon" aria-hidden="true" />
                  <p className="mb-0">{workload.summary}</p>
                </div>
              ) : null}

              {Array.isArray(workload.priorities) && workload.priorities.length > 0 ? (
                <>
                  <p className="ijp-label mb-2">Suggested order</p>
                  {/*
                    The same numbered rows the AI panel uses, rather than a
                    second hand-rolled copy. Three typos lived in the old
                    markup and every one failed silently: a missing bracket in
                    "var(--ijp-signal", "aligh-itmes-start" instead of
                    align-items-start, and "ijp-mited" instead of ijp-muted.
                    None of them threw - the styles simply never applied.
                  */}
                  <ol className="ijp-fix-list mb-0">
                    {workload.priorities.map((priority, index) => (
                      <li className="ijp-fix" key={`${priority}-${index}`}>
                        <span className="ijp-fix-number">{index + 1}</span>
                        <span className="ijp-fix-text">{priority}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="ijp-muted mb-0">
                  Nothing is waiting for review. Both queues are clear.
                </p>
              )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}