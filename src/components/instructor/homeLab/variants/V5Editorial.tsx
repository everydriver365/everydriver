import { mockHome } from "../mockData";
import { ChevronRight, Plus, Users, MessageSquare, Calendar, CreditCard, Zap, Navigation2, Settings } from "lucide-react";

const ACCENT = "#3D55A1";
const ICONS: Record<string, any> = {
  plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
  "credit-card": CreditCard, zap: Zap, navigation: Navigation2, settings: Settings,
};

export function V5Editorial() {
  const m = mockHome;
  return (
    <div style={{ padding: "8px 0 80px", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif", background: "#FAFAF7" }}>
      <div style={{ padding: "16px 22px 8px" }}>
        <p style={{ fontSize: 11, color: "#94908A", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>{m.dateLabel}</p>
        <h1 style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 600, letterSpacing: "-0.035em", color: "#1C1917", marginTop: 8, fontFamily: "'New York', Georgia, ui-serif, serif" }}>
          {m.greeting},<br />{m.instructorName}.
        </h1>
        <p style={{ fontSize: 13, color: "#78716C", marginTop: 8 }}>{m.todayLessons.length} lessons today · first up in {m.nextLesson.startsInMinutes} minutes.</p>
      </div>

      {/* Hero next-lesson */}
      <div style={{ margin: "12px 16px 18px", background: "#FFFFFF", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ height: 110, background: `linear-gradient(135deg, ${m.nextLesson.avatarTone}, #FDF2F8)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: m.nextLesson.avatarFg, fontSize: 22, fontWeight: 600 }}>
            {m.nextLesson.initials}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: ACCENT, fontWeight: 600 }}>Next lesson</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#1C1917", marginTop: 4, fontFamily: "'New York', Georgia, serif" }}>{m.nextLesson.pupilName}</p>
          <p style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>{m.nextLesson.timeLabel} · {m.nextLesson.durationMinutes} min · {m.nextLesson.pickup}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button style={{ flex: 1, background: "#1C1917", color: "#FFFFFF", padding: "11px 12px", borderRadius: 12, fontSize: 13, fontWeight: 500 }}>Navigate</button>
            <button style={{ flex: 1, background: "#F5F5F4", color: "#1C1917", padding: "11px 12px", borderRadius: 12, fontSize: 13, fontWeight: 500 }}>Pupil profile</button>
          </div>
        </div>
      </div>

      {/* Editorial section: Your week */}
      <div style={{ padding: "0 22px 14px" }}>
        <p style={{ fontSize: 11, color: "#94908A", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>Your week</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {[
            { v: m.weekStats.lessons.value, l: "lessons" },
            { v: `£${m.weekStats.earnings.value}`, l: "earned" },
            { v: `${m.weekStats.hours.value}h`, l: "taught" },
          ].map((s) => (
            <div key={s.l}>
              <p style={{ fontSize: 26, fontWeight: 600, color: "#1C1917", letterSpacing: "-0.02em", fontFamily: "'New York', Georgia, serif", fontVariantNumeric: "tabular-nums" }}>{s.v}</p>
              <p style={{ fontSize: 11, color: "#78716C" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      <div style={{ padding: "10px 22px 14px" }}>
        <p style={{ fontSize: 11, color: "#94908A", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>Needs attention</p>
        <div style={{ background: "#FFFFFF", borderRadius: 14, marginTop: 10 }}>
          {[
            { t: `${m.alerts.pendingJobs} new job offers`, s: m.pendingOffer.deadline },
            { t: `${m.alerts.unreadMessages} unread messages`, s: "Pupils & parents" },
            { t: `${m.openSlots.length} fillable gaps`, s: "This week" },
          ].map((row, i, arr) => (
            <div key={row.t} style={{ display: "flex", alignItems: "center", padding: "12px 14px", borderBottom: i === arr.length - 1 ? "none" : "0.5px solid #EFEAE2" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: "#1C1917" }}>{row.t}</p>
                <p style={{ fontSize: 11, color: "#78716C" }}>{row.s}</p>
              </div>
              <ChevronRight size={16} color="#C7C2BB" />
            </div>
          ))}
        </div>
      </div>

      {/* Shortcuts */}
      <div style={{ padding: "10px 22px 14px" }}>
        <p style={{ fontSize: 11, color: "#94908A", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>Shortcuts</p>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 10 }}>
          {m.pinnedTools.map((t) => {
            const Icon = ICONS[t.icon] ?? Plus;
            return (
              <button key={t.id} style={{ background: "#FFFFFF", border: "0.5px solid #EFEAE2", borderRadius: 14, padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Icon size={14} color="#1C1917" />
                <span style={{ fontSize: 12, color: "#1C1917" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
