import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo-everydriver-dark.png";

export function Footer() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="EveryDriver" className="h-10" />
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
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="mb-4 font-semibold">Portals</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/pupil" className="hover:text-accent">Pupil Portal</Link></li>
              <li><Link to="/instructor" className="hover:text-accent">Instructor Portal</Link></li>
              <li><Link to="/parent" className="hover:text-accent">Parent Portal</Link></li>
              <li><Link to="/admin" className="hover:text-accent">Admin Portal</Link></li>
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
          <p>© {new Date().getFullYear()} DriveTime. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
