import { Link } from "react-router-dom";
import { BookOpen, FileEdit, Phone, Calendar } from "lucide-react";

interface MiniWebsiteSecondaryNavProps {
  slug: string;
}

export function MiniWebsiteSecondaryNav({ slug }: MiniWebsiteSecondaryNavProps) {
  const links = [
    { to: `/i/${slug}/theory`, label: "Theory Practice", icon: BookOpen },
    { to: `/i/${slug}/tests`, label: "Test Availability", icon: Calendar },
    { to: `/i/${slug}/contact?type=bespoke`, label: "Bespoke Course Request", icon: FileEdit },
    { to: `/i/${slug}/contact?type=callback`, label: "Request a Callback", icon: Phone },
  ];

  return (
    <div className="bg-[hsl(var(--secondary-nav))] border-b border-[hsl(var(--secondary-nav-foreground))]/10">
      <div className="container">
        <nav className="flex items-center justify-center gap-1 md:gap-4 py-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
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
