import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Users, Briefcase, CreditCard, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Home", icon: Home, path: "/instructor" },
  { label: "Schedule", icon: Calendar, path: "/instructor/schedule" },
  { label: "Pupils", icon: Users, path: "/instructor/pupils" },
  { label: "Jobs", icon: Briefcase, path: "/instructor/jobs", showBadge: true },
  { label: "Pay", icon: CreditCard, path: "/instructor/pay" },
  { label: "Settings", icon: Settings, path: "/instructor/settings" },
];

// Mock instructor ID for demo
const MOCK_INSTRUCTOR_ID = "550e8400-e29b-41d4-a716-446655440000";

export function InstructorBottomNav() {
  const location = useLocation();
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  useEffect(() => {
    const fetchPendingJobs = async () => {
      const { count, error } = await supabase
        .from("course_enquiries")
        .select("*", { count: "exact", head: true })
        .eq("assigned_instructor_id", MOCK_INSTRUCTOR_ID)
        .eq("status", "pending");

      if (!error && count) {
        setPendingJobsCount(count);
      }
    };

    fetchPendingJobs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("job-offers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_enquiries",
          filter: `assigned_instructor_id=eq.${MOCK_INSTRUCTOR_ID}`,
        },
        () => {
          fetchPendingJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white to-gray-50/95 border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] md:hidden">
      <div className="flex items-center justify-around h-12 w-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showNotification = item.showBadge && pendingJobsCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className="relative">
                <item.icon
                  className="h-4 w-4 transition-all duration-200"
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {showNotification && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-wide transition-all duration-200 ${
                isActive ? "font-semibold" : "font-medium"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}
