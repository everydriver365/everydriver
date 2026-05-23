import { useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Phone, Bell, Plus, Menu, RefreshCw, List, Columns3, CalendarRange } from "lucide-react";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useActiveTrackingSession } from "@/hooks/useActiveTrackingSession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAICallDivert } from "@/hooks/useAICallDivert";
import { AICallDivertSheet } from "@/components/instructor/AICallDivertSheet";

type ViewMode = 'list' | 'week' | 'month' | 'calendar' | 'schedule';

interface Stats {
  lessons: number;
  scheduled: number;
  free: number;
  overdue: number;
}

interface Props {
  instructorId: string | undefined;
  profileImageUrl?: string | null;
  instructorName?: string | null;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onSync: () => void;
  isSyncing: boolean;
  onAdd: () => void;
  navigate: NavigateFunction;
  stats: Stats;
}

const BORDER = "0.5px solid #e0e3ea";
const FONT = "Poppins, system-ui, sans-serif";

function CircleBtn({ onClick, label, children, badge }: { onClick: () => void; label: string; children: React.ReactNode; badge?: number }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: "relative", width: 30, height: 30, borderRadius: 15,
        background: "#fff", border: BORDER,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0, cursor: "pointer", flexShrink: 0,
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: "absolute", top: -3, right: -3,
          minWidth: 14, height: 14, padding: "0 3px", borderRadius: 8,
          background: "#c9302c", color: "#fff",
          fontSize: 9, fontWeight: 600, lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function TrackingPill({ instructorId, navigate }: { instructorId: string | undefined; navigate: NavigateFunction }) {
  const { data: prefs } = useQuery({
    queryKey: ["instructor-auto-start-tracker", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data } = await supabase.from("instructors").select("auto_start_tracker").eq("id", instructorId!).maybeSingle();
      return data as { auto_start_tracker: boolean | null } | null;
    },
  });
  const enabled = !!instructorId && !!prefs?.auto_start_tracker;
  const { data: session } = useActiveTrackingSession(enabled ? instructorId : undefined);
  if (!enabled || !session) return null;
  return (
    <button
      onClick={() => navigate("/instructor/tracking")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "#e8f5ee", color: "#2d8a4e",
        borderRadius: 20, padding: "3px 9px 3px 7px",
        border: "none", cursor: "pointer",
        fontFamily: FONT, fontSize: 11, fontWeight: 600,
        WebkitTapHighlightColor: "transparent",
      }}
      aria-label="Tracking active"
    >
      <span style={{
        width: 7, height: 7, borderRadius: 999, background: "#2d8a4e",
        animation: "schedule-pulse 1.5s ease-in-out infinite alternate",
      }} />
      Tracking
      <style>{`@keyframes schedule-pulse { from { opacity: 0.4; } to { opacity: 1; } }`}</style>
    </button>
  );
}

function StatTile({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div style={{
      background: "#fff", border: BORDER, borderRadius: 12, padding: 10,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minWidth: 0,
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.1, fontFamily: FONT }}>{value}</div>
      <div style={{ marginTop: 4, fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", fontFamily: FONT }}>
        {label}
      </div>
    </div>
  );
}

export function ScheduleMobileChrome({
  instructorId, profileImageUrl, instructorName,
  viewMode, setViewMode, onSync, isSyncing, onAdd, navigate, stats,
}: Props) {
  const [divertSheetOpen, setDivertSheetOpen] = useState(false);
  const { total: notifCount } = useCombinedNotificationCount(instructorId);
  const aiDivert = useAICallDivert(instructorId, null);

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const dateLine = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const initial = (instructorName || "I").charAt(0).toUpperCase();

  const toggles: { label: string; target: ViewMode; Icon: typeof List }[] = [
    { label: "List", target: "list", Icon: List },
    { label: "Week", target: "week", Icon: Columns3 },
    { label: "Month", target: "month", Icon: CalendarRange },
  ];

  return (
    <div style={{ fontFamily: FONT, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Nav bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1a1a1f", letterSpacing: "-0.2px" }}>
            Schedule
          </h1>
          <TrackingPill instructorId={instructorId} navigate={navigate} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CircleBtn onClick={() => setDivertSheetOpen(true)} label="Calls">
            <Phone size={14} strokeWidth={1.8} color={aiDivert.settings.mode !== "off" ? "#1D9E75" : "#6B6B6B"} />
          </CircleBtn>
          <CircleBtn onClick={() => navigate("/instructor/notifications")} label="Notifications" badge={notifCount}>
            <Bell size={14} strokeWidth={1.8} color="#6B6B6B" />
          </CircleBtn>
          <CircleBtn onClick={onAdd} label="Add">
            <Plus size={14} strokeWidth={1.8} color="#6B6B6B" />
          </CircleBtn>
          <CircleBtn onClick={() => navigate("/instructor/menu")} label="Menu">
            <Menu size={14} strokeWidth={1.8} color="#6B6B6B" />
          </CircleBtn>
          <button
            onClick={() => navigate("/instructor/profile")}
            aria-label="Profile"
            style={{
              width: 30, height: 30, borderRadius: 15,
              background: "#B23A3F", border: BORDER, overflow: "hidden",
              padding: 0, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{initial}</span>
            )}
          </button>
        </div>
      </div>

      {/* Month / date header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1f", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            {monthYear}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#aaa" }}>
            {dateLine} · Today
          </div>
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          aria-label="Sync calendar"
          style={{
            width: 34, height: 34, borderRadius: 17,
            background: "#fff", border: BORDER,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, cursor: "pointer", flexShrink: 0,
          }}
        >
          <RefreshCw size={15} strokeWidth={1.8} color="#1a1a1f" style={isSyncing ? { animation: "spin 1s linear infinite" } : undefined} />
        </button>
      </div>

      {/* View toggle */}
      <div style={{
        background: "#fff", border: BORDER, borderRadius: 12, padding: 3,
        display: "flex", gap: 2,
      }}>
        {toggles.map(({ label, target, Icon }) => {
          const active = viewMode === target;
          return (
            <button
              key={label}
              onClick={() => setViewMode(target)}
              style={{
                flex: 1, borderRadius: 9, padding: "8px 0",
                background: active ? "#1a1a1f" : "transparent",
                color: active ? "#fff" : "#aaa",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                fontSize: 12, fontWeight: 500, fontFamily: FONT,
              }}
            >
              <Icon size={13} strokeWidth={1.8} />
              {label}
            </button>
          );
        })}
      </div>





      <AICallDivertSheet open={divertSheetOpen} onOpenChange={setDivertSheetOpen} state={aiDivert} />
    </div>
  );
}
