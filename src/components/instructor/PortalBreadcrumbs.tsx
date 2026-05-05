import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  items: Crumb[];
}

export function PortalBreadcrumbs({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex items-center flex-wrap gap-1">
        <li className="flex items-center gap-1">
          <Link
            to="/instructor"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3 w-3" />
            <span>Dashboard</span>
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 opacity-60" />
              {item.to && !isLast ? (
                <Link to={item.to} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-foreground font-medium" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
