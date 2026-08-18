import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { aiApi } from "../../api/aiApi.js";
import DashboardShell from "../../components/shared/DashboardShell.jsx";
import StatCard from "../../components/shared/StatCard.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import AiChatPage from "../ai/AiChatPage.jsx";

/**
 * The student's home page.
 *
 * The four figures across the top are real - they come from the same
 * calculated skill-gap report the assistant reasons about, so the dashboard
 * and the chat can never disagree. Nothing here is a placeholder number.
 *
 * TODO MEMBER_2: this is a shell. Replace the layout below with your real
 * dashboard (recent applications, upcoming deadlines, profile prompts) using
 * StatCard, SectionCard and DataTable. Keep the nav list and the route, or
 * tell the group first. The assistant is Member 1's and is already wired.
 */
const NAV = [
  { to: "/student", icon: "bi-grid-1x2", label: "Overview", end: true },
  { section: "My profile" },
  { to: "/student/profile", icon: "bi-person", label: "Profile" },
  { to: "/student/certificates", icon: "bi-patch-check", label: "Certificates" },
  { section: "Opportunities" },
  { to: "/internships", icon: "bi-search", label: "Find internships" },
  { to: "/student/applications", icon: "bi-send", label: "My applications" },
  { section: "Account" },
  { to: "/student/settings", icon: "bi-gear", label: "Settings" },
];

export default function StudentHomePage() {
  const [gaps, setGaps] = useState(null);

  useEffect(() => {
    let cancelled = false;
    aiApi
      .skillGaps()
      .then((data) => {
        if (!cancelled) setGaps(data);
      })
      .catch(() => {
        if (!cancelled) setGaps(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dash = (value) => (gaps === null ? "..." : (value ?? "-"));
  const completeness = gaps?.profileCompleteness;

  return (
    <DashboardShell
      title="Overview"
      subtitle="Where you stand, and what to do next."
      nav={NAV}
      actions={
        <Link className="btn btn-ijp-primary btn-sm" to="/internships">
          <i className="bi bi-search me-2" aria-hidden="true" />
          Find internships
        </Link>
      }
    >
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            label="Profile"
            value={completeness == null ? dash(null) : `${completeness}%`}
            icon="bi-person-check"
            tone={completeness == null ? undefined : completeness >= 80 ? "ok" : "warn"}
            hint={
              gaps?.profileGaps?.length
                ? `${gaps.profileGaps.length} thing(s) still empty`
                : "Nothing missing"
            }
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Skills to learn"
            value={dash(gaps?.skillsToLearn?.length)}
            icon="bi-lightbulb"
            hint={gaps?.skillsToLearn?.[0] ? `Start with ${gaps.skillsToLearn[0].skill}` : undefined}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Applications"
            value={dash(gaps?.applicationCount)}
            icon="bi-send"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            label="Verified certificates"
            value={dash(gaps?.verifiedCertificateCount)}
            icon="bi-patch-check"
            tone={gaps && gaps.verifiedCertificateCount === 0 ? "warn" : undefined}
            hint={
              gaps && gaps.verifiedCertificateCount === 0
                ? "Employers only see verified ones"
                : undefined
            }
          />
        </div>
      </div>

      <SectionCard title="Your assistant" padded={false}>
        <div className="px-4 pb-4">
          <AiChatPage audience="student" embedded />
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
