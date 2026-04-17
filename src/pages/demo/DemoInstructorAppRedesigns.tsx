import { useState } from "react";
import { Bell, Menu, Car, MessageSquare, MapPin, Clock, ChevronRight, Home, Calendar, Map, User, Sparkles, Zap, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 10 professionally coordinated visual systems for the instructor mobile app.
 * Each design uses a tonal palette (50-900) so color is woven through:
 * shell tint, header accent strip, hero, tile icons, schedule rail,
 * time labels, dividers, stats highlight, nav active state.
 * Layout & functions remain identical.
 */

type Palette = {
  /** very subtle shell tint */
  shellTint: string;
  /** card surface */
  surface: string;
  /** soft accent fill (badges, icon bg) */
  soft: string;
  /** medium accent (rails, dividers) */
  medium: string;
  /** primary accent */
  accent: string;
  /** deep accent (hero gradient end) */
  deep: string;
  /** hero gradient start */
  heroStart: string;
  /** hero gradient end */
  heroEnd: string;
};

type Design = {
  id: number;
  name: string;
  tagline: string;
  palette: Palette;
  font: string;
  /** "rounded" | "sharp" | "soft" — affects radii & borders */
  shape: "rounded" | "sharp" | "soft";
};

const DESIGNS: Design[] = [
  {
    id: 1,
    name: "Atlantic",
    tagline: "Cool blue, professional, trustworthy",
    palette: {
      shellTint: "#F5F8FC",
      surface: "#FFFFFF",
      soft: "#E3EEFB",
      medium: "#A9C9EE",
      accent: "#2B6CB0",
      deep: "#1A4A85",
      heroStart: "#2B6CB0",
      heroEnd: "#1A4A85",
    },
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
    shape: "rounded",
  },
  {
    id: 2,
    name: "Forest Court",
    tagline: "Deep evergreen with cream highlights",
    palette: {
      shellTint: "#F6F8F4",
      surface: "#FFFFFF",
      soft: "#E1ECDD",
      medium: "#9CC09A",
      accent: "#2F6B4A",
      deep: "#1E4A33",
      heroStart: "#2F6B4A",
      heroEnd: "#1E4A33",
    },
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
    shape: "rounded",
  },
  {
    id: 3,
    name: "Burgundy Press",
    tagline: "Editorial wine red, refined typography",
    palette: {
      shellTint: "#FAF6F6",
      surface: "#FFFFFF",
      soft: "#F2E2E4",
      medium: "#D4A1A6",
      accent: "#8B2942",
      deep: "#5E1A2C",
      heroStart: "#8B2942",
      heroEnd: "#5E1A2C",
    },
    font: "'Lora', Georgia, serif",
    shape: "soft",
  },
  {
    id: 4,
    name: "Nordic Slate",
    tagline: "Muted slate-blue, Scandinavian calm",
    palette: {
      shellTint: "#F4F6F8",
      surface: "#FFFFFF",
      soft: "#E2E8EE",
      medium: "#A8B6C5",
      accent: "#475A6E",
      deep: "#2E3D4F",
      heroStart: "#475A6E",
      heroEnd: "#2E3D4F",
    },
    font: "'Inter', system-ui, sans-serif",
    shape: "sharp",
  },
  {
    id: 5,
    name: "Amber Atelier",
    tagline: "Warm amber & cream, craft studio feel",
    palette: {
      shellTint: "#FBF7F0",
      surface: "#FFFFFF",
      soft: "#FAEAD0",
      medium: "#E8C383",
      accent: "#B8801F",
      deep: "#7E5712",
      heroStart: "#B8801F",
      heroEnd: "#7E5712",
    },
    font: "'Inter', system-ui, sans-serif",
    shape: "soft",
  },
  {
    id: 6,
    name: "Heather",
    tagline: "Soft purple-grey, gentle & modern",
    palette: {
      shellTint: "#F7F5FA",
      surface: "#FFFFFF",
      soft: "#EAE3F4",
      medium: "#BFB0D8",
      accent: "#6B4FA0",
      deep: "#48336F",
      heroStart: "#6B4FA0",
      heroEnd: "#48336F",
    },
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
    shape: "rounded",
  },
  {
    id: 7,
    name: "Marina",
    tagline: "Teal & sand, fresh maritime",
    palette: {
      shellTint: "#F4F9F9",
      surface: "#FFFFFF",
      soft: "#D9EDED",
      medium: "#8FCFCB",
      accent: "#1F857F",
      deep: "#0F5C57",
      heroStart: "#1F857F",
      heroEnd: "#0F5C57",
    },
    font: "'Inter', system-ui, sans-serif",
    shape: "rounded",
  },
  {
    id: 8,
    name: "Graphite & Ember",
    tagline: "Charcoal neutrals, ember accent",
    palette: {
      shellTint: "#F6F6F7",
      surface: "#FFFFFF",
      soft: "#FCE5DD",
      medium: "#F0A88E",
      accent: "#D85A2C",
      deep: "#9B3A14",
      heroStart: "#3A3A3D",
      heroEnd: "#1F1F22",
    },
    font: "'Inter', system-ui, sans-serif",
    shape: "sharp",
  },
  {
    id: 9,
    name: "Sage Linen",
    tagline: "Soft sage green, natural & airy",
    palette: {
      shellTint: "#F5F8F4",
      surface: "#FFFFFF",
      soft: "#E2EDD9",
      medium: "#A8C99A",
      accent: "#5C8C4F",
      deep: "#3E6135",
      heroStart: "#5C8C4F",
      heroEnd: "#3E6135",
    },
    font: "'Lora', Georgia, serif",
    shape: "soft",
  },
  {
    id: 10,
    name: "Indigo Mono",
    tagline: "Single deep indigo on warm white",
    palette: {
      shellTint: "#FAFAFB",
      surface: "#FFFFFF",
      soft: "#E4E5F4",
      medium: "#A8ABDD",
      accent: "#3D43B5",
      deep: "#262A7A",
      heroStart: "#3D43B5",
      heroEnd: "#262A7A",
    },
    font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
    shape: "rounded",
  },
];

const radiusFor = (shape: Design["shape"]) =>
  shape === "sharp" ? 4 : shape === "soft" ? 18 : 14;

function PhoneFrame({ design }: { design: Design }) {
  const p = design.palette;
  const R = radiusFor(design.shape);
  const cardStyle: React.CSSProperties = {
    background: p.surface,
    borderRadius: R,
    border: `0.5px solid ${p.medium}40`,
    boxShadow: design.shape === "sharp" ? "none" : `0 1px 2px ${p.deep}08`,
  };

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: 320,
        height: 640,
        borderRadius: 36,
        border: "8px solid #1c1c1e",
        background: p.shellTint,
        fontFamily: design.font,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
      }}
    >
      <div className="h-full overflow-y-auto" style={{ background: p.shellTint }}>
        {/* Accent strip above header */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${p.accent}, ${p.deep})` }} />

        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{
            background: p.surface,
            borderBottom: `0.5px solid ${p.medium}40`,
          }}
        >
          <div className="relative">
            <Bell className="h-5 w-5" style={{ color: p.accent }} />
            <span
              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
              style={{ background: p.accent }}
            >
              3
            </span>
          </div>
          <span className="text-[13px] font-bold tracking-wide" style={{ color: p.deep }}>
            DSM
          </span>
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white"
              style={{ background: "#ff3b30" }}
            >
              SOS
            </div>
            <Menu className="h-5 w-5" style={{ color: p.deep, opacity: 0.6 }} />
          </div>
        </div>

        <div className="p-3 space-y-3 pb-20">
          {/* Greeting */}
          <div className="px-1 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: p.accent }}>
                Good morning
              </p>
              <p className="text-[18px] font-bold" style={{ color: p.deep }}>
                Sarah Mitchell
              </p>
            </div>
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.deep})` }}
            >
              SM
            </div>
          </div>

          {/* Hero / Next Up */}
          <div
            className="p-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${p.heroStart} 0%, ${p.heroEnd} 100%)`,
              borderRadius: R,
              boxShadow: `0 4px 14px ${p.deep}25`,
            }}
          >
            {/* decorative corner badge */}
            <div
              className="absolute top-0 right-0 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ background: "rgba(255,255,255,0.18)", borderBottomLeftRadius: R / 2 }}
            >
              Next · 14m
            </div>
            <div className="flex items-center gap-2 mb-1.5 mt-1">
              <Clock className="h-3 w-3 text-white opacity-80" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white opacity-80">
                10:00 — 12:00
              </span>
            </div>
            <p className="text-[20px] font-bold leading-tight text-white">James Carter</p>
            <p className="text-[12px] mt-0.5 text-white opacity-85">2hr lesson · Manual</p>
            <div className="flex items-center gap-1.5 mt-3">
              <MapPin className="h-3 w-3 text-white opacity-70" />
              <span className="text-[11px] text-white opacity-85">12 Oakwood Rd · 4.2mi</span>
            </div>
            <button
              className="mt-3 px-3 py-1.5 text-[11px] font-semibold rounded-lg"
              style={{ background: "#fff", color: p.deep }}
            >
              Start lesson →
            </button>
          </div>

          {/* Activity Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Car, label: "Job Offers", count: "2" },
              { icon: MessageSquare, label: "Messages", count: "5" },
              { icon: Award, label: "Tests", count: "1" },
              { icon: Zap, label: "Fill Gaps", count: "3" },
            ].map((tile) => (
              <div key={tile.label} className="p-3 relative overflow-hidden" style={cardStyle}>
                {/* left accent rail */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r"
                  style={{ background: p.accent }}
                />
                <div
                  className="h-8 w-8 flex items-center justify-center mb-2"
                  style={{ background: p.soft, borderRadius: design.shape === "sharp" ? 2 : 8 }}
                >
                  <tile.icon className="h-4 w-4" style={{ color: p.accent }} />
                </div>
                <p className="text-[11px] font-medium" style={{ color: p.deep, opacity: 0.6 }}>
                  {tile.label}
                </p>
                <p className="text-[18px] font-bold mt-0.5" style={{ color: p.deep }}>
                  {tile.count}
                </p>
              </div>
            ))}
          </div>

          {/* Section header */}
          <div className="flex items-center gap-2 px-1 pt-1">
            <div className="h-[1px] w-3" style={{ background: p.accent }} />
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: p.accent }}
            >
              Today's Schedule
            </p>
          </div>

          {/* Schedule list */}
          <div style={cardStyle}>
            {[
              { time: "10:00", name: "Emma Wilson", dur: "1hr" },
              { time: "12:30", name: "Tom Patel", dur: "2hr" },
              { time: "15:00", name: "Lily Chen", dur: "1.5hr" },
            ].map((item, i, arr) => (
              <div
                key={item.time}
                className="flex items-center justify-between px-3 py-2.5"
                style={{
                  borderBottom: i < arr.length - 1 ? `0.5px solid ${p.medium}30` : "none",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{ background: p.accent }}
                  >
                    {item.time}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: p.deep }}>
                      {item.name}
                    </p>
                    <p className="text-[10px]" style={{ color: p.deep, opacity: 0.55 }}>
                      {item.dur}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: p.medium }} />
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div
            className="p-3 flex items-center justify-around relative overflow-hidden"
            style={cardStyle}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${p.accent}, ${p.medium})` }}
            />
            {[
              { label: "Today", val: "6" },
              { label: "Week", val: "32" },
              { label: "£", val: "1.2k", highlight: true },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p
                  className="text-[16px] font-bold"
                  style={{ color: s.highlight ? p.accent : p.deep }}
                >
                  {s.val}
                </p>
                <p
                  className="text-[9px] uppercase tracking-wide font-medium"
                  style={{ color: p.deep, opacity: 0.55 }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom nav */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5 backdrop-blur-md"
          style={{
            background: `${p.surface}E6`,
            borderTop: `0.5px solid ${p.medium}40`,
          }}
        >
          {[
            { icon: Home, label: "Home", active: true },
            { icon: Calendar, label: "Schedule", active: false },
            { icon: Map, label: "Track", active: false },
            { icon: User, label: "Profile", active: false },
          ].map((n) => (
            <div key={n.label} className="flex flex-col items-center gap-0.5 relative">
              {n.active && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full"
                  style={{ background: p.accent }}
                />
              )}
              <n.icon
                className="h-5 w-5"
                style={{ color: n.active ? p.accent : `${p.deep}80` }}
              />
              <span
                className="text-[9px] font-medium"
                style={{ color: n.active ? p.accent : `${p.deep}80` }}
              >
                {n.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DemoInstructorAppRedesigns() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Instructor App — 10 Refined Design Systems
          </h1>
          <p className="mt-2 text-slate-600">
            Cohesive palettes woven through every element. Same layout, same functions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {DESIGNS.map((d) => (
            <div
              key={d.id}
              className={cn(
                "rounded-2xl bg-white p-6 transition-all cursor-pointer border-2",
                selected === d.id
                  ? "border-emerald-500 shadow-2xl scale-[1.02]"
                  : "border-transparent shadow-md hover:shadow-xl"
              )}
              onClick={() => setSelected(d.id)}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                    {d.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{d.name}</h2>
                </div>
                <p className="text-sm text-slate-500">{d.tagline}</p>
                {/* palette swatches */}
                <div className="flex gap-1 mt-2">
                  {[d.palette.soft, d.palette.medium, d.palette.accent, d.palette.deep].map((c) => (
                    <div
                      key={c}
                      className="h-4 w-4 rounded-full border border-slate-200"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <PhoneFrame design={d} />
              {selected === d.id && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-3 w-3" />
                    Selected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
            <span className="text-sm">
              Selected: <strong>#{selected} {DESIGNS.find((d) => d.id === selected)?.name}</strong>
            </span>
            <span className="text-xs text-slate-400">— tell me to apply it</span>
          </div>
        )}
      </div>
    </div>
  );
}
