/**
 * The pages that route correctly but whose feature belongs to a teammate.
 */
const ACCOUNT_ENDPOINTS = [
  "GET  /api/account/me",
  "PUT  /api/account/me",
  "POST /api/account/change-password",
  "GET  /api/account/2fa/status",
];

const NOTIFICATION_ENDPOINTS = [
  "GET   /api/notifications?page=0&size=10",
  "PATCH /api/notifications/{id}/read",
  "PATCH /api/notifications/read-all",
];


export const STUDENT_PAGES = [
  {
    path: "/student/internships",
    title: "Browse internships",
    description: "Every open vacancy, searchable.",
    icon: "bi-search",
    owner: "Member 3",
    endpoints: [
      "GET /api/internships?keyword=&page=0&size=10",
      "GET /api/internships/{id}",
      "POST /api/internships/{id}/applications",
    ],
  },
  {
    path: "/student/applications",
    title: "My applications",
    description: "Every internship you have applied to, and where it stands.",
    icon: "bi-send",
    owner: "Member 2 (screen) / Member 3 (workflow)",
    endpoints: ["GET /api/student/applications"],
  },
  {
    path: "/student/certificates",
    title: "Certificates",
    description: "Upload qualifications and track their verification.",
    icon: "bi-patch-check",
    owner: "Member 2 (upload) / Member 4 (verification)",
    endpoints: [
      "GET    /api/students/me/certificates",
      "POST   /api/students/me/certificates",
      "DELETE /api/students/me/certificates/{id}",
      "GET    /api/certificates/{id}/file",
    ],
  },
  {
    path: "/student/notifications",
    title: "Notifications",
    description: "Updates on your applications and certificates.",
    icon: "bi-bell",
    owner: "Member 4",
    endpoints: NOTIFICATION_ENDPOINTS,
  },
  {
    path: "/student/profile",
    title: "My profile",
    description: "Your university, skills, interests and links.",
    icon: "bi-person",
    owner: "Member 2",
    endpoints: [
      "GET  /api/students/me",
      "PUT  /api/students/me",
      "GET  /api/students/me/skills",
      "POST /api/students/me/skills",
    ],
  },
  {
    path: "/student/settings",
    title: "Settings",
    description: "Your account, password and two-factor authentication.",
    icon: "bi-gear",
    owner: "Member 2",
    endpoints: ACCOUNT_ENDPOINTS,
  },
];

export const EMPLOYER_PAGES = [
  {
    path: "/employer/internships/new",
    title: "Post an internship",
    description: "Create a vacancy. Publishing needs an approved company.",
    icon: "bi-plus-square",
    owner: "Member 3",
    endpoints: ["POST /api/employer/internships"],
  },
  {
    path: "/employer/internships",
    title: "Manage internships",
    description: "Your vacancies, drafts and closed listings.",
    icon: "bi-megaphone",
    owner: "Member 3",
    endpoints: [
      "GET /api/employer/internships",
      "GET /api/employer/internships/{id}",
      "PUT /api/employer/internships/{id}",
    ],
  },
  {
    path: "/employer/applications",
    title: "Applicants",
    description: "Review, shortlist and decide. Verified qualifications only.",
    icon: "bi-people",
    owner: "Member 3",
    endpoints: [
      "GET   /api/employer/internships/{id}/applications",
      "GET   /api/employer/applications/{id}",
      "PATCH /api/employer/applications/{id}/status",
    ],
  },
  {
    path: "/employer/notifications",
    title: "Notifications",
    description: "New applicants and approval decisions.",
    icon: "bi-bell",
    owner: "Member 4",
    endpoints: NOTIFICATION_ENDPOINTS,
  },
  {
    path: "/employer/company",
    title: "Company profile",
    description: "Your organisation's details and approval status.",
    icon: "bi-building",
    owner: "Member 3",
    endpoints: [
      "GET /api/employer/profile",
      "PUT /api/employer/profile",
      "GET /api/employer/company",
      "PUT /api/employer/company",
    ],
  },
  {
    path: "/employer/settings",
    title: "Settings",
    description: "Your account, password and two-factor authentication.",
    icon: "bi-gear",
    owner: "Member 2 (shared account screens)",
    endpoints: ACCOUNT_ENDPOINTS,
  },
];

export const ADMIN_PAGES = [
  {
    path: "/admin/certificates",
    title: "Certificate review",
    description: "The queue that decides what employers are allowed to see.",
    icon: "bi-patch-check",
    owner: "Member 4",
    endpoints: [
      "GET   /api/admin/certificates/pending",
      "GET   /api/admin/certificates/{id}",
      "PATCH /api/admin/certificates/{id}/verification",
      "GET   /api/certificates/{id}/file",
    ],
  },
  {
    path: "/admin/employers",
    title: "Companies",
    description: "Approve or reject company registrations.",
    icon: "bi-building-check",
    owner: "Member 4",
    endpoints: [
      "GET   /api/admin/employers/pending",
      "PATCH /api/admin/employers/{id}/approval",
    ],
  },
  {
    path: "/admin/internships",
    title: "Internships",
    description: "Every vacancy on the platform.",
    icon: "bi-megaphone",
    owner: "Member 4",
    endpoints: [
      "GET /api/internships?page=0&size=20",
      "(an admin-wide listing endpoint does not exist yet - Member 3 or 4 adds it)",
    ],
  },
  {
    path: "/admin/users",
    title: "Users",
    description: "Every account, and their status.",
    icon: "bi-people",
    owner: "Member 4",
    endpoints: [
      "GET   /api/admin/users?role=&status=&search=",
      "PATCH /api/admin/users/{id}/status",
    ],
  },
  {
    path: "/admin/reports",
    title: "Reports",
    description: "Platform activity and AI usage.",
    icon: "bi-graph-up",
    owner: "Member 4",
    endpoints: ["GET /api/admin/ai/usage", "GET /api/admin/ai/usage/summary"],
  },
  {
    path: "/admin/notifications",
    title: "Notifications",
    description: "Approval requests and platform events.",
    icon: "bi-bell",
    owner: "Member 4",
    endpoints: NOTIFICATION_ENDPOINTS,
  },
  {
    path: "/admin/settings",
    title: "Settings",
    description: "Your account, password and two-factor authentication.",
    icon: "bi-gear",
    owner: "Member 2 (shared account screens)",
    endpoints: ACCOUNT_ENDPOINTS,
  },
];
