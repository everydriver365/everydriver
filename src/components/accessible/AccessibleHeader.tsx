import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Accessibility } from "lucide-react";

const NAV = [
  { to: "/accessible/instructors", label: "Instructors" },
  { to: "/accessible/forum", label: "Forum" },
  { to: "/accessible/garages", label: "Garages" },
  { to: "/accessible/trackers", label: "Trackers" },
];

export function AccessibleHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="acc-header">
      <div className="acc-container flex items-center justify-between gap-4 py-4">
        <Link to="/accessible" className="acc-brand" aria-label="Drive for all home">
          <span className="acc-brand-mark" aria-hidden="true">
            <Accessibility className="h-6 w-6" />
          </span>
          <span className="acc-brand-text">
            <span className="acc-brand-1">Drive</span>
            <span className="acc-brand-2">for all</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `acc-nav-link ${isActive ? "acc-nav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/pupil/login" className="acc-btn acc-btn--ghost ml-2">Sign in</Link>
        </nav>

        <button
          type="button"
          className="acc-icon-btn md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="acc-mobile-nav md:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `acc-mobile-link ${isActive ? "acc-mobile-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/pupil/login" onClick={() => setOpen(false)} className="acc-mobile-link">
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
