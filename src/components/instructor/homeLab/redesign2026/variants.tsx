import { mockHome } from "../mockData";
import {
  Phone, MessageSquare, Navigation, MapPin, Plus, Users, Calendar, CreditCard,
  Zap, Settings, Bell, ChevronRight, Clock, TrendingUp, CloudRain, Search,
  Sparkles, Car, PoundSterling, AlertCircle, CheckCircle2, Activity, Home,
} from "lucide-react";

const PRIMARY = "#3D55A1";
const TINT = "#EDF2FE";
const ACCENT = "#CC2229";
const BG = "#F4F7F6";
const SURFACE = "#FFFFFF";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const SUBTLE = "#94A3B8";
const BORDER = "rgba(15,23,42,0.06)";

const m = mockHome;

/* ---------------- Shared bits ---------------- */
function StatusDot({ color = "#10B981" }: { color?: string }) {
  return <span style={{ width: 6, height: 6, borderRadius: 999, background: color, display: "inline-block" }} />;
}

function MapStrip({ height = 96, label }: { height?: number; label?: string }) {
  return (
    <div style={{
      position: "relative", height, borderRadius: 14, overflow: "hidden",
      background: "linear-gradient(135deg,#E9EEF5 0%,#DCE5F2 50%,#E9EEF5 100%)",
    }}>
      {/* faux roads */}
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d="M0,70 Q80,40 160,55 T300,30" stroke="#fff" strokeWidth="6" fill="none" opacity="0.85" />
        <path d="M0,70 Q80,40 160,55 T300,30" stroke={PRIMARY} strokeWidth="2.5" fill="none" strokeDasharray="6 4" />
        <circle cx="20" cy="72" r="5" fill={PRIMARY} />
        <circle cx="280" cy="32" r="6" fill={ACCENT} />
      </svg>
      {label && (
        <div style={{
          position: "absolute", bottom: 8, left: 8, padding: "5px 9px",
          background: "rgba(255,255,255,0.95)", borderRadius: 999,
          fontSize: 11, fontWeight: 700, color: PRIMARY, display: "inline-flex", gap: 6, alignItems: "center"
        }}>
          <StatusDot color={ACCENT} /> {label}
        </div>
      )}
    </div>
  );
}

function Avatar({ initials, tone = "#FCE7F3", fg = "#9D174D", size = 40 }: any) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: tone, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.36,
    }}>{initials}</div>
  );
}

/* =========================================================
   V1 — CALM CARD STACK (premium iOS, generous whitespace)
   ========================================================= */
export function V1CalmStack() {
  return (
    <div style={{ background: BG, padding: "8px 16px 100px", color: TEXT, minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px 14px" }}>
        <div>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{m.dateLabel}</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>Hi, {m.instructorName}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={iconBtn}><Search size={18} color={TEXT} /></button>
          <button style={{ ...iconBtn, position: "relative" }}>
            <Bell size={18} color={TEXT} />
            <span style={badgeDot}>{m.alerts.unreadMessages}</span>
          </button>
        </div>
      </div>

      {/* Up next hero */}
      <div style={{ ...cardBase, padding: 14, marginBottom: 12 }}>
        <MapStrip height={108} label={`Live · in ${m.nextLesson.startsInMinutes}m`} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <Avatar initials={m.nextLesson.initials} tone={m.nextLesson.avatarTone} fg={m.nextLesson.avatarFg} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Up next · {m.nextLesson.timeLabel}</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 1 }}>{m.nextLesson.pupilName}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{m.nextLesson.pickup} · {m.nextLesson.distanceMiles}mi · ETA {m.nextLesson.etaMinutes}m</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...primBtn, flex: 1.3 }}><Phone size={15} /> Call</button>
          <button style={tintBtn}><MessageSquare size={15} /></button>
          <button style={tintBtn}><Navigation size={15} /></button>
        </div>
      </div>

      {/* Alerts strip */}
      <div style={{ ...cardBase, padding: 10, marginBottom: 12, display: "flex", gap: 8 }}>
        <AlertPill icon={<AlertCircle size={14} />} label={`${m.alerts.pendingJobs} jobs`} tone="#FEF3C7" fg="#92400E" />
        <AlertPill icon={<MessageSquare size={14} />} label={`${m.alerts.unreadMessages} msgs`} tone={TINT} fg={PRIMARY} />
        <AlertPill icon={<CheckCircle2 size={14} />} label={`${m.alerts.testSwaps} swap`} tone="#DCFCE7" fg="#166534" />
      </div>

      {/* Today section */}
      <SectionLabel>Today · {m.todayLessons.length} lessons</SectionLabel>
      <div style={cardBase}>
        {m.todayLessons.map((l, i) => (
          <div key={l.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            borderBottom: i < m.todayLessons.length - 1 ? `1px solid ${BORDER}` : "none",
          }}>
            <div style={{ width: 44, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{l.time}</div>
              <div style={{ fontSize: 10, color: MUTED }}>{l.duration}m</div>
            </div>
            <Avatar initials={l.initials} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{l.pupil}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{l.type} · {l.location}</div>
            </div>
            {!l.paid && <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "3px 7px", borderRadius: 999 }}>UNPAID</span>}
          </div>
        ))}
      </div>

      <SectionLabel>This week</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        <Stat label="Lessons" value={m.weekStats.lessons.value} goal={m.weekStats.lessons.goal} />
        <Stat label="Hours" value={m.weekStats.hours.value} goal={m.weekStats.hours.goal} />
        <Stat label="£" value={m.weekStats.earnings.value} goal={m.weekStats.earnings.goal} prefix="£" />
      </div>

      <SectionLabel>Quick tools</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {m.pinnedTools.slice(0, 8).map((t) => (
          <div key={t.id} style={toolTile}>
            <ToolIcon icon={t.icon} />
            <div style={{ fontSize: 10.5, fontWeight: 600, color: TEXT }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   V2 — TIMELINE SPINE (vertical day with anchored hero)
   ========================================================= */
export function V2TimelineSpine() {
  return (
    <div style={{ background: BG, padding: "6px 0 100px", color: TEXT, minHeight: "100%" }}>
      <div style={{ padding: "10px 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Today</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{m.dateLabel.split(",")[1]?.trim()}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: MUTED }}>
          <CloudRain size={14} /> {m.weather.temp}°
        </div>
      </div>

      {/* hero */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{ ...cardBase, padding: 14, background: PRIMARY, color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.85 }}>Up next · in {m.nextLesson.startsInMinutes}m</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", padding: "3px 8px", borderRadius: 999 }}>ETA {m.nextLesson.etaMinutes}m</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{m.nextLesson.timeLabel}</div>
          <div style={{ fontSize: 14, opacity: 0.95, marginTop: 2 }}>{m.nextLesson.pupilName} · {m.nextLesson.pickup}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={{ ...primBtn, background: "white", color: PRIMARY, flex: 1 }}><Phone size={15} /> Call</button>
            <button style={{ ...primBtn, background: "rgba(255,255,255,0.18)", color: "white", flex: 1 }}><Navigation size={15} /> Drive</button>
          </div>
        </div>
      </div>

      {/* timeline */}
      <div style={{ padding: "0 14px" }}>
        <SectionLabel>Day at a glance</SectionLabel>
        <div style={{ ...cardBase, padding: "8px 0" }}>
          {m.todayLessons.map((l, i) => (
            <div key={l.id} style={{ display: "flex", padding: "10px 14px", gap: 12, alignItems: "center" }}>
              <div style={{ width: 50 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{l.time}</div>
                <div style={{ fontSize: 10, color: MUTED }}>{l.duration}m</div>
              </div>
              <div style={{ width: 2, alignSelf: "stretch", background: i === 0 ? PRIMARY : BORDER, borderRadius: 999, position: "relative" }}>
                <div style={{ position: "absolute", left: -4, top: "50%", width: 10, height: 10, borderRadius: 999, background: i === 0 ? PRIMARY : "#CBD5E1", border: "2px solid white" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{l.pupil}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{l.type} · {l.location}</div>
              </div>
              {!l.paid && <span style={{ fontSize: 9, fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "2px 6px", borderRadius: 999 }}>UNPAID</span>}
            </div>
          ))}
          <div style={{ borderTop: `1px dashed ${BORDER}`, margin: "6px 14px", paddingTop: 8, fontSize: 11, color: MUTED, display: "flex", justifyContent: "space-between" }}>
            <span>3 open slots</span>
            <span style={{ color: PRIMARY, fontWeight: 700 }}>Fill gaps →</span>
          </div>
        </div>

        <SectionLabel>This week</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <Stat label="Lessons" value={m.weekStats.lessons.value} goal={m.weekStats.lessons.goal} />
          <Stat label="Hours" value={m.weekStats.hours.value} goal={m.weekStats.hours.goal} />
          <Stat label="£" value={m.weekStats.earnings.value} goal={m.weekStats.earnings.goal} prefix="£" />
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

/* =========================================================
   V3 — DASHBOARD MOSAIC (KPI-first, glance)
   ========================================================= */
export function V3Mosaic() {
  return (
    <div style={{ background: BG, padding: "6px 14px 100px", color: TEXT, minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px 14px" }}>
        <div>
          <div style={{ fontSize: 13, color: MUTED }}>{m.greeting},</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{m.instructorName}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={iconBtn}><Bell size={18} color={TEXT} /></button>
          <button style={iconBtn}><Settings size={18} color={TEXT} /></button>
        </div>
      </div>

      {/* KPI mosaic */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <BigKpi label="This week" value={`£${m.weekStats.earnings.value}`} sub={`Goal £${m.weekStats.earnings.goal}`} accent={PRIMARY} icon={<PoundSterling size={16} />} />
        <BigKpi label="Lessons" value={m.weekStats.lessons.value} sub={`/ ${m.weekStats.lessons.goal} target`} accent="#10B981" icon={<Activity size={16} />} />
      </div>

      {/* hero */}
      <div style={{ ...cardBase, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Next · {m.nextLesson.timeLabel}</div>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>in {m.nextLesson.startsInMinutes}m</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar initials={m.nextLesson.initials} tone={m.nextLesson.avatarTone} fg={m.nextLesson.avatarFg} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{m.nextLesson.pupilName}</div>
            <div style={{ fontSize: 12, color: MUTED }}>{m.nextLesson.pickup} · ETA {m.nextLesson.etaMinutes}m</div>
          </div>
        </div>
        <MapStrip height={70} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button style={{ ...primBtn, flex: 1 }}><Phone size={14} /> Call</button>
          <button style={{ ...tintBtn, flex: 1 }}><Navigation size={14} /> Drive</button>
        </div>
      </div>

      {/* Alerts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
        <MiniAlert label="Jobs" count={m.alerts.pendingJobs} tone="#FEF3C7" fg="#92400E" />
        <MiniAlert label="Msgs" count={m.alerts.unreadMessages} tone={TINT} fg={PRIMARY} />
        <MiniAlert label="Swaps" count={m.alerts.testSwaps} tone="#DCFCE7" fg="#166534" />
      </div>

      <SectionLabel>Today</SectionLabel>
      <div style={cardBase}>
        {m.todayLessons.slice(0, 4).map((l, i) => (
          <div key={l.id} style={{ display: "flex", padding: "10px 14px", gap: 10, alignItems: "center", borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700, width: 44 }}>{l.time}</div>
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

/* =========================================================
   V4 — MAGAZINE (editorial spacing, soft serif accent)
   ========================================================= */
export function V4Magazine() {
  return (
    <div style={{ background: "#FBF9F4", padding: "6px 18px 100px", color: TEXT, minHeight: "100%" }}>
      <div style={{ padding: "12px 0 16px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700 }}>Daily brief · {m.dateLabel}</div>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 30, lineHeight: 1.05, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8 }}>
          Good morning,<br /><span style={{ fontStyle: "italic", color: PRIMARY }}>{m.instructorName}.</span>
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>{m.todayLessons.length} lessons · {m.weather.temp}° {m.weather.summary}</div>
      </div>

      <SectionLabel>Lead story</SectionLabel>
      <div style={{ ...cardBase, padding: 16 }}>
        <div style={{ fontSize: 10, color: ACCENT, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>Up next · in {m.nextLesson.startsInMinutes}m</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginTop: 6, letterSpacing: "-0.01em" }}>{m.nextLesson.pupilName}</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{m.nextLesson.timeLabel} · {m.nextLesson.pickup} · {m.nextLesson.distanceMiles} mi</div>
        <div style={{ marginTop: 12 }}><MapStrip height={90} label={`ETA ${m.nextLesson.etaMinutes}m`} /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={{ ...primBtn, flex: 1 }}><Phone size={14} /> Call</button>
          <button style={tintBtn}><MessageSquare size={14} /></button>
          <button style={tintBtn}><Navigation size={14} /></button>
        </div>
      </div>

      <SectionLabel>The day ahead</SectionLabel>
      <div style={cardBase}>
        {m.todayLessons.map((l, i) => (
          <div key={l.id} style={{ display: "flex", padding: "12px 14px", gap: 12, alignItems: "center", borderBottom: i < m.todayLessons.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ width: 48, fontFamily: "Georgia, serif" }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{l.time}</div>
              <div style={{ fontSize: 10, color: MUTED }}>{l.duration}m</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{l.pupil}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{l.type} · {l.location}</div>
            </div>
            {!l.paid && <span style={{ fontSize: 9, color: ACCENT, fontWeight: 800 }}>UNPAID</span>}
          </div>
        ))}
      </div>

      <SectionLabel>By the numbers</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        <Stat label="Lessons" value={m.weekStats.lessons.value} goal={m.weekStats.lessons.goal} />
        <Stat label="Hours" value={m.weekStats.hours.value} goal={m.weekStats.hours.goal} />
        <Stat label="£" value={m.weekStats.earnings.value} goal={m.weekStats.earnings.goal} prefix="£" />
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

/* =========================================================
   V5 — COMMAND BRIDGE (info-dense, pro pilot)
   ========================================================= */
export function V5Command() {
  return (
    <div style={{ background: "#0F172A", padding: "6px 0 100px", color: "white", minHeight: "100%" }}>
      <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Bridge · live</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{m.instructorName}</div>
        </div>
        <div style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 11, color: "#10B981", fontWeight: 700 }}>
          <StatusDot color="#10B981" /> ONLINE
        </div>
      </div>

      {/* search */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ background: "#1E293B", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, color: "#94A3B8", fontSize: 13 }}>
          <Search size={15} /> Search pupils, lessons, postcodes…
        </div>
      </div>

      {/* hero */}
      <div style={{ padding: "0 16px 10px" }}>
        <div style={{ background: "#1E293B", borderRadius: 16, padding: 14, border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#60A5FA", letterSpacing: "0.1em" }}>NEXT LESSON · T-{m.nextLesson.startsInMinutes}m</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981" }}>● PAID</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar initials={m.nextLesson.initials} tone="#1E3A8A" fg="#BFDBFE" size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{m.nextLesson.pupilName}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "ui-monospace, monospace" }}>{m.nextLesson.timeLabel} · {m.nextLesson.pickup} · {m.nextLesson.distanceMiles}mi</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12, fontSize: 10, color: "#94A3B8" }}>
            <Telem label="ETA" value={`${m.nextLesson.etaMinutes}m`} />
            <Telem label="DUR" value={`${m.nextLesson.durationMinutes}m`} />
            <Telem label="DIST" value={`${m.nextLesson.distanceMiles}mi`} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={{ ...primBtn, flex: 1.3, background: ACCENT }}><Phone size={14} /> Call</button>
            <button style={{ ...primBtn, flex: 1, background: "#334155" }}><MessageSquare size={14} /></button>
            <button style={{ ...primBtn, flex: 1, background: "#334155" }}><Navigation size={14} /></button>
          </div>
        </div>
      </div>

      {/* dense KPI strip */}
      <div style={{ padding: "0 16px 10px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        <DarkKpi label="WEEK" value={`£${m.weekStats.earnings.value}`} />
        <DarkKpi label="HRS" value={`${m.weekStats.hours.value}`} />
        <DarkKpi label="LSN" value={`${m.weekStats.lessons.value}`} />
        <DarkKpi label="ALR" value={`${m.alerts.pendingJobs + m.alerts.unreadMessages + m.alerts.testSwaps}`} accent={ACCENT} />
      </div>

      {/* schedule */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, margin: "12px 4px 8px" }}>Schedule · today</div>
        <div style={{ background: "#1E293B", borderRadius: 12, border: "1px solid #334155" }}>
          {m.todayLessons.map((l, i) => (
            <div key={l.id} style={{ display: "flex", padding: "10px 12px", gap: 10, alignItems: "center", borderBottom: i < m.todayLessons.length - 1 ? "1px solid #334155" : "none", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
              <span style={{ color: "#60A5FA", fontWeight: 700, width: 44 }}>{l.time}</span>
              <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{l.pupil}</span>
              <span style={{ color: "#94A3B8" }}>{l.location}</span>
              <span style={{ color: l.paid ? "#10B981" : "#F59E0B", fontSize: 9, fontWeight: 800 }}>{l.paid ? "●" : "!"}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, margin: "14px 4px 8px" }}>Console</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {m.pinnedTools.slice(0, 8).map((t) => (
            <div key={t.id} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <ToolIcon icon={t.icon} dark />
              <div style={{ fontSize: 10, color: "#CBD5E1", fontWeight: 600 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
const cardBase: React.CSSProperties = {
  background: SURFACE, borderRadius: 16,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)",
  overflow: "hidden",
};
const iconBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 999, background: "white",
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", boxShadow: "0 1px 2px rgba(15,23,42,0.06)", position: "relative",
};
const badgeDot: React.CSSProperties = {
  position: "absolute", top: 4, right: 4, minWidth: 16, height: 16,
  borderRadius: 999, background: ACCENT, color: "white",
  fontSize: 9, fontWeight: 800, padding: "0 4px",
  display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white",
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
const toolTile: React.CSSProperties = {
  background: SURFACE, borderRadius: 14, padding: "12px 6px",
  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "16px 4px 8px" }}>
      {children}
    </div>
  );
}

function AlertPill({ icon, label, tone, fg }: any) {
  return (
    <div style={{ flex: 1, background: tone, color: fg, borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
      {icon} {label}
    </div>
  );
}

function MiniAlert({ label, count, tone, fg }: any) {
  return (
    <div style={{ background: tone, color: fg, borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800 }}>{count}</span>
    </div>
  );
}

function Stat({ label, value, goal, prefix = "" }: any) {
  const pct = Math.min(100, (Number(value) / Number(goal)) * 100);
  return (
    <div style={{ ...cardBase, padding: 12 }}>
      <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{prefix}{value}</div>
      <div style={{ height: 4, background: "#F1F5F9", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: PRIMARY, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function BigKpi({ label, value, sub, accent, icon }: any) {
  return (
    <div style={{ ...cardBase, padding: 14, background: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${accent}1A`, color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Telem({ label, value }: any) {
  return (
    <div style={{ background: "#0F172A", borderRadius: 8, padding: "8px 10px", border: "1px solid #334155" }}>
      <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ fontSize: 14, color: "white", fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{value}</div>
    </div>
  );
}

function DarkKpi({ label, value, accent }: any) {
  return (
    <div style={{ background: "#1E293B", borderRadius: 10, padding: "8px 6px", textAlign: "center", border: "1px solid #334155" }}>
      <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, letterSpacing: "0.1em" }}>{label}</div>
      <div style={{ fontSize: 14, color: accent || "white", fontWeight: 800, marginTop: 2, fontFamily: "ui-monospace, monospace" }}>{value}</div>
    </div>
  );
}

function ToolIcon({ icon, dark }: { icon: string; dark?: boolean }) {
  const map: Record<string, any> = {
    plus: Plus, users: Users, "message-square": MessageSquare, calendar: Calendar,
    "credit-card": CreditCard, zap: Zap, navigation: Navigation, settings: Settings,
  };
  const Icon = map[icon] || Plus;
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: dark ? "#0F172A" : TINT,
      color: dark ? "#60A5FA" : PRIMARY,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={17} />
    </div>
  );
}
