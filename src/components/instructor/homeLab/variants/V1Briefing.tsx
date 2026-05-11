import { mockHome } from "../mockData";
import { Bell, ChevronRight, MapPin, Navigation2, CreditCard, Plus, Users, MessageSquare, Calendar, Zap, Settings, CloudRain } from "lucide-react";

const ACCENT = "#3D55A1";
const TINT = "#EDF2FE";

const ICONS: Record<string, any> = {
  plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
  "credit-card": CreditCard, zap: Zap, navigation: Navigation2, settings: Settings,
};

export function V1Briefing() {
  const m = mockHome;
  return (
    <div style={{ padding: "8px 16px 80px", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between pt-2 pb-3">
        <div>
          <p style={{ fontSize: 13, color: "#64748B" }}>{m.dateLabel}</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.02em" }}>
            {m.greeting}, {m.instructorName}
          </h1>
        </div>
        <button style={{ width: 38, height: 38, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <Bell size={18} color="#0F172A" />
          <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: 999, background: "#EF4444" }} />
        </button>
      </div>

      {/* Briefing hero */}
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ background: TINT, color: ACCENT, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999 }}>NEXT UP · in {m.nextLesson.startsInMinutes}m</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748B" }}>
            <CloudRain size={12} /> {m.weather.temp}° · {m.weather.summary}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ width: 48, height: 48, borderRadius: 14, background: m.nextLesson.avatarTone, color: m.nextLesson.avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
            {m.nextLesson.initials}
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>{m.nextLesson.pupilName}</p>
            <p style={{ fontSize: 12, color: "#64748B" }}>{m.nextLesson.timeLabel} · {m.nextLesson.durationMinutes}m · {m.nextLesson.lessonType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-[12px]" style={{ color: "#475569" }}>
          <MapPin size={13} /> {m.nextLesson.pickup} · {m.nextLesson.distanceMiles} mi · {m.nextLesson.etaMinutes}m drive
        </div>
        <div className="flex gap-2 mt-3">
          <button style={{ flex: 1, background: ACCENT, color: "#FFFFFF", padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Navigation2 size={14} /> Navigate
          </button>
          <button style={{ flex: 1, background: TINT, color: ACCENT, padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
            View pupil
          </button>
        </div>
      </div>

      {/* Today timeline rail */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 4px 6px" }}>Today · {m.todayLessons.length} lessons</p>
      <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "4px 0" }}>
        {m.todayLessons.map((l, i) => (
          <div key={l.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i === m.todayLessons.length - 1 ? "none" : "0.5px solid #E5E7EB" }}>
            <div style={{ width: 44, textAlign: "right", fontSize: 12, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{l.time}</div>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#475569" }}>{l.initials}</div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{l.pupil}</p>
              <p style={{ fontSize: 11, color: "#64748B" }}>{l.duration}m · {l.location} · {l.type}</p>
            </div>
            {!l.paid && <span style={{ fontSize: 10, fontWeight: 600, color: "#B45309", background: "#FEF3C7", padding: "2px 7px", borderRadius: 999 }}>UNPAID</span>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", padding: "16px 4px 6px" }}>Shortcuts</p>
      <div className="grid grid-cols-4 gap-3">
        {m.pinnedTools.slice(0, 8).map((t) => {
          const Icon = ICONS[t.icon] ?? Plus;
          return (
            <button key={t.id} style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
              <Icon size={18} color="#475569" />
              <span style={{ fontSize: 10, color: "#0F172A" }}>{t.label}</span>
              {t.badge && <span style={{ position: "absolute", top: 6, right: 14, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 600, padding: "0 5px", borderRadius: 999, minWidth: 14, textAlign: "center" }}>{t.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
