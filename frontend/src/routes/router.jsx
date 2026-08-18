import { Navigate, Route, Routes } from "react-router-dom";

import RoleLayout from "../layouts/RoleLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import RequireAuth from "../components/shared/RequireAuth.jsx";
import FeaturePlaceholder from "../components/common/FeaturePlaceholder.jsx";
import { STUDENT_NAV, EMPLOYER_NAV, ADMIN_NAV } from "../config/navigation.js";
import { STUDENT_PAGES, EMPLOYER_PAGES, ADMIN_PAGES } from "./placeholders.js";
import { useAuth, homeFor } from "../config/authContext.jsx";

import FoundationHomePage from "../features/integration/FoundationHomePage.jsx";
import IntegrationStatusPage from "../features/integration/IntegrationStatusPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import StudentDashboardPage from "../features/student/StudentDashboardPage.jsx";
import EmployerDashboardPage from "../features/employer/EmployerDashboardPage.jsx";
import AdminDashboardPage from "../features/admin/AdminDashboardPage.jsx";
import AiChatPage from "../features/ai/AiChatPage.jsx";

/**
 * Every route in the application.
 *
 * ================== HOW THIS IS STRUCTURED, AND WHY ==================
 * Each role has a LAYOUT route with CHILD routes. The layout renders the
 * sidebar, the header and <Outlet />; the children render the pages.
 *
 * Previously /student was a single leaf route whose component rendered the
 * shell *and* the AI assistant, and no child routes existed. Clicking
 * "My profile" matched nothing, fell through to the catch-all, and came back
 * to that same page - which is why the AI appeared on every screen.
 *
 * The AI now renders at exactly three URLs: /student/ai, /employer/ai and
 * /admin/ai. Nowhere else.
 * =====================================================================
 *
 * TO ADD A PAGE: build it under features/<area>/, import it above, and replace
 * the matching <FeaturePlaceholder> with your component. Keep the path.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public shell: a thin header, no sidebar. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/integration/status" element={<IntegrationStatusPage />} />
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
        {STUDENT_PAGES.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<FeaturePlaceholder {...page} />}
          />
        ))}
      </Route>

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
        {EMPLOYER_PAGES.map((page) => (
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
        {ADMIN_PAGES.map((page) => (
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

/** Signed in? Straight to your dashboard. Otherwise, what this project is. */
function LandingRoute() {
  const { user, loading } = useAuth();
  if (!loading && user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return <FoundationHomePage />;
}
