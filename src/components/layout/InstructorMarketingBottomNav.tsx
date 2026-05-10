import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, Globe, PoundSterling, LogIn } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Features", icon: Sparkles, path: "/instructor-app/features" },
  { label: "Websites", icon: Globe, path: "/instructor-app/domains" },
  { label: "Pricing", icon: PoundSterling, path: "/compare" },
  { label: "Log In", icon: LogIn, path: "/instructor-app/login" },
];

export function InstructorMarketingBottomNav() {
  const location = useLocation();

  return (
    <nav style={{ backgroundColor: "#09507f" }} className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 md:hidden">
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
      <div style={{ backgroundColor: "#09507f" }} className="h-safe-area-inset-bottom" />
    </nav>
  );
}
