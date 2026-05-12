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
];

export default function InstructorNextUpLab() {
  const [active, setActive] = useState<string>("all");
  const visible = active === "all" ? VARIANTS : VARIANTS.filter(v => v.id === active);

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
