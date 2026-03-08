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

// ─── Option G: Dark Glass Overlay ───
function OptionG() {
  const pct = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
  return (
    <div className="relative overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <img src={instructorHeroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="relative px-4 pt-4 pb-3.5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-base">K</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{greeting}, {firstName}</h1>
            <p className="text-[11px] text-white/50">{dateStr}</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Today's Progress</span>
            <span className="text-sm font-bold text-white">{todayCompleted}/{todayTotal}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-white/50">{todayTotal - todayCompleted} lessons remaining</span>
            <span className="text-[10px] text-emerald-300 font-medium">{Math.round(pct)}% complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Option H: Stacked Timeline ───
function OptionH() {
  const lessons = [
    { time: "09:00", name: "Sarah M.", done: true },
    { time: "11:00", name: "James K.", done: true },
    { time: "13:30", name: "Priya S.", done: false },
    { time: "15:00", name: "Tom W.", done: false },
    { time: "17:00", name: "Lucy B.", done: false },
  ];
  return (
    <div className="px-4 pt-3 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName}</h1>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
        </div>
        <div className="bg-primary text-primary-foreground rounded-full px-3 py-1">
          <span className="text-sm font-bold">{todayCompleted}/{todayTotal}</span>
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border/40 p-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {lessons.map((l, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full ${l.done ? "bg-emerald-500" : "bg-muted"}`} />
              <span className="text-[9px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/40">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-foreground font-medium">Next: 13:30 — Priya S.</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ─── Option I: Dual-Tone Card ───
function OptionI() {
  const pct = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
  return (
    <div className="px-4 pt-3 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="rounded-2xl overflow-hidden shadow-sm border border-border/40">
        {/* Top — Primary colored */}
        <div className="bg-primary px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold">K</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-primary-foreground">{greeting}, {firstName}</h1>
              <p className="text-[11px] text-primary-foreground/60">{dateStr}</p>
            </div>
          </div>
        </div>
        {/* Bottom — Card */}
        <div className="bg-card px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Today</span>
            <span className="text-xs font-bold text-foreground">{todayCompleted} of {todayTotal}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex gap-3 mt-2.5">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-[10px] text-muted-foreground">Remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Option J: Radial Dashboard ───
function OptionJ() {
  const todayPct = todayTotal > 0 ? todayCompleted / todayTotal : 0;
  const weekPct = weekTotal > 0 ? weekCompleted / weekTotal : 0;
  const r1 = 30, r2 = 22;
  const c1 = 2 * Math.PI * r1, c2 = 2 * Math.PI * r2;
  return (
    <div className="px-4 pt-3 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] text-muted-foreground">{dateStr}</p>
          <h1 className="text-xl font-bold text-foreground">{greeting}, {firstName}</h1>
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border/40 p-4 shadow-sm flex items-center gap-4">
        <div className="relative w-[76px] h-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
            <circle cx="38" cy="38" r={r1} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <motion.circle cx="38" cy="38" r={r1} fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={c1} initial={{ strokeDashoffset: c1 }} animate={{ strokeDashoffset: c1 * (1 - weekPct) }}
              transition={{ duration: 1.2 }} />
            <circle cx="38" cy="38" r={r2} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <motion.circle cx="38" cy="38" r={r2} fill="none" stroke="#10B981" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={c2} initial={{ strokeDashoffset: c2 }} animate={{ strokeDashoffset: c2 * (1 - todayPct) }}
              transition={{ duration: 1, delay: 0.2 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{todayCompleted}/{todayTotal}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-foreground font-medium">Today</span>
            <span className="text-xs text-muted-foreground ml-auto">{todayCompleted}/{todayTotal}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs text-foreground font-medium">This Week</span>
            <span className="text-xs text-muted-foreground ml-auto">{weekCompleted}/{weekTotal}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Next at 13:30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Option K: Notification-Style Banner ───
function OptionK() {
  return (
    <div className="px-4 pt-3 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
      <p className="text-[11px] text-muted-foreground mb-0.5">{dateStr}</p>
      <h1 className="text-2xl font-bold text-foreground">{greeting} 👋</h1>
      <div className="mt-3 space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{todayCompleted} lessons completed</p>
            <p className="text-[11px] text-muted-foreground">{todayTotal - todayCompleted} more today</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-primary/5 border border-primary/15 rounded-xl px-3.5 py-2.5 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{weekCompleted}/{weekTotal} this week</p>
            <p className="text-[11px] text-muted-foreground">{weekTotal - weekCompleted} lessons to go</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Option L: Map Peek Hero ───
function OptionL() {
  return (
    <div className="relative overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <img src={instructorHeroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="relative px-4 pt-16 pb-3">
        <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-card/90 backdrop-blur-sm rounded-xl border border-border/40 p-2.5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground leading-none">{todayCompleted}/{todayTotal}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Today</p>
            </div>
          </div>
          <div className="flex-1 bg-card/90 backdrop-blur-sm rounded-xl border border-border/40 p-2.5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground leading-none">{weekCompleted}/{weekTotal}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">This Week</p>
            </div>
          </div>
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
    { id: "G", title: "Dark Glass Overlay", desc: "Blurred dark photo hero with glass progress bar", component: <OptionG /> },
    { id: "H", title: "Stacked Timeline", desc: "Timeline segments with next lesson preview", component: <OptionH /> },
    { id: "I", title: "Dual-Tone Card", desc: "Primary header fused with card stats below", component: <OptionI /> },
    { id: "J", title: "Radial Dashboard", desc: "Nested concentric rings with legend", component: <OptionJ /> },
    { id: "K", title: "Notification Banners", desc: "Stacked alert-style stat banners", component: <OptionK /> },
    { id: "L", title: "Map Peek Hero", desc: "Bottom-gradient image with floating stat pills", component: <OptionL /> },
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
