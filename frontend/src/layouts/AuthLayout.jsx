import { Link, Outlet } from "react-router-dom";
import AuthAside from "../features/auth/AuthAside.jsx";
import ThemeToggle from "../components/shared/ThemeToggle.jsx";
import LanguageToggle from "../components/shared/LanguageToggle.jsx";

/**
 * The shell for signing in and signing up.
 */
export default function AuthLayout() {
  return (
    <div className="ijp-auth-shell">
      <header className="ijp-auth-bar">
        <Link to="/" className="ijp-sidebar-brand" aria-label="InternshipJP home">
          <span className="ijp-sidebar-mark" aria-hidden="true">
            <i className="bi bi-mortarboard-fill" />
          </span>
          <span className="ijp-brand">
            Internship<span className="ijp-brand-mark">JP</span>
          </span>
        </Link>

        {/* Before sign-in is exactly when this matters: someone who reads
            Burmese should not have to get through an English login first. */}
        <LanguageToggle />
        <ThemeToggle />
      </header>

      <main className="ijp-auth-screen" id="main">
        <div className="ijp-card ijp-auth-card">
          <AuthAside />
          <div className="ijp-auth-form">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
