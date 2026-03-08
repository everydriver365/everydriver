import { Home, Clock, CreditCard, BookOpen, Grid3X3, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const handleNavClick = (id: string) => {
    onNavigate(id === "more" ? "home" : id);
  };

  const activeColor = brandColour || undefined;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 w-full px-1 pb-safe">
        {navItems.map((item) => {
          const isActive = activeSection === item.id || (item.id === "home" && activeSection === "home");

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              <div className="relative p-1">
                <item.icon
                  className="h-5 w-5 transition-all duration-200"
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{ color: isActive ? (activeColor || 'hsl(var(--primary))') : 'hsl(var(--muted-foreground))' }}
                />
              </div>
              <span
                className="text-[10px] font-medium transition-all duration-200"
                style={{ color: isActive ? (activeColor || 'hsl(var(--primary))') : 'hsl(var(--muted-foreground))' }}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="pupil-tab-pill"
                  className="absolute -bottom-0 h-0.5 w-6 rounded-full"
                  style={{ backgroundColor: activeColor || 'hsl(var(--primary))' }}
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
