import { Link } from "react-router-dom";
import SidebarItem from "./SidebarItem.jsx";
import Avatar from "../shared/Avatar.jsx";
import { useLanguage } from "../../config/languageContext.jsx";
import { ROLE_LABEL } from "../../config/navigation.js";
import { useAuth } from "../../config/authContext.jsx";

/**
 * The application sidebar.
 */
export default function Sidebar({ nav, collapsed, onToggleCollapse, onNavigate, inDrawer }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  // Inside the mobile drawer the sidebar is always full width - a collapsed
  // rail inside a slide-over would be pointless.
  const isCollapsed = collapsed && !inDrawer;

  return (
    <div className={`ijp-sidebar${isCollapsed ? " ijp-sidebar--collapsed" : ""}`}>
      <div className="ijp-sidebar-head">
        <Link to="/" className="ijp-sidebar-brand" title="InternshipJP">
          <span className="ijp-sidebar-mark" aria-hidden="true">
            <i className="bi bi-mortarboard-fill" />
          </span>
          {isCollapsed ? null : (
            <span className="ijp-brand">
              Internship<span className="ijp-brand-mark">JP</span>
            </span>
          )}
        </Link>

        {inDrawer ? null : (
          <button
            type="button"
            className="ijp-sidebar-toggle"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand the sidebar" : "Collapse the sidebar"}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {/* One icon that rotates, not two that swap. Swapping snaps; a
                rotation reads as the same control changing direction. */}
            <i
              className={`bi bi-chevron-left ijp-toggle-icon${
                isCollapsed ? " ijp-toggle-icon--flipped" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      <nav className="ijp-sidebar-nav" aria-label="Main">
        {nav.map((group, index) => (
          <div className="ijp-nav-group" key={group.section ?? `group-${index}`}>
            {group.section ? (
              <>
                <p className="ijp-nav-section">{group.sectionKey ? t(group.sectionKey) : group.section}</p>
                <hr className="ijp-nav-divider" aria-hidden="true" />
              </>
            ) : null}
            <ul className="list-unstyled mb-0 d-grid gap-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.to}
                  item={item}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {user ? (
        <div className="ijp-sidebar-foot">
          <div className={`ijp-identity${isCollapsed ? " ijp-identity--collapsed" : ""}`}>
            <Avatar name={user.fullName} />
            {isCollapsed ? null : (
              <span className="ijp-identity-text">
                <span className="ijp-identity-name">{user.fullName}</span>
                <span className="ijp-identity-role">{ROLE_LABEL[user.role] ?? user.role}</span>
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
