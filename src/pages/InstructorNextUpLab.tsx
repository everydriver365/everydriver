import { useState } from "react";
import {
  MapPin, Phone, MessageSquare, Navigation, Clock, ChevronRight,
  CheckCircle2, Car, PoundSterling, User, CalendarClock, Route,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared mock data — represents the "next up" lesson on the instructor home.
// ---------------------------------------------------------------------------
const lesson = {
  pupilName: "Maya Patel",
  initials: "MP",
  lessonType: "Standard · Manual",
  startTime: "09:30",
  endTime: "11:00",
  durationMins: 90,
  pickup: "12 Stockbridge Road, Winchester",
  postcode: "SO22 6RN",
  distanceMiles: 3.2,
  etaMinutes: 12,
  minutesUntil: 35,
  paid: true,
  price: 54,
  weather: "14° Light rain",
  progress: 18, // % through the syllabus
  totalLessons: 22,
  completedLessons: 4,
};

const iosFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

// ---------------------------------------------------------------------------
// V1 · Hero Brief — bold time, generous breathing room, single primary CTA.
// ---------------------------------------------------------------------------
function V1HeroBrief() {
  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5EA", borderRadius: 16, padding: 18, fontFamily: iosFont }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Up next · in {lesson.minutesUntil}m
        </span>
        {lesson.paid && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#16A34A", fontWeight: 500 }}>
            <CheckCircle2 size={12} /> Paid
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
        <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: -1.5, color: "#000", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {lesson.startTime}
        </span>
        <span style={{ fontSize: 13, color: "#6E6E73" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 500, color: "#000", marginTop: 12, letterSpacing: -0.2 }}>
        {lesson.pupilName}
      </div>
      <div style={{ fontSize: 13, color: "#6E6E73", marginTop: 2 }}>{lesson.lessonType}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, color: "#6E6E73" }}>
        <MapPin size={13} /> {lesson.pickup}
      </div>
      <button
        style={{
          width: "100%", marginTop: 14, padding: "12px", borderRadius: 12,
          background: "#3D55A1", color: "#FFF", fontSize: 15, fontWeight: 600,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <Navigation size={16} /> Navigate · {lesson.etaMinutes} min
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V2 · Map Hero — static map preview at top, info chips below.
// ---------------------------------------------------------------------------
function V2MapHero() {
  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5EA", borderRadius: 16, overflow: "hidden", fontFamily: iosFont }}>
      <div
        style={{
          height: 130,
          background:
            "linear-gradient(135deg, #DCEAFE 0%, #C7D7F5 50%, #B5C7EE 100%)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 16, top: 12, fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.4, background: "rgba(255,255,255,0.85)", padding: "4px 8px", borderRadius: 999 }}>
          In {lesson.minutesUntil}m
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MapPin size={28} color="#B23A3F" strokeWidth={2.4} fill="#fff" />
        </div>
        <div style={{ position: "absolute", right: 12, bottom: 10, fontSize: 11, color: "#0F172A", background: "rgba(255,255,255,0.9)", padding: "4px 8px", borderRadius: 8, fontWeight: 500 }}>
          {lesson.distanceMiles} mi · {lesson.etaMinutes} min
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#000" }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>{lesson.lessonType}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#000", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</div>
            <div style={{ fontSize: 11, color: "#6E6E73", marginTop: 3 }}>{lesson.durationMins}m lesson</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={btnSecondary}><Phone size={14} /> Call</button>
          <button style={btnSecondary}><MessageSquare size={14} /> Message</button>
          <button style={btnPrimary}><Navigation size={14} /> Go</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V3 · Avatar Hero — pupil-centric, big avatar, readable hierarchy.
// ---------------------------------------------------------------------------
function V3AvatarHero() {
  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5EA", borderRadius: 16, padding: 16, fontFamily: iosFont }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: 0.4 }}>
        Up next
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 999, background: "linear-gradient(135deg,#3D55A1,#7C8DD6)",
          color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 600, fontSize: 18,
        }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#000", letterSpacing: -0.2 }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>Lesson {lesson.completedLessons + 1} of {lesson.totalLessons} · {lesson.lessonType}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#000", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</div>
          <div style={{ fontSize: 11, color: "#3D55A1", marginTop: 4, fontWeight: 600 }}>in {lesson.minutesUntil}m</div>
        </div>
      </div>
      {/* progress bar */}
      <div style={{ marginTop: 14, height: 4, background: "#F2F2F7", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${lesson.progress}%`, height: "100%", background: "#3D55A1" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#6E6E73" }}>
        <span>{lesson.progress}% syllabus</span>
        <span>{lesson.pickup.split(",")[0]} · {lesson.postcode}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnSecondary}><MessageSquare size={14} /> Chat</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V4 · Compact Strip — single-row dense layout, fits above-the-fold easily.
// ---------------------------------------------------------------------------
function V4CompactStrip() {
  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5EA", borderRadius: 14, padding: 12, fontFamily: iosFont, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: "#EDF2FE", color: "#3D55A1",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{lesson.startTime.split(":")[0]}</div>
        <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>:{lesson.startTime.split(":")[1]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#000" }}>{lesson.pupilName}</span>
          <span style={{ fontSize: 11, color: "#3D55A1", background: "#EDF2FE", padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>in {lesson.minutesUntil}m</span>
        </div>
        <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lesson.lessonType} · {lesson.postcode} · {lesson.distanceMiles}mi
        </div>
      </div>
      <button style={{ ...btnPrimary, padding: "8px 12px", flexShrink: 0 }}>
        <Navigation size={14} />
      </button>
      <ChevronRight size={16} color="#C7C7CC" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// V5 · Glass Dark — premium dark gradient, white type, glassy chips.
// ---------------------------------------------------------------------------
function V5GlassDark() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1F2A4A 0%, #3D55A1 100%)",
      borderRadius: 18, padding: 18, fontFamily: iosFont, color: "#FFF",
      boxShadow: "0 10px 30px -12px rgba(31,42,74,0.5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.85 }}>
          Up next · in {lesson.minutesUntil} min
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: 999 }}>
          <CheckCircle2 size={12} /> Paid
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
        <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, opacity: 0.8 }}>· {lesson.durationMins}m</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 10 }}>{lesson.pupilName}</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{lesson.lessonType}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Chip icon={<MapPin size={12} />} label={`${lesson.postcode}`} />
        <Chip icon={<Route size={12} />} label={`${lesson.distanceMiles} mi`} />
        <Chip icon={<Clock size={12} />} label={`${lesson.etaMinutes} min ETA`} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={glassBtn}><Phone size={14} /></button>
        <button style={glassBtn}><MessageSquare size={14} /></button>
        <button style={{ ...glassBtn, flex: 1, background: "#FFF", color: "#1F2A4A", fontWeight: 600 }}>
          <Navigation size={14} /> Navigate
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V6 · Timeline Card — visual time spine left, content right.
// ---------------------------------------------------------------------------
function V6Timeline() {
  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E5EA", borderRadius: 16, padding: 16, fontFamily: iosFont, display: "flex", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.4 }}>Now</div>
        <div style={{ width: 2, height: 22, background: "#E5E5EA", margin: "6px 0" }} />
        <div style={{ width: 10, height: 10, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px #EDF2FE" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{lesson.startTime}</div>
        <div style={{ width: 2, flex: 1, background: "#E5E5EA", margin: "6px 0", minHeight: 30 }} />
        <div style={{ fontSize: 11, color: "#6E6E73", fontVariantNumeric: "tabular-nums" }}>{lesson.endTime}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#000" }}>{lesson.pupilName}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1" }}>in {lesson.minutesUntil}m</span>
        </div>
        <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>{lesson.lessonType} · {lesson.durationMins}m</div>
        <div style={{ marginTop: 10, padding: 10, background: "#F8F9FB", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#000", fontWeight: 500 }}>
            <MapPin size={12} color="#3D55A1" /> {lesson.pickup}
          </div>
          <div style={{ fontSize: 11, color: "#6E6E73", marginTop: 4, display: "flex", gap: 10 }}>
            <span>{lesson.postcode}</span>
            <span>· {lesson.distanceMiles} mi</span>
            <span>· {lesson.etaMinutes} min away</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <button style={iconBtn}><Phone size={14} /></button>
          <button style={iconBtn}><MessageSquare size={14} /></button>
          <button style={{ ...btnPrimary, flex: 1, padding: "8px 12px" }}><Navigation size={14} /> Navigate</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared inline styles + tiny components
// ---------------------------------------------------------------------------
const btnPrimary: React.CSSProperties = {
  flex: 1, padding: "10px 12px", borderRadius: 10,
  background: "#3D55A1", color: "#FFF", fontWeight: 600, fontSize: 13,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
};
const btnSecondary: React.CSSProperties = {
  flex: 1, padding: "10px 12px", borderRadius: 10,
  background: "#F2F2F7", color: "#000", fontWeight: 500, fontSize: 13,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
};
const iconBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, background: "#F2F2F7",
  display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#000",
};
const glassBtn: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, color: "#FFF",
  background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  fontSize: 13, fontWeight: 500,
};
function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, padding: "4px 8px", borderRadius: 999, background: "rgba(255,255,255,0.15)", color: "#FFF" }}>
      {icon} {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// V7 · Boarding Pass — ticket-style with notch + dashed divider.
// ---------------------------------------------------------------------------
function V7BoardingPass() {
  return (
    <div style={{ fontFamily: iosFont, position: "relative", filter: "drop-shadow(0 8px 24px rgba(15,23,42,0.08))" }}>
      <div style={{ background: "#FFF", borderRadius: 16, padding: 16, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#3D55A1", letterSpacing: 1.4 }}>UP NEXT · LESSON #{lesson.completedLessons + 1}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", letterSpacing: 1.4 }}>PAID</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>From</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>You</div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "0 14px" }}>
            <div style={{ flex: 1, height: 1, borderTop: "1px dashed #CBD5E1" }} />
            <Car size={14} color="#3D55A1" />
            <div style={{ flex: 1, height: 1, borderTop: "1px dashed #CBD5E1" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>To</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{lesson.postcode.split(" ")[0]}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 6 }}>
          {lesson.distanceMiles} mi · {lesson.etaMinutes} min drive
        </div>
      </div>
      {/* notch */}
      <div style={{ position: "relative", height: 0 }}>
        <div style={{ position: "absolute", left: -8, top: -10, width: 16, height: 16, borderRadius: 999, background: "#F4F7F6" }} />
        <div style={{ position: "absolute", right: -8, top: -10, width: 16, height: 16, borderRadius: 999, background: "#F4F7F6" }} />
      </div>
      <div style={{ background: "#FFF", borderRadius: 16, padding: 16, marginTop: 6, borderTop: "1px dashed #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Field label="Passenger" value={lesson.pupilName} />
          <Field label="Boarding" value={lesson.startTime} align="right" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <Field label="Type" value={lesson.lessonType} />
          <Field label="Duration" value={`${lesson.durationMins}m`} align="right" />
        </div>
        <button style={{ ...btnPrimary, width: "100%", marginTop: 14 }}>
          <Navigation size={14} /> Start journey
        </button>
      </div>
    </div>
  );
}
function Field({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V8 · Countdown Ring — circular SVG progress around minutes-until.
// ---------------------------------------------------------------------------
function V8CountdownRing() {
  const total = 60;
  const remaining = Math.min(lesson.minutesUntil, total);
  const pct = remaining / total;
  const r = 32, c = 2 * Math.PI * r;
  return (
    <div style={{ background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 16, padding: 16, fontFamily: iosFont, display: "flex", gap: 14, alignItems: "center" }}>
      <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
        <svg width={76} height={76}>
          <circle cx={38} cy={38} r={r} stroke="#F2F2F7" strokeWidth={6} fill="none" />
          <circle
            cx={38} cy={38} r={r} stroke="#3D55A1" strokeWidth={6} fill="none"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            strokeLinecap="round" transform="rotate(-90 38 38)"
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{lesson.minutesUntil}</div>
          <div style={{ fontSize: 9, color: "#6E6E73", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>min</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 1 }}>Up next · {lesson.startTime}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#000", marginTop: 4 }}>{lesson.pupilName}</div>
        <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>{lesson.lessonType}</div>
        <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} /> {lesson.postcode} · {lesson.etaMinutes}m drive
        </div>
      </div>
      <button style={{ ...iconBtn, background: "#3D55A1", color: "#FFF" }}>
        <Navigation size={16} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V9 · Split Action — left info, right tall CTA column.
// ---------------------------------------------------------------------------
function V9SplitAction() {
  return (
    <div style={{ background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 16, fontFamily: iosFont, display: "flex", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Up next · in {lesson.minutesUntil}m
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginTop: 6, fontVariantNumeric: "tabular-nums", letterSpacing: -0.4 }}>{lesson.startTime}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#000", marginTop: 8 }}>{lesson.pupilName}</div>
        <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>{lesson.lessonType} · {lesson.durationMins}m</div>
        <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} /> {lesson.postcode}
        </div>
      </div>
      <button style={{
        width: 96, background: "#3D55A1", color: "#FFF",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
        fontWeight: 600, fontSize: 12,
      }}>
        <Navigation size={20} />
        Navigate
        <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 500 }}>{lesson.etaMinutes} min</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V10 · Status Banner — colored top bar communicates state at a glance.
// ---------------------------------------------------------------------------
function V10StatusBanner() {
  return (
    <div style={{ background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 16, fontFamily: iosFont, overflow: "hidden" }}>
      <div style={{ background: "#3D55A1", color: "#FFF", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
          <Clock size={12} /> Starts in {lesson.minutesUntil} minutes
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, fontVariantNumeric: "tabular-nums" }}>{lesson.startTime} – {lesson.endTime}</span>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "#EDF2FE", color: "#3D55A1",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14,
          }}>{lesson.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#000" }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 1 }}>{lesson.lessonType} · £{lesson.price}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "10px 12px", background: "#F8F9FB", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#0F172A" }}>
          <MapPin size={13} color="#3D55A1" />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.pickup}</span>
          <span style={{ fontWeight: 600, color: "#3D55A1", flexShrink: 0 }}>{lesson.etaMinutes}m</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={btnSecondary}><Phone size={14} /></button>
          <button style={btnSecondary}><MessageSquare size={14} /></button>
          <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V11 · Editorial Card — large serif name, magazine pacing.
// ---------------------------------------------------------------------------
function V11Editorial() {
  return (
    <div style={{ background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 16, padding: 20, fontFamily: iosFont }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 28, height: 1, background: "#0F172A" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: 2 }}>Up Next</span>
        <div style={{ width: 28, height: 1, background: "#0F172A" }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 1 }}>
          In {lesson.minutesUntil} minutes
        </div>
        <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, fontWeight: 600, color: "#0F172A", marginTop: 6, letterSpacing: -0.6, lineHeight: 1.1 }}>
          {lesson.pupilName}
        </div>
        <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 6, fontStyle: "italic" }}>
          {lesson.lessonType}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18, paddingTop: 14, borderTop: "1px solid #F2F2F7" }}>
        <Stat label="Time" value={lesson.startTime} />
        <Stat label="Duration" value={`${lesson.durationMins}m`} />
        <Stat label="ETA" value={`${lesson.etaMinutes}m`} />
      </div>
      <div style={{ fontSize: 12, color: "#6E6E73", textAlign: "center", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <MapPin size={12} /> {lesson.pickup}
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14 }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V12 · Live Card — ambient background gradient with imminent emphasis.
// ---------------------------------------------------------------------------
function V12LiveCard() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background: "radial-gradient(120% 80% at 0% 0%, #DCEAFE 0%, #FFFFFF 55%)",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#3D55A1" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px rgba(61,85,161,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.7 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#6E6E73" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "#3D55A1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#6E6E73" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <Mini icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <Mini icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <Mini icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14 }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function Mini({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.7)", border: "0.5px solid #E5E5EA", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#3D55A1" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "#6E6E73", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V13 · Stacked Cards — primary card with peek of the lesson after.
// ---------------------------------------------------------------------------
function V13StackedCards() {
  return (
    <div style={{ fontFamily: iosFont, position: "relative", paddingBottom: 14 }}>
      <div style={{
        position: "absolute", left: 16, right: 16, bottom: 0, height: 28,
        background: "#FFF", border: "0.5px solid #E5E5EA", borderTop: "none",
        borderRadius: "0 0 14px 14px", opacity: 0.7,
      }} />
      <div style={{
        position: "absolute", left: 8, right: 8, bottom: 6, height: 28,
        background: "#FFF", border: "0.5px solid #E5E5EA", borderTop: "none",
        borderRadius: "0 0 14px 14px", opacity: 0.85,
      }} />
      <div style={{ background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 14, padding: 16, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.4 }}>Up next · in {lesson.minutesUntil}m</span>
          <span style={{ fontSize: 11, color: "#6E6E73", fontVariantNumeric: "tabular-nums" }}>{lesson.startTime}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#3D55A1,#7C8DD6)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{lesson.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#000" }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 1 }}>{lesson.lessonType} · {lesson.postcode}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={btnSecondary}><Phone size={14} /></button>
          <button style={btnSecondary}><MessageSquare size={14} /></button>
          <button style={btnPrimary}><Navigation size={14} /> {lesson.etaMinutes}m</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V14 · Glanceable — minimalist, single line of essentials.
// ---------------------------------------------------------------------------
function V14Glanceable() {
  return (
    <div style={{
      background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 14,
      padding: "14px 16px", fontFamily: iosFont,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px #EDF2FE" }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{lesson.startTime}</span>
          <span style={{ fontSize: 12, color: "#3D55A1", fontWeight: 600 }}>· in {lesson.minutesUntil}m</span>
        </div>
        <div style={{ fontSize: 13, color: "#0F172A", marginTop: 4, fontWeight: 500 }}>{lesson.pupilName}</div>
        <div style={{ fontSize: 11, color: "#6E6E73", marginTop: 1 }}>{lesson.postcode} · {lesson.distanceMiles}mi</div>
      </div>
      <ChevronRight size={18} color="#C7C7CC" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// V15 · iOS Widget — looks like a Lock Screen widget tile.
// ---------------------------------------------------------------------------
function V15IOSWidget() {
  return (
    <div style={{
      background: "linear-gradient(180deg, #1F2937 0%, #0F172A 100%)",
      borderRadius: 22, padding: 16, fontFamily: iosFont, color: "#FFF",
      aspectRatio: "1 / 1", maxWidth: 220, margin: "0 auto",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      boxShadow: "0 12px 30px -10px rgba(15,23,42,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.6 }}>
          <CalendarClock size={11} /> Up next
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>DSM</span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, fontWeight: 500 }}>{lesson.pupilName}</div>
        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{lesson.postcode} · {lesson.distanceMiles}mi</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 600 }}>
        <span style={{ color: "#7DD3FC" }}>in {lesson.minutesUntil}m</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, opacity: 0.85 }}>
          <Navigation size={11} /> {lesson.etaMinutes}m
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V16 · Driver Brief — pre-trip checklist style with subtle ticks.
// ---------------------------------------------------------------------------
function V16DriverBrief() {
  const items = [
    { label: "Pupil paid", value: "£" + lesson.price, ok: lesson.paid },
    { label: "Travel time", value: `${lesson.etaMinutes} min`, ok: true },
    { label: "Weather", value: lesson.weather, ok: true },
  ];
  return (
    <div style={{ background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 16, padding: 16, fontFamily: iosFont }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: 0.4 }}>Pre-lesson brief</span>
        <span style={{ fontSize: 11, color: "#3D55A1", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{lesson.startTime} · in {lesson.minutesUntil}m</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "#000", marginTop: 8 }}>{lesson.pupilName}</div>
      <div style={{ fontSize: 12, color: "#6E6E73", marginTop: 1 }}>{lesson.lessonType}</div>
      <div style={{ marginTop: 12, borderTop: "1px solid #F2F2F7" }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid #F2F2F7" : "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0F172A" }}>
              <CheckCircle2 size={14} color={it.ok ? "#16A34A" : "#94A3B8"} />
              {it.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14 }}>
        <Navigation size={14} /> Navigate · {lesson.postcode}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V17 · Pill Header — single tall pill with rounded inner sections.
// ---------------------------------------------------------------------------
function V17PillHeader() {
  return (
    <div style={{
      background: "#0F172A", borderRadius: 999, padding: 6, fontFamily: iosFont,
      display: "flex", alignItems: "center", gap: 8, color: "#FFF",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999, background: "#3D55A1",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{lesson.startTime.split(":")[0]}</div>
        <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>:{lesson.startTime.split(":")[1]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{lesson.pupilName}</div>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          in {lesson.minutesUntil}m · {lesson.postcode} · {lesson.etaMinutes}m drive
        </div>
      </div>
      <button style={{
        width: 56, height: 56, borderRadius: 999, background: "#FFF", color: "#0F172A",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Navigation size={18} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V18 · Bento Grid — equal-weight info cells.
// ---------------------------------------------------------------------------
function V18Bento() {
  return (
    <div style={{ background: "#FFF", border: "0.5px solid #E5E5EA", borderRadius: 16, padding: 12, fontFamily: iosFont }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 4px 10px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", textTransform: "uppercase", letterSpacing: 0.4 }}>Up next</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1" }}>in {lesson.minutesUntil}m</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "auto auto", gap: 8 }}>
        <BentoCell bg="#EDF2FE" rowSpan={2}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.4 }}>Pupil</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginTop: 6, lineHeight: 1.2 }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#3D55A1", marginTop: 4 }}>{lesson.lessonType}</div>
          <div style={{ marginTop: "auto", paddingTop: 14, fontSize: 24, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums", letterSpacing: -0.6 }}>{lesson.startTime}</div>
        </BentoCell>
        <BentoCell bg="#FEF3C7">
          <div style={{ fontSize: 10, fontWeight: 600, color: "#92400E", textTransform: "uppercase", letterSpacing: 0.4 }}>ETA</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{lesson.etaMinutes}m</div>
          <div style={{ fontSize: 10, color: "#92400E", marginTop: 2 }}>{lesson.distanceMiles} miles</div>
        </BentoCell>
        <BentoCell bg="#DCFCE7">
          <div style={{ fontSize: 10, fontWeight: 600, color: "#166534", textTransform: "uppercase", letterSpacing: 0.4 }}>{lesson.paid ? "Paid" : "Owed"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>£{lesson.price}</div>
          <div style={{ fontSize: 10, color: "#166534", marginTop: 2 }}>{lesson.postcode}</div>
        </BentoCell>
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 10 }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function BentoCell({ children, bg, rowSpan }: { children: React.ReactNode; bg: string; rowSpan?: number }) {
  return (
    <div style={{
      background: bg, borderRadius: 12, padding: 12, gridRow: rowSpan ? `span ${rowSpan}` : undefined,
      display: "flex", flexDirection: "column", minHeight: 80,
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// V19 · Live Aurora — Live Card vibe with multi-stop aurora gradient.
// ---------------------------------------------------------------------------
function V19LiveAurora() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(120% 80% at 0% 0%, #DBEAFE 0%, transparent 55%), " +
        "radial-gradient(100% 70% at 100% 0%, #FCE7F3 0%, transparent 60%), " +
        "radial-gradient(140% 100% at 50% 120%, #DCFCE7 0%, transparent 55%), #FFFFFF",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#0F172A" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#EC4899", boxShadow: "0 0 0 4px rgba(236,72,153,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.7 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#64748B" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#EC4899,#3D55A1)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <Mini icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <Mini icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <Mini icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14 }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V20 · Live Sunrise — warm dawn gradient, perfect for early lessons.
// ---------------------------------------------------------------------------
function V20LiveSunrise() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background: "linear-gradient(135deg, #FFE4C4 0%, #FFF1E0 40%, #FFFFFF 100%)",
      border: "0.5px solid #F4D5B0",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#9A3412" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#F97316", boxShadow: "0 0 0 4px rgba(249,115,22,0.2)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9A3412", textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#9A3412" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#9A3412" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <MiniWarm icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <MiniWarm icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <MiniWarm icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14, background: "#EA580C" }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function MiniWarm({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.75)", border: "0.5px solid #F4D5B0", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#EA580C" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "#9A3412", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V21 · Live Mesh Dark — dark mesh gradient with glassy mini tiles.
// ---------------------------------------------------------------------------
function V21LiveMeshDark() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden", color: "#FFF",
      background:
        "radial-gradient(80% 60% at 0% 0%, rgba(61,85,161,0.55) 0%, transparent 60%), " +
        "radial-gradient(70% 60% at 100% 100%, rgba(124,58,237,0.45) 0%, transparent 60%), " +
        "linear-gradient(180deg, #0B1220 0%, #0F172A 100%)",
      boxShadow: "0 16px 40px -16px rgba(11,18,32,0.6)",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#34D399", boxShadow: "0 0 0 4px rgba(52,211,153,0.25)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, opacity: 0.75 }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.18)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, backdropFilter: "blur(8px)" }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <MiniGlass icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <MiniGlass icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <MiniGlass icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14, background: "#FFF", color: "#0F172A" }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function MiniGlass({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.16)", borderRadius: 10, padding: "8px 6px", textAlign: "center", backdropFilter: "blur(8px)" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#A5B4FC" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#FFF", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V22 · Live Mint — fresh mint/sky gradient with tinted tiles.
// ---------------------------------------------------------------------------
function V22LiveMint() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(120% 80% at 100% 0%, #CFFAFE 0%, transparent 55%), " +
        "linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%)",
      border: "0.5px solid #BAE6FD",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#0F766E" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#10B981", boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#0F766E", textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#0F766E" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#10B981,#0EA5E9)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#0F766E" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <MiniMint icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <MiniMint icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <MiniMint icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14, background: "#0EA5E9" }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function MiniMint({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.78)", border: "0.5px solid #BAE6FD", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#0EA5E9" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "#0F766E", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V23 · Live + Map — Live Card with a slim static map strip on top.
// ---------------------------------------------------------------------------
function V23LivePlusMap() {
  return (
    <div style={{
      borderRadius: 18, fontFamily: iosFont, overflow: "hidden",
      background: "radial-gradient(120% 80% at 0% 0%, #DCEAFE 0%, #FFFFFF 55%)",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{
        height: 70, position: "relative",
        background: "linear-gradient(135deg, #C7D7F5 0%, #B5C7EE 60%, #A0B4E2 100%)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 18px)" }} />
        <div style={{ position: "absolute", left: 14, top: 12, fontSize: 10, fontWeight: 700, color: "#1F2A4A", textTransform: "uppercase", letterSpacing: 0.6, background: "rgba(255,255,255,0.85)", padding: "3px 7px", borderRadius: 999 }}>
          Live · in {lesson.minutesUntil}m
        </div>
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#1F2A4A", background: "rgba(255,255,255,0.85)", padding: "4px 8px", borderRadius: 999 }}>
          <Navigation size={11} /> {lesson.etaMinutes}m
        </div>
        <MapPin size={20} color="#B23A3F" strokeWidth={2.4} fill="#fff" style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%,-50%)" }} />
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
          <span style={{ fontSize: 12, color: "#64748B" }}>→ {lesson.endTime}</span>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: "#3D55A1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{lesson.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>{lesson.lessonType} · {lesson.postcode}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={btnSecondary}><Phone size={14} /></button>
          <button style={btnSecondary}><MessageSquare size={14} /></button>
          <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V24 · Live Twilight — deep blue→violet ambient with progress sparkline.
// ---------------------------------------------------------------------------
function V24LiveTwilight() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden", color: "#FFF",
      background:
        "radial-gradient(110% 70% at 0% 100%, rgba(236,72,153,0.35) 0%, transparent 60%), " +
        "radial-gradient(120% 80% at 100% 0%, rgba(56,189,248,0.35) 0%, transparent 60%), " +
        "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#FBBF24", boxShadow: "0 0 0 4px rgba(251,191,36,0.25)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, opacity: 0.7 }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>{lesson.pupilName}</div>
      <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>{lesson.lessonType} · £{lesson.price} · {lesson.postcode}</div>
      {/* progress sparkline / countdown rail */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.7, marginBottom: 4 }}>
          <span>now</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{lesson.startTime}</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
          <div style={{
            width: `${Math.max(6, 100 - (lesson.minutesUntil / 60) * 100)}%`,
            height: "100%",
            background: "linear-gradient(90deg, #38BDF8, #FBBF24, #EC4899)",
          }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button style={glassBtn}><Phone size={14} /></button>
        <button style={glassBtn}><MessageSquare size={14} /></button>
        <button style={{ ...glassBtn, flex: 1, background: "#FFF", color: "#1E1B4B", fontWeight: 700 }}>
          <Navigation size={14} /> Navigate
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V25 · Live Slate — neutral slate-blue ambient, premium and quiet.
// ---------------------------------------------------------------------------
function V25LiveSlate() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(120% 80% at 100% 0%, #E2E8F0 0%, transparent 55%), " +
        "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
      border: "0.5px solid #E2E8F0",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#475569" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#475569", boxShadow: "0 0 0 4px rgba(71,85,105,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#64748B" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "#0F172A", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <MiniSlate icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <MiniSlate icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <MiniSlate icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14, background: "#0F172A" }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function MiniSlate({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#475569" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V26 · Live Brand — uses the instructor primary blue as the ambient wash.
// ---------------------------------------------------------------------------
function V26LiveBrand() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(110% 70% at 0% 0%, rgba(61,85,161,0.18) 0%, transparent 60%), " +
        "radial-gradient(120% 80% at 100% 100%, rgba(61,85,161,0.12) 0%, transparent 60%), #FFFFFF",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#3D55A1" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px rgba(61,85,161,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#3D55A1" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "#3D55A1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#3D55A1" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <MiniBrand icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <MiniBrand icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <MiniBrand icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14 }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function MiniBrand({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "#EDF2FE", border: "0.5px solid rgba(61,85,161,0.18)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#3D55A1" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V27 · Live Rose — soft rose/peach ambient, warm without being loud.
// ---------------------------------------------------------------------------
function V27LiveRose() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(120% 80% at 0% 0%, #FCE7F3 0%, transparent 55%), " +
        "radial-gradient(100% 70% at 100% 100%, #FFE4E6 0%, transparent 55%), #FFFFFF",
      border: "0.5px solid #FBCFE8",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#9D174D" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#EC4899", boxShadow: "0 0 0 4px rgba(236,72,153,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9D174D", textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#9D174D" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#EC4899,#F43F5E)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#9D174D" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <MiniRose icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <MiniRose icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <MiniRose icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14, background: "#EC4899" }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function MiniRose({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.78)", border: "0.5px solid #FBCFE8", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#EC4899" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "#9D174D", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V28 · Live Vertical — Live Card with stacked metric rows instead of grid.
// ---------------------------------------------------------------------------
function V28LiveVertical() {
  const rows = [
    { icon: <MapPin size={13} color="#3D55A1" />, label: "Pickup", value: lesson.pickup.split(",")[0] + " · " + lesson.postcode },
    { icon: <Route size={13} color="#3D55A1" />, label: "Distance", value: `${lesson.distanceMiles} miles` },
    { icon: <Clock size={13} color="#3D55A1" />, label: "Travel time", value: `${lesson.etaMinutes} min` },
    { icon: <PoundSterling size={13} color="#16A34A" />, label: "Status", value: lesson.paid ? `Paid · £${lesson.price}` : `Unpaid · £${lesson.price}` },
  ];
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background: "radial-gradient(120% 80% at 0% 0%, #DCEAFE 0%, #FFFFFF 55%)",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#3D55A1" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px rgba(61,85,161,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.7 }}>Next lesson</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#64748B" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginTop: 12 }}>{lesson.pupilName}</div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{lesson.lessonType}</div>
      <div style={{ marginTop: 12, background: "rgba(255,255,255,0.7)", border: "0.5px solid #E5E5EA", borderRadius: 12 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 12px", borderBottom: i < rows.length - 1 ? "0.5px solid #E5E5EA" : "none", gap: 10 }}>
            {r.icon}
            <span style={{ fontSize: 12, color: "#64748B", flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{r.value}</span>
          </div>
        ))}
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14 }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V29 · Live Forecast — Live Card with weather woven into the gradient.
// ---------------------------------------------------------------------------
function V29LiveForecast() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(120% 80% at 0% 0%, #E0F2FE 0%, transparent 55%), " +
        "radial-gradient(120% 90% at 100% 100%, #DBEAFE 0%, transparent 60%), " +
        "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
      border: "0.5px solid #BFDBFE",
    }}>
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#1D4ED8" }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#1D4ED8", boxShadow: "0 0 0 4px rgba(29,78,216,0.18)" }} />
        Live · {lesson.minutesUntil}m
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: 0.6 }}>Next lesson · {lesson.weather}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</span>
        <span style={{ fontSize: 13, color: "#64748B" }}>→ {lesson.endTime}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#1D4ED8,#0EA5E9)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#1D4ED8" }}>{lesson.lessonType}</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <MiniForecast icon={<MapPin size={12} />} top={lesson.postcode} bottom="Pickup" />
        <MiniForecast icon={<Route size={12} />} top={`${lesson.distanceMiles}mi`} bottom="Distance" />
        <MiniForecast icon={<Clock size={12} />} top={`${lesson.etaMinutes}m`} bottom="ETA" />
      </div>
      <button style={{ ...btnPrimary, width: "100%", marginTop: 14, background: "#1D4ED8" }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}
function MiniForecast({ icon, top, bottom }: { icon: React.ReactNode; top: string; bottom: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.8)", border: "0.5px solid #BFDBFE", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", color: "#1D4ED8" }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{top}</div>
      <div style={{ fontSize: 9, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: 0.6 }}>{bottom}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V30 · Live Pro — Live Card with avatar hero + ETA pill, large CTA pair.
// ---------------------------------------------------------------------------
function V30LivePro() {
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 18, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(110% 70% at 100% 0%, #DCEAFE 0%, transparent 60%), " +
        "radial-gradient(120% 80% at 0% 100%, #F1F5F9 0%, transparent 60%), #FFFFFF",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px rgba(61,85,161,0.18)" }} />
            Live · in {lesson.minutesUntil}m
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 6 }}>{lesson.startTime}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{lesson.durationMins}m · ends {lesson.endTime}</div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 999,
          background: "linear-gradient(135deg,#3D55A1,#7C8DD6)",
          color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 18,
        }}>{lesson.initials}</div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>{lesson.lessonType} · £{lesson.price}{lesson.paid ? " · paid" : ""}</div>
      </div>
      <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.75)", border: "0.5px solid #E5E5EA", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <MapPin size={14} color="#3D55A1" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.pickup}</div>
          <div style={{ fontSize: 10, color: "#64748B" }}>{lesson.postcode} · {lesson.distanceMiles}mi</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#3D55A1", background: "#EDF2FE", padding: "4px 10px", borderRadius: 999 }}>
          {lesson.etaMinutes}m
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V31 · Live Brief — Live Card ambient + checklist rows underneath.
// ---------------------------------------------------------------------------
function V31LiveBrief() {
  const items = [
    { icon: <PoundSterling size={13} />, label: "Pupil paid", value: "£" + lesson.price, ok: lesson.paid },
    { icon: <Route size={13} />,         label: "Travel time", value: `${lesson.etaMinutes}m · ${lesson.distanceMiles}mi`, ok: true },
    { icon: <Clock size={13} />,         label: "Weather", value: lesson.weather, ok: true },
  ];
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 16, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(120% 70% at 100% 0%, #DBEAFE 0%, transparent 55%), " +
        "radial-gradient(120% 70% at 0% 100%, #DCFCE7 0%, transparent 55%), #FFFFFF",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#10B981", boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }} />
            Live brief · in {lesson.minutesUntil}m
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: -0.8, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 6 }}>{lesson.startTime}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{lesson.pupilName} · {lesson.lessonType}</div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 999,
          background: "linear-gradient(135deg,#3D55A1,#7C8DD6)",
          color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 16,
        }}>{lesson.initials}</div>
      </div>
      <div style={{ marginTop: 12, background: "rgba(255,255,255,0.7)", border: "0.5px solid #E5E5EA", borderRadius: 12, padding: "4px 12px", backdropFilter: "blur(6px)" }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#0F172A" }}>
              <CheckCircle2 size={14} color={it.ok ? "#16A34A" : "#94A3B8"} />
              <span style={{ color: "#475569" }}>{it.icon}</span>
              {it.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate · {lesson.postcode}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V32 · Live Brief Dark — glassy dark surface with checklist chips.
// ---------------------------------------------------------------------------
function V32LiveBriefDark() {
  const items = [
    { label: "Paid", value: "£" + lesson.price, ok: lesson.paid },
    { label: "Travel", value: `${lesson.etaMinutes}m`, ok: true },
    { label: "Weather", value: lesson.weather, ok: true },
    { label: "Pickup", value: lesson.postcode, ok: true },
  ];
  return (
    <div style={{
      position: "relative", borderRadius: 18, padding: 16, fontFamily: iosFont, overflow: "hidden", color: "#FFF",
      background:
        "radial-gradient(120% 70% at 0% 0%, rgba(61,85,161,0.55) 0%, transparent 55%), " +
        "radial-gradient(120% 80% at 100% 100%, rgba(124,58,237,0.45) 0%, transparent 60%), #0B1220",
      border: "0.5px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6, color: "#A5B4FC" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#34D399", boxShadow: "0 0 0 4px rgba(52,211,153,0.22)" }} />
          Live brief
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#CBD5E1", fontVariantNumeric: "tabular-nums" }}>in {lesson.minutesUntil}m</span>
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{lesson.startTime}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{lesson.lessonType}</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 999, background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14,
        }}>{lesson.initials}</div>
      </div>
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 10px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.85 }}>
              <CheckCircle2 size={12} color={it.ok ? "#34D399" : "#94A3B8"} />
              {it.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <button style={{
        marginTop: 12, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "10px 14px", borderRadius: 12, background: "#FFFFFF", color: "#0F172A",
        fontWeight: 600, fontSize: 13, border: "none",
      }}>
        <Navigation size={14} /> Navigate
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V33 · Live Brief Compact — single ambient card with inline check chips.
// ---------------------------------------------------------------------------
function V33LiveBriefCompact() {
  const chips = [
    { label: "Paid £" + lesson.price, ok: lesson.paid },
    { label: lesson.etaMinutes + "m drive", ok: true },
    { label: lesson.weather, ok: true },
  ];
  return (
    <div style={{
      position: "relative", borderRadius: 16, padding: 14, fontFamily: iosFont, overflow: "hidden",
      background:
        "radial-gradient(120% 70% at 100% 0%, #FCE7F3 0%, transparent 55%), " +
        "radial-gradient(120% 70% at 0% 100%, #DBEAFE 0%, transparent 55%), #FFFFFF",
      border: "0.5px solid #E5E5EA",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#EC4899", boxShadow: "0 0 0 4px rgba(236,72,153,0.18)" }} />
          Live brief · {lesson.startTime}
        </span>
        <span style={{ fontSize: 11, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>in {lesson.minutesUntil}m</span>
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 999, background: "linear-gradient(135deg,#3D55A1,#7C8DD6)",
          color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>{lesson.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lesson.pupilName}</div>
          <div style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.pickup}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {chips.map((c, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 9px", borderRadius: 999,
            background: "rgba(255,255,255,0.75)", border: "0.5px solid #E5E5EA",
            fontSize: 11, fontWeight: 600, color: "#0F172A",
          }}>
            <CheckCircle2 size={11} color={c.ok ? "#16A34A" : "#94A3B8"} />
            {c.label}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V34 · Live Brief Pro — split: ambient hero on top, brief checklist bottom.
// ---------------------------------------------------------------------------
function V34LiveBriefPro() {
  const items = [
    { icon: <PoundSterling size={13} color="#16A34A" />, label: "Payment",   value: lesson.paid ? "Paid · £" + lesson.price : "Outstanding" },
    { icon: <Car size={13} color="#3D55A1" />,           label: "Vehicle",   value: "Ready" },
    { icon: <Route size={13} color="#3D55A1" />,         label: "Travel",    value: `${lesson.etaMinutes}m · ${lesson.distanceMiles}mi` },
    { icon: <MapPin size={13} color="#3D55A1" />,        label: "Pickup",    value: lesson.postcode },
  ];
  return (
    <div style={{
      borderRadius: 18, fontFamily: iosFont, overflow: "hidden",
      border: "0.5px solid #E5E5EA", background: "#FFFFFF",
    }}>
      <div style={{
        position: "relative", padding: 16,
        background:
          "radial-gradient(120% 70% at 100% 0%, #DBEAFE 0%, transparent 55%), " +
          "radial-gradient(120% 70% at 0% 100%, #EDE9FE 0%, transparent 55%), #F8FAFC",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px rgba(61,85,161,0.18)" }} />
              Live · in {lesson.minutesUntil}m
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#0F172A", letterSpacing: -0.8, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 6 }}>{lesson.startTime}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 6 }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{lesson.lessonType}</div>
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: 999, background: "linear-gradient(135deg,#3D55A1,#7C8DD6)",
            color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17,
          }}>{lesson.initials}</div>
        </div>
      </div>
      <div style={{ padding: "4px 14px" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", fontWeight: 500 }}>
              {it.icon}
              {it.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #F1F5F9" }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V35 · Live Brief Pro · No Map — refined hero + brief, no map strip.
// ---------------------------------------------------------------------------
function V35LiveBriefProNoMap() {
  const items = [
    { icon: <PoundSterling size={13} color="#16A34A" />, label: "Payment", value: lesson.paid ? "Paid · £" + lesson.price : "Outstanding" },
    { icon: <Car size={13} color="#3D55A1" />,           label: "Vehicle", value: "Ready" },
    { icon: <Route size={13} color="#3D55A1" />,         label: "Travel",  value: `${lesson.etaMinutes}m · ${lesson.distanceMiles}mi` },
    { icon: <MapPin size={13} color="#3D55A1" />,        label: "Pickup",  value: lesson.postcode },
  ];
  return (
    <div style={{
      borderRadius: 18, fontFamily: iosFont, overflow: "hidden",
      border: "0.5px solid #E5E5EA", background: "#FFFFFF",
      boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
    }}>
      <div style={{
        position: "relative", padding: 16,
        background:
          "radial-gradient(120% 70% at 100% 0%, #DBEAFE 0%, transparent 55%), " +
          "radial-gradient(120% 70% at 0% 100%, #EDE9FE 0%, transparent 55%), #F8FAFC",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px rgba(61,85,161,0.18)" }} />
              Live · in {lesson.minutesUntil}m
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#0F172A", letterSpacing: -0.8, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 6 }}>{lesson.startTime}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 6 }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{lesson.lessonType}</div>
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: 999, background: "linear-gradient(135deg,#3D55A1,#7C8DD6)",
            color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17,
          }}>{lesson.initials}</div>
        </div>
      </div>
      <div style={{ padding: "4px 14px" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", fontWeight: 500 }}>
              {it.icon}{it.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #F1F5F9" }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V36 · Live Brief Pro · With Map — adds a static map strip above the hero.
// ---------------------------------------------------------------------------
function V36LiveBriefProMap() {
  const items = [
    { icon: <PoundSterling size={13} color="#16A34A" />, label: "Payment", value: lesson.paid ? "Paid · £" + lesson.price : "Outstanding" },
    { icon: <Car size={13} color="#3D55A1" />,           label: "Vehicle", value: "Ready" },
    { icon: <Route size={13} color="#3D55A1" />,         label: "Travel",  value: `${lesson.etaMinutes}m · ${lesson.distanceMiles}mi` },
    { icon: <MapPin size={13} color="#3D55A1" />,        label: "Pickup",  value: lesson.postcode },
  ];
  return (
    <div style={{
      borderRadius: 18, fontFamily: iosFont, overflow: "hidden",
      border: "0.5px solid #E5E5EA", background: "#FFFFFF",
      boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
    }}>
      <div style={{
        position: "relative", height: 96,
        background:
          "linear-gradient(180deg, #DBEAFE 0%, #EDE9FE 100%), " +
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 14px)",
        borderBottom: "1px solid #E5E5EA",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 22px)",
        }} />
        <div style={{
          position: "absolute", left: "30%", top: "55%", width: 28, height: 28, borderRadius: 999,
          background: "#3D55A1", border: "3px solid #FFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 10px rgba(61,85,161,0.35)",
        }}>
          <Car size={13} color="#FFF" />
        </div>
        <div style={{
          position: "absolute", right: "20%", top: "30%", width: 24, height: 24, borderRadius: 999,
          background: "#FFF", border: "2px solid #3D55A1",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MapPin size={12} color="#3D55A1" />
        </div>
        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 11, fontWeight: 700, color: "#3D55A1", background: "rgba(255,255,255,0.9)",
          padding: "4px 9px", borderRadius: 999, border: "0.5px solid #BFDBFE",
        }}>{lesson.etaMinutes}m · {lesson.distanceMiles}mi</span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#3D55A1", boxShadow: "0 0 0 4px rgba(61,85,161,0.18)" }} />
              Live · in {lesson.minutesUntil}m
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: -0.8, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 6 }}>{lesson.startTime}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 6 }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{lesson.lessonType}</div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: 999, background: "linear-gradient(135deg,#3D55A1,#7C8DD6)",
            color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16,
          }}>{lesson.initials}</div>
        </div>
      </div>
      <div style={{ padding: "0 14px" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", fontWeight: 500 }}>
              {it.icon}{it.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #F1F5F9", marginTop: 4 }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V37 · Live Brief Pro · Dark Hero — dark gradient hero pops on light blue bg.
// ---------------------------------------------------------------------------
function V37LiveBriefProDark() {
  const items = [
    { icon: <PoundSterling size={13} color="#16A34A" />, label: "Payment", value: lesson.paid ? "Paid · £" + lesson.price : "Outstanding" },
    { icon: <Car size={13} color="#3D55A1" />,           label: "Vehicle", value: "Ready" },
    { icon: <Route size={13} color="#3D55A1" />,         label: "Travel",  value: `${lesson.etaMinutes}m · ${lesson.distanceMiles}mi` },
    { icon: <MapPin size={13} color="#3D55A1" />,        label: "Pickup",  value: lesson.postcode },
  ];
  return (
    <div style={{
      borderRadius: 18, fontFamily: iosFont, overflow: "hidden",
      border: "0.5px solid rgba(15,23,42,0.08)", background: "#FFFFFF",
      boxShadow: "0 10px 28px -14px rgba(15,23,42,0.35), 0 2px 6px rgba(15,23,42,0.06)",
    }}>
      <div style={{
        position: "relative", padding: 18, color: "#FFF",
        background:
          "radial-gradient(120% 80% at 100% 0%, rgba(124,141,214,0.45) 0%, transparent 55%), " +
          "radial-gradient(120% 80% at 0% 100%, rgba(61,85,161,0.55) 0%, transparent 60%), " +
          "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#34D399", boxShadow: "0 0 0 4px rgba(52,211,153,0.22)" }} />
              Live · in {lesson.minutesUntil}m
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 6 }}>{lesson.startTime}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{lesson.lessonType}</div>
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: 999, background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17,
          }}>{lesson.initials}</div>
        </div>
      </div>
      <div style={{ padding: "4px 14px" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", fontWeight: 500 }}>
              {it.icon}{it.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #F1F5F9" }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// V38 · Live Brief Pro · Dark + Map — dark hero with map strip; max contrast.
// ---------------------------------------------------------------------------
function V38LiveBriefProDarkMap() {
  const items = [
    { icon: <PoundSterling size={13} color="#16A34A" />, label: "Payment", value: lesson.paid ? "Paid · £" + lesson.price : "Outstanding" },
    { icon: <Car size={13} color="#3D55A1" />,           label: "Vehicle", value: "Ready" },
    { icon: <Route size={13} color="#3D55A1" />,         label: "Travel",  value: `${lesson.etaMinutes}m · ${lesson.distanceMiles}mi` },
    { icon: <MapPin size={13} color="#3D55A1" />,        label: "Pickup",  value: lesson.postcode },
  ];
  return (
    <div style={{
      borderRadius: 18, fontFamily: iosFont, overflow: "hidden",
      border: "0.5px solid rgba(15,23,42,0.08)", background: "#FFFFFF",
      boxShadow: "0 10px 28px -14px rgba(15,23,42,0.35), 0 2px 6px rgba(15,23,42,0.06)",
    }}>
      <div style={{
        position: "relative", height: 90,
        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 22px)",
        }} />
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M 20 70 Q 120 30 220 50 T 380 30" stroke="#7C8DD6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="4 4" />
        </svg>
        <div style={{
          position: "absolute", left: "10%", top: "60%", width: 24, height: 24, borderRadius: 999,
          background: "#34D399", border: "2px solid #0F172A",
          boxShadow: "0 0 0 4px rgba(52,211,153,0.25)",
        }} />
        <div style={{
          position: "absolute", right: "10%", top: "20%", width: 26, height: 26, borderRadius: 999,
          background: "#FFF", border: "2px solid #3D55A1",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MapPin size={13} color="#3D55A1" />
        </div>
        <span style={{
          position: "absolute", top: 10, left: 10,
          fontSize: 10, fontWeight: 700, color: "#A5B4FC", background: "rgba(255,255,255,0.08)",
          padding: "4px 9px", borderRadius: 999, border: "0.5px solid rgba(255,255,255,0.12)",
          textTransform: "uppercase", letterSpacing: 0.6,
        }}>Route preview</span>
      </div>
      <div style={{
        padding: 16, color: "#FFF",
        background:
          "radial-gradient(120% 80% at 0% 100%, rgba(61,85,161,0.55) 0%, transparent 60%), " +
          "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#A5B4FC", textTransform: "uppercase", letterSpacing: 0.6, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#34D399", boxShadow: "0 0 0 4px rgba(52,211,153,0.22)" }} />
              Live · in {lesson.minutesUntil}m
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.8, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 6 }}>{lesson.startTime}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{lesson.pupilName}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{lesson.lessonType}</div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: 999, background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16,
          }}>{lesson.initials}</div>
        </div>
      </div>
      <div style={{ padding: "4px 14px" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569", fontWeight: 500 }}>
              {it.icon}{it.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #F1F5F9" }}>
        <button style={btnSecondary}><Phone size={14} /> Call</button>
        <button style={btnPrimary}><Navigation size={14} /> Navigate</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const VARIANTS = [
  { id: "v1", name: "Hero Brief", desc: "Bold time, single primary CTA. Calm and editorial.", Component: V1HeroBrief },
  { id: "v2", name: "Map Hero", desc: "Static map preview anchors the destination.", Component: V2MapHero },
  { id: "v3", name: "Avatar Hero", desc: "Pupil-centric with syllabus progress bar.", Component: V3AvatarHero },
  { id: "v4", name: "Compact Strip", desc: "Single dense row — leaves room for everything else.", Component: V4CompactStrip },
  { id: "v5", name: "Glass Dark", desc: "Premium gradient + glassy chips, attention-grabbing.", Component: V5GlassDark },
  { id: "v6", name: "Timeline", desc: "Time spine on the left, address card on the right.", Component: V6Timeline },
  { id: "v7", name: "Boarding Pass", desc: "Ticket-style with notch and dashed divider.", Component: V7BoardingPass },
  { id: "v8", name: "Countdown Ring", desc: "Circular progress around minutes-until.", Component: V8CountdownRing },
  { id: "v9", name: "Split Action", desc: "Info on the left, tall navigate column on the right.", Component: V9SplitAction },
  { id: "v10", name: "Status Banner", desc: "Coloured top bar communicates state at a glance.", Component: V10StatusBanner },
  { id: "v11", name: "Editorial", desc: "Magazine pacing with serif name and stat row.", Component: V11Editorial },
  { id: "v12", name: "Live Card", desc: "Ambient gradient with live pulse and metric tiles.", Component: V12LiveCard },
  { id: "v13", name: "Stacked Cards", desc: "Primary card with a peek of the next lesson behind.", Component: V13StackedCards },
  { id: "v14", name: "Glanceable", desc: "Minimalist single-line list row, ultra-low chrome.", Component: V14Glanceable },
  { id: "v15", name: "iOS Widget", desc: "Square Lock Screen widget styling, dark surface.", Component: V15IOSWidget },
  { id: "v16", name: "Driver Brief", desc: "Pre-lesson checklist with paid / travel / weather.", Component: V16DriverBrief },
  { id: "v17", name: "Pill Header", desc: "All-pill bar with avatar dot and round CTA.", Component: V17PillHeader },
  { id: "v18", name: "Bento Grid", desc: "Equal-weight bento cells: pupil, ETA, payment.", Component: V18Bento },
  { id: "v19", name: "Live Aurora", desc: "Live Card with multi-stop pastel aurora gradient.", Component: V19LiveAurora },
  { id: "v20", name: "Live Sunrise", desc: "Warm dawn gradient — great for early lessons.", Component: V20LiveSunrise },
  { id: "v21", name: "Live Mesh Dark", desc: "Dark mesh gradient with glassy translucent tiles.", Component: V21LiveMeshDark },
  { id: "v22", name: "Live Mint", desc: "Fresh mint→sky gradient, calm and modern.", Component: V22LiveMint },
  { id: "v23", name: "Live + Map", desc: "Live Card with a slim static map strip on top.", Component: V23LivePlusMap },
  { id: "v24", name: "Live Twilight", desc: "Deep blue→violet ambient with a countdown rail.", Component: V24LiveTwilight },
  { id: "v25", name: "Live Slate", desc: "Neutral slate-blue ambient — premium and quiet.", Component: V25LiveSlate },
  { id: "v26", name: "Live Brand", desc: "Instructor primary blue as the ambient wash.", Component: V26LiveBrand },
  { id: "v27", name: "Live Rose", desc: "Soft rose/peach ambient, warm without being loud.", Component: V27LiveRose },
  { id: "v28", name: "Live Vertical", desc: "Live Card with stacked metric rows instead of a grid.", Component: V28LiveVertical },
  { id: "v29", name: "Live Forecast", desc: "Weather woven into the gradient and header.", Component: V29LiveForecast },
  { id: "v30", name: "Live Pro", desc: "Avatar hero, address strip with ETA pill, dual CTAs.", Component: V30LivePro },
  { id: "v31", name: "Live Brief", desc: "Live Card ambient + paid/travel/weather checklist.", Component: V31LiveBrief },
  { id: "v32", name: "Live Brief Dark", desc: "Glassy dark surface with a 2×2 brief grid.", Component: V32LiveBriefDark },
  { id: "v33", name: "Live Brief Compact", desc: "Single ambient card with inline check chips.", Component: V33LiveBriefCompact },
  { id: "v34", name: "Live Brief Pro", desc: "Ambient hero on top, full brief checklist beneath.", Component: V34LiveBriefPro },
  { id: "v35", name: "Brief Pro · No Map", desc: "Refined Live Brief Pro hero, no map strip.", Component: V35LiveBriefProNoMap },
  { id: "v36", name: "Brief Pro · Map", desc: "Live Brief Pro with a static map strip on top.", Component: V36LiveBriefProMap },
  { id: "v37", name: "Brief Pro · Dark", desc: "Dark gradient hero — pops on light blue backgrounds.", Component: V37LiveBriefProDark },
  { id: "v38", name: "Brief Pro · Dark + Map", desc: "Dark hero + map strip for maximum contrast on blue.", Component: V38LiveBriefProDarkMap },
];

export default function InstructorNextUpLab() {
  const [active, setActive] = useState<string>("all");
  const [bg, setBg] = useState<string>("#F4F7F6");
  const visible = active === "all" ? VARIANTS : VARIANTS.filter(v => v.id === active);
  const bgOptions = [
    { id: "neutral",   label: "Neutral",   color: "#F4F7F6" },
    { id: "lightblue", label: "Light blue", color: "#EDF2FE" },
    { id: "blue",      label: "Brand tint", color: "#DCEAFE" },
    { id: "white",     label: "White",     color: "#FFFFFF" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7F6", padding: "32px 16px 96px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Demo · sample data</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginTop: 4 }}>Next Up Tile — 6 redesigns</h1>
        <p style={{ fontSize: 14, color: "#64748B", marginTop: 6, maxWidth: 640 }}>
          Six directions for the “Up next” lesson card on the instructor home. Same data, different
          structure, hierarchy and tone. Pick a winner and we'll port it into the live screen.
        </p>

        <div style={{ display: "flex", gap: 6, margin: "20px 0 28px", flexWrap: "wrap" }}>
          {[{ id: "all", name: "All 6" }, ...VARIANTS].map(v => (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                background: active === v.id ? "#0F172A" : "#FFFFFF",
                color: active === v.id ? "#FFFFFF" : "#0F172A",
                border: "1px solid #E2E8F0",
              }}
            >
              {v.name}
            </button>
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: visible.length === 1 ? "minmax(0,420px)" : "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 24,
          justifyContent: "center",
        }}>
          {visible.map((v, idx) => {
            const C = v.Component;
            const num = VARIANTS.findIndex(x => x.id === v.id) + 1;
            return (
              <div key={v.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>V{num}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", marginTop: 2 }}>{v.name}</div>
                  </div>
                </div>
                <div style={{ background: "#F4F7F6", padding: 16, borderRadius: 14 }}>
                  <C />
                </div>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 12 }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
