import { useState } from "react";
import { PhoneFrame } from "@/components/instructor/homeLab/PhoneFrame";
import {
  V1CalmStack, V2TimelineSpine, V3Mosaic, V4Magazine, V5Command,
} from "@/components/instructor/homeLab/redesign2026/variants";
import {
  V6Focus, V7Bento, V8Story, V9Rings, V10Concierge,
} from "@/components/instructor/homeLab/redesign2026/variantsB";

const VARIANTS = [
  { id: "v1", name: "Calm Stack", desc: "Premium iOS card stack — generous whitespace, hero up next with map.", Component: V1CalmStack },
  { id: "v2", name: "Timeline Spine", desc: "Vertical day spine with bold indigo hero card. Glanceable.", Component: V2TimelineSpine },
  { id: "v3", name: "Dashboard Mosaic", desc: "KPI-first mosaic — earnings & lessons up top, hero below.", Component: V3Mosaic },
  { id: "v4", name: "Magazine", desc: "Editorial layout, soft serif headlines, calm warm background.", Component: V4Magazine },
  { id: "v5", name: "Command Bridge", desc: "Pro pilot dark-themed cockpit — info-dense, telemetry feel.", Component: V5Command },
  { id: "v6", name: "Focus Mode", desc: "Single-task hero countdown. Big, calm, one thing at a time.", Component: V6Focus },
  { id: "v7", name: "Bento Grid", desc: "Apple-style adaptive blocks — mixed sizes, glanceable mosaic.", Component: V7Bento },
  { id: "v8", name: "Story Cards", desc: "Instagram-style avatar rail + image-led hero card.", Component: V8Story },
  { id: "v9", name: "Activity Rings", desc: "Apple Watch triple-ring weekly progress hero.", Component: V9Rings },
  { id: "v10", name: "AI Concierge", desc: "Conversational header with AI brief and quick suggestion chips.", Component: V10Concierge },
];

export default function InstructorHomeRedesignLab2026() {
  const [active, setActive] = useState("all");
  const visible = active === "all" ? VARIANTS : VARIANTS.filter((v) => v.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Demo · sample data</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginTop: 4 }}>
            Instructor Mobile Home — 10 Redesigns
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 6, maxWidth: 680 }}>
            Ten fresh directions for the mobile home. All preserve current functionality
            (next lesson with live map & ETA, alerts, today's schedule, week stats, quick tools).
            Pick a direction and we'll port it into the live screen.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActive("all")} style={tabStyle(active === "all")}>All 10</button>
          {VARIANTS.map((v, i) => (
            <button key={v.id} onClick={() => setActive(v.id)} style={tabStyle(active === v.id)}>
              V{i + 1} · {v.name}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: visible.length === 1 ? "1fr" : "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 32,
            justifyItems: "center",
          }}
        >
          {visible.map((v) => {
            const C = v.Component;
            const num = VARIANTS.findIndex((x) => x.id === v.id) + 1;
            return (
              <div key={v.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <PhoneFrame label={`V${num} · ${v.name}`}>
                  <C />
                </PhoneFrame>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 10, maxWidth: 360, textAlign: "center" }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
    background: active ? "#0F172A" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#0F172A",
    border: "1px solid #E2E8F0", cursor: "pointer",
  };
}
