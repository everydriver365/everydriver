import { mockHome } from "../mockData";
import { ChevronRight, Plus, Users, MessageSquare, Calendar, CreditCard, Zap, Navigation2, Settings, Bell } from "lucide-react";

const ICONS: Record<string, any> = {
  plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
  "credit-card": CreditCard, zap: Zap, navigation: Navigation2, settings: Settings,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 20px 6px", fontWeight: 500 }}>{title}</p>
      <div style={{ background: "#FFFFFF", borderRadius: 12, margin: "0 16px", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Row({ left, primary, secondary, right, divider = true }: { left?: React.ReactNode; primary: string; secondary?: string; right?: React.ReactNode; divider?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: divider ? "0.5px solid #E5E7EB" : "none" }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, color: "#111827", fontWeight: 400 }}>{primary}</p>
        {secondary && <p style={{ fontSize: 12, color: "#6B7280" }}>{secondary}</p>}
      </div>
      {right ?? <ChevronRight size={16} color="#C7CAD1" />}
    </div>
  );
}

export function V2Settings() {
  const m = mockHome;
  return (
    <div style={{ padding: "8px 0 80px", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif", background: "#F2F2F7" }}>
      <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>Home</h1>
        <button style={{ width: 32, height: 32, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bell size={16} color="#3D55A1" />
        </button>
      </div>
      <p style={{ padding: "0 20px 14px", fontSize: 13, color: "#6B7280" }}>{m.greeting}, {m.instructorName} · {m.dateLabel}</p>

      <Section title="Now">
        <Row
          left={<div style={{ width: 36, height: 36, borderRadius: 10, background: m.nextLesson.avatarTone, color: m.nextLesson.avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{m.nextLesson.initials}</div>}
          primary={m.nextLesson.pupilName}
          secondary={`In ${m.nextLesson.startsInMinutes}m · ${m.nextLesson.timeLabel} · ${m.nextLesson.pickup}`}
          right={<span style={{ fontSize: 12, color: "#3D55A1", fontWeight: 600 }}>Navigate</span>}
        />
        <Row primary="Open slots this week" secondary={`${m.openSlots.length} gaps you could fill`} divider={false} right={<span style={{ fontSize: 13, color: "#6B7280" }}>{m.openSlots.length} ›</span>} />
      </Section>

      <Section title={`Today · ${m.todayLessons.length} lessons`}>
        {m.todayLessons.map((l, i) => (
          <Row
            key={l.id}
            left={<div style={{ width: 32, textAlign: "right", fontSize: 12, color: "#6B7280", fontVariantNumeric: "tabular-nums" }}>{l.time}</div>}
            primary={l.pupil}
            secondary={`${l.duration}m · ${l.type} · ${l.location}`}
            right={l.paid ? <ChevronRight size={16} color="#C7CAD1" /> : <span style={{ fontSize: 10, fontWeight: 600, color: "#B45309", background: "#FEF3C7", padding: "2px 7px", borderRadius: 999 }}>UNPAID</span>}
            divider={i !== m.todayLessons.length - 1}
          />
        ))}
      </Section>

      <Section title="This week">
        <Row primary="Lessons" secondary={`${m.weekStats.lessons.value} of ${m.weekStats.lessons.goal} goal`} right={<span style={{ fontSize: 15, color: "#0F172A", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{m.weekStats.lessons.value}</span>} />
        <Row primary="Earnings" secondary={`Goal £${m.weekStats.earnings.goal}`} right={<span style={{ fontSize: 15, color: "#0F172A", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>£{m.weekStats.earnings.value}</span>} />
        <Row primary="Hours taught" divider={false} right={<span style={{ fontSize: 15, color: "#0F172A", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{m.weekStats.hours.value}h</span>} />
      </Section>

      <Section title="Needs attention">
        <Row primary={`${m.alerts.pendingJobs} new job offers`} secondary={m.pendingOffer.deadline} right={<span style={{ background: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999 }}>{m.alerts.pendingJobs}</span>} />
        <Row primary={`${m.alerts.unreadMessages} unread messages`} divider={false} right={<span style={{ background: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999 }}>{m.alerts.unreadMessages}</span>} />
      </Section>

      <Section title="Quick actions">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: 12, gap: 10 }}>
          {m.pinnedTools.map((t) => {
            const Icon = ICONS[t.icon] ?? Plus;
            return (
              <button key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "transparent", padding: "6px 0" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F2F4F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color="#475569" />
                </div>
                <span style={{ fontSize: 10, color: "#374151", textAlign: "center" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
