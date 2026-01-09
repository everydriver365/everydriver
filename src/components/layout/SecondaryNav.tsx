import { Link } from "react-router-dom";
import { BookOpen, FileEdit, Phone, User } from "lucide-react";

const secondaryLinks = [
  { href: "/theory", label: "Theory Practice", icon: BookOpen },
  { href: "/contact?type=bespoke", label: "Bespoke Course Request", icon: FileEdit },
  { href: "/contact?type=callback", label: "Request a Callback", icon: Phone },
  { href: "/instructor", label: "Instructor Login", icon: User },
  { href: "/pupil", label: "Pupil Login", icon: User },
];

export function SecondaryNav() {
  return (
    <div className="bg-[hsl(var(--secondary-nav))] border-b border-[hsl(var(--secondary-nav-foreground))]/10">
      <div className="container">
        <nav className="flex items-center justify-center gap-1 md:gap-6 py-2 overflow-x-auto">
          {secondaryLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-[hsl(var(--secondary-nav-foreground))] hover:text-[hsl(var(--secondary-nav-foreground))]/80 transition-colors whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
