import { mockHome } from "../mockData";
import { ChevronRight, Plus, Users, MessageSquare, Calendar, CreditCard, Zap, Navigation2, Settings, Bell, MapPin, Clock, Car } from "lucide-react";

const ICONS: Record<string, any> = {
  plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
  "credit-card": CreditCard, zap: Zap, navigation: Navigation2, settings: Settings,
};

// Color accents for sections
const SECTION_ACCENTS: Record<string, { tint: string; fg: string; dot: string }> = {
  Now: { tint: "#EDF2FE", fg: "#3D55A1", dot: "#3D55A1" },
  Today: { tint: "#FEF3E7", fg: "#B45309", dot: "#F59E0B" },
  "This week": { tint: "#ECFDF5", fg: "#047857", dot: "#10B981" },
  "Needs attention": { tint: "#FEE2E2", fg: "#B91C1C", dot: "#EF4444" },
  "Quick actions": { tint: "#F3E8FF", fg: "#6D28D9", dot: "#8B5CF6" },
};

function Section({ title, children, accentKey }: { title: string; children: React.ReactNode; accentKey?: string }) {
  const accent = accentKey ? SECTION_ACCENTS[accentKey] : undefined;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ padding: "0 20px 6px", display: "flex", alignItems: "center", gap: 6 }}>
        {accent && <span style={{ width: 6, height: 6, borderRadius: 999, background: accent.dot }} />}
        <p style={{ fontSize: 12, color: accent?.fg ?? "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{title}</p>
      </div>
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

function NextLessonHero({ m }: { m: typeof mockHome }) {
  const nl = m.nextLesson;
  return (
    <div
      style={{
        margin: "0 16px 14px",
        borderRadius: 16,
        padding: 16,
        background: "linear-gradient(135deg, #3D55A1 0%, #5B73C4 60%, #7B9AE8 100%)",
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 24px -10px rgba(61,85,161,0.45)",
      }}
    >
      {/* Decorative blob */}
      <div style={{ position: "absolute", top: -40, right: -30, width: 140, height: 140, borderRadius: 999, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", bottom: -50, left: -20, width: 120, height: 120, borderRadius: 999, background: "rgba(255,255,255,0.06)" }} />

      {/* Top row: status pill + ETA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.18)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#34D399", boxShadow: "0 0 0 3px rgba(52,211,153,0.25)" }} />
          Up Next
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}>
          <Clock size={11} /> in {nl.startsInMinutes}m
        </span>
      </div>

      {/* Pupil row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFFFFF", color: "#3D55A1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, boxShadow: "0 4px 12px -4px rgba(0,0,0,0.25)" }}>
          {nl.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15 }}>{nl.pupilName}</p>
          <p style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{nl.timeLabel} · {nl.durationMinutes}m lesson</p>
        </div>
      </div>

      {/* Meta chips */}
      <div style={{ display: "flex", gap: 8, marginTop: 14, position: "relative", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "5px 9px", borderRadius: 999, background: "rgba(255,255,255,0.14)" }}>
          <MapPin size={11} /> {nl.pickup}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "5px 9px", borderRadius: 999, background: "rgba(255,255,255,0.14)" }}>
          <Car size={11} /> {nl.distanceMiles} mi · {nl.etaMinutes} min
        </span>
      </div>

      {/* CTA row */}
      <div style={{ display: "flex", gap: 8, marginTop: 14, position: "relative" }}>
        <button style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, padding: "10px 12px", borderRadius: 12, background: "#FFFFFF", color: "#3D55A1", border: "none" }}>
          <Navigation2 size={14} /> Navigate
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.16)", color: "#FFFFFF", border: "none" }}>
          <MessageSquare size={14} />
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.16)", color: "#FFFFFF", border: "none" }}>
          Details
        </button>
      </div>
    </div>
  );
}

export function V2Settings() {
  const m = mockHome;
  return (
    <div style={{ padding: "8px 0 80px", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif", background: "#F2F2F7" }}>
      <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>Home</h1>
        <button style={{ width: 32, height: 32, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <Bell size={16} color="#3D55A1" />
          <span style={{ position: "absolute", top: 4, right: 5, width: 8, height: 8, borderRadius: 999, background: "#EF4444", border: "1.5px solid #FFFFFF" }} />
        </button>
      </div>
      <p style={{ padding: "0 20px 14px", fontSize: 13, color: "#6B7280" }}>{m.greeting}, {m.instructorName} · {m.dateLabel}</p>

      {/* New richer Next Lesson hero */}
      <NextLessonHero m={m} />

      <Section title="Now" accentKey="Now">
        <Row primary="Open slots this week" secondary={`${m.openSlots.length} gaps you could fill`} divider={false} right={<span style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", background: "#EDF2FE", padding: "3px 9px", borderRadius: 999 }}>{m.openSlots.length} gaps</span>} />
      </Section>

      <Section title={`Today · ${m.todayLessons.length} lessons`} accentKey="Today">
        {m.todayLessons.map((l, i) => (
          <Row
            key={l.id}
            left={<div style={{ width: 32, textAlign: "right", fontSize: 12, color: "#B45309", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{l.time}</div>}
            primary={l.pupil}
            secondary={`${l.duration}m · ${l.type} · ${l.location}`}
            right={l.paid
              ? <span style={{ fontSize: 10, fontWeight: 600, color: "#047857", background: "#D1FAE5", padding: "2px 7px", borderRadius: 999 }}>PAID</span>
              : <span style={{ fontSize: 10, fontWeight: 600, color: "#B45309", background: "#FEF3C7", padding: "2px 7px", borderRadius: 999 }}>UNPAID</span>}
            divider={i !== m.todayLessons.length - 1}
          />
        ))}
      </Section>

      <Section title="This week" accentKey="This week">
        <Row primary="Lessons" secondary={`${m.weekStats.lessons.value} of ${m.weekStats.lessons.goal} goal`} right={<span style={{ fontSize: 15, color: "#047857", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{m.weekStats.lessons.value}</span>} />
        <Row primary="Earnings" secondary={`Goal £${m.weekStats.earnings.goal}`} right={<span style={{ fontSize: 15, color: "#047857", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>£{m.weekStats.earnings.value}</span>} />
        <Row primary="Hours taught" divider={false} right={<span style={{ fontSize: 15, color: "#047857", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{m.weekStats.hours.value}h</span>} />
      </Section>

      <Section title="Needs attention" accentKey="Needs attention">
        <Row primary={`${m.alerts.pendingJobs} new job offers`} secondary={m.pendingOffer.deadline} right={<span style={{ background: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>{m.alerts.pendingJobs}</span>} />
        <Row primary={`${m.alerts.unreadMessages} unread messages`} divider={false} right={<span style={{ background: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>{m.alerts.unreadMessages}</span>} />
      </Section>

      <Section title="Quick actions" accentKey="Quick actions">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: 12, gap: 10 }}>
          {m.pinnedTools.map((t, idx) => {
            const Icon = ICONS[t.icon] ?? Plus;
            const tints = [
              { bg: "#EDF2FE", fg: "#3D55A1" },
              { bg: "#FEF3E7", fg: "#B45309" },
              { bg: "#ECFDF5", fg: "#047857" },
              { bg: "#F3E8FF", fg: "#6D28D9" },
              { bg: "#FFE4E6", fg: "#BE123C" },
              { bg: "#E0F2FE", fg: "#0369A1" },
              { bg: "#FEF9C3", fg: "#A16207" },
              { bg: "#FCE7F3", fg: "#BE185D" },
            ];
            const c = tints[idx % tints.length];
            return (
              <button key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "transparent", padding: "6px 0", border: "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={c.fg} />
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
