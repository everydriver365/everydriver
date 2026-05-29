import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { QUICK_ACCESS, QATile } from "@/components/instructor/MobileHomeDSM2026";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useQuickAccessUnreads } from "@/hooks/useQuickAccessUnreads";
import { haptics } from "@/lib/haptics";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
const BG = "#F4F7F6";

export default function InstructorQuickAccessAll() {
  const navigate = useNavigate();
  const location = useLocation();
  const { instructor } = useInstructorAuth();
  const unreads = useQuickAccessUnreads(instructor?.id ?? "");
  const [activeRoute, setActiveRoute] = useState<string | null>(null);

  const isEvery = location.pathname.startsWith("/every-instructor");
  const backTo = isEvery ? "/every-instructor" : "/instructor";

  return (
    <div
      className="min-h-screen ios-instructor instructor-portal ios-scroll a11y-scope"
      style={{ backgroundColor: BG, fontFamily: FONT }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: BG,
          padding: "12px 16px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "0.5px solid #E5E5EA",
        }}
      >
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            if (window.history.length > 1) navigate(-1);
            else navigate(backTo);
          }}
          aria-label="Back"
          style={{
            background: "transparent",
            border: 0,
            padding: 4,
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
            color: "#000",
          }}
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#000" }}>
          Quick access
        </span>
      </div>

      <main style={{ padding: "16px 16px 96px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {QUICK_ACCESS.map((item) => (
            <QATile
              key={item.label}
              item={item}
              active={activeRoute === item.route}
              onPress={() => {
                haptics.selection();
                setActiveRoute(item.route);
                navigate(item.route);
              }}
              badgeCount={unreads[item.label] ?? 0}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
