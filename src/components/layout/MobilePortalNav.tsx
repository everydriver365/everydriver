import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

interface MobilePortalNavProps {
  items: MobileNavItem[];
  layoutId: string;
  activeColor?: string;
  inactiveColor?: string;
  bgClassName?: string;
  pillClassName?: string;
  /** Use buttons with onClick instead of Links (for section-based portals) */
  onNavigate?: (path: string) => void;
  /** If using section-based navigation, pass the active section id */
  activeSection?: string;
}

export function MobilePortalNav({
  items,
  layoutId,
  activeColor = "text-primary",
  inactiveColor = "text-muted-foreground",
  bgClassName = "bg-white/80 backdrop-blur-xl border-t border-[hsl(240_5%_78%/0.5)]",
  pillClassName = "bg-primary",
  onNavigate,
  activeSection,
}: MobilePortalNavProps) {
  const location = useLocation();

  return (
    <nav
      className={cn("fixed bottom-0 left-0 right-0 z-50 md:hidden", bgClassName)}
      role="navigation"
    >
      <div className="flex items-center justify-around h-16 w-full px-1">
        {items.map((item) => {
          const isActive = activeSection
            ? activeSection === item.path
            : item.path === items[0]?.path
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

          const content = (
            <>
              <div className="relative">
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <item.icon
                    className={cn("h-5 w-5", isActive ? activeColor : inactiveColor)}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </motion.div>
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {item.badge! > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? activeColor : inactiveColor
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className={cn("absolute bottom-1 w-5 h-[3px] rounded-full", pillClassName)}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </>
          );

          if (onNavigate) {
            return (
              <button
                key={item.path}
                onClick={() => {
                  haptics.selection();
                  onNavigate(item.path);
                }}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => haptics.selection()}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {content}
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" style={{ background: "inherit" }} />
    </nav>
  );
}
