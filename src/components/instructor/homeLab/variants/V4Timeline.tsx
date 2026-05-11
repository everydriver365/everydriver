import { mockHome } from "../mockData";
import { Plus, Search, Wrench, MapPin, Zap, Navigation2 } from "lucide-react";

const ACCENT = "#3D55A1";
const TINT = "#EDF2FE";

// Build slots: lessons + gaps interleaved
function buildTimeline() {
  const events = [
    { type: "lesson", time: "09:30", end: "11:00", pupil: "Maya Patel", duration: 90, location: "SO22" },
    { type: "gap", time: "11:00", end: "11:15", duration: 15 },
    { type: "lesson", time: "11:15", end: "12:15", pupil: "Tom Reilly", duration: 60, location: "SO23" },
    { type: "gap", time: "12:15", end: "13:00", duration: 45 },
    { type: "lesson", time: "13:00", end: "15:00", pupil: "Olivia Chen", duration: 120, location: "SO21" },
    { type: "gap", time: "15:00", end: "16:00", duration: 60, fillable: true },
    { type: "lesson", time: "16:00", end: "17:00", pupil: "Jake Morgan", duration: 60, location: "SO22" },
  ];
  return events;
}

export function V4Timeline() {
  const m = mockHome;
  const events = buildTimeline();
  const nowIndex = 0; // before first lesson

  return (
    <div style={{ padding: "8px 0 100px", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif", position: "relative", minHeight: "100%" }}>
      {/* compact header */}
      <div style={{ padding: "6px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, color: "#64748B" }}>{m.dateLabel}</p>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.02em" }}>Today · {m.todayLessons.length} lessons</h1>
        </div>
        <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600, background: TINT, padding: "4px 10px", borderRadius: 999 }}>NOW · 08:55</span>
      </div>

      {/* timeline */}
      <div style={{ position: "relative", padding: "0 16px" }}>
        <div style={{ position: "absolute", left: 60, top: 0, bottom: 0, width: 1, background: "#E5E7EB" }} />
        {events.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "stretch", marginBottom: 8 }}>
            <div style={{ width: 44, paddingTop: 12, fontSize: 11, color: "#64748B", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{e.time}</div>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: e.type === "lesson" ? ACCENT : "#FFFFFF", border: e.type === "gap" ? "1.5px dashed #94A3B8" : "none", marginTop: 14 }} />
              {i === nowIndex && (
                <div style={{ position: "absolute", left: -16, top: 12, fontSize: 9, color: "#EF4444", fontWeight: 700 }}>●</div>
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              {e.type === "lesson" ? (
                <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "10px 12px" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{e.pupil}</p>
                  <p style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={10} /> {e.location} · {e.duration}m
                  </p>
                </div>
              ) : (
                <div style={{ background: "transparent", border: "1px dashed #CBD5E1", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>{e.duration}m gap</span>
                  {(e as any).fillable && (
                    <button style={{ fontSize: 11, color: ACCENT, fontWeight: 600, background: TINT, padding: "4px 10px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Zap size={11} /> Fill
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* floating bottom bar */}
      <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, background: "#FFFFFF", borderRadius: 22, padding: 8, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 10px 30px -10px rgba(15,23,42,0.25)" }}>
        <button style={{ flex: 1, padding: "10px 12px", background: ACCENT, color: "#FFFFFF", borderRadius: 16, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={14} /> Add lesson
        </button>
        <button style={{ width: 44, height: 44, borderRadius: 16, background: "#F2F4F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Search size={18} color="#475569" />
        </button>
        <button style={{ width: 44, height: 44, borderRadius: 16, background: "#F2F4F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wrench size={18} color="#475569" />
        </button>
      </div>
    </div>
  );
}
