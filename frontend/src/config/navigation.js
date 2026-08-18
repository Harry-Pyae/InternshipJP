/**
 * Sidebar navigation, one list per role.
 *
 * Defined here rather than inside each layout so that adding a page is a
 * one-line change in a single file, and so nobody can accidentally show an
 * employer a student link.
 *
 * `end: true` means the link is only active on an exact match - without it,
 * "Dashboard" (/student/dashboard) would stay highlighted on every child route.
 *
 * Members 2, 3 and 4: add your pages here and in routes/router.jsx. Keep the
 * paths, or tell the group first - the login redirect depends on them.
 *
 * THE DEVELOPER SECTION
 *   Integration status is a build-time tool, not a product feature, so it only
 *   appears when import.meta.env.DEV is true. Vite compiles that to false for
 *   `npm run build`, so the section is dropped from a production bundle rather
 *   than merely hidden - no student will ever see a link to it.
 */
function developerSection(path) {
  if (!import.meta.env.DEV) {
    return [];
  }
  return [
    {
      section: "Developer",
      items: [{ to: path, icon: "bi-activity", label: "Integration status" }],
    },
  ];
}
export const STUDENT_NAV = [
  {
    section: null,
    items: [
      { to: "/student/dashboard", icon: "bi-grid-1x2", label: "Dashboard", end: true },
      { to: "/student/internships", icon: "bi-search", label: "Browse internships" },
      { to: "/student/applications", icon: "bi-send", label: "My applications" },
      { to: "/student/certificates", icon: "bi-patch-check", label: "Certificates" },
    ],
  },
  {
    section: "Inbox",
    items: [
      { to: "/student/notifications", icon: "bi-bell", label: "Notifications" },
      { to: "/student/messages", icon: "bi-chat-left-text", label: "Messages" },
    ],
  },
  {
    section: "Assistant",
    items: [{ to: "/student/ai", icon: "bi-stars", label: "AI assistant" }],
  },
  {
    section: "Account",
    items: [
      { to: "/student/profile", icon: "bi-person", label: "My profile" },
      { to: "/student/settings", icon: "bi-gear", label: "Settings" },
    ],
  },
  ...developerSection("/student/integration"),
];

export const EMPLOYER_NAV = [
  {
    section: null,
    items: [
      { to: "/employer/dashboard", icon: "bi-grid-1x2", label: "Dashboard", end: true },
      { to: "/employer/internships/new", icon: "bi-plus-square", label: "Post internship" },
      { to: "/employer/internships", icon: "bi-megaphone", label: "Manage internships", end: true },
      { to: "/employer/applications", icon: "bi-people", label: "Applicants" },
    ],
  },
  {
    section: "Inbox",
    items: [
      { to: "/employer/notifications", icon: "bi-bell", label: "Notifications" },
      { to: "/employer/messages", icon: "bi-chat-left-text", label: "Messages" },
    ],
  },
  {
    section: "Assistant",
    items: [{ to: "/employer/ai", icon: "bi-stars", label: "AI assistant" }],
  },
  {
    section: "Account",
    items: [
      { to: "/employer/company", icon: "bi-building", label: "Company profile" },
      { to: "/employer/settings", icon: "bi-gear", label: "Settings" },
    ],
  },
  ...developerSection("/employer/integration"),
];

export const ADMIN_NAV = [
  {
    section: null,
    items: [
      { to: "/admin/dashboard", icon: "bi-grid-1x2", label: "Dashboard", end: true },
      { to: "/admin/certificates", icon: "bi-patch-check", label: "Certificate review" },
      { to: "/admin/employers", icon: "bi-building-check", label: "Companies" },
      { to: "/admin/internships", icon: "bi-megaphone", label: "Internships" },
      { to: "/admin/users", icon: "bi-people", label: "Users" },
      { to: "/admin/reports", icon: "bi-graph-up", label: "Reports" },
    ],
  },
  {
    section: "Inbox",
    items: [
      { to: "/admin/notifications", icon: "bi-bell", label: "Notifications" },
      { to: "/admin/messages", icon: "bi-chat-left-text", label: "Messages" },
    ],
  },
  {
    section: "Assistant",
    items: [{ to: "/admin/ai", icon: "bi-stars", label: "AI assistant" }],
  },
  {
    section: "Account",
    items: [{ to: "/admin/settings", icon: "bi-gear", label: "Settings" }],
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
