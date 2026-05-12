import { useState } from "react";
import { PhoneFrame } from "@/components/instructor/homeLab/PhoneFrame";
import {
  A1StatTriad, A2PriorityHero, A3ChipCluster, A4Timeline,
  A5TwoColumn, A6BannerStack, A7Inbox,
  A8Carousel, A9ScoreRing, A10AIBrief, A11Tabbed, A12FocusSnooze, A13Ticker,
} from "@/components/instructor/homeLab/redesign2026/attentionVariants";

const VARIANTS = [
  { id: "a1", name: "Stat Triad",     desc: "3-up KPI tiles + top 2 rows. Glanceable totals first.",            Component: A1StatTriad },
  { id: "a2", name: "Priority Hero",  desc: "Bold red gradient hero for top item, then condensed list.",         Component: A2PriorityHero },
  { id: "a3", name: "Chip Cluster",   desc: "Compact pill chips with count badges. Most space efficient.",        Component: A3ChipCluster },
  { id: "a4", name: "Timeline Spine", desc: "Vertical spine with coloured dots. Reads like a feed.",              Component: A4Timeline },
  { id: "a5", name: "Two Column",     desc: "Side-by-side Urgent / To-do mini cards. Bento inside bento.",        Component: A5TwoColumn },
  { id: "a6", name: "Banner Stack",   desc: "Standalone left-bordered alert banners. No outer card.",             Component: A6BannerStack },
  { id: "a7", name: "Inbox Style",    desc: "Mail-style rows with unread dots. Familiar, ultra dense.",           Component: A7Inbox },
  { id: "a8", name: "Swipe Carousel", desc: "Horizontal swipeable cards, one per item with Resolve CTA.",         Component: A8Carousel },
  { id: "a9", name: "Score Ring",     desc: "Apple-style ring showing urgent ratio + condensed list.",            Component: A9ScoreRing },
  { id: "a10", name: "AI Brief",      desc: "Dark concierge header with AI-written summary + action shortcuts.",  Component: A10AIBrief },
  { id: "a11", name: "Tabbed",        desc: "Urgent / To-do / Done tabs with bulk-resolve CTA.",                  Component: A11Tabbed },
  { id: "a12", name: "Focus + Snooze", desc: "Single most-important item with Resolve & Snooze actions.",         Component: A12FocusSnooze },
  { id: "a13", name: "Status Ticker", desc: "Slim status bar + scrollable chip ticker. Lowest visual weight.",    Component: A13Ticker },
];

export default function InstructorAttentionLab2026() {
  const [active, setActive] = useState("all");
  const visible = active === "all" ? VARIANTS : VARIANTS.filter((v) => v.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Demo · sample data</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginTop: 4 }}>
            Needs Attention — 13 Redesigns
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", marginTop: 6, maxWidth: 680 }}>
            Seven directions for the Needs Attention tile. All keep the same data
            (urgent + to-do rows with counts) and match the bento system in use on the home.
            Pick one and we'll port it into the live mobile home.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActive("all")} style={tab(active === "all")}>All 13</button>
          {VARIANTS.map((v, i) => (
            <button key={v.id} onClick={() => setActive(v.id)} style={tab(active === v.id)}>
              A{i + 1} · {v.name}
            </button>
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: visible.length === 1 ? "1fr" : "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 32, justifyItems: "center",
        }}>
          {visible.map((v) => {
            const C = v.Component;
            const num = VARIANTS.findIndex((x) => x.id === v.id) + 1;
            return (
              <div key={v.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <PhoneFrame label={`A${num} · ${v.name}`}>
                  <div style={{ padding: "16px 14px" }}>
                    <C />
                  </div>
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

function tab(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
    background: active ? "#0F172A" : "#FFFFFF",
    color: active ? "#FFFFFF" : "#0F172A",
    border: "1px solid #E2E8F0", cursor: "pointer",
  };
}
