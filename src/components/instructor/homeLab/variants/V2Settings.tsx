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

function MiniMap() {
  return (
    <div aria-hidden style={{ position: "relative", width: "100%", height: 140, background: "#EAF1F5", overflow: "hidden" }}>
      <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: "block" }}>
        <path d="M 18 12 Q 50 4 86 18 T 138 36 L 130 70 Q 90 80 56 66 T 12 50 Z" fill="#DCE8D2" opacity={0.75} />
        <path d="M 220 92 Q 260 82 295 96 L 305 138 L 210 136 Z" fill="#DCE8D2" opacity={0.65} />
        <path d="M -10 92 Q 80 70 160 80 T 330 66" stroke="#FFFFFF" strokeWidth={6} fill="none" />
        <path d="M -10 92 Q 80 70 160 80 T 330 66" stroke="#D5DCE3" strokeWidth={3} fill="none" />
        <path d="M 30 -10 Q 50 44 80 76 T 130 144" stroke="#FFFFFF" strokeWidth={5} fill="none" />
        <path d="M 30 -10 Q 50 44 80 76 T 130 144" stroke="#D5DCE3" strokeWidth={2.5} fill="none" />
        <path d="M 200 -10 Q 210 44 240 76 T 290 144" stroke="#FFFFFF" strokeWidth={5} fill="none" />
        <path d="M 200 -10 Q 210 44 240 76 T 290 144" stroke="#D5DCE3" strokeWidth={2.5} fill="none" />
        <path d="M -10 34 Q 70 44 150 32 T 330 24" stroke="#D5DCE3" strokeWidth={2} fill="none" />
        {/* Route */}
        <path d="M 60 90 Q 130 60 200 70 T 258 72" stroke="#3D55A1" strokeWidth={2.5} strokeDasharray="5 4" fill="none" strokeLinecap="round" />
        {/* Origin */}
        <circle cx={60} cy={90} r={8} fill="#10B981" stroke="#FFFFFF" strokeWidth={2.5} />
        {/* Destination pin */}
        <g transform="translate(258 70)">
          <path d="M 0 16 L -7 2 A 8 8 0 1 1 7 2 Z" fill="#3D55A1" stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" />
          <circle cx={0} cy={-2} r={2.8} fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

function NextLessonHero({ m }: { m: typeof mockHome }) {
  const nl = m.nextLesson;
  const [h, mm] = nl.timeLabel.split(":").map(Number);
  const endMins = h * 60 + mm + nl.durationMinutes;
  const endLabel = `${String(Math.floor(endMins / 60) % 24).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
  const parts = m.dateLabel.split(" ");
  const dayNum = parts[1]?.replace(",", "") ?? "2";
  const monthShort = (parts[2] ?? "MAR").slice(0, 3).toUpperCase();
  const price = Math.round((nl.durationMinutes / 60) * 45);

  return (
    <div
      style={{
        margin: "0 16px 14px",
        borderRadius: 16,
        background: "#FFFFFF",
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(15,23,42,0.04), 0 6px 16px -8px rgba(15,23,42,0.18), 0 22px 40px -20px rgba(61,85,161,0.22)",
        border: "1px solid #E4E8EF",
      }}
    >
      {/* Mini map header */}
      <div style={{ position: "relative" }}>
        <MiniMap />
        <span style={{ position: "absolute", top: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,0.95)", color: "#3D55A1", letterSpacing: "0.06em", textTransform: "uppercase", boxShadow: "0 1px 4px rgba(15,23,42,0.08)" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#10B981", boxShadow: "0 0 0 3px rgba(16,185,129,0.25)" }} />
          Up Next · in {nl.startsInMinutes}m
        </span>
        {nl.paymentStatus === "paid" && (
          <span style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: "5px 9px", borderRadius: 999, background: "#10B981", color: "#FFFFFF", letterSpacing: "0.06em", boxShadow: "0 2px 6px rgba(16,185,129,0.35)" }}>
            PAID
          </span>
        )}
      </div>

      {/* Info body */}
      <div style={{ padding: "16px 18px", position: "relative" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#3F4754", letterSpacing: "0.01em", textTransform: "uppercase", marginBottom: 10, lineHeight: 1.2 }}>
          {nl.durationMinutes / 60} Hour Driving Lesson
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "#4B5565" }}>
          <Clock size={15} color="#9AA3B2" />
          <span style={{ fontSize: 14 }}>{nl.timeLabel} – {endLabel} <span style={{ color: "#9AA3B2" }}>({dayNum} {monthShort.charAt(0) + monthShort.slice(1).toLowerCase()})</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <MapPin size={15} color="#9AA3B2" />
          <span style={{ fontSize: 14, color: "#3D55A1", fontWeight: 500 }}>{nl.pickup.split(" · ")[0]}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Users size={15} color="#9AA3B2" />
          <span style={{ fontSize: 14, color: "#4B5565" }}>With <span style={{ color: "#3D55A1", fontWeight: 500 }}>{nl.pupilName.split(" ")[0]} {nl.pupilName.split(" ")[1]?.charAt(0) ?? ""}</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 15, height: 15, borderRadius: 999, border: "1.5px solid #9AA3B2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#9AA3B2" }}>£</span>
          <span style={{ fontSize: 14, color: "#4B5565", fontWeight: 500 }}>£{price.toFixed(2)}</span>
        </div>

        <button style={{ position: "absolute", bottom: 14, right: 14, width: 34, height: 34, borderRadius: 999, background: "#3D55A1", border: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px -4px rgba(61,85,161,0.5)" }}>
          <ChevronRight size={18} color="#FFFFFF" />
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
