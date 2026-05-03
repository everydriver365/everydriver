import { useState } from "react";
import { Bell, Menu, Car, MessageSquare, MapPin, Clock, ChevronRight, Home, Calendar, Map, User, Sparkles, Zap, Award } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 10 professional iOS-style designs.
 * Crisp, native-feeling, but with TINTED surfaces (not white-on-white).
 * Each uses an iOS-style grouped-list layout with a tinted shell background,
 * white cards floating on top, and a single sophisticated accent color.
 * Layout & functions identical across all variants.
 */

type Theme = {
  id: number;
  name: string;
  tagline: string;
  /** subtle tinted shell (the "off-white" that prevents white-on-white) */
  shell: string;
  /** white-ish card surface (slightly off the shell) */
  card: string;
  /** soft accent for icon backgrounds */
  iconBg: string;
  /** primary accent (buttons, time chips, nav active) */
  accent: string;
  /** deep accent (titles, hero gradient end) */
  deep: string;
  /** hero gradient start */
  heroStart: string;
  /** hero gradient end */
  heroEnd: string;
  /** primary text */
  text: string;
  /** muted text */
  muted: string;
  /** hairline border / divider */
  hairline: string;
  /** font stack */
  font: string;
};

const THEMES: Theme[] = [
  {
    id: 1, name: "Slate Mist", tagline: "Cool grey-blue, Apple-clean",
    shell: "#EEF1F5", card: "#FFFFFF", iconBg: "#E1E8F0",
    accent: "#3B6EA5", deep: "#1F3B5F",
    heroStart: "#3B6EA5", heroEnd: "#1F3B5F",
    text: "#1C1C1E", muted: "#7A8595", hairline: "#D8DEE6",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 2, name: "Sage Stone", tagline: "Soft sage tint, organic calm",
    shell: "#EEF2EC", card: "#FFFFFF", iconBg: "#DDE8DA",
    accent: "#5C8C5A", deep: "#3A5C3A",
    heroStart: "#5C8C5A", heroEnd: "#3A5C3A",
    text: "#1F2F1E", muted: "#7A8C78", hairline: "#D6DED4",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 3, name: "Warm Linen", tagline: "Cream tint, terracotta accent",
    shell: "#F4EFE7", card: "#FFFFFF", iconBg: "#EBE2D2",
    accent: "#B5562C", deep: "#7E3818",
    heroStart: "#B5562C", heroEnd: "#7E3818",
    text: "#2D2018", muted: "#8B7C68", hairline: "#E0D6C4",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 4, name: "Graphite Pro", tagline: "Dark mode, electric blue",
    shell: "#0F1115", card: "#1A1D24", iconBg: "#252A33",
    accent: "#4A9EFF", deep: "#2675D6",
    heroStart: "#4A9EFF", heroEnd: "#1A4F99",
    text: "#F2F4F7", muted: "#8A93A3", hairline: "#2A2F38",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 5, name: "Pearl Rose", tagline: "Blush tint, dusty rose accent",
    shell: "#F5EDED", card: "#FFFFFF", iconBg: "#EBDDDD",
    accent: "#A24A5C", deep: "#6E2D3C",
    heroStart: "#A24A5C", heroEnd: "#6E2D3C",
    text: "#2A1A1F", muted: "#9A7A82", hairline: "#E0D2D2",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 6, name: "Marine Steel", tagline: "Steel grey, deep marine blue",
    shell: "#EAEEF2", card: "#FFFFFF", iconBg: "#DAE2EA",
    accent: "#0B5F8A", deep: "#063D5C",
    heroStart: "#0B5F8A", heroEnd: "#063D5C",
    text: "#0F1F2E", muted: "#6B7C8C", hairline: "#D2DBE4",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 7, name: "Olive Field", tagline: "Warm olive, forest accent",
    shell: "#EFEFE5", card: "#FFFFFF", iconBg: "#E2E2D0",
    accent: "#5F6B2E", deep: "#3D461A",
    heroStart: "#5F6B2E", heroEnd: "#3D461A",
    text: "#272A18", muted: "#7E8470", hairline: "#D8D8C8",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 8, name: "Lavender Fog", tagline: "Soft lavender, deep violet",
    shell: "#EFEDF5", card: "#FFFFFF", iconBg: "#E2DEEC",
    accent: "#5E4B9E", deep: "#3D2D6E",
    heroStart: "#5E4B9E", heroEnd: "#3D2D6E",
    text: "#1F1A2D", muted: "#827998", hairline: "#DCD7E8",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 9, name: "Deep Forest", tagline: "Dark mode, emerald accent",
    shell: "#0E1614", card: "#162220", iconBg: "#1F302C",
    accent: "#34D399", deep: "#0F8C5C",
    heroStart: "#34D399", heroEnd: "#0F5C42",
    text: "#EDF4F1", muted: "#7C9690", hairline: "#23332F",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
  {
    id: 10, name: "Almond Cocoa", tagline: "Almond tint, rich cocoa",
    shell: "#F2EBE2", card: "#FFFFFF", iconBg: "#E5DACA",
    accent: "#7A4E2E", deep: "#4F2F18",
    heroStart: "#7A4E2E", heroEnd: "#4F2F18",
    text: "#2A1E12", muted: "#8C7A66", hairline: "#DDD0BC",
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  },
];

const tilesData = [
  { icon: Car, label: "Job Offers", count: "2" },
  { icon: MessageSquare, label: "Messages", count: "5" },
  { icon: Award, label: "Tests", count: "1" },
  { icon: Zap, label: "Fill Gaps", count: "3" },
];
const scheduleData = [
  { time: "10:00", name: "Emma Wilson", dur: "1hr" },
  { time: "12:30", name: "Tom Patel", dur: "2hr" },
  { time: "15:00", name: "Lily Chen", dur: "1.5hr" },
];

function PhoneFrame({ t }: { t: Theme }) {
  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: 320,
        height: 640,
        borderRadius: 36,
        border: "8px solid #1c1c1e",
        background: t.shell,
        fontFamily: t.font,
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
      }}
    >
      <div className="h-full overflow-y-auto" style={{ background: t.shell }}>
        {/* Header — frosted, sits on shell tint */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-xl"
          style={{
            background: `${t.shell}E6`,
            borderBottom: `0.5px solid ${t.hairline}`,
          }}
        >
          <div className="relative">
            <Bell className="h-5 w-5" style={{ color: t.accent }} strokeWidth={2} />
            <span
              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
              style={{ background: t.accent }}
            >
              3
            </span>
          </div>
          <span className="text-[13px] font-semibold tracking-wide" style={{ color: t.text, letterSpacing: "0.02em" }}>
            DSM
          </span>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white" style={{ background: "#E15D5A" }}>
              SOS
            </div>
            <Menu className="h-5 w-5" style={{ color: t.muted }} strokeWidth={2} />
          </div>
        </div>

        <div className="p-3 space-y-3 pb-20">
          {/* Greeting */}
          <div className="px-1 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium" style={{ color: t.muted }}>Good morning</p>
              <p className="text-[20px] font-bold tracking-tight" style={{ color: t.text }}>
                Sarah Mitchell
              </p>
            </div>
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.deep})` }}
            >
              SM
            </div>
          </div>

          {/* Hero */}
          <div
            className="p-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${t.heroStart} 0%, ${t.heroEnd} 100%)`,
              borderRadius: 16,
              boxShadow: `0 6px 18px ${t.deep}30`,
            }}
          >
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}
            >
              Next · 14m
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="h-3 w-3 text-white opacity-80" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white opacity-85">
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
              className="mt-3 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg"
              style={{ background: "#FFFFFF", color: t.deep }}
            >
              Start lesson →
            </button>
          </div>

          {/* Activity tiles — white cards floating on tinted shell */}
          <div className="grid grid-cols-2 gap-2.5">
            {tilesData.map((tile) => (
              <div
                key={tile.label}
                className="p-3"
                style={{
                  background: t.card,
                  borderRadius: 14,
                  border: `0.5px solid ${t.hairline}`,
                  boxShadow: `0 1px 2px ${t.deep}08`,
                }}
              >
                <div
                  className="h-8 w-8 flex items-center justify-center mb-2 rounded-lg"
                  style={{ background: t.iconBg }}
                >
                  <tile.icon className="h-4 w-4" style={{ color: t.accent }} strokeWidth={2} />
                </div>
                <p className="text-[11px] font-medium" style={{ color: t.muted }}>
                  {tile.label}
                </p>
                <p className="text-[18px] font-bold mt-0.5" style={{ color: t.text }}>
                  {tile.count}
                </p>
              </div>
            ))}
          </div>

          {/* Section header — iOS Settings style */}
          <p
            className="text-[11px] font-medium uppercase tracking-wider px-3 pt-2 pb-1"
            style={{ color: t.muted, letterSpacing: "0.04em" }}
          >
            Today's Schedule
          </p>

          {/* Schedule list — grouped iOS list */}
          <div
            style={{
              background: t.card,
              borderRadius: 14,
              border: `0.5px solid ${t.hairline}`,
              boxShadow: `0 1px 2px ${t.deep}08`,
              overflow: "hidden",
            }}
          >
            {scheduleData.map((item, i, arr) => (
              <div key={item.time}>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums"
                      style={{ background: t.iconBg, color: t.accent }}
                    >
                      {item.time}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: t.text }}>
                        {item.name}
                      </p>
                      <p className="text-[10px]" style={{ color: t.muted }}>
                        {item.dur}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: t.muted }} strokeWidth={2} />
                </div>
                {i < arr.length - 1 && (
                  <div style={{ height: 0.5, background: t.hairline, marginLeft: 64 }} />
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            className="p-3 flex items-center justify-around"
            style={{
              background: t.card,
              borderRadius: 14,
              border: `0.5px solid ${t.hairline}`,
              boxShadow: `0 1px 2px ${t.deep}08`,
            }}
          >
            {[
              { label: "Today", val: "6" },
              { label: "Week", val: "32" },
              { label: "£", val: "1.2k", highlight: true },
            ].map((s, i, a) => (
              <>
                <div key={s.label} className="text-center flex-1">
                  <p className="text-[16px] font-bold tabular-nums" style={{ color: s.highlight ? t.accent : t.text }}>
                    {s.val}
                  </p>
                  <p className="text-[9px] uppercase tracking-wide font-medium" style={{ color: t.muted }}>
                    {s.label}
                  </p>
                </div>
                {i < a.length - 1 && <div style={{ width: 0.5, height: 28, background: t.hairline }} />}
              </>
            ))}
          </div>
        </div>

        {/* Bottom nav — frosted */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2.5 backdrop-blur-xl"
          style={{
            background: `${t.shell}E6`,
            borderTop: `0.5px solid ${t.hairline}`,
          }}
        >
          {[
            { icon: Home, label: "Home", active: true },
            { icon: Calendar, label: "Schedule", active: false },
            { icon: Map, label: "Track", active: false },
            { icon: User, label: "Profile", active: false },
          ].map((n) => (
            <div key={n.label} className="flex flex-col items-center gap-0.5">
              <n.icon
                className="h-5 w-5"
                style={{ color: n.active ? t.accent : t.muted }}
                strokeWidth={n.active ? 2.4 : 2}
              />
              <span
                className="text-[9px] font-medium"
                style={{ color: n.active ? t.accent : t.muted }}
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
            Instructor App — 10 Professional iOS Themes
          </h1>
          <p className="mt-2 text-slate-600">
            Crisp native-feel with subtle tinted surfaces — no flat white-on-white.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {THEMES.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-2xl bg-white shadow-lift p-6 transition-all cursor-pointer border-2",
                selected === t.id
                  ? "border-emerald-500 shadow-2xl scale-[1.02]"
                  : "border-transparent shadow-md hover:shadow-xl"
              )}
              onClick={() => setSelected(t.id)}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">
                    {t.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{t.name}</h2>
                </div>
                <p className="text-sm text-slate-500">{t.tagline}</p>
                <div className="flex gap-1 mt-2">
                  {[t.shell, t.iconBg, t.accent, t.deep].map((c) => (
                    <div
                      key={c}
                      className="h-4 w-4 rounded-full border border-slate-200"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <PhoneFrame t={t} />
              {selected === t.id && (
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
              Selected: <strong>#{selected} {THEMES.find((t) => t.id === selected)?.name}</strong>
            </span>
            <span className="text-xs text-slate-400">— tell me to apply it</span>
          </div>
        )}
      </div>
    </div>
  );
}
