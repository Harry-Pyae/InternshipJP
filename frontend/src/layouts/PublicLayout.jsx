import { Link, Outlet } from "react-router-dom";
import ThemeToggle from "../components/shared/ThemeToggle.jsx";
import UserMenu from "../components/navigation/UserMenu.jsx";
import { useAuth } from "../config/authContext.jsx";

/**
 * The shell for pages outside a role: the landing page, sign in, sign up and
 * the integration status utility.
 *
 * A thin header and nothing else. Signed-in pages get the sidebar from
 * RoleLayout, so wrapping both in one global chrome would put a navbar above a
 * sidebar - one navigation too many.
 */
export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="ijp-public">
      <a className="visually-hidden-focusable btn btn-ijp-primary m-2" href="#main">
        Skip to content
      </a>

      <header className="ijp-public-bar">
        <div className="container d-flex align-items-center justify-content-between gap-3">
          <Link to="/" className="ijp-sidebar-brand">
            <span className="ijp-sidebar-mark" aria-hidden="true">
              <i className="bi bi-mortarboard-fill" />
            </span>
            <span className="ijp-brand">
              Internship<span className="ijp-brand-mark">JP</span>
            </span>
          </Link>

          <div className="d-flex align-items-center gap-2">
            <ThemeToggle />
            {user ? <UserMenu /> : (
              <Link className="btn btn-sm btn-ijp-primary" to="/auth/login">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="ijp-public-main" id="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
