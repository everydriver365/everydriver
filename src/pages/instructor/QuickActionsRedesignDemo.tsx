import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Plus,
  PoundSterling,
  Car,
  Heart,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * DSM brand: red #E02020, blue #2255FF, navy #0F1B2D
 * Round 2 — gradient-led, bold, iOS premium. No more flat white squares.
 */

const DSM = {
  red: "#E02020",
  redLight: "#FF5A5A",
  redDeep: "#9B0E0E",
  blue: "#2255FF",
  blueLight: "#5C82FF",
  blueDeep: "#0E2BAA",
  navy: "#0F1B2D",
  navy2: "#1B2840",
  light: "#EEF1F5",
  white: "#FFFFFF",
  muted: "#7A8FAA",
};

interface ActionItem {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  /** which DSM accent the tile leans toward */
  tone: "red" | "blue" | "navy" | "mix";
  status?: string;
}

const actions: ActionItem[] = [
  { id: "fill-gaps", label: "Fill gaps", subtitle: "Schedule gaps", icon: Calendar, tone: "blue", status: "3 open" },
  { id: "track-live", label: "Track live", subtitle: "GPS tracking", icon: MapPin, tone: "red", status: "Active" },
  { id: "add-lesson", label: "Add lesson", subtitle: "New booking", icon: Plus, tone: "mix" },
  { id: "take-payment", label: "Take payment", subtitle: "Record payment", icon: PoundSterling, tone: "navy", status: "Secure" },
  { id: "find-my-car", label: "Find my car", subtitle: "Car location", icon: Car, tone: "blue", status: "12m" },
  { id: "health-hub", label: "Health hub", subtitle: "Wellness tips", icon: Heart, tone: "red" },
  { id: "test-swap", label: "Test swap", subtitle: "Swap a test", icon: Calendar, tone: "navy", status: "2 pending" },
  { id: "find-nearby", label: "Find nearby", subtitle: "Toilets & food", icon: MapPin, tone: "mix" },
];

const grad = (t: ActionItem["tone"]) => {
  switch (t) {
    case "red":
      return `linear-gradient(135deg, ${DSM.redLight}, ${DSM.red} 60%, ${DSM.redDeep})`;
    case "blue":
      return `linear-gradient(135deg, ${DSM.blueLight}, ${DSM.blue} 60%, ${DSM.blueDeep})`;
    case "navy":
      return `linear-gradient(135deg, ${DSM.navy2}, ${DSM.navy})`;
    case "mix":
    default:
      return `linear-gradient(135deg, ${DSM.blue}, ${DSM.red})`;
  }
};

const SF = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', Inter, sans-serif" };

/* ============================================================
 * 1. Full-bleed Gradient Tiles (every tile a gradient)
 * ============================================================ */
function V1_FullBleedGradient() {
  return (
    <div className="rounded-3xl p-4" style={{ ...SF, background: DSM.navy }}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="rounded-3xl p-4 flex flex-col items-start text-left active:scale-[0.96] transition-transform shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden h-[120px]"
              style={{ background: grad(a.tone) }}
            >
              <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10 blur-xl" />
              <div className="relative z-10 size-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-auto">
                <Icon size={20} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="relative z-10">
                <div className="text-[15px] font-bold text-white leading-tight">{a.label}</div>
                <div className="text-[12px] text-white/80 mt-0.5">{a.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 2. Gradient Border (light interior, glowing brand stroke)
 * ============================================================ */
function V2_GradientBorder() {
  return (
    <div className="rounded-3xl p-4 bg-[#F4F6FA]" style={SF}>
      <h3 className="text-[22px] font-bold tracking-tight text-[#0F1B2D] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="rounded-2xl p-[1.5px]" style={{ background: grad(a.tone) }}>
              <button className="bg-white rounded-[14px] p-3.5 flex items-center gap-3 w-full text-left active:scale-[0.97] transition-transform">
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: grad(a.tone) }}>
                  <Icon size={18} strokeWidth={2.4} color="#fff" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[#0F1B2D] truncate">{a.label}</div>
                  <div className="text-[11px] text-[#7A8FAA] truncate">{a.subtitle}</div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 3. Glassmorphism on Brand Backdrop
 * ============================================================ */
function V3_GlassOnBrand() {
  return (
    <div
      className="rounded-3xl p-4 relative overflow-hidden"
      style={{ ...SF, background: `linear-gradient(135deg, ${DSM.blueDeep}, ${DSM.blue} 50%, ${DSM.red})` }}
    >
      <div className="absolute -top-20 -left-20 size-64 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 size-64 rounded-full bg-white/10 blur-3xl" />
      <h3 className="relative text-[13px] font-bold uppercase tracking-widest text-white/80 mb-3 px-1">Quick actions</h3>
      <div className="relative grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform bg-white/15 backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
            >
              <div className="size-10 rounded-full flex items-center justify-center mb-3 bg-white/25 border border-white/40">
                <Icon size={18} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="text-[14px] font-bold text-white leading-tight">{a.label}</div>
              <div className="text-[11px] text-white/75 mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 4. Aurora / Mesh Gradient Cards
 * ============================================================ */
function V4_AuroraMesh() {
  const meshes = [
    `radial-gradient(at 20% 20%, ${DSM.blueLight} 0%, transparent 50%), radial-gradient(at 80% 80%, ${DSM.red} 0%, transparent 50%), ${DSM.navy}`,
    `radial-gradient(at 80% 20%, ${DSM.red} 0%, transparent 50%), radial-gradient(at 20% 80%, ${DSM.blue} 0%, transparent 50%), ${DSM.navy}`,
    `radial-gradient(at 50% 0%, ${DSM.blue} 0%, transparent 60%), radial-gradient(at 50% 100%, ${DSM.redDeep} 0%, transparent 60%), ${DSM.navy}`,
    `radial-gradient(at 0% 50%, ${DSM.red} 0%, transparent 60%), radial-gradient(at 100% 50%, ${DSM.blueLight} 0%, transparent 60%), ${DSM.navy}`,
  ];
  return (
    <div className="rounded-3xl p-4 bg-[#0B1422]" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="rounded-3xl p-4 flex flex-col items-start text-left active:scale-[0.96] transition-transform h-[120px] relative overflow-hidden border border-white/10 shadow-xl"
              style={{ background: meshes[i % meshes.length] }}
            >
              <div className="size-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-auto border border-white/20">
                <Icon size={20} strokeWidth={2.4} color="#fff" />
              </div>
              <div>
                <div className="text-[15px] font-bold text-white leading-tight">{a.label}</div>
                <div className="text-[11px] text-white/80 mt-0.5">{a.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 5. Hero Gradient Header + Floating Tiles
 * ============================================================ */
function V5_HeroHeader() {
  return (
    <div className="rounded-3xl overflow-hidden bg-[#F4F6FA]" style={SF}>
      <div
        className="px-5 pt-5 pb-8 relative"
        style={{ background: `linear-gradient(135deg, ${DSM.blueDeep}, ${DSM.blue} 55%, ${DSM.red})` }}
      >
        <div className="absolute top-0 right-0 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 flex items-center gap-1.5">
            <Sparkles size={12} /> Today
          </div>
          <h2 className="text-[24px] font-bold text-white tracking-tight mt-0.5">Quick actions</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 -mt-6 relative">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="bg-white rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform shadow-[0_8px_24px_-12px_rgba(15,27,45,0.25)]"
            >
              <div className="size-10 rounded-2xl flex items-center justify-center mb-3 shadow-md" style={{ background: grad(a.tone) }}>
                <Icon size={18} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="text-[14px] font-semibold text-[#0F1B2D] leading-tight">{a.label}</div>
              <div className="text-[11px] text-[#7A8FAA] mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 6. Bento Mosaic (mixed tile sizes, gradient hero)
 * ============================================================ */
function V6_Bento() {
  const [hero, ...rest] = actions;
  const HIcon = hero.icon;
  return (
    <div className="rounded-3xl p-3 bg-[#0F1B2D]" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3 px-2 pt-1">Quick actions</h3>
      <div className="grid grid-cols-3 gap-2.5 auto-rows-[88px]">
        {/* Hero — spans 2 cols, 2 rows */}
        <button
          className="col-span-2 row-span-2 rounded-2xl p-4 flex flex-col justify-between text-left active:scale-[0.97] transition-transform relative overflow-hidden shadow-xl"
          style={{ background: `linear-gradient(135deg, ${DSM.blue}, ${DSM.red})` }}
        >
          <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-white/15 blur-2xl" />
          <div className="size-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <HIcon size={24} strokeWidth={2.4} color="#fff" />
          </div>
          <div>
            <div className="text-[18px] font-bold text-white">{hero.label}</div>
            <div className="text-[12px] text-white/80">{hero.subtitle}</div>
          </div>
        </button>
        {rest.slice(0, 6).map((a, i) => {
          const Icon = a.icon;
          // Some tiles are wide (col-span-2) for variety
          const wide = i === 1 || i === 4;
          return (
            <button
              key={a.id}
              className={`${wide ? "col-span-2" : ""} rounded-2xl p-3 flex flex-col justify-between text-left active:scale-[0.96] transition-transform border border-white/10`}
              style={{ background: grad(a.tone) }}
            >
              <div className="size-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Icon size={14} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="text-[12px] font-bold text-white leading-tight">{a.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 7. Neumorphic Brand (deep navy, soft inner shadows + accent)
 * ============================================================ */
function V7_Neumorphic() {
  return (
    <div className="rounded-3xl p-4" style={{ ...SF, background: "#1A2438" }}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/40 mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform"
              style={{
                background: "#1A2438",
                boxShadow:
                  "8px 8px 16px rgba(0,0,0,0.45), -4px -4px 12px rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="size-11 rounded-full flex items-center justify-center mb-3"
                style={{ background: grad(a.tone), boxShadow: `0 6px 18px -4px ${a.tone === "red" ? DSM.red : DSM.blue}80` }}
              >
                <Icon size={19} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="text-[14px] font-bold text-white leading-tight">{a.label}</div>
              <div className="text-[11px] text-white/55 mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 8. Animated Conic Gradient Ring (icon ring glow)
 * ============================================================ */
function V8_ConicRing() {
  return (
    <div className="rounded-3xl p-4 bg-[#F4F6FA]" style={SF}>
      <h3 className="text-[22px] font-bold tracking-tight text-[#0F1B2D] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="bg-white rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform shadow-[0_2px_8px_rgba(15,27,45,0.06)]"
            >
              <div
                className="size-12 rounded-full p-[2px] mb-3"
                style={{
                  background: `conic-gradient(from 180deg, ${DSM.blue}, ${DSM.red}, ${DSM.blue})`,
                }}
              >
                <div className="size-full rounded-full bg-white flex items-center justify-center">
                  <Icon size={18} strokeWidth={2.4} style={{ color: a.tone === "red" ? DSM.red : DSM.blue }} />
                </div>
              </div>
              <div className="text-[14px] font-semibold text-[#0F1B2D] leading-tight">{a.label}</div>
              <div className="text-[11px] text-[#7A8FAA] mt-0.5">{a.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 9. Gradient Underline / Top Accent Bar
 * ============================================================ */
function V9_TopAccent() {
  return (
    <div className="rounded-3xl p-4 bg-[#F4F6FA]" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7A8FAA] mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="bg-white rounded-2xl overflow-hidden flex flex-col items-start text-left active:scale-[0.97] transition-transform shadow-[0_2px_8px_rgba(15,27,45,0.06)]"
            >
              <div className="h-1.5 w-full" style={{ background: grad(a.tone) }} />
              <div className="p-4 w-full">
                <div className="size-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: grad(a.tone) }}>
                  <Icon size={18} strokeWidth={2.4} color="#fff" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-[#0F1B2D] leading-tight">{a.label}</div>
                    <div className="text-[11px] text-[#7A8FAA] mt-0.5">{a.subtitle}</div>
                  </div>
                  {a.status && (
                    <ChevronRight size={14} className="text-[#C7CDD6]" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 10. Diagonal Split (brand gradient slash across each tile)
 * ============================================================ */
function V10_DiagonalSplit() {
  return (
    <div className="rounded-3xl p-4 bg-[#0F1B2D]" style={SF}>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white/50 mb-3 px-1">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="rounded-2xl p-4 flex flex-col items-start text-left active:scale-[0.97] transition-transform relative overflow-hidden h-[120px] border border-white/10"
              style={{
                background: `linear-gradient(135deg, ${DSM.navy2} 0%, ${DSM.navy2} 55%, ${a.tone === "red" ? DSM.red : a.tone === "blue" ? DSM.blue : DSM.blueDeep} 130%)`,
              }}
            >
              {/* diagonal accent slash */}
              <div
                className="absolute -right-10 -bottom-10 size-32 opacity-40"
                style={{
                  background: grad(a.tone),
                  clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
                  filter: "blur(8px)",
                }}
              />
              <div className="relative size-10 rounded-2xl flex items-center justify-center mb-auto" style={{ background: grad(a.tone), boxShadow: `0 8px 20px -6px ${a.tone === "red" ? DSM.red : DSM.blue}` }}>
                <Icon size={18} strokeWidth={2.4} color="#fff" />
              </div>
              <div className="relative">
                <div className="text-[15px] font-bold text-white leading-tight">{a.label}</div>
                <div className="text-[11px] text-white/70 mt-0.5">{a.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 *  PAGE
 * ============================================================ */
export default function QuickActionsRedesignDemo() {
  const navigate = useNavigate();

  const variants = [
    { n: 1, title: "Full-bleed Gradient Tiles", desc: "Every tile is a brand gradient with soft inner glow. Bold and premium.", C: V1_FullBleedGradient },
    { n: 2, title: "Gradient Border", desc: "Light interior with a glowing brand-coloured stroke around each tile.", C: V2_GradientBorder },
    { n: 3, title: "Glass on Brand Backdrop", desc: "Frosted glass tiles floating on a vivid red→blue brand wash.", C: V3_GlassOnBrand },
    { n: 4, title: "Aurora Mesh Cards", desc: "Each tile is a unique radial-mesh gradient — looks futuristic.", C: V4_AuroraMesh },
    { n: 5, title: "Hero Gradient Header", desc: "Big brand-gradient banner with floating white tiles overlapping it.", C: V5_HeroHeader },
    { n: 6, title: "Bento Mosaic", desc: "Mixed tile sizes — large primary action, smaller gradient mosaic around it.", C: V6_Bento },
    { n: 7, title: "Neumorphic Brand", desc: "Deep navy with soft sculpted shadows + glowing brand-coloured icons.", C: V7_Neumorphic },
    { n: 8, title: "Conic Ring Icons", desc: "White tiles with rotating red→blue conic gradient ring around each icon.", C: V8_ConicRing },
    { n: 9, title: "Top Accent Bar", desc: "Clean white tile with a thin gradient bar across the top — subtle.", C: V9_TopAccent },
    { n: 10, title: "Diagonal Brand Slash", desc: "Dark navy tile with a glowing diagonal brand-gradient slash in the corner.", C: V10_DiagonalSplit },
  ];

  return (
    <main className="min-h-dvh bg-[#EEF1F5] pb-24" style={SF}>
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#E5EAF1]">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="size-9 rounded-full bg-[#F2F2F7] flex items-center justify-center">
            <ArrowLeft size={18} className="text-[#0F1B2D]" />
          </button>
          <div>
            <h1 className="text-[16px] font-semibold text-[#0F1B2D] leading-tight">Quick Actions — Round 2</h1>
            <p className="text-[11px] text-[#7A8FAA]">Bolder · gradient-led · DSM brand</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-8">
        {variants.map((v) => {
          const C = v.C;
          return (
            <section key={v.n} className="space-y-2.5">
              <div className="px-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold tracking-widest text-white px-2 py-0.5 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${DSM.blue}, ${DSM.red})` }}
                  >
                    OPTION {v.n}
                  </span>
                  <span className="h-px flex-1 bg-[#E5EAF1]" />
                </div>
                <h2 className="text-[16px] font-semibold text-[#0F1B2D]">{v.title}</h2>
                <p className="text-[12px] text-[#7A8FAA] mt-0.5">{v.desc}</p>
              </div>
              <C />
            </section>
          );
        })}

        <div className="text-center text-[12px] text-[#7A8FAA] pt-2">
          Pick a number (1–10) and I'll roll it out across the homepage.
        </div>
      </div>
    </main>
  );
}
