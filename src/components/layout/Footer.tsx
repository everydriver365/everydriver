import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useRouteLogo } from "@/hooks/useRouteLogo";

// Decorative tyre track SVG pattern
function TyreTrackPattern() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-48 md:w-72 lg:w-96 opacity-[0.08] pointer-events-none"
      viewBox="0 0 200 600"
      preserveAspectRatio="xMaxYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left track */}
      <g fill="currentColor">
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={`left-${i}`} transform={`translate(40, ${i * 30})`}>
            <polygon points="0,0 25,8 25,18 0,10" />
            <polygon points="30,0 55,8 55,18 30,10" />
          </g>
        ))}
      </g>
      {/* Right track */}
      <g fill="currentColor">
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={`right-${i}`} transform={`translate(110, ${i * 30 + 15})`}>
            <polygon points="0,0 25,8 25,18 0,10" />
            <polygon points="30,0 55,8 55,18 30,10" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Footer() {
  const { logo, logoAlt, logoText, homeLink } = useRouteLogo();

  return (
    <footer style={{ backgroundColor: "#09507f" }} className="relative border-t text-primary-foreground overflow-hidden">
      {/* Tyre track decoration - hidden on small screens */}
      <div className="hidden sm:block">
        <TyreTrackPattern />
      </div>

      <div className="container relative z-10 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to={homeLink} className="flex items-center gap-2">
              <img src={logo} alt={logoAlt} className="h-10 -mx-1" />
              {logoText && <span className="text-sm font-semibold text-primary-foreground">{logoText}</span>}
            </Link>
            <p className="text-sm text-primary-foreground/70">
              Professional driving instruction to help you pass your test with confidence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/70 transition-colors hover:text-accent">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 transition-colors hover:text-accent">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 transition-colors hover:text-accent">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/courses" className="hover:text-accent">Find Courses</Link></li>
              <li><Link to="/about" className="hover:text-accent">About Us</Link></li>
              <li><Link to="/pricing" className="hover:text-accent">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-accent">FAQ</Link></li>
              <li><Link to="/instructor-app/login" className="hover:text-accent font-medium text-accent">EveryDriver for Instructors</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="mb-4 font-semibold">Portals</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/drive365" className="hover:text-accent">Drive365 Learners</Link></li>
              <li><Link to="/pupil/login" className="hover:text-accent">Pupil Portal</Link></li>
              <li><Link to="/instructor-app/login" className="hover:text-accent">Instructor Portal</Link></li>
              <li><Link to="/admin/login" className="hover:text-accent">Admin Portal</Link></li>
              <li><Link to="/accessible" className="hover:text-accent text-accent font-medium">Drive for all</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold">Contact Us</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>0800 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>hello@drivetime.co.uk</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Covering all UK postcodes</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/10 pt-8 text-center text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} Drive365. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="/privacy-policy" className="hover:text-accent">Privacy Policy</a>
            <span>|</span>
            <Link to="/terms-of-service" className="hover:text-accent">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
