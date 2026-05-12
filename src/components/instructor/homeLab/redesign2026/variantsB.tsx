import { mockHome } from "../mockData";
import {
  Phone, MessageSquare, Navigation, Plus, Users, Calendar, CreditCard,
  Zap, Settings, Bell, Search, Sparkles, PoundSterling, AlertCircle,
  CheckCircle2, Clock, ChevronRight, Sun, Moon, Coffee, Target, Flame,
} from "lucide-react";

const PRIMARY = "#3D55A1";
const TINT = "#EDF2FE";
const ACCENT = "#CC2229";
const BG = "#F4F7F6";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "rgba(15,23,42,0.06)";

const m = mockHome;

function Avatar({ initials, tone = "#FCE7F3", fg = "#9D174D", size = 40 }: any) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: tone, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
    }}>{initials}</div>
  );
}

function FauxMap({ height = 100, rounded = 14 }: { height?: number; rounded?: number }) {
  return (
    <div style={{
      position: "relative", height, borderRadius: rounded, overflow: "hidden",
      background: "linear-gradient(135deg,#E9EEF5 0%,#DCE5F2 50%,#E9EEF5 100%)",
    }}>
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d="M0,70 Q80,40 160,55 T300,30" stroke="#fff" strokeWidth="6" fill="none" opacity="0.85" />
        <path d="M0,70 Q80,40 160,55 T300,30" stroke={PRIMARY} strokeWidth="2.5" fill="none" strokeDasharray="6 4" />
        <circle cx="20" cy="72" r="5" fill={PRIMARY} />
        <circle cx="280" cy="32" r="6" fill={ACCENT} />
      </svg>
    </div>
  );
}

const cardBase: React.CSSProperties = {
  background: SURFACE, borderRadius: 16,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)",
  overflow: "hidden",
};
const primBtn: React.CSSProperties = {
  height: 38, borderRadius: 12, border: "none", background: ACCENT,
  color: "white", fontWeight: 700, fontSize: 13,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
};
const tintBtn: React.CSSProperties = {
  height: 38, padding: "0 14px", borderRadius: 12, border: "none", background: TINT,
  color: PRIMARY, fontWeight: 700, fontSize: 13,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
};
function SectionLabel({ children, light }: any) {
  return (
    <div style={{ fontSize: 11, color: light ? "rgba(255,255,255,0.55)" : MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "16px 4px 8px" }}>
      {children}
    </div>
  );
}
function ToolIcon({ icon }: { icon: string }) {
  const map: Record<string, any> = {
    plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
    "credit-card": CreditCard, zap: Zap, navigation: Navigation, settings: Settings,
  };
  const Icon = map[icon] || Plus;
  return (
    <div style={{ width: 34, height: 34, borderRadius: 10, background: TINT, color: PRIMARY,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={17} />
    </div>
  );
}
const toolTile: React.CSSProperties = {
  background: SURFACE, borderRadius: 14, padding: "12px 6px",
  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

/* =========================================================
   V6 — FOCUS MODE (single-task hero, minimalist)
   ========================================================= */
export function V6Focus() {
  return (
    <div style={{ background: BG, padding: "0 0 100px", minHeight: "100%", color: TEXT }}>
      {/* Hero takes 55% */}
      <div style={{
        background: `linear-gradient(160deg, ${PRIMARY} 0%, #2A3F7E 100%)`,
        color: "white", padding: "20px 20px 28px", borderRadius: "0 0 28px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>{m.dateLabel}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <Sun size={16} opacity={0.85} />
            <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>{m.weather.temp}°</span>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", opacity: 0.7 }}>YOUR NEXT FOCUS</div>
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
          {m.nextLesson.startsInMinutes}<span style={{ fontSize: 22, opacity: 0.7, marginLeft: 4 }}>min</span>
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>until {m.nextLesson.pupilName} · {m.nextLesson.timeLabel}</div>

        <div style={{
          marginTop: 16, background: "rgba(255,255,255,0.12)", borderRadius: 14,
          padding: 12, display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(10px)",
        }}>
          <Avatar initials={m.nextLesson.initials} tone="rgba(255,255,255,0.2)" fg="white" size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nextLesson.pickup}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{m.nextLesson.distanceMiles} mi · ETA {m.nextLesson.etaMinutes}m · {m.nextLesson.lessonType}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button style={{ ...primBtn, flex: 1.4, background: "white", color: ACCENT }}><Phone size={14} /> Call</button>
          <button style={{ ...primBtn, flex: 1, background: "rgba(255,255,255,0.16)" }}><Navigation size={14} /> Drive</button>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <SectionLabel>Today · {m.todayLessons.length} lessons</SectionLabel>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, margin: "0 -16px", padding: "0 16px 4px" }}>
          {m.todayLessons.map((l) => (
            <div key={l.id} style={{ ...cardBase, padding: 12, minWidth: 140, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: PRIMARY }}>{l.time}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{l.pupil}</div>
              <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>{l.duration}m · {l.location}</div>
              {!l.paid && <div style={{ fontSize: 9, fontWeight: 800, color: "#92400E", marginTop: 6 }}>UNPAID</div>}
            </div>
          ))}
        </div>

        <SectionLabel>Needs you</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <NeedTile icon={<AlertCircle size={14} />} label="Jobs" count={m.alerts.pendingJobs} tone="#FEF3C7" fg="#92400E" />
          <NeedTile icon={<MessageSquare size={14} />} label="Msgs" count={m.alerts.unreadMessages} tone={TINT} fg={PRIMARY} />
          <NeedTile icon={<CheckCircle2 size={14} />} label="Swaps" count={m.alerts.testSwaps} tone="#DCFCE7" fg="#166534" />
        </div>

        <SectionLabel>Quick tools</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {m.pinnedTools.slice(0, 8).map((t) => (
            <div key={t.id} style={toolTile}>
              <ToolIcon icon={t.icon} />
              <div style={{ fontSize: 10.5, fontWeight: 600 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NeedTile({ icon, label, count, tone, fg }: any) {
  return (
    <div style={{ background: tone, color: fg, borderRadius: 14, padding: "12px 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {icon}<span style={{ fontSize: 18, fontWeight: 800 }}>{count}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* =========================================================
   V7 — BENTO GRID (Apple-style adaptive blocks)
   ========================================================= */
export function V7Bento() {
  return (
    <div style={{ background: BG, padding: "10px 14px 100px", minHeight: "100%", color: TEXT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 4px 14px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Hi, {m.instructorName}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ width: 36, height: 36, borderRadius: 999, background: SURFACE, border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(15,23,42,0.06)" }}><Search size={16} color={TEXT} /></button>
          <button style={{ width: 36, height: 36, borderRadius: 999, background: SURFACE, border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(15,23,42,0.06)" }}><Bell size={16} color={TEXT} /></button>
        </div>
      </div>

      {/* Bento row 1: Hero (full width) */}
      <div style={{ ...cardBase, padding: 0, marginBottom: 8, overflow: "hidden" }}>
        <FauxMap height={110} rounded={0} />
        <div style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: PRIMARY, letterSpacing: "0.1em" }}>UP NEXT · {m.nextLesson.timeLabel}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT }}>● in {m.nextLesson.startsInMinutes}m</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
            <Avatar initials={m.nextLesson.initials} tone={m.nextLesson.avatarTone} fg={m.nextLesson.avatarFg} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{m.nextLesson.pupilName}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{m.nextLesson.pickup} · ETA {m.nextLesson.etaMinutes}m</div>
            </div>
            <button style={{ ...primBtn, height: 34, padding: "0 14px" }}><Phone size={13} /></button>
          </div>
        </div>
      </div>

      {/* Bento row 2: 2 small + 1 tall */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <BentoBlock>
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>EARNINGS</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: PRIMARY }}>£{m.weekStats.earnings.value}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>this week</div>
        </BentoBlock>
        <BentoBlock>
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>LESSONS</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{m.weekStats.lessons.value}<span style={{ fontSize: 12, color: MUTED }}>/{m.weekStats.lessons.goal}</span></div>
          <div style={{ height: 4, background: "#F1F5F9", borderRadius: 999, marginTop: 8 }}>
            <div style={{ width: `${(m.weekStats.lessons.value / m.weekStats.lessons.goal) * 100}%`, height: "100%", background: "#10B981", borderRadius: 999 }} />
          </div>
        </BentoBlock>
      </div>

      {/* Bento row 3: alerts strip + streak */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
        <BentoBlock>
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>NEEDS YOU</div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <Mini count={m.alerts.pendingJobs} label="Jobs" fg="#92400E" />
            <Mini count={m.alerts.unreadMessages} label="Msgs" fg={PRIMARY} />
            <Mini count={m.alerts.testSwaps} label="Swap" fg="#166534" />
          </div>
        </BentoBlock>
        <BentoBlock style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
          <Flame size={18} color="#92400E" />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#92400E", marginTop: 2 }}>12</div>
          <div style={{ fontSize: 9, color: "#92400E", fontWeight: 700 }}>DAY STREAK</div>
        </BentoBlock>
      </div>

      {/* Today list bento */}
      <BentoBlock style={{ padding: 0, marginBottom: 8 }}>
        <div style={{ padding: "12px 14px 4px", fontSize: 10, color: MUTED, fontWeight: 700 }}>TODAY · {m.todayLessons.length} LESSONS</div>
        {m.todayLessons.slice(0, 3).map((l, i) => (
          <div key={l.id} style={{ display: "flex", padding: "10px 14px", gap: 10, alignItems: "center", borderTop: i === 0 ? "none" : `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, width: 42, color: PRIMARY }}>{l.time}</div>
            <Avatar initials={l.initials} size={28} />
            <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{l.pupil}</div>
            <div style={{ fontSize: 10, color: MUTED }}>{l.location}</div>
          </div>
        ))}
      </BentoBlock>

      {/* Tools bento */}
      <BentoBlock>
        <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, marginBottom: 10 }}>QUICK TOOLS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {m.pinnedTools.slice(0, 8).map((t) => (
            <div key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <ToolIcon icon={t.icon} />
              <div style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </BentoBlock>
    </div>
  );
}
function BentoBlock({ children, style }: any) {
  return <div style={{ ...cardBase, padding: 14, ...style }}>{children}</div>;
}
function Mini({ count, label, fg }: any) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: fg }}>{count}</div>
      <div style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* =========================================================
   V8 — STORY CARDS (swipeable hero, IG-feel)
   ========================================================= */
export function V8Story() {
  return (
    <div style={{ background: BG, padding: "10px 0 100px", minHeight: "100%", color: TEXT }}>
      <div style={{ padding: "6px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: MUTED }}>{m.dateLabel}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{m.greeting}</div>
        </div>
        <Avatar initials="AX" tone={TINT} fg={PRIMARY} size={38} />
      </div>

      {/* Story rail */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 12px" }}>
        <StoryAvatar label="You" highlight />
        {m.todayLessons.slice(0, 5).map((l) => (
          <div key={l.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, width: 60 }}>
            <div style={{ padding: 2, borderRadius: 999, background: l.paid ? "linear-gradient(135deg,#10B981,#3D55A1)" : "linear-gradient(135deg,#F59E0B,#CC2229)" }}>
              <div style={{ background: BG, padding: 2, borderRadius: 999 }}>
                <Avatar initials={l.initials} size={48} />
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{l.time}</div>
          </div>
        ))}
      </div>

      {/* Hero story card */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ ...cardBase, padding: 0, overflow: "hidden" }}>
          <div style={{ position: "relative" }}>
            <FauxMap height={140} rounded={0} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", background: "rgba(255,255,255,0.94)", borderRadius: 999, fontSize: 11, fontWeight: 700, color: PRIMARY }}>
              ● Live · in {m.nextLesson.startsInMinutes}m
            </div>
            <div style={{ position: "absolute", bottom: 10, left: 12, color: "white" }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>UP NEXT</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{m.nextLesson.pupilName}</div>
            </div>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: MUTED, marginBottom: 12 }}>
              <span><b style={{ color: TEXT, fontSize: 13 }}>{m.nextLesson.timeLabel}</b> start</span>
              <span><b style={{ color: TEXT, fontSize: 13 }}>{m.nextLesson.etaMinutes}m</b> ETA</span>
              <span><b style={{ color: TEXT, fontSize: 13 }}>{m.nextLesson.distanceMiles}mi</b> away</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...primBtn, flex: 1.3 }}><Phone size={14} /> Call</button>
              <button style={tintBtn}><MessageSquare size={14} /></button>
              <button style={tintBtn}><Navigation size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <SectionLabel>This week</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <StatCard label="Lessons" v={m.weekStats.lessons.value} g={m.weekStats.lessons.goal} />
          <StatCard label="Hours" v={m.weekStats.hours.value} g={m.weekStats.hours.goal} />
          <StatCard label="£" v={m.weekStats.earnings.value} g={m.weekStats.earnings.goal} prefix="£" />
        </div>

        <SectionLabel>Quick tools</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {m.pinnedTools.slice(0, 8).map((t) => (
            <div key={t.id} style={toolTile}>
              <ToolIcon icon={t.icon} />
              <div style={{ fontSize: 10.5, fontWeight: 600 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function StoryAvatar({ label, highlight }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, width: 60 }}>
      <div style={{ padding: 2, borderRadius: 999, background: highlight ? `linear-gradient(135deg,${PRIMARY},#60A5FA)` : "transparent", width: 56, height: 56 }}>
        <div style={{ background: BG, padding: 2, borderRadius: 999, height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={20} color={PRIMARY} />
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600 }}>{label}</div>
    </div>
  );
}
function StatCard({ label, v, g, prefix = "" }: any) {
  const pct = Math.min(100, (v / g) * 100);
  return (
    <div style={{ ...cardBase, padding: 12 }}>
      <div style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{prefix}{v}</div>
      <div style={{ height: 4, background: "#F1F5F9", borderRadius: 999, marginTop: 8 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: PRIMARY, borderRadius: 999 }} />
      </div>
    </div>
  );
}

/* =========================================================
   V9 — RING DASHBOARD (Apple Watch activity ring vibe)
   ========================================================= */
export function V9Rings() {
  const lPct = (m.weekStats.lessons.value / m.weekStats.lessons.goal) * 100;
  const hPct = (m.weekStats.hours.value / m.weekStats.hours.goal) * 100;
  const ePct = (m.weekStats.earnings.value / m.weekStats.earnings.goal) * 100;
  return (
    <div style={{ background: BG, padding: "10px 14px 100px", minHeight: "100%", color: TEXT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 4px 14px" }}>
        <div>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>This Week</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{m.instructorName}</div>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 999, background: SURFACE, border: "none", boxShadow: "0 1px 2px rgba(15,23,42,0.06)" }}><Bell size={16} /></button>
      </div>

      {/* Triple ring hero */}
      <div style={{ ...cardBase, padding: 16, marginBottom: 10, background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "white" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <TripleRing l={lPct} h={hPct} e={ePct} />
          <div style={{ flex: 1 }}>
            <RingLabel color="#F59E0B" label="Lessons" v={`${m.weekStats.lessons.value}/${m.weekStats.lessons.goal}`} />
            <RingLabel color="#10B981" label="Hours" v={`${m.weekStats.hours.value}/${m.weekStats.hours.goal}`} />
            <RingLabel color="#EC4899" label="Earnings" v={`£${m.weekStats.earnings.value}`} />
          </div>
        </div>
      </div>

      {/* Up next */}
      <div style={{ ...cardBase, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: PRIMARY, letterSpacing: "0.1em" }}>UP NEXT · {m.nextLesson.timeLabel}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: MUTED }}>in {m.nextLesson.startsInMinutes}m</span>
        </div>
        <FauxMap height={80} />
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <Avatar initials={m.nextLesson.initials} tone={m.nextLesson.avatarTone} fg={m.nextLesson.avatarFg} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{m.nextLesson.pupilName}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{m.nextLesson.pickup} · ETA {m.nextLesson.etaMinutes}m</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...primBtn, flex: 1.3 }}><Phone size={14} /> Call</button>
          <button style={tintBtn}><MessageSquare size={14} /></button>
          <button style={tintBtn}><Navigation size={14} /></button>
        </div>
      </div>

      {/* mini alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
        <NeedTile icon={<AlertCircle size={14} />} label="Jobs" count={m.alerts.pendingJobs} tone="#FEF3C7" fg="#92400E" />
        <NeedTile icon={<MessageSquare size={14} />} label="Msgs" count={m.alerts.unreadMessages} tone={TINT} fg={PRIMARY} />
        <NeedTile icon={<CheckCircle2 size={14} />} label="Swaps" count={m.alerts.testSwaps} tone="#DCFCE7" fg="#166534" />
      </div>

      <SectionLabel>Today</SectionLabel>
      <div style={cardBase}>
        {m.todayLessons.slice(0, 4).map((l, i) => (
          <div key={l.id} style={{ display: "flex", padding: "10px 14px", gap: 10, alignItems: "center", borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700, width: 44, color: PRIMARY }}>{l.time}</div>
            <Avatar initials={l.initials} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l.pupil}</div>
              <div style={{ fontSize: 10.5, color: MUTED }}>{l.duration}m · {l.location}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Quick tools</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {m.pinnedTools.slice(0, 8).map((t) => (
          <div key={t.id} style={toolTile}>
            <ToolIcon icon={t.icon} />
            <div style={{ fontSize: 10.5, fontWeight: 600 }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function TripleRing({ l, h, e }: any) {
  const ring = (r: number, color: string, pct: number) => {
    const c = 2 * Math.PI * r;
    return <circle r={r} cx={60} cy={60} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${(pct/100)*c} ${c}`} strokeLinecap="round" transform="rotate(-90 60 60)" opacity={0.95} />;
  };
  const bg = (r: number) => <circle r={r} cx={60} cy={60} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />;
  return (
    <svg width={120} height={120}>
      {bg(48)}{ring(48, "#F59E0B", l)}
      {bg(36)}{ring(36, "#10B981", h)}
      {bg(24)}{ring(24, "#EC4899", e)}
    </svg>
  );
}
function RingLabel({ color, label, v }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
      <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700 }}>{v}</span>
    </div>
  );
}

/* =========================================================
   V10 — CONCIERGE (AI-styled, conversational header)
   ========================================================= */
export function V10Concierge() {
  return (
    <div style={{ background: BG, padding: "0 0 100px", minHeight: "100%", color: TEXT }}>
      <div style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
        padding: "16px 18px 22px", borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${PRIMARY},#7C3AED)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>Your AI assistant</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>Ready</div>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, letterSpacing: "-0.01em" }}>
          Morning <span style={{ color: PRIMARY }}>{m.instructorName}</span>. Your day's looking good — <b>{m.todayLessons.length} lessons</b>, <b>£{m.weekStats.earnings.value}</b> banked this week.
        </div>
        <div style={{ marginTop: 12, background: "white", borderRadius: 999, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 2px rgba(15,23,42,0.06)" }}>
          <Search size={15} color={MUTED} />
          <span style={{ fontSize: 13, color: MUTED }}>Ask anything · "Add Tom on Friday 3pm"</span>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {/* Suggestion chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, margin: "0 -14px", padding: "0 14px 12px" }}>
          {[
            { icon: Phone, label: "Call Maya" }, { icon: Zap, label: "Fill Tue gap" },
            { icon: PoundSterling, label: "Take payment" }, { icon: Calendar, label: "Tomorrow" },
          ].map((c, i) => (
            <button key={i} style={{ background: "white", border: `1px solid ${BORDER}`, borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, color: TEXT }}>
              <c.icon size={13} color={PRIMARY} /> {c.label}
            </button>
          ))}
        </div>

        {/* Up next briefing */}
        <div style={{ ...cardBase, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Sparkles size={12} color={PRIMARY} />
            <span style={{ fontSize: 10, fontWeight: 800, color: PRIMARY, letterSpacing: "0.1em" }}>BRIEF · UP NEXT</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>
            <b>{m.nextLesson.pupilName}</b> at <b>{m.nextLesson.timeLabel}</b> — pickup in <b>{m.nextLesson.pickup}</b>, {m.nextLesson.distanceMiles} mi · ETA {m.nextLesson.etaMinutes}m. Last lesson focus: roundabouts.
          </div>
          <FauxMap height={70} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={{ ...primBtn, flex: 1.3 }}><Phone size={14} /> Call</button>
            <button style={tintBtn}><MessageSquare size={14} /></button>
            <button style={tintBtn}><Navigation size={14} /></button>
          </div>
        </div>

        <SectionLabel>Day plan</SectionLabel>
        <div style={cardBase}>
          {m.todayLessons.map((l, i) => (
            <div key={l.id} style={{ display: "flex", padding: "10px 14px", gap: 10, alignItems: "center", borderBottom: i < m.todayLessons.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 700, width: 44, color: PRIMARY }}>{l.time}</div>
              <Avatar initials={l.initials} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l.pupil}</div>
                <div style={{ fontSize: 10.5, color: MUTED }}>{l.duration}m · {l.location}</div>
              </div>
              {!l.paid && <span style={{ fontSize: 9, fontWeight: 800, color: "#92400E", background: "#FEF3C7", padding: "2px 6px", borderRadius: 999 }}>£</span>}
            </div>
          ))}
        </div>

        <SectionLabel>This week</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <StatCard label="Lessons" v={m.weekStats.lessons.value} g={m.weekStats.lessons.goal} />
          <StatCard label="Hours" v={m.weekStats.hours.value} g={m.weekStats.hours.goal} />
          <StatCard label="£" v={m.weekStats.earnings.value} g={m.weekStats.earnings.goal} prefix="£" />
        </div>

        <SectionLabel>Quick tools</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {m.pinnedTools.slice(0, 8).map((t) => (
            <div key={t.id} style={toolTile}>
              <ToolIcon icon={t.icon} />
              <div style={{ fontSize: 10.5, fontWeight: 600 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
