import { NavLink } from "react-router-dom";

/**
 * One navigation link.
 *
 * Collapsed, the label is removed from the DOM rather than hidden with CSS, so
 * it cannot be squeezed into a 4rem column and wrap into a smear. The name is
 * still reachable: `title` gives a hover tooltip and `aria-label` gives it to
 * a screen reader.
 *
 * The active state uses three signals, not just colour - a tinted background,
 * a left marker and a heavier weight - because colour alone fails for a
 * colour-blind reader.
 */
export default function SidebarItem({ item, collapsed, onNavigate }) {
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          `ijp-nav-item${isActive ? " ijp-nav-item--active" : ""}${
            collapsed ? " ijp-nav-item--collapsed" : ""
          }`
        }
      >
        <i className={`bi ${item.icon} ijp-nav-icon`} aria-hidden="true" />
        {collapsed ? null : <span className="ijp-nav-label">{item.label}</span>}
        {!collapsed && item.badge ? (
          <span className="badge rounded-pill text-bg-secondary ms-auto">{item.badge}</span>
        ) : null}
      </NavLink>
    </li>
  );
}
