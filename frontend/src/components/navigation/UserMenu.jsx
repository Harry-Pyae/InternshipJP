import { Link, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import { ROLE_LABEL } from "../../config/navigation.js";

/**
 * The account control in the top-right.
 *
 * Shows initials rather than a photo: the photo_path column exists but nobody
 * uploads one yet, and a broken image is worse than none. Member 2 can swap in
 * an <img> once profile photos work.
 */
export default function UserMenu({ settingsPath }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Link className="btn btn-sm btn-ijp-primary" to="/auth/login">
        Sign in
      </Link>
    );
  }

  async function handleSignOut() {
    await signOut();
    navigate("/auth/login", { replace: true });
  }

  return (
    <div className="dropdown">
      <button
        className="ijp-usermenu"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        aria-label="Account menu"
      >
        <span className="ijp-avatar ijp-avatar--sm" aria-hidden="true">
          {initials(user.fullName)}
        </span>
        <span className="ijp-usermenu-text d-none d-md-flex">
          <span className="ijp-usermenu-name">{user.fullName}</span>
          <span className="ijp-usermenu-role">{ROLE_LABEL[user.role] ?? user.role}</span>
        </span>
        <i className="bi bi-chevron-down ijp-usermenu-caret d-none d-md-block" aria-hidden="true" />
      </button>

      <ul className="dropdown-menu dropdown-menu-end ijp-menu">
        <li>
          <span className="dropdown-item-text">
            <span className="d-block fw-semibold">{user.fullName}</span>
            <span className="ijp-muted ijp-data" style={{ fontSize: "0.78rem" }}>
              {user.email}
            </span>
          </span>
        </li>
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <Link className="dropdown-item" to={homeFor(user.role)}>
            <i className="bi bi-grid-1x2 me-2" aria-hidden="true" />
            My dashboard
          </Link>
        </li>
        {settingsPath ? (
          <li>
            <Link className="dropdown-item" to={settingsPath}>
              <i className="bi bi-gear me-2" aria-hidden="true" />
              Account settings
            </Link>
          </li>
        ) : null}
        <li>
          <hr className="dropdown-divider" />
        </li>
        <li>
          <button className="dropdown-item text-danger" type="button" onClick={handleSignOut}>
            <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}

function initials(name) {
  if (!name) {
    return "?";
  }
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
