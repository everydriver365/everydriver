import { useState } from "react";
import { PhoneFrame } from "@/components/instructor/homeLab/PhoneFrame";
import { V1Briefing } from "@/components/instructor/homeLab/variants/V1Briefing";
import { V2Settings } from "@/components/instructor/homeLab/variants/V2Settings";
import { V3Dashboard } from "@/components/instructor/homeLab/variants/V3Dashboard";
import { V4Timeline } from "@/components/instructor/homeLab/variants/V4Timeline";
import { V5Editorial } from "@/components/instructor/homeLab/variants/V5Editorial";
import { V6Command } from "@/components/instructor/homeLab/variants/V6Command";
import { V7Cockpit } from "@/components/instructor/homeLab/variants/V7Cockpit";

const VARIANTS = [
  { id: "v1", name: "Briefing", desc: "Hero brief + condensed timeline", Component: V1Briefing },
  { id: "v2", name: "Settings", desc: "iOS grouped sections", Component: V2Settings },
  { id: "v3", name: "Dashboard", desc: "Activity rings + KPI mosaic", Component: V3Dashboard },
  { id: "v4", name: "Timeline", desc: "Vertical day with fillable gaps", Component: V4Timeline },
  { id: "v5", name: "Editorial", desc: "Magazine layout, serif headlines", Component: V5Editorial },
  { id: "v6", name: "Command", desc: "Search-first, dense info cards", Component: V6Command },
  { id: "v7", name: "Cockpit", desc: "Up Next hero + 2×2 KPI mosaic", Component: V7Cockpit },
];

export default function InstructorHomeDesignLab() {
  const [active, setActive] = useState("all");

  const visible = active === "all" ? VARIANTS : VARIANTS.filter((v) => v.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Demo · sample data</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginTop: 4 }}>Instructor Home — 6 Redesigns</h1>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 6, maxWidth: 640 }}>
            Six iOS-light professional directions for the mobile home. All preserve current functionality
            (next lesson, today's schedule, week stats, pinned tools, open slots, alerts). Pick a direction
            and we'll port it into the live screen.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          <button
            onClick={() => setActive("all")}
            style={{
              padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
              background: active === "all" ? "#0F172A" : "#FFFFFF",
              color: active === "all" ? "#FFFFFF" : "#0F172A",
              border: "1px solid #E2E8F0",
            }}
          >
            All 6
          </button>
          {VARIANTS.map((v, i) => (
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
              V{i + 1} · {v.name}
            </button>
          ))}
        </div>

        {/* Grid of phones */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: visible.length === 1 ? "1fr" : "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 32,
            justifyItems: "center",
          }}
        >
          {visible.map((v, idx) => {
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
