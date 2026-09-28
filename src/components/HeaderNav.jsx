import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function HeaderNav({
  basePath = "",
  activeBookingsCount,
  isSidebarOpen,
  onToggleSidebar,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const location = useLocation();

  const homePath = basePath || "/";
  const otherPaths = [
    `${basePath}/admin/menu`,
    `${basePath}/table-view`,
    `${basePath}/admin/rates`,
  ];

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

  const isOtherActive = otherPaths.some((p) => location.pathname.startsWith(p));
  const isHomeActive = location.pathname === homePath;
  const isBookingsActive = location.pathname.startsWith(`${basePath}/admin/bookings`);

  const closeMore = () => setIsMoreOpen(false);

  return (
    <>
      <nav className="header-nav" aria-label="Main navigation">
        <Link
          className={`header-nav-item ${isHomeActive ? "is-active" : ""}`}
          to={homePath}
        >
          Home
        </Link>
        <Link
          className={`header-nav-item header-nav-item-with-badge ${
            isBookingsActive ? "is-active" : ""
          }`}
          to={`${basePath}/admin/bookings`}
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
              to={`${basePath}/table-view`}
              onClick={closeMore}
              role="menuitem"
            >
              Table View
            </Link>
            <Link
              className="header-nav-more-item"
              to={`${basePath}/admin/menu`}
              onClick={closeMore}
              role="menuitem"
            >
              Manage Bar
            </Link>
            <Link
              className="header-nav-more-item"
              to={`${basePath}/admin/rates`}
              onClick={closeMore}
              role="menuitem"
            >
              Rate Settings
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
