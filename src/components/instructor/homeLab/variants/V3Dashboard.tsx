import { mockHome } from "../mockData";
import { Plus, Users, MessageSquare, Calendar, CreditCard, Zap, Navigation2, Settings, ChevronRight, Bell } from "lucide-react";

const ICONS: Record<string, any> = {
  plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
  "credit-card": CreditCard, zap: Zap, navigation: Navigation2, settings: Settings,
};

function Ring({ value, goal, color, label, unit }: { value: number; goal: number; color: string; label: string; unit?: string }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / goal);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} stroke="#F1F5F9" strokeWidth="8" fill="none" />
          <circle cx="40" cy="40" r={r} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 40 40)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{value}{unit}</span>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{label}</p>
    </div>
  );
}

export function V3Dashboard() {
  const m = mockHome;
  return (
    <div style={{ padding: "8px 16px 80px", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif" }}>
      <div className="flex items-center justify-between pt-1 pb-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>Hi {m.instructorName}</h1>
          <p style={{ fontSize: 12, color: "#64748B" }}>{m.dateLabel}</p>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bell size={16} color="#0F172A" />
        </button>
      </div>

      {/* Rings */}
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px 8px", display: "flex", justifyContent: "space-around", marginBottom: 12 }}>
        <Ring value={m.weekStats.lessons.value} goal={m.weekStats.lessons.goal} color="#3D55A1" label="Lessons" />
        <Ring value={m.weekStats.earnings.value} goal={m.weekStats.earnings.goal} color="#10B981" label="Earnings" unit="" />
        <Ring value={m.weekStats.hours.value} goal={m.weekStats.hours.goal} color="#F59E0B" label="Hours" unit="h" />
      </div>

      {/* KPI mosaic */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Today", value: m.todayLessons.length, sub: "lessons" },
          { label: "Open slots", value: m.openSlots.length, sub: "this week" },
          { label: "Unpaid", value: m.todayLessons.filter(l => !l.paid).length, sub: "today" },
          { label: "Alerts", value: m.alerts.pendingJobs + m.alerts.testSwaps, sub: "needs action" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#FFFFFF", borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{k.value}</p>
            <p style={{ fontSize: 11, color: "#64748B" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Up next horizontal */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 4px 8px" }}>Up next today</p>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, marginLeft: -16, marginRight: -16, padding: "0 16px 8px" }}>
        {m.todayLessons.map((l) => (
          <div key={l.id} style={{ minWidth: 180, background: "#FFFFFF", borderRadius: 14, padding: 12 }}>
            <p style={{ fontSize: 12, color: "#3D55A1", fontWeight: 600 }}>{l.time}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginTop: 4 }}>{l.pupil}</p>
            <p style={{ fontSize: 11, color: "#64748B" }}>{l.duration}m · {l.type}</p>
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 8 }}>{l.location}</p>
          </div>
        ))}
      </div>

      {/* Tools strip */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 4px 8px" }}>Pinned</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {m.pinnedTools.slice(0, 8).map((t) => {
          const Icon = ICONS[t.icon] ?? Plus;
          return (
            <button key={t.id} style={{ background: "#FFFFFF", borderRadius: 12, padding: "10px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Icon size={18} color="#3D55A1" />
              <span style={{ fontSize: 10, color: "#0F172A" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
