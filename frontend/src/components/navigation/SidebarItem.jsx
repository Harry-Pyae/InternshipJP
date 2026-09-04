import { NavLink } from "react-router-dom";

/**
 * One navigation link.
 *
 * The label now stays in the DOM and fades out, rather than being removed.
 * Removing it snapped; fading needs the text to still be there to animate.
 *
 * The reason it was removed in the first place was wrapping - a label squeezed
 * into a 4rem column turns into a two-line smear mid-animation. `white-space:
 * nowrap` plus `overflow: hidden` solves that properly, so the text can shrink
 * to zero width without ever re-flowing.
 *
 * Keeping it in the DOM also means the link always has an accessible name,
 * collapsed or not - previously that depended on remembering to add aria-label.
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
        className={({ isActive }) =>
          `ijp-nav-item${isActive ? " ijp-nav-item--active" : ""}${
            collapsed ? " ijp-nav-item--collapsed" : ""
          }`
        }
      >
        <i className={`bi ${item.icon} ijp-nav-icon`} aria-hidden="true" />
        <span className="ijp-nav-label">{item.label}</span>
        {item.badge ? (
          <span className="badge rounded-pill text-bg-secondary ijp-nav-badge">{item.badge}</span>
        ) : null}
      </NavLink>
    </li>
  );
}
