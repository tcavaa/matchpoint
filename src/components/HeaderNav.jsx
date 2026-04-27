import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const OTHER_PATHS = ["/admin/menu", "/table-view", "/admin/sales"];

export default function HeaderNav({
  activeBookingsCount,
  isSidebarOpen,
  onToggleSidebar,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handler = (event) => {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  const isOtherActive = OTHER_PATHS.some((p) => location.pathname.startsWith(p));
  const isHomeActive = location.pathname === "/";
  const isBookingsActive = location.pathname.startsWith("/admin/bookings");

  const closeMore = () => setIsMoreOpen(false);

  return (
    <>
      <nav className="header-nav" aria-label="Main navigation">
        <Link
          className={`header-nav-item ${isHomeActive ? "is-active" : ""}`}
          to="/"
        >
          Home
        </Link>
        <Link
          className={`header-nav-item header-nav-item-with-badge ${
            isBookingsActive ? "is-active" : ""
          }`}
          to="/admin/bookings"
        >
          Bookings
          {activeBookingsCount > 0 && (
            <span className="header-nav-badge">{activeBookingsCount}</span>
          )}
        </Link>
        <div
          className={`header-nav-more ${isMoreOpen ? "is-open" : ""}`}
          ref={moreRef}
        >
          <button
            type="button"
            className={`header-nav-item header-nav-more-toggle ${
              isOtherActive ? "is-active" : ""
            }`}
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            aria-haspopup="menu"
          >
            Other
            <span className="header-nav-chevron" aria-hidden="true">
              ▾
            </span>
          </button>
          <div className="header-nav-more-menu" role="menu">
            <Link
              className="header-nav-more-item"
              to="/table-view"
              onClick={closeMore}
              role="menuitem"
            >
              Table View
            </Link>
            <Link
              className="header-nav-more-item"
              to="/admin/menu"
              onClick={closeMore}
              role="menuitem"
            >
              Manage Bar
            </Link> 
            <Link
              className="header-nav-more-item"
              to="/admin/sales"
              onClick={closeMore}
              role="menuitem"
            >
              Sale Settings
            </Link>
          </div>
        </div>
      </nav>
      <button
        type="button"
        className="header-bar-toggle"
        onClick={onToggleSidebar}
      >
        {isSidebarOpen ? "Close Bar" : "Open Bar"}
      </button>
    </>
  );
}
