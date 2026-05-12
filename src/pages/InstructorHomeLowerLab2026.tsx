import { useState } from "react";
import { PhoneFrame } from "@/components/instructor/homeLab/PhoneFrame";
import {
  L1Mosaic, L2Garden, L3Carousel, L4Command, L5Categories,
} from "@/components/instructor/homeLab/redesign2026/lowerVariants";

const VARIANTS = [
  { id: "l1", name: "Bento Mosaic",  desc: "4-col compact icon grid + bento alerts/upgrades/upcoming. Pure bento.", Component: L1Mosaic },
  { id: "l2", name: "Tile Garden",   desc: "2-col rich icon-label tiles with ‘Show all’ overflow.",                Component: L2Garden },
  { id: "l3", name: "Snap Carousel", desc: "Horizontal swipeable tools rail, gradient alerts, swipeable upgrades.", Component: L3Carousel },
  { id: "l4", name: "Command Center",desc: "Search-first with Pinned + Suggested groups and dark upgrade ad.",     Component: L4Command },
  { id: "l5", name: "Category Pills",desc: "Tools grouped by category as pill chips. Cleanest for scanability.",   Component: L5Categories },
];

export default function InstructorHomeLowerLab2026() {
  const [active, setActive] = useState("all");
  const visible = active === "all" ? VARIANTS : VARIANTS.filter((v) => v.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Demo · sample data</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginTop: 4 }}>
            Quick Access & Below — 5 Redesigns
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 6, maxWidth: 680 }}>
            Five directions for everything from Quick Access down: tools, needs-attention, upgrade promos and upcoming events.
            All match the bento system already on the home. Pick one and we'll port it into the live screen.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActive("all")} style={tabStyle(active === "all")}>All 5</button>
          {VARIANTS.map((v, i) => (
            <button key={v.id} onClick={() => setActive(v.id)} style={tabStyle(active === v.id)}>
              L{i + 1} · {v.name}
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
                <PhoneFrame label={`L${num} · ${v.name}`}>
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
