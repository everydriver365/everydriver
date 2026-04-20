import { Link } from "react-router-dom";
import dfaLogo from "@/assets/dfa-logo.png";

export function AccessibleFooter() {
  return (
    <footer className="acc-footer">
      <div className="acc-container py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="acc-brand mb-3">
              <img src={dfaLogo} alt="Drive for all" className="h-10 w-auto" />
            </div>
            <p className="text-sm opacity-80">
              Driving designed around you — accessible instructors, adapted-vehicle garages and a community for disabled drivers.
            </p>
          </div>

          <div>
            <h3 className="acc-footer-title">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/accessible/instructors" className="acc-footer-link">Instructors</Link></li>
              <li><Link to="/accessible/forum" className="acc-footer-link">Forum</Link></li>
              <li><Link to="/accessible/garages" className="acc-footer-link">Garages</Link></li>
              <li><Link to="/accessible/trackers" className="acc-footer-link">Trackers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="acc-footer-title">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="acc-footer-link">Contact us</Link></li>
              <li><Link to="/help" className="acc-footer-link">Help centre</Link></li>
              <li><a href="mailto:hello@drive365.co.uk" className="acc-footer-link">hello@drive365.co.uk</a></li>
            </ul>
          </div>

          <div>
            <h3 className="acc-footer-title">Accessibility</h3>
            <p className="text-sm opacity-80">
              We aim for WCAG 2.2 AA across this site. If you hit a barrier, please email us — we'll fix it fast.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-xs opacity-70">
          © {new Date().getFullYear()} Drive for all. Part of the Drive365 family.
        </div>
      </div>
    </footer>
  );
}
