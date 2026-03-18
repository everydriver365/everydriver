import { useState } from "react";
import { motion } from "framer-motion";
import {
  Compass, ChevronRight, Users, Coffee, Sparkles, ArrowRight,
  Zap, Radio, ExternalLink, Eye, Star, Layout
} from "lucide-react";

/* ───────── Option 1: Glassmorphic ───────── */
function GlassmorphicTiles() {
  return (
    <div className="space-y-3">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, hsl(217 60% 20% / 0.85), hsl(217 50% 30% / 0.7))",
          backdropFilter: "blur(20px)",
          border: "1px solid hsl(217 40% 50% / 0.2)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <Coffee className="h-5 w-5 text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">The Waiting Room</p>
            <p className="text-[11px] text-blue-200/70 mt-0.5">Weekly Zoom for driving instructors</p>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-300/50 shrink-0" />
        </div>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, hsl(160 40% 18% / 0.85), hsl(160 35% 25% / 0.7))",
          backdropFilter: "blur(20px)",
          border: "1px solid hsl(160 40% 40% / 0.2)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Compass className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Discover Features</p>
            <p className="text-[11px] text-emerald-200/70 mt-0.5">See everything your app can do</p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-300/50 shrink-0" />
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Option 2: Bold Gradient Banners ───────── */
function GradientBannerTiles() {
  return (
    <div className="space-y-3">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer"
        style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
        <div className="relative p-5 flex items-center gap-4">
          <span className="text-3xl">☕</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60">Weekly</p>
            <p className="text-base font-bold text-white mt-0.5">The Waiting Room</p>
            <p className="text-[11px] text-blue-100/60 mt-1">Informal Zoom sessions for ADIs</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer"
        style={{ background: "linear-gradient(135deg, #064e3b, #059669)" }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
        <div className="relative p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-emerald-200" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/60">Explore</p>
            <p className="text-base font-bold text-white mt-0.5">Discover Features</p>
            <p className="text-[11px] text-emerald-100/60 mt-1">Everything your app can do</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Option 3: Minimal Outline ───────── */
function MinimalOutlineTiles() {
  return (
    <div className="space-y-3">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="rounded-2xl border border-border bg-card p-4 cursor-pointer flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
          <Coffee className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">The Waiting Room</p>
          <p className="text-[11px] text-muted-foreground">Weekly Zoom · Open to all ADIs</p>
        </div>
        <span className="text-[11px] font-medium text-blue-500">Join →</span>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.97 }}
        className="rounded-2xl border border-border bg-card p-4 cursor-pointer flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Compass className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Discover Features</p>
          <p className="text-[11px] text-muted-foreground">See what your app can do</p>
        </div>
        <span className="text-[11px] font-medium text-primary">Explore →</span>
      </motion.div>
    </div>
  );
}

/* ───────── Option 4: Stacked Compact Strip ───────── */
function CompactStripTiles() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
      <motion.div
        whileTap={{ backgroundColor: "hsl(var(--muted))" }}
        className="px-4 py-3.5 cursor-pointer flex items-center gap-3"
      >
        <span className="text-lg">☕</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-foreground">The Waiting Room</p>
          <p className="text-[10px] text-muted-foreground">Weekly Zoom for instructors</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Live</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        </div>
      </motion.div>
      <motion.div
        whileTap={{ backgroundColor: "hsl(var(--muted))" }}
        className="px-4 py-3.5 cursor-pointer flex items-center gap-3"
      >
        <Compass className="h-[18px] w-[18px] text-primary" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-foreground">Discover Features</p>
          <p className="text-[10px] text-muted-foreground">Explore all app capabilities</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">30+</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Option 5: Dark Premium Cards ───────── */
function DarkPremiumTiles() {
  return (
    <div className="space-y-3">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer bg-slate-900 border border-slate-700/50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-transparent" />
        <div className="relative p-4 flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Coffee className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-slate-900" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">The Waiting Room</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Weekly Zoom · Every Thursday</p>
          </div>
          <div className="text-[10px] font-semibold text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg">
            Join
          </div>
        </div>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer bg-slate-900 border border-slate-700/50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-transparent to-transparent" />
        <div className="relative p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Discover Features</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Explore 30+ app capabilities</p>
          </div>
          <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg">
            Explore
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Option 6: iOS Settings Style ───────── */
function IOSSettingsTiles() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <motion.div
        whileTap={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
        className="px-4 py-3 cursor-pointer flex items-center gap-3 border-b border-border"
      >
        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <Users className="h-4 w-4 text-white" />
        </div>
        <p className="text-[15px] text-foreground flex-1">The Waiting Room</p>
        <p className="text-[13px] text-muted-foreground mr-1">Weekly</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
      </motion.div>
      <motion.div
        whileTap={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
        className="px-4 py-3 cursor-pointer flex items-center gap-3"
      >
        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
          <Compass className="h-4 w-4 text-white" />
        </div>
        <p className="text-[15px] text-foreground flex-1">Discover Features</p>
        <p className="text-[13px] text-muted-foreground mr-1">30+</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
      </motion.div>
    </div>
  );
}

/* ───────── Option 7: Editorial / Magazine ───────── */
function EditorialTiles() {
  return (
    <div className="space-y-3">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="rounded-2xl bg-card border border-border overflow-hidden cursor-pointer"
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400" />
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500">Community</p>
              <p className="text-lg font-bold text-foreground mt-1 leading-tight">The Waiting<br />Room</p>
            </div>
            <span className="text-3xl mt-1">☕</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Join fellow driving instructors for informal weekly Zoom chats. Share tips, ask questions, connect.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-blue-500">
            <span className="text-[11px] font-semibold">Join next session</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.98 }}
        className="rounded-2xl bg-card border border-border overflow-hidden cursor-pointer"
      >
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500">Explore</p>
              <p className="text-lg font-bold text-foreground mt-1 leading-tight">Discover<br />Features</p>
            </div>
            <Sparkles className="h-7 w-7 text-emerald-400 mt-1" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Your app has 30+ powerful features. Explore scheduling, tracking, payments, and more.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-emerald-500">
            <span className="text-[11px] font-semibold">Start exploring</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Option 8: Pill / Floating Action ───────── */
function PillActionTiles() {
  return (
    <div className="space-y-2.5">
      <motion.div
        whileTap={{ scale: 0.96 }}
        className="rounded-full bg-blue-500 px-5 py-3 cursor-pointer flex items-center gap-3 shadow-lg shadow-blue-500/20"
      >
        <Coffee className="h-4 w-4 text-white" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">The Waiting Room</p>
        </div>
        <span className="text-[10px] font-medium text-blue-100/80 bg-white/15 px-2.5 py-0.5 rounded-full">Weekly Zoom</span>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.96 }}
        className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 cursor-pointer flex items-center gap-3 shadow-lg shadow-emerald-500/20"
      >
        <Compass className="h-4 w-4 text-white" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">Discover Features</p>
        </div>
        <span className="text-[10px] font-medium text-emerald-100/80 bg-white/15 px-2.5 py-0.5 rounded-full">30+ tools</span>
      </motion.div>
    </div>
  );
}

/* ───────── DEMO PAGE ───────── */
const OPTIONS = [
  { id: 1, name: "Glassmorphic", desc: "Frosted glass with blur & depth", component: GlassmorphicTiles },
  { id: 2, name: "Bold Gradient", desc: "Vibrant gradient banners with shapes", component: GradientBannerTiles },
  { id: 3, name: "Minimal Outline", desc: "Clean, bordered, light & simple", component: MinimalOutlineTiles },
  { id: 4, name: "Compact Strip", desc: "Unified card, stacked rows", component: CompactStripTiles },
  { id: 5, name: "Dark Premium", desc: "Dark cards with glowing accents", component: DarkPremiumTiles },
  { id: 6, name: "iOS Settings", desc: "Native iOS grouped list style", component: IOSSettingsTiles },
  { id: 7, name: "Editorial", desc: "Magazine-style with descriptions", component: EditorialTiles },
  { id: 8, name: "Pill Actions", desc: "Rounded pill-shaped CTAs", component: PillActionTiles },
];

export default function TileDesignDemo() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-4">
        <h1 className="text-lg font-bold text-foreground">Tile Redesign Options</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">8 design directions for the bottom tiles</p>
      </div>

      <div className="px-4 pb-20 space-y-8 pt-4">
        {OPTIONS.map((opt) => {
          const Comp = opt.component;
          const isSelected = selected === opt.id;
          return (
            <motion.div
              key={opt.id}
              className={`rounded-3xl p-4 transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground">
                    Option {opt.id}
                  </p>
                  <p className="text-sm font-bold text-foreground">{opt.name}</p>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelected(isSelected ? null : opt.id)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isSelected ? "Selected ✓" : "Pick this"}
                </motion.button>
              </div>
              <Comp />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
