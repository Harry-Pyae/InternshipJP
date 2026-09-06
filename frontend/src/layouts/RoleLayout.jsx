import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar.jsx";
import Topbar from "../components/navigation/Topbar.jsx";

/**
 * The shell every signed-in page sits inside: sidebar, header, and the page
 * itself rendered through <Outlet />.
 */
const STORAGE_KEY = "internshipjp-sidebar-collapsed";

export default function RoleLayout({ nav, title, settingsPath }) {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* Private browsing can block storage; the toggle still works. */
      }
      return next;
    });
  }, []);

  // Navigating always closes the drawer - on a phone, tapping a link and then
  // having to close the menu by hand feels broken.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer, like every other overlay on the web.
  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  // The current page's label, for the header.
  const activeLabel =
    nav
      .flatMap((group) => group.items)
      .filter((item) => location.pathname.startsWith(item.to))
      .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? title;

  return (
    <div className={`ijp-shell${collapsed ? " ijp-shell--collapsed" : ""}`}>
      <aside className="ijp-shell-side d-none d-lg-block">
        <Sidebar nav={nav} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </aside>

      {/* Mobile drawer. Rendered only while open so it cannot trap focus. */}
      {drawerOpen ? (
        <>
          <button
            type="button"
            className="ijp-scrim d-lg-none"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close the navigation menu"
          />
          <aside className="ijp-drawer d-lg-none" role="dialog" aria-label="Navigation">
            <Sidebar nav={nav} inDrawer onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </>
      ) : null}

      <div className="ijp-shell-main">
        <Topbar
          title={activeLabel}
          settingsPath={settingsPath}
          basePath={settingsPath.replace(/\/settings$/, "")}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="ijp-shell-content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
