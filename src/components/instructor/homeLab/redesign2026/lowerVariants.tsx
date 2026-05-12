import { ReactNode } from "react";
import {
  Wrench, MapPin, PoundSterling, Plus, Calendar, Camera, Heart,
  Megaphone, Car, Accessibility, AlertCircle, ChevronRight,
  Sparkles, Crown, Inbox, Star, CheckCircle2, Clock, Search,
  ShieldPlus, Users, Repeat2, type LucideIcon,
} from "lucide-react";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
const BLUE = "#3D55A1";
const MUTED = "#5B6B8A";
const BG = "#F2F4F8";
const BORDER = "rgba(26,82,160,0.10)";

const bento = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: `0.5px solid ${BORDER}`,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  padding: 14,
} as const;

const TOOLS: { id: string; label: string; icon: LucideIcon; tone: string; bg: string }[] = [
  { id: "fill",    label: "Fill gaps",    icon: Calendar,      tone: "#7C3AED", bg: "#F3EEFE" },
  { id: "track",   label: "Track live",   icon: MapPin,        tone: "#DC2626", bg: "#FEE9EA" },
  { id: "add",     label: "Add lesson",   icon: Plus,          tone: BLUE,      bg: "#EDF2FE" },
  { id: "pay",     label: "Take payment", icon: PoundSterling, tone: "#059669", bg: "#E6F7EF" },
  { id: "car",     label: "Find car",     icon: Car,           tone: "#0EA5E9", bg: "#E6F4FB" },
  { id: "health",  label: "Health hub",   icon: Heart,         tone: "#EC4899", bg: "#FCE8F1" },
  { id: "swap",    label: "Test swap",    icon: Repeat2,       tone: "#F59E0B", bg: "#FEF3D6" },
  { id: "near",    label: "Find nearby",  icon: MapPin,        tone: "#0F766E", bg: "#E2F4F1" },
  { id: "cam",     label: "Dashcam",      icon: Camera,        tone: "#475569", bg: "#EEF2F7" },
  { id: "a11y",    label: "Access.",      icon: Accessibility, tone: "#7C3AED", bg: "#F3EEFE" },
  { id: "news",    label: "Updates",      icon: Megaphone,     tone: "#B45309", bg: "#FCEFD9" },
  { id: "more",    label: "All tools",    icon: Wrench,        tone: "#1E293B", bg: "#E5E9F0" },
];

const ATTENTION = [
  { icon: AlertCircle, tint: "#DC2626", bg: "#FEE9EA", title: "2 unpaid lessons",  sub: "Sarah J · Mike P" },
  { icon: Clock,       tint: "#B45309", bg: "#FCEFD9", title: "Test swap pending", sub: "3 March · Mark L" },
  { icon: Star,        tint: "#0EA5E9", bg: "#E6F4FB", title: "Review request",   sub: "Ask Ellie B for review" },
];

const UPGRADES = [
  { icon: ShieldPlus, tint: BLUE, bg: "#EDF2FE", title: "Add insurance",  sub: "Pay-as-you-drive cover" },
  { icon: Crown,      tint: "#B45309", bg: "#FCEFD9", title: "Upgrade plan", sub: "Unlock AI receptionist" },
  { icon: Users,      tint: "#059669", bg: "#E6F7EF", title: "Refer ADI",   sub: "Earn £50 per signup" },
];

const EVENTS = [
  { day: "Tue 12", title: "DVSA standards check", sub: "Winchester · 14:00" },
  { day: "Fri 15", title: "Pupil mock test",      sub: "Test centre · 10:30" },
  { day: "Sat 16", title: "ADI meet-up",          sub: "King's Head · 19:00" },
];

function H({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: BG, padding: 12, fontFamily: FONT, color: "#0F172A", minHeight: "100%" }}>
      {/* faux content above */}
      <div style={{ ...bento, padding: 10, marginBottom: 10, color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        … bento above (up next, kpis, schedule)
      </div>
      {children}
    </div>
  );
}

/* ============ L1 · Bento Mosaic Tools ============ */
export function L1Mosaic() {
  return (
    <Frame>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Quick access</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {TOOLS.slice(0, 8).map((t) => (
            <button key={t.id} style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <t.icon size={20} color={t.tone} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 10.5, color: "#0F172A", textAlign: "center" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Needs attention</H>
        {ATTENTION.map((a, i) => (
          <Row key={i} {...a} last={i === ATTENTION.length - 1} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        {UPGRADES.slice(0, 2).map((u, i) => (
          <div key={i} style={{ ...bento, padding: 12 }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: u.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <u.icon size={16} color={u.tint} />
            </span>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>{u.title}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{u.sub}</div>
          </div>
        ))}
      </div>
      <div style={bento}>
        <H>Upcoming</H>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i ? "0.5px solid #EEF2F7" : "none" }}>
            <div style={{ width: 44, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: MUTED, fontWeight: 700 }}>{e.day.split(" ")[0].toUpperCase()}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: BLUE }}>{e.day.split(" ")[1]}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{e.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Row({ icon: Icon, tint, bg, title, sub, last }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: last ? "none" : "0.5px solid #EEF2F7" }}>
      <span style={{ width: 32, height: 32, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={tint} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11, color: MUTED }}>{sub}</div>
      </div>
      <ChevronRight size={16} color="#CBD5E1" />
    </div>
  );
}

/* ============ L2 · Tile Garden (large icon cards 2-col) ============ */
export function L2Garden() {
  return (
    <Frame>
      <H>&nbsp;&nbsp;Quick access</H>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        {TOOLS.slice(0, 6).map((t) => (
          <button key={t.id} style={{ ...bento, padding: 12, textAlign: "left", cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <t.icon size={18} color={t.tone} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</span>
          </button>
        ))}
      </div>
      <button style={{ ...bento, padding: 10, width: "100%", textAlign: "center", color: BLUE, fontWeight: 700, fontSize: 12, marginBottom: 12, cursor: "pointer" }}>
        Show all 12 tools
      </button>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Needs attention</H>
        {ATTENTION.map((a, i) => <Row key={i} {...a} last={i === ATTENTION.length - 1} />)}
      </div>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>For you</H>
        {UPGRADES.map((u, i) => <Row key={i} {...u} last={i === UPGRADES.length - 1} />)}
      </div>
      <div style={bento}>
        <H>Upcoming</H>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: i ? "0.5px solid #EEF2F7" : "none" }}>
            <div style={{ width: 38, fontSize: 11, color: MUTED, fontWeight: 700 }}>{e.day}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{e.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ============ L3 · Carousel / Snap rail ============ */
export function L3Carousel() {
  return (
    <Frame>
      <div style={{ ...bento, marginBottom: 8, padding: "12px 0 12px 14px" }}>
        <div style={{ paddingRight: 14, marginBottom: 10 }}>
          <H>Quick access</H>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingRight: 14, scrollSnapType: "x mandatory" }}>
          {TOOLS.map((t) => (
            <button key={t.id} style={{ flex: "0 0 78px", scrollSnapAlign: "start", background: t.bg, border: 0, borderRadius: 14, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <t.icon size={22} color={t.tone} />
              <span style={{ fontSize: 10.5, color: "#0F172A", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ ...bento, marginBottom: 8, background: "linear-gradient(135deg,#FEE9EA,#FFF)" }}>
        <H>Needs attention · 3</H>
        {ATTENTION.map((a, i) => <Row key={i} {...a} last={i === ATTENTION.length - 1} />)}
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 8, paddingBottom: 4 }}>
        {UPGRADES.map((u, i) => (
          <div key={i} style={{ ...bento, flex: "0 0 70%", padding: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: u.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <u.icon size={16} color={u.tint} />
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>{u.title}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{u.sub}</div>
          </div>
        ))}
      </div>
      <div style={bento}>
        <H>Upcoming</H>
        {EVENTS.slice(0, 2).map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: i ? "0.5px solid #EEF2F7" : "none" }}>
            <div style={{ width: 38, fontSize: 11, color: MUTED, fontWeight: 700 }}>{e.day}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{e.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ============ L4 · Search-led command center ============ */
export function L4Command() {
  return (
    <Frame>
      <div style={{ ...bento, padding: 10, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <Search size={16} color={MUTED} />
        <span style={{ fontSize: 13, color: MUTED }}>Search 24 tools, pupils, lessons</span>
      </div>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Pinned</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {TOOLS.slice(0, 4).map((t) => (
            <button key={t.id} style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <t.icon size={20} color={t.tone} />
              </span>
              <span style={{ fontSize: 10.5, color: "#0F172A" }}>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ height: 1, background: "#EEF2F7", margin: "12px 0" }} />
        <H>Suggested</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {TOOLS.slice(4, 8).map((t) => (
            <button key={t.id} style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <t.icon size={20} color={t.tone} />
              </span>
              <span style={{ fontSize: 10.5, color: "#0F172A" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Inbox · 3 need you</H>
        {ATTENTION.map((a, i) => <Row key={i} {...a} last={i === ATTENTION.length - 1} />)}
      </div>
      <div style={{ ...bento, marginBottom: 8, background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#FFF" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#94A3B8" }}>UPGRADE</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>Unlock AI receptionist</div>
        <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 4 }}>Never miss a call · From £12/mo</div>
      </div>
      <div style={bento}>
        <H>Upcoming</H>
        {EVENTS.slice(0, 2).map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: i ? "0.5px solid #EEF2F7" : "none" }}>
            <div style={{ width: 38, fontSize: 11, color: MUTED, fontWeight: 700 }}>{e.day}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{e.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ============ L5 · Stacked categories ============ */
export function L5Categories() {
  const groups = [
    { name: "Lessons",  items: TOOLS.slice(0, 3) },
    { name: "Money",    items: [TOOLS[3]] },
    { name: "Vehicle",  items: [TOOLS[4], TOOLS[8]] },
    { name: "Wellness", items: [TOOLS[5], TOOLS[9]] },
  ];
  return (
    <Frame>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Quick access</H>
        {groups.map((g, gi) => (
          <div key={g.name} style={{ paddingTop: gi ? 12 : 0, borderTop: gi ? "0.5px solid #EEF2F7" : "none", marginTop: gi ? 8 : 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 8 }}>{g.name}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {g.items.map((t) => (
                <button key={t.id} style={{ background: t.bg, border: 0, borderRadius: 999, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <t.icon size={14} color={t.tone} />
                  <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 600 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Needs attention</H>
        {ATTENTION.map((a, i) => <Row key={i} {...a} last={i === ATTENTION.length - 1} />)}
      </div>
      <div style={{ ...bento, marginBottom: 8 }}>
        <H>Boost your week</H>
        {UPGRADES.map((u, i) => <Row key={i} {...u} last={i === UPGRADES.length - 1} />)}
      </div>
      <div style={bento}>
        <H>Upcoming</H>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: i ? "0.5px solid #EEF2F7" : "none" }}>
            <div style={{ width: 38, fontSize: 11, color: MUTED, fontWeight: 700 }}>{e.day}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{e.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}
