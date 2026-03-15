import { Home, Users, MessageSquare, Settings, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'children' | 'feedback';
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "children", label: "Children", icon: Users, badgeKey: "children" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, badgeKey: "feedback" },
  { id: "settings", label: "Settings", icon: Settings },
];

interface ParentBottomNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  negativeBadgeCount?: number;
  feedbackBadgeCount?: number;
}

export function ParentBottomNav({ activeSection, onNavigate, negativeBadgeCount = 0, feedbackBadgeCount = 0 }: ParentBottomNavProps) {
  const getBadgeCount = (key?: string) => {
    if (key === 'children') return negativeBadgeCount;
    if (key === 'feedback') return feedbackBadgeCount;
    return 0;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      role="navigation"
      aria-label="Parent portal navigation"
    >
      <div className="flex items-center justify-around h-16 w-full px-1 pb-safe">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const badgeCount = getBadgeCount(item.badgeKey);

          return (
            <button
              key={item.id}
              onClick={() => { haptics.selection(); onNavigate(item.id); }}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <div className="relative p-1">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-0.5 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="parent-tab-pill"
                  className="absolute -bottom-0 h-0.5 w-6 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" style={{ background: "inherit" }} />
    </nav>
  );
}
