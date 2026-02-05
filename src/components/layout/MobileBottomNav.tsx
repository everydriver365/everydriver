import { Link, useLocation } from "react-router-dom";
import { Home, Search, BookOpen, HelpCircle, MessageCircle, Gift } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, path: "/drive365" },
  { label: "Search", icon: Search, path: "/courses" },
  { label: "Theory", icon: BookOpen, path: "/theory" },
  { label: "FAQs", icon: HelpCircle, path: "/faqs" },
  { label: "Help", icon: MessageCircle, path: "/help" },
  { label: "Benefits", icon: Gift, path: "/benefits" },
];

export function MobileBottomNav() {
  const location = useLocation();

  // Hide the public site bottom-nav inside the instructor portal.
  // Instructor pages render their own bottom navigation.
  if (location.pathname.startsWith("/instructor")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary-foreground/10 md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive 
                  ? "text-white" 
                  : "text-primary-foreground/60 hover:text-primary-foreground/80"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-primary" />
    </nav>
  );
}
