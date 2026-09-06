import { Navigate, Route, Routes } from "react-router-dom";

import RoleLayout from "../layouts/RoleLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import RequireAuth from "../components/shared/RequireAuth.jsx";
import FeaturePlaceholder from "../components/common/FeaturePlaceholder.jsx";
import { STUDENT_NAV, EMPLOYER_NAV, ADMIN_NAV } from "../config/navigation.js";
import { STUDENT_PAGES, EMPLOYER_PAGES, ADMIN_PAGES } from "./placeholders.js";
import { useAuth, homeFor } from "../config/authContext.jsx";
import LoadingBlock from "../components/shared/LoadingBlock.jsx";

import FoundationHomePage from "../features/integration/FoundationHomePage.jsx";
import IntegrationStatusPage from "../features/integration/IntegrationStatusPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import PendingApprovalPage from "../features/auth/PendingApprovalPage.jsx";
import StudentDashboardPage from "../features/student/StudentDashboardPage.jsx";
import StudentProfilePage from "../features/student/StudentProfilePage.jsx";
import EditStudentProfilePage from "../features/student/EditStudentProfilePage.jsx";
import EditStudentSkillsPage from "../features/student/EditStudentSkillsPage.jsx";
import EditStudentEducationPage from "../features/student/EditStudentEducationPage.jsx";
import StudentCertificatesPage from "../features/student/StudentCertificatesPage.jsx";
import StudentApplicationsPage from "../features/student/StudentApplicationsPage.jsx";
import EmployerDashboardPage from "../features/employer/EmployerDashboardPage.jsx";
import ManageInternshipsPage from "../features/employer/ManageInternshipsPage.jsx";
import PostInternshipPage from "../features/employer/PostInternshipPage.jsx";
import ApplicantsPage from "../features/employer/ApplicantsPage.jsx";
import EmployerApplicantDetailPage from "../features/employer/EmployerApplicantDetailPage.jsx";
import CompanyProfilePage from "../features/employer/CompanyProfilePage.jsx";
import EmployerProfilePage from "../features/employer/EmployerProfilePage.jsx";
import BrowseInternshipsPage from "../features/student/BrowseInternshipsPage.jsx";
import StudentInternshipDetailPage from "../features/student/StudentInternshipDetailPage.jsx";
import NotificationsPage from "../features/shared/NotificationsPage.jsx";
import AccountSettingsPage from "../features/shared/AccountSettingsPage.jsx";
import AdminDashboardPage from "../features/admin/AdminDashboardPage.jsx";
import AdminCertificatesPage from "../features/admin/AdminCertificatesPage.jsx";
import AdminCertificateReviewPage from "../features/admin/AdminCertificateReviewPage.jsx";
import AdminUsersPage from "../features/admin/AdminUsersPage.jsx";
import AdminSettingsPage from "../features/admin/AdminSettingsPage.jsx";
import AdminInternshipsPage from "../features/admin/AdminInternshipsPage.jsx";
import AdminNotificationsPage from "../features/admin/AdminNotificationsPage.jsx";
import AdminEmployersPage from "../features/admin/AdminEmployersPage.jsx";
import AdminEmployerReviewPage from "../features/admin/AdminEmployerReviewPage.jsx";
import AdminReportsPage from "../features/admin/AdminReportsPage.jsx";
import AiChatPage from "../features/ai/AiChatPage.jsx";

/**
 * Every route in the application.
 */
/** Employer paths Member 3 has built. */
const EMPLOYER_BUILT = new Set([
  "/employer/applications/:id",
  "/employer/internships/:id/edit",
  "/employer/notifications",
  "/employer/settings",
  "/employer/internships/new",
  "/employer/internships",
  "/employer/applications",
  "/employer/company",
  "/employer/profile",
]);

/** Student paths built by Member 3 (browsing vacancies is their module). */
const STUDENT_BUILT = new Set([
  "/student/internships",
  "/student/profile",
  "/student/profile/edit",
  "/student/skills/edit",
  "/student/education/edit",
  "/student/certificates",
  "/student/applications",
  "/student/notifications",
  "/student/settings",
]);

/** Admin paths that now have a real page, so no placeholder is needed. */
const ADMIN_BUILT = new Set([
  "/admin/users",
  "/admin/certificates",
  "/admin/employers",
  "/admin/internships",
  "/admin/notifications",
  "/admin/reports",
  "/admin/settings",
]);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public shell: a thin header, no sidebar. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/foundation" element={<FoundationHomePage />} />
        <Route path="/integration/status" element={<IntegrationStatusPage />} />
      </Route>

      {/*
        Auth owns the whole screen. No navbar: it would offer "Theme" and
        "Sign in" directly above a card that already does both.
      */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      {/* ------------------------------------------------ STUDENT */}
      <Route
        element={
          <RequireAuth role="STUDENT">
            <RoleLayout nav={STUDENT_NAV} title="Student" settingsPath="/student/settings" />
          </RequireAuth>
        }
      >
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/ai" element={<AiChatPage audience="student" />} />
        <Route path="/student/integration" element={<IntegrationStatusPage />} />
        <Route path="/student/internships" element={<BrowseInternshipsPage />} />
        <Route path="/student/internships/:id" element={<StudentInternshipDetailPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
        <Route path="/student/profile/edit" element={<EditStudentProfilePage />} />
        <Route path="/student/skills/edit" element={<EditStudentSkillsPage />} />
        <Route path="/student/education/edit" element={<EditStudentEducationPage />} />
        <Route path="/student/certificates" element={<StudentCertificatesPage />} />
        <Route path="/student/applications" element={<StudentApplicationsPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/student/settings" element={<AccountSettingsPage />} />

        {STUDENT_PAGES.filter((page) => !STUDENT_BUILT.has(page.path)).map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<FeaturePlaceholder {...page} />}
          />
        ))}
      </Route>

      {/*
        An employer waiting on approval. Outside the employer shell on purpose:
        a sidebar full of links they cannot use yet would be misleading.
      */}
      <Route
        path="/pending-approval"
        element={
          <RequireAuth role="EMPLOYER">
            <PendingApprovalPage />
          </RequireAuth>
        }
      />

      {/* ----------------------------------------------- EMPLOYER */}
      <Route
        element={
          <RequireAuth role="EMPLOYER">
            <RoleLayout nav={EMPLOYER_NAV} title="Employer" settingsPath="/employer/settings" />
          </RequireAuth>
        }
      >
        <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />
        <Route path="/employer/dashboard" element={<EmployerDashboardPage />} />
        <Route path="/employer/ai" element={<AiChatPage audience="employer" />} />
        <Route path="/employer/integration" element={<IntegrationStatusPage />} />
        <Route path="/employer/internships/new" element={<PostInternshipPage />} />
        {/*
          Edit reuses the create page - same form, same validation, one place
          to fix a bug. The :id is what switches it into edit mode.
        */}
        <Route path="/employer/internships/:id/edit" element={<PostInternshipPage />} />
        <Route path="/employer/internships" element={<ManageInternshipsPage />} />
        <Route path="/employer/applications" element={<ApplicantsPage />} />
        <Route path="/employer/applications/:id" element={<EmployerApplicantDetailPage />} />
        <Route path="/employer/company" element={<CompanyProfilePage />} />
        {/*
          Not in EMPLOYER_NAV - reachable by URL only. Member 3 built the page
          but did not add a sidebar link; left as they had it.
        */}
        <Route path="/employer/profile" element={<EmployerProfilePage />} />
        <Route path="/employer/notifications" element={<NotificationsPage />} />
        <Route path="/employer/settings" element={<AccountSettingsPage />} />

        {EMPLOYER_PAGES.filter((page) => !EMPLOYER_BUILT.has(page.path)).map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<FeaturePlaceholder {...page} />}
          />
        ))}
      </Route>

      {/* -------------------------------------------------- ADMIN */}
      <Route
        element={
          <RequireAuth role="ADMIN">
            <RoleLayout nav={ADMIN_NAV} title="Administrator" settingsPath="/admin/settings" />
          </RequireAuth>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/ai" element={<AiChatPage audience="admin" />} />
        <Route path="/admin/integration" element={<IntegrationStatusPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
        <Route path="/admin/certificates/:id" element={<AdminCertificateReviewPage />} />
        <Route path="/admin/employers" element={<AdminEmployersPage />} />
        <Route path="/admin/employers/:id" element={<AdminEmployerReviewPage />} />
        <Route path="/admin/internships" element={<AdminInternshipsPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />

        {/*
          Member 4 built every admin screen except Messages, which has no
          backend at all. Anything in ADMIN_PAGES without a real page above
          keeps its placeholder - without this, the Messages link in the
          sidebar would match no route, fall through to the catch-all and
          bounce the admin back to the landing page.
        */}
        {ADMIN_PAGES.filter((page) => !ADMIN_BUILT.has(page.path)).map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<FeaturePlaceholder {...page} />}
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * The root URL.
 */
function LandingRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingBlock label="Loading..." />;
  }
  if (user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return <Navigate to="/auth/login" replace />;
}
