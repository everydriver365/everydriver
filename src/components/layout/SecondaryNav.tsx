import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, FileEdit, Phone, User } from "lucide-react";

const secondaryLinks = [
  { href: "/theory", label: "Theory Practice", icon: BookOpen, external: false },
  { href: "/contact?type=bespoke", label: "Bespoke Course Request", icon: FileEdit, external: false },
  { href: "/contact?type=callback", label: "Request a Callback", icon: Phone, external: false },
  { href: "/test-swap", label: "Test Swap", icon: CalendarDays, external: false },
  { href: "/instructor-app/login", label: "Instructor Login", icon: User, external: false },
  { href: "/pupil/login", label: "Pupil Login", icon: User, external: false },
];

export function SecondaryNav() {
  return (
    <div className="bg-[hsl(var(--secondary-nav))] border-b border-[hsl(var(--secondary-nav-foreground))]/10">
      <div className="container">
        <nav className="flex items-center justify-center gap-1 md:gap-4 py-1 overflow-x-auto">
          {secondaryLinks.map((link) => {
            const Icon = link.icon;
            const className = "flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-[hsl(var(--secondary-nav-foreground))] hover:text-[hsl(var(--secondary-nav-foreground))]/80 transition-colors whitespace-nowrap";
            const content = (
              <>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.label.split(' ')[0]}</span>
              </>
            );
            return link.external ? (
              <a key={link.href} href={link.href} className={className}>
                {content}
              </a>
            ) : (
              <Link key={link.href} to={link.href} className={className}>
                {content}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
