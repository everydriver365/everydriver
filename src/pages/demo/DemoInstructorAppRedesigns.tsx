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

// Crisp White base — 10 variants with different accent colors and subtle hero tints
const makeCrispVariant = (
  id: number,
  name: string,
  tagline: string,
  accent: string,
  heroBg: string,
  tileIconBg: string,
): Design => ({
  id,
  name,
  tagline,
  shellBg: "#FFFFFF",
  headerBg: "#FFFFFF",
  headerText: "#1c1c1e",
  cardBg: "#FFFFFF",
  cardBorder: "0.5px solid #E4E4E7",
  cardRadius: "14px",
  cardShadow: "none",
  textPrimary: "#1c1c1e",
  textMuted: "#8e8e93",
  accent,
  accentText: "#FFFFFF",
  navBg: "rgba(255,255,255,0.92)",
  navActive: accent,
  navInactive: "#8e8e93",
  font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  heroBg,
  heroText: "#FFFFFF",
  tileIconBg,
  tileIconColor: accent,
});

const DESIGNS: Design[] = [
  makeCrispVariant(1, "Ocean Breeze", "Crisp white + cool blue accents", "#0A84FF", "linear-gradient(135deg, #0A84FF 0%, #5AC8FA 100%)", "#E5F1FF"),
  makeCrispVariant(2, "Emerald Drive", "Crisp white + vivid green", "#34C759", "linear-gradient(135deg, #1FAE5C 0%, #34C759 100%)", "#E4F7EA"),
  makeCrispVariant(3, "Sunrise Coral", "Crisp white + warm coral", "#FF6B6B", "linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)", "#FFE9E9"),
  makeCrispVariant(4, "Royal Indigo", "Crisp white + deep indigo", "#5E5CE6", "linear-gradient(135deg, #5E5CE6 0%, #8E8AF0 100%)", "#ECEBFE"),
  makeCrispVariant(5, "Mango Sun", "Crisp white + bright tangerine", "#FF9500", "linear-gradient(135deg, #FF9500 0%, #FFB340 100%)", "#FFF1DC"),
  makeCrispVariant(6, "Magenta Pop", "Crisp white + bold magenta", "#FF2D92", "linear-gradient(135deg, #FF2D92 0%, #FF6BB5 100%)", "#FFE4F1"),
  makeCrispVariant(7, "Teal Calm", "Crisp white + relaxed teal", "#00B5AD", "linear-gradient(135deg, #00B5AD 0%, #4FD6CE 100%)", "#DEF6F4"),
  makeCrispVariant(8, "Plum Velvet", "Crisp white + rich purple", "#8E44AD", "linear-gradient(135deg, #8E44AD 0%, #B57BD0 100%)", "#F1E4F7"),
  makeCrispVariant(9, "Lime Zest", "Crisp white + electric lime", "#7BC043", "linear-gradient(135deg, #5BAA28 0%, #9DD55E 100%)", "#EBF6DD"),
  makeCrispVariant(10, "Crimson Edge", "Crisp white + sharp red", "#E63946", "linear-gradient(135deg, #C81D2A 0%, #E63946 100%)", "#FCE2E5"),
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
