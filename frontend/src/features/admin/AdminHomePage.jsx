import { useEffect, useState } from "react";
import { aiApi } from "../../api/aiApi.js";
import DashboardShell from "../../components/shared/DashboardShell.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import AiChatPage from "../ai/AiChatPage.jsx";

/**
 * The administrator's home page.
 *
 * The counts come from the same workload report the assistant reads, and the
 * colour comes from AGE rather than volume. Three certificates waiting an hour
 * is fine; one waiting eleven days is not, because for eleven days a student
 * has been unable to show that qualification to any employer.
 *
 * TODO MEMBER_4: this is a shell. Replace the layout with your real dashboard
 * and build the queue pages, starting with /admin/certificates - verifying a
 * certificate is what makes it visible to employers, and nothing else in the
 * system can do it. Keep the nav list and the route, or tell the group first.
 */
const NAV = [
  { to: "/admin", icon: "bi-grid-1x2", label: "Overview", end: true },
  { section: "Reviewing" },
  { to: "/admin/certificates", icon: "bi-patch-check", label: "Certificates" },
  { to: "/admin/employers", icon: "bi-building-check", label: "Companies" },
  { section: "Platform" },
  { to: "/admin/users", icon: "bi-people", label: "Users" },
  { to: "/admin/reports", icon: "bi-graph-up", label: "Reports" },
  { section: "Account" },
  { to: "/admin/settings", icon: "bi-gear", label: "Settings" },
];

export default function AdminHomePage() {
  const [workload, setWorkload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    aiApi
      .adminWorkload()
      .then((data) => {
        if (!cancelled) setWorkload(data);
      })
      .catch(() => {
        if (!cancelled) setWorkload(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dash = (value) => (workload === null ? "..." : (value ?? "-"));
  const oldestCertificate = workload?.oldestCertificates?.[0]?.daysWaiting ?? 0;
  const oldestCompany = workload?.oldestCompanies?.[0]?.daysWaiting ?? 0;

  // Colour follows how long something has waited, not how much of it there is.
  const ageTone = (days) => (days >= 7 ? "bad" : days >= 3 ? "warn" : "ok");

  return (
    <DashboardShell
      title="Overview"
      subtitle="What needs your review today, oldest first."
      nav={NAV}
    >
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            label="Certificates"
            value={dash(workload?.certificatesPending)}
            icon="bi-patch-check"
            tone={workload?.certificatesPending ? ageTone(oldestCertificate) : "ok"}
            hint={oldestCertificate ? `oldest ${oldestCertificate} days` : "Queue clear"}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Companies"
            value={dash(workload?.companiesPending)}
            icon="bi-building-check"
            tone={workload?.companiesPending ? ageTone(oldestCompany) : "ok"}
            hint={oldestCompany ? `oldest ${oldestCompany} days` : "Queue clear"}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Stalled applicants"
            value={dash(workload?.applicationsStalled)}
            icon="bi-hourglass-split"
            tone={workload?.applicationsStalled ? "warn" : "ok"}
            hint={workload?.applicationsStalled ? "Employers to nudge" : "Employers responding"}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Students"
            value={dash(workload?.totalStudents)}
            icon="bi-mortarboard"
            hint={workload ? `${workload.totalEmployers} employer(s)` : undefined}
          />
        </div>
      </div>

      <SectionCard title="Your assistant" padded={false}>
        <div className="px-4 pb-4">
          <AiChatPage audience="admin" embedded initialTab="today" />
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
