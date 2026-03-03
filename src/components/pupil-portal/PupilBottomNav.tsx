import { Home, Clock, CreditCard, BookOpen, Grid3X3, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function getContrastColor(hex: string): { active: string; inactive: string } {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const base = lum > 0.6 ? "0,0,0" : "255,255,255";
  return { active: `rgba(${base},1)`, inactive: `rgba(${base},0.6)` };
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "schedule", label: "Lessons", icon: Clock },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "theory", label: "Theory", icon: BookOpen },
  { id: "more", label: "More", icon: Grid3X3 },
];

interface PupilBottomNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  brandColour?: string | null;
  wallpaperColor?: string;
}

export function PupilBottomNav({ activeSection, onNavigate, brandColour, wallpaperColor }: PupilBottomNavProps) {
  // "more" maps to "home" with menu visible — or just back to home for simplicity
  const handleNavClick = (id: string) => {
    onNavigate(id === "more" ? "home" : id);
  };

  const bgColor = wallpaperColor || "#f2f2f7";
  const contrast = getContrastColor(bgColor);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center justify-around h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id || (item.id === "home" && activeSection === "home");
          const activeColor = brandColour || `hsl(var(--primary))`;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <div className="relative">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg w-8 h-8 transition-colors",
                    isActive ? "bg-current" : ""
                  )}
                  style={isActive ? { backgroundColor: contrast.active } : undefined}
                >
                  <item.icon
                    className="h-5 w-5 transition-all duration-200"
                    strokeWidth={isActive ? 2 : 1.8}
                    color={isActive ? bgColor : contrast.inactive}
                  />
                </div>
              </div>
              <span
                className="text-[12px] font-medium transition-all duration-200"
                style={{ color: isActive ? contrast.active : contrast.inactive }}
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
