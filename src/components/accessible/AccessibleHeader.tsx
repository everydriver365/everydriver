import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import dfaLogo from "@/assets/dfa-logo.png";

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
        <Link to="/accessible" className="acc-brand flex items-center gap-3" aria-label="Drive for all home">
          <img src={dfaLogo} alt="Drive for all" className="h-10 w-auto" />
          <span className="hidden text-sm font-semibold tracking-wide text-foreground sm:inline">Driving For All</span>
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
