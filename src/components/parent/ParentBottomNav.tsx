import { Home, Users, MessageSquare, Settings, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "children", label: "Children", icon: Users },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

interface ParentBottomNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export function ParentBottomNav({ activeSection, onNavigate }: ParentBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-[#f2f2f7]"
    >
      <div className="flex items-center justify-around h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <div className="relative">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg w-8 h-8 transition-colors",
                    isActive ? "bg-primary" : ""
                  )}
                >
                  <item.icon
                    className="h-5 w-5 transition-all duration-200"
                    strokeWidth={isActive ? 2 : 1.8}
                    color={isActive ? "#ffffff" : "#8e8e93"}
                  />
                </div>
              </div>
              <span
                className={cn(
                  "text-[12px] font-medium transition-all duration-200",
                  isActive ? "text-primary" : "text-[#8e8e93]"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" style={{ background: "inherit" }} />
    </nav>
  );
}
