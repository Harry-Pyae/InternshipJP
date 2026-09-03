import { Link, Outlet } from "react-router-dom";
import AuthAside from "../features/auth/AuthAside.jsx";
import ThemeToggle from "../components/shared/ThemeToggle.jsx";

/**
 * The shell for signing in and signing up.
 *
 * A slim bar carries the brand and the theme control, and the card fills what
 * is left of the viewport.
 *
 * WHY THE BAR HAS NO "SIGN IN" BUTTON
 *   It used to, and it sat directly above a card whose whole purpose is
 *   signing in - two controls for one job. The bar keeps only what the card
 *   cannot carry: identity, and a way home.
 *
 * WHY THE CARD SCROLLS INSTEAD OF THE PAGE
 *   Sign-in has three fields; employer sign-up has six. If the document grows,
 *   the short form floats in emptiness and the long one pushes its submit
 *   button off-screen. The card is bounded by the viewport and the form column
 *   scrolls inside it, so the brand panel and the heading stay put either way.
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
