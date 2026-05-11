import { mockHome } from "../mockData";
import { Search, ChevronRight, Plus, Users, MessageSquare, Calendar, CreditCard, Zap, Navigation2, Settings, AlertCircle, Bell } from "lucide-react";

const ACCENT = "#3D55A1";
const TINT = "#EDF2FE";

const ICONS: Record<string, any> = {
  plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
  "credit-card": CreditCard, zap: Zap, navigation: Navigation2, settings: Settings,
};

export function V6Command() {
  const m = mockHome;
  return (
    <div style={{ padding: "8px 14px 80px", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif" }}>
      {/* Command bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFFFFF", borderRadius: 14, padding: "10px 12px", marginBottom: 10 }}>
        <Search size={16} color="#94A3B8" />
        <input placeholder="Search pupils, lessons, tools…" style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 13, color: "#0F172A" }} readOnly />
        <span style={{ fontSize: 10, color: "#94A3B8", border: "1px solid #E5E7EB", borderRadius: 6, padding: "1px 5px" }}>⌘K</span>
      </div>

      {/* Pinned chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
        {m.pinnedTools.slice(0, 6).map((t) => {
          const Icon = ICONS[t.icon] ?? Plus;
          return (
            <button key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFFFFF", padding: "8px 12px", borderRadius: 999, fontSize: 12, color: "#0F172A", flexShrink: 0, position: "relative" }}>
              <Icon size={13} color={ACCENT} />
              {t.label}
              {t.badge && <span style={{ background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 600, padding: "0 5px", borderRadius: 999, marginLeft: 2 }}>{t.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Alerts banner */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderLeft: `3px solid ${ACCENT}` }}>
        <div className="flex items-center gap-2">
          <AlertCircle size={14} color={ACCENT} />
          <p style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.06em" }}>Needs response · {m.alerts.pendingJobs + m.alerts.testSwaps + m.alerts.unreadMessages}</p>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", marginTop: 6 }}>{m.alerts.pendingJobs} job offers, {m.alerts.unreadMessages} messages, {m.alerts.testSwaps} swap</p>
        <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{m.pendingOffer.deadline}</p>
      </div>

      {/* Next lesson dense card */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, background: TINT, padding: "3px 8px", borderRadius: 999 }}>NEXT · in {m.nextLesson.startsInMinutes}m</span>
          <span style={{ fontSize: 11, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{m.nextLesson.timeLabel} → {m.nextLesson.durationMinutes}m</span>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: m.nextLesson.avatarTone, color: m.nextLesson.avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 }}>{m.nextLesson.initials}</div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{m.nextLesson.pupilName}</p>
            <p style={{ fontSize: 11, color: "#64748B" }}>{m.nextLesson.pickup} · {m.nextLesson.distanceMiles} mi · {m.nextLesson.etaMinutes}m</p>
          </div>
          <button style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", background: ACCENT, padding: "8px 12px", borderRadius: 10 }}>Go</button>
        </div>
      </div>

      {/* Today list */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, marginBottom: 10 }}>
        <div className="flex items-center justify-between" style={{ padding: "12px 14px 8px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Today</p>
          <span style={{ fontSize: 11, color: "#64748B" }}>{m.todayLessons.length} lessons · 1 unpaid</span>
        </div>
        {m.todayLessons.map((l, i) => (
          <div key={l.id} className="flex items-center gap-3" style={{ padding: "8px 14px", borderTop: "0.5px solid #F1F5F9" }}>
            <span style={{ width: 36, fontSize: 11, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{l.time}</span>
            <span style={{ flex: 1, fontSize: 13, color: "#0F172A" }}>{l.pupil}</span>
            <span style={{ fontSize: 11, color: "#64748B" }}>{l.duration}m</span>
            {!l.paid && <span style={{ fontSize: 9, fontWeight: 600, color: "#B45309", background: "#FEF3C7", padding: "1px 5px", borderRadius: 4 }}>UNPAID</span>}
          </div>
        ))}
      </div>

      {/* Open slots */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px" }}>
        <div className="flex items-center justify-between mb-2">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Open slots</p>
          <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>Fill all ›</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {m.openSlots.map((s) => (
            <span key={s.id} style={{ fontSize: 11, color: "#475569", background: "#F2F4F8", padding: "5px 10px", borderRadius: 999 }}>
              {s.label} · {s.duration}m
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
