import { Navigate, useLocation } from "react-router-dom";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import LoadingBlock from "./LoadingBlock.jsx";

/**
 * Route guard. Wrap any page that needs a signed-in user, optionally of a
 * particular role.
 *
 *   <Route element={
 *     <RequireAuth role="ADMIN"><RoleLayout nav={ADMIN_NAV} /></RequireAuth>
 *   }>
 *     <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
 *   </Route>
 *
 * THIS IS NOT SECURITY. It stops someone seeing a broken screen, nothing more.
 * A determined visitor can edit the JavaScript and render any page they like -
 * they still cannot read a single row, because every endpoint checks the
 * session and the role on the server. Never let a guard here be the only thing
 * protecting something.
 *
 * Owner: Member 1 (integration). Member 2 owns what happens after login.
 */
export default function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingBlock label="Checking your session..." />;
  }

  if (!user) {
    // Remember where they were headed, so login can send them back.
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  // An employer whose company has not been approved cannot use the employer
  // area yet. Sending them to a screen that explains why beats a dashboard
  // where most things look available and publishing fails with a 403.
  if (
    user.role === "EMPLOYER" &&
    user.accountStatus === "PENDING" &&
    location.pathname !== "/pending-approval"
  ) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (role && user.role !== role) {
    // Signed in, wrong door. Send them to their own home rather than showing
    // a "forbidden" page they can do nothing about.
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return children;
}
