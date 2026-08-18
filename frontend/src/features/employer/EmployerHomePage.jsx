import { useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import DashboardShell from "../../components/shared/DashboardShell.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import AiChatPage from "../ai/AiChatPage.jsx";

/**
 * The employer's home page.
 *
 * The figures come from the same company report the assistant reads, so the
 * dashboard and the chat always agree. "Unreviewed" is deliberately given a
 * warning colour when it is above zero: an applicant nobody has opened is the
 * single most common reason a good candidate goes somewhere else.
 *
 * TODO MEMBER_3: this is a shell. Replace the layout with your real dashboard
 * (vacancy performance, applicant pipeline) using StatCard, SectionCard and
 * DataTable. Keep the nav list and the route, or tell the group first.
 */
const NAV = [
  { to: "/employer", icon: "bi-grid-1x2", label: "Overview", end: true },
  { section: "Hiring" },
  { to: "/employer/internships", icon: "bi-megaphone", label: "Internships" },
  { to: "/employer/applications", icon: "bi-people", label: "Applicants" },
  { section: "Company" },
  { to: "/employer/profile", icon: "bi-building", label: "Company profile" },
  { section: "Account" },
  { to: "/employer/settings", icon: "bi-gear", label: "Settings" },
];

export default function EmployerHomePage() {
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    let cancelled = false;
    aiApi
      .companyInsights()
      .then((data) => {
        if (!cancelled) setInsight(data);
      })
      .catch(() => {
        if (!cancelled) setInsight(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dash = (value) => (insight === null ? "..." : (value ?? "-"));
  const unreviewed = insight?.awaitingReview;

  return (
    <DashboardShell
      title="Overview"
      subtitle="Your vacancies, your pipeline, and what is holding it up."
      nav={NAV}
    >
      {insight && insight.approvalStatus !== "APPROVED" ? (
        <div className="alert alert-warning d-flex gap-2 py-2 px-3 small">
          <i className="bi bi-hourglass-split" aria-hidden="true" />
          <span>
            Your company is <strong>{insight.approvalStatus.toLowerCase()}</strong>. Students
            cannot see anything you publish until an administrator approves it.
          </span>
        </div>
      ) : null}

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Open vacancies" value={dash(insight?.openInternships)} icon="bi-megaphone" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Applicants" value={dash(insight?.totalApplications)} icon="bi-people" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Unreviewed"
            value={dash(unreviewed)}
            icon="bi-clock-history"
            tone={unreviewed ? "bad" : "ok"}
            hint={unreviewed ? "Students accept the first offer" : "All caught up"}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Weak listings"
            value={dash(insight?.listingIssues?.length)}
            icon="bi-exclamation-triangle"
            tone={insight?.listingIssues?.length ? "warn" : "ok"}
            hint={insight?.listingIssues?.length ? "Missing details cost applicants" : undefined}
          />
        </div>
      </div>

      <SectionCard title="Your assistant" padded={false}>
        <div className="px-4 pb-4">
          <AiChatPage audience="employer" embedded />
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
