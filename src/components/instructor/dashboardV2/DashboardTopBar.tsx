import { Bell, Moon, Sun, Sparkles, Search, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

const PAGE_LABELS: Record<string, string> = {
  "/instructor": "Dashboard",
  "/instructor/schedule": "Schedule",
  "/instructor/diary": "Diary",
  "/instructor/find-appointment": "Find slot",
  "/instructor/pupils": "Pupils",
  "/instructor/course-planner": "Course Planner",
  "/instructor/waiting-list": "Waiting List",
  "/instructor/gaps": "Fill Gaps",
  "/instructor/test-results": "Driving Test Results",
  "/instructor/test-requests": "Test Swap",
  "/instructor/standards-check": "Standards Check",
  "/instructor/cpd": "CPD",
  "/instructor/tracking": "Live Tracking",
  "/instructor/fleet-map": "Fleet Map",
  "/instructor/vehicle-health": "Vehicle Health",
  "/instructor/satnav": "SatNav",
  "/instructor/dashcam": "Dashcam",
  "/instructor/mileage": "Mileage",
  "/instructor/fuel": "Fuel",
  "/instructor/routes": "Saved Routes",
  "/instructor/famulor": "Telephone Calls and Answering",
  "/instructor/take-payment": "Take Payment",
  "/instructor/pay": "Payments",
  "/instructor/pending-scheduling": "Pending",
  "/instructor/expenses": "Expenses",
  "/instructor/tax": "Tax",
  "/instructor/income": "Reports",
  "/instructor/reviews": "Reviews",
  "/instructor/referrals": "Referrals",
  "/instructor/automations": "Automations",
  "/website/my-site": "My Site",
  "/instructor/branding": "Branding",
  "/instructor/domains": "Domain",
  "/instructor/profile": "Profile",
  "/instructor/billing": "Plan & Billing",
  "/instructor/modules": "Modules",
  "/instructor/integrations": "Integrations",
  "/instructor/menu": "More tools",
};

interface Props {
  userInitials: string;
  notificationCount?: number;
  onAskED: () => void;
  onBell: () => void;
}

export function DashboardTopBar({ userInitials, notificationCount = 0, onAskED, onBell }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { pathname } = useLocation();
  const currentLabel =
    PAGE_LABELS[pathname] ||
    Object.entries(PAGE_LABELS).find(([key]) => key !== "/instructor" && pathname.startsWith(key + "/"))?.[1] ||
    "Dashboard";

  return (
    <header
      className="sticky top-0 z-20 flex items-center"
      style={{
        height: 56,
        padding: "0 24px",
        background: "var(--d2-surface)",
        borderBottom: "0.5px solid var(--d2-border)",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5" style={{ fontSize: 13 }}>
        <span style={{ color: "var(--d2-text-3)" }}>Instructor</span>
        <ChevronRight size={12} style={{ color: "var(--d2-text-3)" }} strokeWidth={2} />
        <span style={{ color: "var(--d2-text-1)", fontWeight: 600 }}>{currentLabel}</span>
      </nav>

      <div className="flex-1" />

      {/* Search */}
      <div
        className="hidden md:flex items-center gap-2"
        style={{
          width: 240, height: 32,
          padding: "0 10px",
          border: "0.5px solid var(--d2-border)",
          borderRadius: 8,
          background: "var(--d2-surface-soft)",
        }}
      >
        <Search size={13} style={{ color: "var(--d2-text-3)" }} />
        <input
          placeholder="Search…"
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 12, color: "var(--d2-text-1)" }}
        />
        <span
          style={{
            fontSize: 10, fontWeight: 500,
            color: "var(--d2-text-3)",
            border: "0.5px solid var(--d2-border)",
            borderRadius: 4, padding: "1px 5px",
            background: "var(--d2-surface)",
          }}
        >
          ⌘K
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-3">
        {/* Theme */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="rounded-md p-1.5 transition-colors"
          style={{ color: "var(--d2-text-2)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Bell */}
        <button
          onClick={onBell}
          className="relative rounded-md p-1.5 transition-colors"
          style={{ color: "var(--d2-text-2)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Notifications"
        >
          <Bell size={15} />
          {notificationCount > 0 && (
            <span
              style={{
                position: "absolute", top: 4, right: 4,
                width: 6, height: 6, borderRadius: "50%",
                background: "#EF4444",
              }}
            />
          )}
        </button>

        {/* Ask ED */}
        <button
          onClick={onAskED}
          className="flex items-center gap-1.5 transition-colors"
          style={{
            height: 30, padding: "0 12px",
            background: "var(--d2-indigo)",
            color: "#fff",
            borderRadius: 999,
            fontSize: 12, fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d2-indigo-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--d2-indigo)")}
        >
          <Sparkles size={13} />
          Ask ED
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center ml-1"
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--d2-indigo-bg)",
            color: "var(--d2-indigo)",
            fontSize: 11, fontWeight: 600,
          }}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
