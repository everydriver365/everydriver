import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Settings } from "lucide-react";
import { EveryInstructorBottomNav } from "@/components/instructor/EveryInstructorBottomNav";

interface Props {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function EveryInstructorLayout({ children, title = "Every Instructor", showHeader = true }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F2F2F7" }}>
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[hsl(240_5%_78%/0.5)]">
          <div className="flex items-center justify-between px-5 h-14">
            <h1 className="text-xl font-bold text-[hsl(240_6%_11%)] tracking-tight">{title}</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/every-instructor/notifications")}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" strokeWidth={1.8} />
              </button>
              <button
                onClick={() => navigate("/every-instructor/settings")}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-600" strokeWidth={1.8} />
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
