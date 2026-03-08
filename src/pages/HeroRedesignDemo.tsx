import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ChevronRight, MapPin, Clock, CheckCircle, Zap, TrendingUp, Calendar } from "lucide-react";
import instructorHeroImg from "@/assets/hero-instructor.jpg";

const firstName = "Kenneth";
const todayCompleted = 2;
const todayTotal = 5;
const weekCompleted = 12;
const weekTotal = 24;
const greeting = (() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good morning`;
  if (h >= 12 && h < 17) return `Good afternoon`;
  if (h >= 17 && h < 21) return `Good evening`;
  return `Hello`;
})();
const dateStr = format(new Date(), "EEEE d MMMM");

// ─── Option A: Ultra-Compact Bar ───
function OptionA() {
  return (
    <div className="relative overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <img src={instructorHeroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
      <div className="relative px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0">
          <span className="text-white font-semibold text-sm">K</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white leading-tight">{greeting}, {firstName}</h1>
          <p className="text-[11px] text-white/60">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
          <span className="text-lg font-bold text-white">{todayCompleted}/{todayTotal}</span>
          <span className="text-[10px] text-white/70 uppercase font-medium">today</span>
        </div>
      </div>
    </div>
  );
}

// ─── Option B: Split Card — Greeting Left, Stats Right ───
function OptionB() {
  const pct = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
  return (
    <div className="px-4 pt-3 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="flex items-stretch gap-3">
        {/* Greeting card */}
        <div className="flex-1 bg-card rounded-2xl p-3.5 border border-border/40 shadow-sm">
          <p className="text-[11px] text-muted-foreground">{dateStr}</p>
          <h1 className="text-lg font-bold text-foreground leading-tight mt-0.5">{greeting}, {firstName} 👋</h1>
          <div className="flex items-center gap-1 mt-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Wildern Lane</span>
          </div>
        </div>
        {/* Today stats */}
        <div className="w-[100px] bg-primary rounded-2xl p-3.5 flex flex-col items-center justify-center shadow-sm">
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{todayCompleted}</span>
            </div>
          </div>
          <p className="text-[10px] font-medium text-white/80 mt-1">of {todayTotal} today</p>
        </div>
      </div>
    </div>
  );
}

// ─── Option C: Inline Progress Strip ───
function OptionC() {
  const pct = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
  return (
    <div className="px-4 pt-3 pb-1" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold text-foreground">{greeting} 👋</h1>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">K</span>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border/40 p-3 mt-2 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{todayCompleted} of {todayTotal} lessons</p>
              <p className="text-[10px] text-muted-foreground">Today's progress</p>
            </div>
          </div>
          <span className="text-lg font-bold text-emerald-500">{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Option D: Gradient Chip Row ───
function OptionD() {
  return (
    <div className="relative overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <img src={instructorHeroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/95" />
      <div className="relative px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white">{greeting}, {firstName}</h1>
            <p className="text-[11px] text-white/50">{dateStr}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">K</span>
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Today", value: `${todayCompleted}/${todayTotal}`, icon: Calendar, active: true },
            { label: "Week", value: `${weekCompleted}/${weekTotal}`, icon: TrendingUp, active: false },
            { label: "Streak", value: "5d", icon: Zap, active: false },
          ].map((chip) => (
            <div
              key={chip.label}
              className={`flex-1 rounded-xl px-3 py-2 flex items-center gap-2 ${
                chip.active ? "bg-white/20 backdrop-blur-sm" : "bg-white/10"
              }`}
            >
              <chip.icon className="h-3.5 w-3.5 text-white/80" />
              <div>
                <p className="text-sm font-bold text-white leading-none">{chip.value}</p>
                <p className="text-[9px] text-white/60 mt-0.5">{chip.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Option E: Minimal Text + Horizontal Stat Dots ───
function OptionE() {
  return (
    <div className="px-4 pt-3 pb-1" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <p className="text-xs text-muted-foreground">{dateStr}</p>
      <h1 className="text-2xl font-bold text-foreground mt-0.5 leading-tight">{greeting},<br/>{firstName} 👋</h1>
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: todayTotal }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < todayCompleted ? "bg-emerald-500" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{todayCompleted} of {todayTotal} lessons done</span>
      </div>
    </div>
  );
}

// ─── Option F: iOS Widget Stack ───
function OptionF() {
  const pct = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
  const remaining = todayTotal - todayCompleted;
  return (
    <div className="px-4 pt-3 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{dateStr}</p>
          <h1 className="text-xl font-bold text-foreground leading-tight">{greeting}, {firstName}</h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">K</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {/* Today Widget */}
        <div className="bg-card rounded-2xl border border-border/40 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Today</span>
          </div>
          <p className="text-2xl font-bold text-foreground leading-none">{todayCompleted}<span className="text-base text-muted-foreground font-medium">/{todayTotal}</span></p>
          <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{remaining} remaining</p>
        </div>
        {/* Week Widget */}
        <div className="bg-card rounded-2xl border border-border/40 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">This Week</span>
          </div>
          <p className="text-2xl font-bold text-foreground leading-none">{weekCompleted}<span className="text-base text-muted-foreground font-medium">/{weekTotal}</span></p>
          <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(weekCompleted / weekTotal) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{weekTotal - weekCompleted} to go</p>
        </div>
      </div>
    </div>
  );
}

export default function HeroRedesignDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const options = [
    { id: "A", title: "Ultra-Compact Bar", desc: "Single-row hero with inline stat pill", component: <OptionA /> },
    { id: "B", title: "Split Card", desc: "Greeting left, progress ring right", component: <OptionB /> },
    { id: "C", title: "Inline Progress Strip", desc: "Text greeting with progress bar card below", component: <OptionC /> },
    { id: "D", title: "Gradient Chip Row", desc: "Image hero with stat chips", component: <OptionD /> },
    { id: "E", title: "Minimal Dots", desc: "Large text greeting with dot progress", component: <OptionE /> },
    { id: "F", title: "iOS Widget Stack", desc: "Two-column widget grid below greeting", component: <OptionF /> },
  ];

  return (
    <div className="min-h-screen bg-muted/50 pb-20">
      <div className="bg-card border-b border-border px-4 py-3 sticky top-0 z-50">
        <h1 className="text-lg font-bold text-foreground">Hero Redesign Options</h1>
        <p className="text-xs text-muted-foreground">Tap a card to see it highlighted</p>
      </div>
      <div className="space-y-6 pt-4">
        {options.map((opt) => (
          <div key={opt.id} className="px-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center">{opt.id}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
              </div>
            </div>
            <div
              onClick={() => setSelected(opt.id === selected ? null : opt.id)}
              className={`rounded-2xl overflow-hidden border-2 transition-colors cursor-pointer ${
                selected === opt.id ? "border-primary shadow-lg" : "border-border/40"
              }`}
            >
              <div className="bg-background">
                {opt.component}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
