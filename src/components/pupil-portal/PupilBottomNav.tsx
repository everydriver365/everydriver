import { useState, useRef, useEffect } from "react";
import { Home, Clock, CreditCard, BookOpen, MessageSquare, LucideIcon } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { motion, AnimatePresence } from "framer-motion";
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
  { id: "messages", label: "Messages", icon: MessageSquare },
];

interface PupilBottomNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  brandColour?: string | null;
  wallpaperColor?: string;
  badges?: {
    lessons?: string | number;
    payments?: string | number;
    theory?: string | number;
    messages?: string | number;
  };
  courseProgress?: number;
}

export function PupilBottomNav({ activeSection, onNavigate, brandColour, wallpaperColor, badges, courseProgress }: PupilBottomNavProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const handleNavClick = (id: string) => {
    haptics.selection();
    onNavigate(id);
  };

  const handleLongPressStart = (id: string) => {
    if (id !== "more") return;
    const timer = setTimeout(() => {
      setShowQuickMenu(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const activeColor = brandColour || undefined;

  const getBadge = (id: string) => {
    if (!badges) return null;
    if (id === "schedule") return badges.lessons;
    if (id === "payments") return badges.payments;
    if (id === "theory") return badges.theory;
    if (id === "messages") return badges.messages;
    return null;
  };

  return (
    <>
      {/* Quick Access Menu (long-press on More) */}
      <AnimatePresence>
        {showQuickMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowQuickMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-20 right-4 z-50 bg-card rounded-2xl border border-border shadow-2xl p-2 min-w-[160px]"
            >
              {[
                { id: "progress", label: "My Progress" },
                { id: "history", label: "Lesson History" },
                { id: "coaching", label: "AI Coaching" },
                { id: "messages", label: "Messages" },
                { id: "notes", label: "My Notes" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate(item.id);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-foreground rounded-xl hover:bg-muted transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "#FFFFFF",
          borderTop: "0.5px solid #E5E7EB",
        }}
      >
        <div className="flex items-center justify-around h-16 w-full px-1 pb-safe">
          {navItems.map((item) => {
            const isActive = activeSection === item.id || (item.id === "home" && activeSection === "home");
            const badge = getBadge(item.id);
            const showProgressRing = item.id === "home" && courseProgress !== undefined;
            const activeNavy = "#0F2044";
            const inactiveGrey = "#888780";
            const color = isActive ? activeNavy : inactiveGrey;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                onTouchStart={() => handleLongPressStart(item.id)}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={() => handleLongPressStart(item.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              >
                <div className="relative p-1">
                  {showProgressRing ? (
                    <div className="relative h-6 w-6">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="#E5E7EB" strokeWidth="2" />
                        <circle
                          cx="12" cy="12" r="10" fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeDasharray={`${(courseProgress / 100) * 62.83} 62.83`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <Home
                        className="absolute inset-0 m-auto h-3 w-3"
                        strokeWidth={isActive ? 2.2 : 1.8}
                        style={{ color }}
                      />
                    </div>
                  ) : (
                    <motion.div
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon
                        className="h-5 w-5 transition-all duration-200"
                        strokeWidth={isActive ? 2.2 : 1.8}
                        style={{ color }}
                      />
                    </motion.div>
                  )}

                  {badge !== null && badge !== undefined && (
                    <span
                      className="absolute -top-1 -right-2 text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center"
                      style={{ background: "#E53935", color: "#fff" }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-medium transition-all duration-200"
                  style={{ color }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-safe-area-inset-bottom" style={{ background: "inherit" }} />
      </nav>
    </>
  );
}
