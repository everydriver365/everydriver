import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Plus,
  PoundSterling,
  Car,
  Heart,
  Megaphone,
  Camera,
  ArrowLeft,
  MoreHorizontal,
  Radio,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ActionItem {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  /** Soft tint colours used by variant 2 */
  tintBg: string;
  tintFg: string;
  /** Accent colour used by variant 3 */
  accent: string;
  status?: string;
}

const actions: ActionItem[] = [
  { id: "fill-gaps", label: "Fill gaps", subtitle: "Schedule gaps", icon: Calendar, tintBg: "#EBF3EF", tintFg: "#3B7254", accent: "#00C2A8", status: "3 open" },
  { id: "track-live", label: "Track live", subtitle: "GPS tracking", icon: MapPin, tintBg: "#FDF3E1", tintFg: "#A37326", accent: "#39C257", status: "Active" },
  { id: "add-lesson", label: "Add lesson", subtitle: "New booking", icon: Plus, tintBg: "#EBF1F7", tintFg: "#456A8F", accent: "#3B82F6" },
  { id: "take-payment", label: "Take payment", subtitle: "Record payment", icon: PoundSterling, tintBg: "#FBEFEF", tintFg: "#A85157", accent: "#A0A0A0", status: "Secure" },
  { id: "find-my-car", label: "Find my car", subtitle: "Car location", icon: Car, tintBg: "#F3EEF6", tintFg: "#745790", accent: "#00C2FF", status: "12m away" },
  { id: "health-hub", label: "Health hub", subtitle: "Wellness tips", icon: Heart, tintBg: "#F5EFEB", tintFg: "#947154", accent: "#FF6B9D" },
  { id: "test-swap", label: "Test swap", subtitle: "Swap a test", icon: Calendar, tintBg: "#EBF3EF", tintFg: "#3B7254", accent: "#FFB000", status: "2 pending" },
  { id: "find-nearby", label: "Find nearby", subtitle: "Toilets & food", icon: MapPin, tintBg: "#FDF3E1", tintFg: "#A37326", accent: "#FFFFFF" },
  { id: "dashcam", label: "Dashcam", subtitle: "View footage", icon: Camera, tintBg: "#FBEFEF", tintFg: "#A85157", accent: "#FF2A2A", status: "Rec" },
  { id: "updates", label: "Updates", subtitle: "News & ideas", icon: Megaphone, tintBg: "#F3EEF6", tintFg: "#745790", accent: "#FFFFFF" },
];

/* ---------- Variant 1: Precision Monochrome ---------- */
function VariantMonochrome() {
  return (
    <section className="bg-[#f2f2f7] dark:bg-[#000] rounded-3xl p-5">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-[22px] font-semibold tracking-tight text-[#1c1c1e] dark:text-white" style={{ fontFamily: "-apple-system, 'SF Pro Display', Inter, sans-serif" }}>
          Quick Actions
        </h2>
        <button className="size-8 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-[#1c1c1e] dark:text-white">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-[14px]" style={{ fontFamily: "-apple-system, 'SF Pro Text', Inter, sans-serif" }}>
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="flex flex-col items-start p-4 bg-white dark:bg-[#1c1c1e] rounded-[22px] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform text-left"
            >
              <div className="size-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 ring-1 ring-black/5 dark:ring-white/10">
                <Icon className="text-[#1c1c1e] dark:text-white" size={20} strokeWidth={2} />
              </div>
              <h3 className="text-[15px] font-medium text-[#1c1c1e] dark:text-white tracking-tight mb-0.5">{a.label}</h3>
              <p className="text-[13px] text-[#8e8e93]">{a.subtitle}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Variant 2: Soft Matte Tints ---------- */
function VariantSoftTints() {
  return (
    <section className="bg-[#F4F2EC] dark:bg-[#1a1814] rounded-3xl p-5" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
      <header className="mb-5 px-1">
        <p className="text-[11px] font-bold text-[#8D8780] mb-1.5 tracking-widest uppercase">Today</p>
        <h1 className="text-[26px] font-semibold text-[#34302C] dark:text-[#F4F2EC] tracking-tight">Quick actions</h1>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="bg-white dark:bg-[#26221e] flex flex-col justify-between h-[140px] p-4 rounded-[24px] border border-black/5 dark:border-white/10 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.08)] active:scale-[0.97] transition-transform text-left"
            >
              <div
                className="size-11 rounded-full flex items-center justify-center"
                style={{ background: a.tintBg, color: a.tintFg }}
              >
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#34302C] dark:text-white leading-snug">{a.label}</h3>
                <p className="text-[13px] font-medium text-[#8D8780]">{a.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Variant 3: Obsidian Telemetry ---------- */
function VariantObsidian() {
  return (
    <section className="bg-[#020202] rounded-3xl p-5">
      <div className="mb-6 px-1">
        <h1 className="text-zinc-100 text-lg font-medium tracking-tight" style={{ fontFamily: "'Outfit', Inter, sans-serif" }}>
          Command Matrix
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="size-1.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            System Online
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="bg-[#0a0a0a] rounded-[20px] p-4 border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between h-[120px] text-left active:scale-[0.97]"
            >
              <div className="size-9 rounded-full bg-[#121212] flex items-center justify-center border border-white/10">
                <Icon size={16} strokeWidth={2} style={{ color: a.accent }} />
              </div>
              <div>
                <h3 className="text-zinc-200 text-[15px] font-medium mb-1" style={{ fontFamily: "'Outfit', Inter, sans-serif" }}>
                  {a.label}
                </h3>
                <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: a.status ? a.accent : "#71717a" }}>
                  {a.status || a.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
export default function QuickActionsRedesignDemo() {
  const navigate = useNavigate();

  const variants = [
    {
      id: "monochrome",
      title: "Option 1 — Precision Monochrome",
      desc: "Calm, professional, iOS-native. Black-on-white icon chips, structural shadows, perfect typography. Best fit if you want a 'serious tool' feel.",
      Component: VariantMonochrome,
    },
    {
      id: "soft",
      title: "Option 2 — Soft Matte Tints",
      desc: "Warm paper background, gentle pastel icon chips colour-coded by category. Friendly and modern, low cognitive load.",
      Component: VariantSoftTints,
    },
    {
      id: "obsidian",
      title: "Option 3 — Obsidian Telemetry",
      desc: "Dark, high-tech command-console look with luminescent status accents. Best fit if you want the app to feel like premium telematics hardware.",
      Component: VariantObsidian,
    },
  ];

  return (
    <main className="min-h-dvh bg-muted/30 pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="size-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-semibold leading-tight">Quick Actions — Redesign</h1>
            <p className="text-[11px] text-muted-foreground">Pick your favourite below</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-8">
        {variants.map((v, idx) => {
          const C = v.Component;
          return (
            <div key={v.id} className="space-y-3">
              <div className="px-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Variant {idx + 1}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <h2 className="text-[17px] font-semibold text-foreground">{v.title}</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">{v.desc}</p>
              </div>
              <C />
            </div>
          );
        })}

        <div className="text-center text-[12px] text-muted-foreground pt-2">
          Tell me which option (1, 2 or 3) and I'll roll it out across the homepage.
        </div>
      </div>
    </main>
  );
}
