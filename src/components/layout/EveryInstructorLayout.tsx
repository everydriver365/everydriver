import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Settings } from "lucide-react";
import { EveryInstructorBottomNav } from "@/components/instructor/EveryInstructorBottomNav";
import { DSMThemeToggle } from "@/components/instructor/DSMThemeToggle";

interface Props {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function EveryInstructorLayout({ children, title = "Every Instructor", showHeader = true }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen ios-instructor instructor-portal ios-scroll"
      style={{ backgroundColor: "hsl(var(--dsm-bg))" }}
    >
      {/* Header — frosted glass nav bar */}
      {showHeader && (
        <header
          className="sticky top-0 z-40 border-b"
          style={{
            backgroundColor: 'hsl(var(--dsm-card) / 0.85)',
            borderColor: 'hsl(var(--dsm-border))',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className="flex items-center justify-between px-5 h-14">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--dsm-text))' }}>{title}</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate("/every-instructor/notifications")}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              >
                <Bell className="h-5 w-5" style={{ color: 'hsl(var(--dsm-text-secondary))' }} strokeWidth={1.6} />
              </button>
              <DSMThemeToggle />
              <button
                onClick={() => navigate("/every-instructor/settings")}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              >
                <Settings className="h-5 w-5" style={{ color: 'hsl(var(--dsm-text-secondary))' }} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <main className="pb-24">{children}</main>

      {/* Bottom Nav */}
      <EveryInstructorBottomNav />
    </div>
  );
}
