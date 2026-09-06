import { NavLink } from "react-router-dom";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * One navigation link.
 */
export default function SidebarItem({ item, collapsed, onNavigate }) {
  const { t } = useLanguage();
  // labelKey when the string table has it, the English label otherwise -
  // so a nav entry someone adds without a key still renders.
  const label = item.labelKey ? t(item.labelKey) : item.label;
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          `ijp-nav-item${isActive ? " ijp-nav-item--active" : ""}${
            collapsed ? " ijp-nav-item--collapsed" : ""
          }`
        }
      >
        <i className={`bi ${item.icon} ijp-nav-icon`} aria-hidden="true" />
        <span className="ijp-nav-label">{label}</span>
        {item.badge ? (
          <span className="badge rounded-pill text-bg-secondary ijp-nav-badge">{item.badge}</span>
        ) : null}
      </NavLink>
    </li>
  );
}
