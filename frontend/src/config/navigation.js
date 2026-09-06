/**
 * Sidebar navigation, one list per role.
 */
function developerSection(path) {
  // Hidden unless you ask for it. It used to appear in every dev build,
  // which is wrong when the dev server is what you demo from.
  // Set VITE_SHOW_DEV_NAV=true in frontend/.env to bring it back.
  if (!import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_NAV !== "true") {
    return [];
  }
  return [
    {
      section: "Developer", sectionKey: "section.developer",
      items: [{ to: path, icon: "bi-activity", label: "Integration status", labelKey: "nav.integration" }],
    },
  ];
}
export const STUDENT_NAV = [
  {
    section: null,
    items: [
      { to: "/student/dashboard", icon: "bi-grid-1x2", label: "Dashboard", labelKey: "nav.dashboard", end: true },
      { to: "/student/internships", icon: "bi-search", label: "Browse internships", labelKey: "nav.browse" },
      { to: "/student/applications", icon: "bi-send", label: "My applications", labelKey: "nav.applications" },
      { to: "/student/certificates", icon: "bi-patch-check", label: "Certificates", labelKey: "nav.certificates" },
      { to: "/student/notifications", icon: "bi-bell", label: "Notifications", labelKey: "nav.notifications" },
    ],
  },
  {
    section: "Assistant", sectionKey: "section.assistant",
    items: [{ to: "/student/ai", icon: "bi-stars", label: "AI assistant", labelKey: "nav.ai" }],
  },
  {
    section: "Account", sectionKey: "section.account",
    items: [
      { to: "/student/profile", icon: "bi-person", label: "My profile", labelKey: "nav.profile" },
      { to: "/student/settings", icon: "bi-gear", label: "Settings", labelKey: "nav.settings" },
    ],
  },
  ...developerSection("/student/integration"),
];

export const EMPLOYER_NAV = [
  {
    section: null,
    items: [
      { to: "/employer/dashboard", icon: "bi-grid-1x2", label: "Dashboard", labelKey: "nav.dashboard", end: true },
      { to: "/employer/internships/new", icon: "bi-plus-square", label: "Post internship", labelKey: "nav.post" },
      { to: "/employer/internships", icon: "bi-megaphone", label: "Manage internships", labelKey: "nav.manage", end: true },
      { to: "/employer/applications", icon: "bi-people", label: "Applicants", labelKey: "nav.applicants" },
      { to: "/employer/notifications", icon: "bi-bell", label: "Notifications", labelKey: "nav.notifications" },
    ],
  },
  {
    section: "Assistant", sectionKey: "section.assistant",
    items: [{ to: "/employer/ai", icon: "bi-stars", label: "AI assistant", labelKey: "nav.ai" }],
  },
  {
    section: "Account", sectionKey: "section.account",
    items: [
      { to: "/employer/company", icon: "bi-building", label: "Company profile", labelKey: "nav.company" },
      { to: "/employer/settings", icon: "bi-gear", label: "Settings", labelKey: "nav.settings" },
    ],
  },
  ...developerSection("/employer/integration"),
];

export const ADMIN_NAV = [
  {
    section: null,
    items: [
      { to: "/admin/dashboard", icon: "bi-grid-1x2", label: "Dashboard", labelKey: "nav.dashboard", end: true },
      { to: "/admin/certificates", icon: "bi-patch-check", label: "Certificate review", labelKey: "nav.certificateReview" },
      { to: "/admin/employers", icon: "bi-building-check", label: "Companies", labelKey: "nav.companies" },
      { to: "/admin/internships", icon: "bi-megaphone", label: "Internships", labelKey: "nav.internships" },
      { to: "/admin/users", icon: "bi-people", label: "Users", labelKey: "nav.users" },
      { to: "/admin/reports", icon: "bi-graph-up", label: "Reports", labelKey: "nav.reports" },
      { to: "/admin/notifications", icon: "bi-bell", label: "Notifications", labelKey: "nav.notifications" },
    ],
  },
  {
    section: "Assistant", sectionKey: "section.assistant",
    items: [{ to: "/admin/ai", icon: "bi-stars", label: "AI assistant", labelKey: "nav.ai" }],
  },
  {
    section: "Account", sectionKey: "section.account",
    items: [{ to: "/admin/settings", icon: "bi-gear", label: "Settings", labelKey: "nav.settings" }],
  },
  ...developerSection("/admin/integration"),
];

export const NAV_BY_ROLE = {
  STUDENT: STUDENT_NAV,
  EMPLOYER: EMPLOYER_NAV,
  ADMIN: ADMIN_NAV,
};

export const ROLE_LABEL = {
  STUDENT: "Student",
  EMPLOYER: "Employer",
  ADMIN: "Administrator",
};
