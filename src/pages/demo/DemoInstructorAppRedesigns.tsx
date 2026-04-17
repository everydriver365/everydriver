import { useState } from "react";
import { Bell, Menu, Plus, Car, Calendar, MessageSquare, MapPin, Clock, ChevronRight, Home, ListChecks, Map, User, Sparkles, Zap, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 10 alternative visual designs for the instructor mobile app.
 * Each preserves the same layout & functions:
 *   - Header (bell, logo, SOS, menu)
 *   - Greeting / hero
 *   - "Next Up" lesson tile
 *   - Activity grid (Job Offers, Messages, Tests, Fill Gaps)
 *   - Recent activity list
 *   - Bottom nav (Home, Schedule, Track, Profile)
 */

type Design = {
  id: number;
  name: string;
  tagline: string;
  shellBg: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  cardBorder: string;
  cardRadius: string;
  cardShadow: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  navBg: string;
  navActive: string;
  navInactive: string;
  font: string;
  heroBg?: string;
  heroText?: string;
  tileIconBg?: string;
  tileIconColor?: string;
};

const DESIGNS: Design[] = [
  {
    id: 1,
    name: "Crisp White (Current)",
    tagline: "Apple-clean, minimal, neutral",
    shellBg: "#FFFFFF",
    headerBg: "#FFFFFF",
    headerText: "#1c1c1e",
    cardBg: "#FFFFFF",
    cardBorder: "0.5px solid #E4E4E7",
    cardRadius: "14px",
    cardShadow: "none",
    textPrimary: "#1c1c1e",
    textMuted: "#8e8e93",
    accent: "#0f9e75",
    accentText: "#FFFFFF",
    navBg: "rgba(255,255,255,0.92)",
    navActive: "#0f9e75",
    navInactive: "#8e8e93",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
    heroBg: "#F2F3F5",
    heroText: "#1c1c1e",
    tileIconBg: "#F2F3F5",
    tileIconColor: "#1c1c1e",
  },
  {
    id: 2,
    name: "Midnight Pro",
    tagline: "Premium dark with electric accents",
    shellBg: "#0B0F1A",
    headerBg: "#0B0F1A",
    headerText: "#F5F7FA",
    cardBg: "#161B2C",
    cardBorder: "1px solid rgba(255,255,255,0.06)",
    cardRadius: "16px",
    cardShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
    textPrimary: "#F5F7FA",
    textMuted: "#7A859E",
    accent: "#00E5C5",
    accentText: "#0B0F1A",
    navBg: "rgba(11,15,26,0.92)",
    navActive: "#00E5C5",
    navInactive: "#5A647D",
    font: "'Inter', system-ui, sans-serif",
    heroBg: "linear-gradient(135deg, #1A2238 0%, #0F1426 100%)",
    heroText: "#F5F7FA",
    tileIconBg: "rgba(0,229,197,0.12)",
    tileIconColor: "#00E5C5",
  },
  {
    id: 3,
    name: "Sage & Stone",
    tagline: "Calm, organic, wellness-inspired",
    shellBg: "#F4F1EC",
    headerBg: "#F4F1EC",
    headerText: "#3A3A3A",
    cardBg: "#FFFFFF",
    cardBorder: "1px solid #E8E2D6",
    cardRadius: "20px",
    cardShadow: "0 2px 8px rgba(120,110,90,0.06)",
    textPrimary: "#3A3A3A",
    textMuted: "#8B8578",
    accent: "#7A9A7E",
    accentText: "#FFFFFF",
    navBg: "rgba(244,241,236,0.95)",
    navActive: "#7A9A7E",
    navInactive: "#8B8578",
    font: "'Lora', Georgia, serif",
    heroBg: "linear-gradient(135deg, #E8E2D6 0%, #F4F1EC 100%)",
    heroText: "#3A3A3A",
    tileIconBg: "#EFEAE0",
    tileIconColor: "#7A9A7E",
  },
  {
    id: 4,
    name: "Neo Brutalist",
    tagline: "Bold borders, flat colour, statement",
    shellBg: "#FFEB3B",
    headerBg: "#FFFFFF",
    headerText: "#000000",
    cardBg: "#FFFFFF",
    cardBorder: "2px solid #000000",
    cardRadius: "0px",
    cardShadow: "4px 4px 0 #000000",
    textPrimary: "#000000",
    textMuted: "#3A3A3A",
    accent: "#FF3B30",
    accentText: "#FFFFFF",
    navBg: "#FFFFFF",
    navActive: "#000000",
    navInactive: "#3A3A3A",
    font: "'Space Grotesk', system-ui, sans-serif",
    heroBg: "#000000",
    heroText: "#FFEB3B",
    tileIconBg: "#FFEB3B",
    tileIconColor: "#000000",
  },
  {
    id: 5,
    name: "Glass Aurora",
    tagline: "Frosted glass on gradient backdrop",
    shellBg: "linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)",
    headerBg: "rgba(255,255,255,0.18)",
    headerText: "#FFFFFF",
    cardBg: "rgba(255,255,255,0.16)",
    cardBorder: "1px solid rgba(255,255,255,0.25)",
    cardRadius: "20px",
    cardShadow: "0 8px 32px rgba(31,38,135,0.2)",
    textPrimary: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.7)",
    accent: "#FFFFFF",
    accentText: "#764BA2",
    navBg: "rgba(255,255,255,0.18)",
    navActive: "#FFFFFF",
    navInactive: "rgba(255,255,255,0.55)",
    font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
    heroBg: "rgba(255,255,255,0.22)",
    heroText: "#FFFFFF",
    tileIconBg: "rgba(255,255,255,0.22)",
    tileIconColor: "#FFFFFF",
  },
  {
    id: 6,
    name: "Forest Pro",
    tagline: "Deep green, gold accent, executive",
    shellBg: "#0F2A1F",
    headerBg: "#0F2A1F",
    headerText: "#F5F0E1",
    cardBg: "#163B2C",
    cardBorder: "1px solid rgba(212,175,55,0.15)",
    cardRadius: "12px",
    cardShadow: "0 4px 16px rgba(0,0,0,0.3)",
    textPrimary: "#F5F0E1",
    textMuted: "#8FA89A",
    accent: "#D4AF37",
    accentText: "#0F2A1F",
    navBg: "rgba(15,42,31,0.95)",
    navActive: "#D4AF37",
    navInactive: "#8FA89A",
    font: "'Inter', system-ui, sans-serif",
    heroBg: "linear-gradient(135deg, #1A4A38 0%, #0F2A1F 100%)",
    heroText: "#F5F0E1",
    tileIconBg: "rgba(212,175,55,0.12)",
    tileIconColor: "#D4AF37",
  },
  {
    id: 7,
    name: "Pastel Pop",
    tagline: "Soft mint, peach & lavender — playful",
    shellBg: "#FFF8F3",
    headerBg: "#FFF8F3",
    headerText: "#2D2D2D",
    cardBg: "#FFFFFF",
    cardBorder: "none",
    cardRadius: "24px",
    cardShadow: "0 4px 20px rgba(255,180,150,0.15)",
    textPrimary: "#2D2D2D",
    textMuted: "#9A8C82",
    accent: "#FF8B7B",
    accentText: "#FFFFFF",
    navBg: "rgba(255,248,243,0.95)",
    navActive: "#FF8B7B",
    navInactive: "#9A8C82",
    font: "'Inter', system-ui, sans-serif",
    heroBg: "linear-gradient(135deg, #FFD4C4 0%, #FFE9DC 100%)",
    heroText: "#2D2D2D",
    tileIconBg: "#FFE9DC",
    tileIconColor: "#FF8B7B",
  },
  {
    id: 8,
    name: "Mono Editorial",
    tagline: "Black, white & one red — Swiss design",
    shellBg: "#FAFAFA",
    headerBg: "#FFFFFF",
    headerText: "#000000",
    cardBg: "#FFFFFF",
    cardBorder: "1px solid #000000",
    cardRadius: "0px",
    cardShadow: "none",
    textPrimary: "#000000",
    textMuted: "#666666",
    accent: "#E63946",
    accentText: "#FFFFFF",
    navBg: "#FFFFFF",
    navActive: "#E63946",
    navInactive: "#000000",
    font: "'Space Mono', 'Courier New', monospace",
    heroBg: "#000000",
    heroText: "#FFFFFF",
    tileIconBg: "#000000",
    tileIconColor: "#FFFFFF",
  },
  {
    id: 9,
    name: "Driving Blueprint",
    tagline: "Tech blue, schematic lines, professional",
    shellBg: "#F0F4F8",
    headerBg: "#FFFFFF",
    headerText: "#0A2540",
    cardBg: "#FFFFFF",
    cardBorder: "1px solid #D6E0EC",
    cardRadius: "10px",
    cardShadow: "0 1px 3px rgba(10,37,64,0.06)",
    textPrimary: "#0A2540",
    textMuted: "#5A7184",
    accent: "#0066FF",
    accentText: "#FFFFFF",
    navBg: "#FFFFFF",
    navActive: "#0066FF",
    navInactive: "#5A7184",
    font: "'Inter', system-ui, sans-serif",
    heroBg: "linear-gradient(135deg, #0066FF 0%, #0044CC 100%)",
    heroText: "#FFFFFF",
    tileIconBg: "#E6EFFF",
    tileIconColor: "#0066FF",
  },
  {
    id: 10,
    name: "Sunset Drive",
    tagline: "Warm orange-to-pink gradient, friendly",
    shellBg: "#FFF5EE",
    headerBg: "#FFFFFF",
    headerText: "#3D1E10",
    cardBg: "#FFFFFF",
    cardBorder: "1px solid #FFE0CC",
    cardRadius: "18px",
    cardShadow: "0 2px 12px rgba(255,107,53,0.08)",
    textPrimary: "#3D1E10",
    textMuted: "#A87856",
    accent: "#FF6B35",
    accentText: "#FFFFFF",
    navBg: "rgba(255,245,238,0.95)",
    navActive: "#FF6B35",
    navInactive: "#A87856",
    font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
    heroBg: "linear-gradient(135deg, #FF6B35 0%, #F7B267 50%, #FFC1A6 100%)",
    heroText: "#FFFFFF",
    tileIconBg: "#FFE9DC",
    tileIconColor: "#FF6B35",
  },
];

function PhoneFrame({ design }: { design: Design }) {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: 320,
        height: 640,
        borderRadius: 36,
        border: "8px solid #1c1c1e",
        background: design.shellBg,
        fontFamily: design.font,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
      }}
    >
      <div className="h-full overflow-y-auto" style={{ background: design.shellBg }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{
            background: design.headerBg,
            borderBottom: design.cardBorder !== "none" ? "1px solid rgba(0,0,0,0.06)" : undefined,
          }}
        >
          <div className="relative">
            <Bell className="h-5 w-5" style={{ color: design.headerText }} />
            <span
              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
              style={{ background: "#ff3b30", color: "#fff" }}
            >
              3
            </span>
          </div>
          <span className="text-[13px] font-bold tracking-wide" style={{ color: design.headerText }}>
            DSM
          </span>
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white"
              style={{ background: "#ff3b30" }}
            >
              SOS
            </div>
            <Menu className="h-5 w-5" style={{ color: design.textMuted }} />
          </div>
        </div>

        <div className="p-3 space-y-3 pb-20">
          {/* Greeting */}
          <div className="px-1">
            <p className="text-[11px]" style={{ color: design.textMuted }}>
              Good morning
            </p>
            <p className="text-[18px] font-bold" style={{ color: design.textPrimary }}>
              Sarah Mitchell
            </p>
          </div>

          {/* Hero / Next Up */}
          <div
            className="p-4 relative overflow-hidden"
            style={{
              background: design.heroBg,
              borderRadius: design.cardRadius,
              border: design.cardBorder,
              boxShadow: design.cardShadow,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5" style={{ color: design.heroText }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: design.heroText, opacity: 0.8 }}>
                Next Up · 14 min
              </span>
            </div>
            <p className="text-[20px] font-bold leading-tight" style={{ color: design.heroText }}>
              James Carter
            </p>
            <p className="text-[12px] mt-1" style={{ color: design.heroText, opacity: 0.85 }}>
              2hr lesson · Manual
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <MapPin className="h-3 w-3" style={{ color: design.heroText, opacity: 0.7 }} />
              <span className="text-[11px]" style={{ color: design.heroText, opacity: 0.85 }}>
                12 Oakwood Rd · 4.2mi
              </span>
            </div>
            <button
              className="mt-3 px-3 py-1.5 text-[11px] font-semibold"
              style={{
                background: design.accent,
                color: design.accentText,
                borderRadius: design.cardRadius === "0px" ? "0px" : "8px",
                border: design.id === 4 ? "2px solid #000" : "none",
              }}
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
              <div
                key={tile.label}
                className="p-3"
                style={{
                  background: design.cardBg,
                  borderRadius: design.cardRadius,
                  border: design.cardBorder,
                  boxShadow: design.cardShadow,
                }}
              >
                <div
                  className="h-8 w-8 flex items-center justify-center mb-2"
                  style={{
                    background: design.tileIconBg,
                    borderRadius: design.cardRadius === "0px" ? "0px" : "8px",
                  }}
                >
                  <tile.icon className="h-4 w-4" style={{ color: design.tileIconColor }} />
                </div>
                <p className="text-[11px] font-medium" style={{ color: design.textMuted }}>
                  {tile.label}
                </p>
                <p className="text-[18px] font-bold mt-0.5" style={{ color: design.textPrimary }}>
                  {tile.count}
                </p>
              </div>
            ))}
          </div>

          {/* Section header */}
          <p
            className="text-[10px] font-semibold uppercase tracking-wider px-1 pt-1"
            style={{ color: design.textMuted }}
          >
            Today's Schedule
          </p>

          {/* Schedule list */}
          <div
            style={{
              background: design.cardBg,
              borderRadius: design.cardRadius,
              border: design.cardBorder,
              boxShadow: design.cardShadow,
            }}
          >
            {[
              { time: "10:00", name: "Emma Wilson", dur: "1hr" },
              { time: "12:30", name: "Tom Patel", dur: "2hr" },
              { time: "15:00", name: "Lily Chen", dur: "1.5hr" },
            ].map((item, i, arr) => (
              <div
                key={item.time}
                className="flex items-center justify-between px-3 py-2.5"
                style={{
                  borderBottom: i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold" style={{ color: design.accent }}>
                    {item.time}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: design.textPrimary }}>
                      {item.name}
                    </p>
                    <p className="text-[10px]" style={{ color: design.textMuted }}>
                      {item.dur}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: design.textMuted }} />
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div
            className="p-3 flex items-center justify-around"
            style={{
              background: design.cardBg,
              borderRadius: design.cardRadius,
              border: design.cardBorder,
              boxShadow: design.cardShadow,
            }}
          >
            {[
              { label: "Today", val: "6" },
              { label: "Week", val: "32" },
              { label: "£", val: "1.2k" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[16px] font-bold" style={{ color: design.textPrimary }}>
                  {s.val}
                </p>
                <p className="text-[9px] uppercase tracking-wide" style={{ color: design.textMuted }}>
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
            background: design.navBg,
            borderTop: "0.5px solid rgba(0,0,0,0.08)",
          }}
        >
          {[
            { icon: Home, label: "Home", active: true },
            { icon: Calendar, label: "Schedule", active: false },
            { icon: Map, label: "Track", active: false },
            { icon: User, label: "Profile", active: false },
          ].map((n) => (
            <div key={n.label} className="flex flex-col items-center gap-0.5">
              <n.icon className="h-5 w-5" style={{ color: n.active ? design.navActive : design.navInactive }} />
              <span
                className="text-[9px] font-medium"
                style={{ color: n.active ? design.navActive : design.navInactive }}
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
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Instructor App — 10 Design Directions</h1>
          <p className="mt-2 text-slate-600">
            Same layout, same functions. Pick the visual style that resonates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {DESIGNS.map((d) => (
            <div
              key={d.id}
              className={cn(
                "rounded-2xl bg-white p-6 transition-all cursor-pointer border-2",
                selected === d.id ? "border-emerald-500 shadow-2xl scale-[1.02]" : "border-transparent shadow-md hover:shadow-xl"
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
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
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
