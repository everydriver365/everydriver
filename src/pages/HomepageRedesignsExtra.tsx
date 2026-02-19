import {
  BookOpen, PoundSterling, Target, Clock, MapPin, Play,
  ChevronDown, ChevronRight, Mail, Car,
  TrendingUp, Calendar, User, Bell, Sun, Heart, Zap, BarChart3,
  ArrowRight, Star, Shield, Navigation, Layers,
  Fuel, CheckCircle, MessageSquare, Compass, Gauge, Route,
  Trophy, Sparkles, ListChecks, CircleDot, Timer, ArrowUpRight,
  GraduationCap, Lightbulb, Megaphone, Gift, Flame, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATS = { lessons: 4, earnings: 140, weekly: 72, nextTime: "10:30" };
const PUPIL = "Sarah M";
const LOCATION = "SW1A 1AA";
const SCHEDULE = [
  { time: "09:00", name: "Sarah M", loc: "SW1A 1AA" },
  { time: "11:00", name: "James R", loc: "EC1A 1BB" },
  { time: "13:30", name: "Emma W", loc: "W1A 1AB" },
  { time: "15:00", name: "Tom B", loc: "SE1 7PB" },
];

// ─── DESIGN 11: Pill Dashboard ───
export function Design11() {
  return (
    <div className="bg-[#fafafa] dark:bg-[#111] min-h-full pb-6">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-muted-foreground">Wednesday</p>
        <p className="text-xl font-black">Dashboard</p>
      </div>
      {/* Pill stats row */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { label: "Lessons", value: "4", bg: "bg-primary/10 text-primary" },
          { label: "Earned", value: "£140", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "Goal", value: "72%", bg: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
          { label: "Msgs", value: "2", bg: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
        ].map((s, i) => (
          <div key={i} className={cn("flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold", s.bg)}>
            {s.value} {s.label}
          </div>
        ))}
      </div>
      {/* Next lesson - full width hero */}
      <div className="mx-4 mt-3 bg-primary rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <p className="text-[10px] uppercase tracking-wider text-white/50">NEXT LESSON</p>
        <p className="text-lg font-bold mt-1">{PUPIL}</p>
        <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
        <div className="flex gap-2 mt-3">
          <button className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Navigate</button>
          <button className="px-3 py-1.5 bg-white text-primary rounded-lg text-xs font-medium">Start</button>
        </div>
      </div>
      {/* Schedule list */}
      <div className="mx-4 mt-3 bg-white dark:bg-card rounded-2xl border p-3">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">SCHEDULE</p>
        {SCHEDULE.map((l, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0 border-border/50">
            <span className="text-xs font-mono text-muted-foreground w-10">{l.time}</span>
            <span className="text-sm font-medium flex-1">{l.name}</span>
            <span className="text-[10px] text-muted-foreground">{l.loc}</span>
          </div>
        ))}
      </div>
      {/* Actions grid */}
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {[
          { icon: Calendar, label: "Diary" },
          { icon: Navigation, label: "SatNav" },
          { icon: Car, label: "Vehicle" },
          { icon: PoundSterling, label: "Pay" },
          { icon: Heart, label: "Health" },
          { icon: Fuel, label: "Fuel" },
          { icon: BarChart3, label: "Stats" },
          { icon: Star, label: "Goals" },
        ].map((a, i) => (
          <div key={i} className="flex flex-col items-center gap-1 py-2">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <a.icon className="h-4.5 w-4.5 text-foreground/60" />
            </div>
            <span className="text-[9px] text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>
      {/* Tomorrow */}
      <div className="mx-4 mt-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-3">
        <p className="text-[10px] font-semibold uppercase text-violet-600 dark:text-violet-400">TOMORROW</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 12: Newspaper ───
export function Design12() {
  return (
    <div className="bg-[#fdf6e3] dark:bg-[#1a1a1a] min-h-full pb-6 font-serif">
      <div className="border-b-2 border-foreground/20 px-4 pt-3 pb-2 text-center">
        <p className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground">THE DAILY DRIVER</p>
        <p className="text-2xl font-black mt-0.5" style={{ fontFamily: "Georgia, serif" }}>Wednesday Edition</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">4 Lessons · £140 Expected · 72% Goal</p>
      </div>
      {/* Headline */}
      <div className="px-4 pt-3 border-b border-foreground/10 pb-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">BREAKING</p>
        <p className="text-lg font-bold mt-1" style={{ fontFamily: "Georgia, serif" }}>Next: {PUPIL} at 10:30</p>
        <p className="text-xs text-muted-foreground mt-1">Pickup from {LOCATION}. Estimated journey time: 15 minutes. Lesson duration: 1.5 hours.</p>
        <button className="mt-2 text-xs font-bold text-primary">START LESSON →</button>
      </div>
      {/* Two columns */}
      <div className="px-4 pt-3 grid grid-cols-2 gap-3">
        <div className="border-r border-foreground/10 pr-3">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="py-1.5 border-b border-foreground/5 last:border-0">
              <p className="text-xs font-semibold">{l.name}</p>
              <p className="text-[10px] text-muted-foreground">{l.time} · {l.loc}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">INBOX</p>
          <div className="py-1.5 border-b border-foreground/5">
            <p className="text-xs font-semibold">2 Unread</p>
            <p className="text-[10px] text-muted-foreground">James R, Emma W</p>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2 mt-3">EARNINGS</p>
          <p className="text-2xl font-black">£140</p>
          <p className="text-[10px] text-muted-foreground">Today's projection</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2 mt-3">FORECAST</p>
          <p className="text-sm font-bold">Tomorrow: 3 lessons</p>
          <p className="text-[10px] text-muted-foreground">£105 expected</p>
        </div>
      </div>
      {/* Quick links */}
      <div className="px-4 mt-4 flex gap-2 flex-wrap">
        {["Diary", "SatNav", "Vehicle", "Pay", "Health"].map((l, i) => (
          <span key={i} className="px-3 py-1 border border-foreground/20 text-[10px] font-semibold uppercase tracking-wider">{l}</span>
        ))}
      </div>
    </div>
  );
}

// ─── DESIGN 13: Neon Dark ───
export function Design13() {
  return (
    <div className="bg-[#0a0a0f] text-white min-h-full pb-6">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-cyan-400 uppercase tracking-widest">EVERY DRIVER</p>
          <p className="text-lg font-bold mt-0.5">Good morning</p>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Bell className="h-3.5 w-3.5 text-cyan-400" />
          </div>
        </div>
      </div>
      {/* Glowing metric */}
      <div className="mx-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-cyan-400/60 uppercase">Today's earnings</p>
            <p className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">£140</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white/80">4</p>
            <p className="text-[10px] text-white/40">lessons</p>
          </div>
        </div>
        <div className="mt-3 h-1 bg-white/5 rounded-full">
          <div className="h-full w-[72%] bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full" />
        </div>
        <p className="text-[10px] text-white/30 mt-1">72% weekly goal</p>
      </div>
      {/* Next lesson */}
      <div className="mx-4 mt-3 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-cyan-400 uppercase">Next lesson</p>
            <p className="text-sm font-bold mt-1">{PUPIL}</p>
            <p className="text-xs text-white/40">10:30 · {LOCATION}</p>
          </div>
          <button className="px-4 py-2 bg-cyan-500 text-black rounded-xl text-xs font-bold">GO</button>
        </div>
      </div>
      {/* Schedule */}
      <div className="mx-4 mt-3">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">SCHEDULE</p>
        {SCHEDULE.map((l, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <span className="text-[10px] font-mono text-cyan-400/60 w-10">{l.time}</span>
            <span className="text-sm flex-1">{l.name}</span>
          </div>
        ))}
      </div>
      {/* Messages */}
      <div className="mx-4 mt-3 border border-purple-500/20 bg-purple-500/5 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-purple-400" />
          <span className="text-sm">2 messages</span>
        </div>
        <span className="w-5 h-5 rounded-full bg-purple-500 text-[10px] font-bold flex items-center justify-center">2</span>
      </div>
      {/* Actions */}
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {[
          { icon: Navigation, label: "SatNav", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
          { icon: Calendar, label: "Diary", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
          { icon: Car, label: "Vehicle", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: PoundSterling, label: "Pay", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
        ].map((a, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", a.color)}>
              <a.icon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/30">{a.label}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 border border-white/5 rounded-xl p-3">
        <p className="text-[10px] text-white/30 uppercase">Tomorrow</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 14: Bubble Cards ───
export function Design14() {
  return (
    <div className="bg-gradient-to-b from-sky-50 to-white dark:from-sky-950/30 dark:to-background min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xl font-black">Hi there 👋</p>
        <p className="text-xs text-muted-foreground">4 lessons today · £140</p>
      </div>
      {/* Chat-like bubbles */}
      <div className="px-4 space-y-2 mt-2">
        <div className="bg-primary text-white rounded-2xl rounded-tl-md p-3 max-w-[85%]">
          <p className="text-xs font-medium">Your next lesson is with {PUPIL} at 10:30</p>
          <p className="text-[10px] text-white/60 mt-0.5">{LOCATION} · in 25 min</p>
          <button className="mt-2 px-3 py-1 bg-white/20 rounded-lg text-[10px] font-medium">Start Lesson →</button>
        </div>
        <div className="bg-card border rounded-2xl rounded-tl-md p-3 max-w-[85%]">
          <p className="text-xs font-medium">📬 2 unread messages from pupils</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl rounded-tl-md p-3 max-w-[85%]">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">💰 £140 expected today · 72% of weekly goal</p>
        </div>
        <div className="bg-card border rounded-2xl rounded-tl-md p-3 max-w-[90%]">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">TODAY'S SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="text-[10px] text-muted-foreground w-10">{l.time}</span>
              <span className="text-xs font-medium">{l.name}</span>
            </div>
          ))}
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl rounded-tl-md p-3 max-w-[80%]">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-400">📅 Tomorrow: 3 lessons · £105</p>
        </div>
      </div>
      {/* Quick actions */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {["Diary", "SatNav", "Vehicle", "Pay", "Health", "Fuel"].map((a, i) => (
          <button key={i} className="flex-shrink-0 px-4 py-2 bg-card border rounded-full text-xs font-medium">{a}</button>
        ))}
      </div>
    </div>
  );
}

// ─── DESIGN 15: Dashboard Panels ───
export function Design15() {
  return (
    <div className="bg-[#f0f0f5] dark:bg-[#111] min-h-full pb-6">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 pt-3 pb-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">EVERY DRIVER</p>
          <div className="flex gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center"><Mail className="h-3.5 w-3.5" /></div>
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center"><Bell className="h-3.5 w-3.5" /></div>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">Today's overview</p>
        <div className="flex items-baseline gap-3 mt-1">
          <p className="text-3xl font-black">£140</p>
          <span className="text-emerald-300 text-xs font-medium">↑ 12%</span>
        </div>
      </div>
      <div className="px-3 -mt-6 space-y-2">
        {/* 3-col metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "4", l: "Lessons", c: "text-indigo-600" },
            { v: "72%", l: "Goal", c: "text-purple-600" },
            { v: "2", l: "Messages", c: "text-rose-600" },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-card rounded-xl p-3 text-center shadow-sm">
              <p className={cn("text-lg font-black", m.c)}>{m.v}</p>
              <p className="text-[9px] text-muted-foreground">{m.l}</p>
            </div>
          ))}
        </div>
        {/* Next up */}
        <div className="bg-white dark:bg-card rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Play className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold">{PUPIL}</p>
                <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">Start</button>
          </div>
        </div>
        {/* Schedule */}
        <div className="bg-white dark:bg-card rounded-xl p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">TODAY</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-indigo-400" />
                <span className="text-xs font-medium">{l.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        {/* Actions */}
        <div className="bg-white dark:bg-card rounded-xl p-3 shadow-sm grid grid-cols-4 gap-2">
          {[
            { icon: Calendar, label: "Diary" },
            { icon: Navigation, label: "SatNav" },
            { icon: Car, label: "Vehicle" },
            { icon: PoundSterling, label: "Pay" },
          ].map((a, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <a.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[9px] text-muted-foreground">{a.label}</span>
            </div>
          ))}
        </div>
        {/* Tomorrow */}
        <div className="bg-white dark:bg-card rounded-xl p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 16: Kanban Lanes ───
export function Design16() {
  return (
    <div className="bg-muted/50 min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-lg font-black">Today</p>
        <p className="text-xs text-muted-foreground">4 lessons · £140 · 72% goal</p>
      </div>
      {/* Horizontal scroll lanes */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2" style={{ minWidth: "600px" }}>
          {/* Done lane */}
          <div className="w-[180px] flex-shrink-0">
            <p className="text-[10px] font-bold uppercase text-emerald-600 mb-2">✓ DONE</p>
            <div className="space-y-2">
              <div className="bg-card border rounded-xl p-3"><p className="text-xs font-medium">Sarah M</p><p className="text-[10px] text-muted-foreground">09:00</p></div>
            </div>
          </div>
          {/* Current lane */}
          <div className="w-[180px] flex-shrink-0">
            <p className="text-[10px] font-bold uppercase text-primary mb-2">▶ NOW</p>
            <div className="space-y-2">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs font-bold">James R</p>
                <p className="text-[10px] text-muted-foreground">11:00 · EC1A</p>
                <button className="mt-2 text-[10px] font-bold text-primary">START →</button>
              </div>
            </div>
          </div>
          {/* Up next lane */}
          <div className="w-[180px] flex-shrink-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">LATER</p>
            <div className="space-y-2">
              <div className="bg-card border rounded-xl p-3"><p className="text-xs font-medium">Emma W</p><p className="text-[10px] text-muted-foreground">13:30</p></div>
              <div className="bg-card border rounded-xl p-3"><p className="text-xs font-medium">Tom B</p><p className="text-[10px] text-muted-foreground">15:00</p></div>
            </div>
          </div>
        </div>
      </div>
      {/* Stats + Messages */}
      <div className="px-4 mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border rounded-xl p-3">
            <PoundSterling className="h-4 w-4 text-emerald-600 mb-1" />
            <p className="text-xl font-black">£140</p>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </div>
          <div className="bg-card border rounded-xl p-3">
            <Mail className="h-4 w-4 text-rose-500 mb-1" />
            <p className="text-xl font-black">2</p>
            <p className="text-[10px] text-muted-foreground">Messages</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-3 grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, Heart].map((Icon, i) => (
            <div key={i} className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted mx-auto">
              <Icon className="h-4 w-4 text-foreground/60" />
            </div>
          ))}
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-violet-600">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 17: Gradient Sections ───
export function Design17() {
  return (
    <div className="min-h-full bg-background pb-6">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 pt-3 pb-5 rounded-b-3xl">
        <p className="text-white/50 text-[10px] uppercase tracking-wider">EVERY DRIVER</p>
        <p className="text-2xl font-black mt-1">£140</p>
        <p className="text-white/60 text-xs">4 lessons today</p>
        <div className="flex gap-2 mt-3">
          <div className="bg-white/15 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-sm font-bold">72%</p>
            <p className="text-[9px] text-white/50">Goal</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-sm font-bold">6.5h</p>
            <p className="text-[9px] text-white/50">Hours</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-sm font-bold">2</p>
            <p className="text-[9px] text-white/50">Msgs</p>
          </div>
        </div>
      </div>
      <div className="px-4 -mt-3 space-y-2">
        <div className="bg-card border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">NEXT UP</p>
              <p className="text-sm font-bold mt-0.5">{PUPIL}</p>
              <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
            </div>
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold">Start</button>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0 border-border/50">
              <div className="w-1 h-4 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium flex-1">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="bg-card border rounded-xl p-3 flex flex-col items-center gap-1">
              <Icon className="h-5 w-5 text-emerald-600" />
              <span className="text-[9px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-card border rounded-2xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-semibold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 18: Single Column Focus ───
export function Design18() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-5 pt-5">
        <p className="text-2xl font-black">Hello</p>
        <p className="text-muted-foreground text-sm mt-0.5">Wednesday · 4 lessons ahead</p>
      </div>
      {/* Big next lesson card */}
      <div className="mx-5 mt-4 border-l-4 border-primary pl-4 py-2">
        <p className="text-[10px] uppercase text-primary font-bold tracking-wider">NEXT</p>
        <p className="text-lg font-bold mt-0.5">{PUPIL}</p>
        <p className="text-sm text-muted-foreground">10:30 AM · {LOCATION}</p>
        <button className="mt-2 text-sm font-bold text-primary">Start lesson →</button>
      </div>
      {/* Divider */}
      <div className="mx-5 my-4 h-px bg-border" />
      {/* Inline stats */}
      <div className="mx-5 flex items-center justify-between">
        <div><p className="text-2xl font-black">£140</p><p className="text-[10px] text-muted-foreground">Today</p></div>
        <div className="text-center"><p className="text-2xl font-black">72%</p><p className="text-[10px] text-muted-foreground">Goal</p></div>
        <div className="text-right"><p className="text-2xl font-black text-rose-500">2</p><p className="text-[10px] text-muted-foreground">Unread</p></div>
      </div>
      <div className="mx-5 my-4 h-px bg-border" />
      {/* Schedule */}
      <div className="mx-5">
        <p className="text-xs font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
        {SCHEDULE.map((l, i) => (
          <div key={i} className="py-2.5 border-b border-border/50 last:border-0 flex items-center justify-between">
            <span className="text-sm font-medium">{l.name}</span>
            <span className="text-xs text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
      <div className="mx-5 my-4 h-px bg-border" />
      {/* Quick links */}
      <div className="mx-5 flex gap-2 flex-wrap">
        {["Diary", "SatNav", "Vehicle", "Pay", "Health", "Fuel"].map((l, i) => (
          <button key={i} className="px-3 py-1.5 border rounded-lg text-xs font-medium">{l}</button>
        ))}
      </div>
      <div className="mx-5 mt-4 p-3 bg-muted/50 rounded-xl">
        <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
        <p className="text-sm font-medium mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 19: Status Bar ───
export function Design19() {
  return (
    <div className="bg-background min-h-full pb-6">
      {/* Top status ticker */}
      <div className="bg-primary text-white px-4 py-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Next: {PUPIL} in 25 min
        </span>
        <span>£140 today</span>
      </div>
      {/* Main content */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-black">Wednesday</p>
          <div className="flex gap-1.5">
            <div className="relative">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[8px] font-bold flex items-center justify-center">2</span>
            </div>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {/* Big stat trio */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-primary/5 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-primary">4</p>
            <p className="text-[9px] text-muted-foreground">Lessons</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">£140</p>
            <p className="text-[9px] text-muted-foreground">Earned</p>
          </div>
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400">72%</p>
            <p className="text-[9px] text-muted-foreground">Goal</p>
          </div>
        </div>
        {/* Next lesson CTA */}
        <div className="bg-card border rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"><Play className="h-5 w-5 text-white" /></div>
            <div className="flex-1">
              <p className="font-bold">{PUPIL}</p>
              <p className="text-xs text-muted-foreground">10:30 · {LOCATION}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {/* Schedule */}
        <div className="bg-card border rounded-2xl p-3 mb-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">FULL SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0 border-border/50">
              <span className="text-[10px] font-mono text-muted-foreground w-10">{l.time}</span>
              <span className="text-xs font-medium">{l.name}</span>
            </div>
          ))}
        </div>
        {/* Actions */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { icon: Calendar, label: "Diary" },
            { icon: Navigation, label: "SatNav" },
            { icon: Car, label: "Vehicle" },
            { icon: PoundSterling, label: "Pay" },
          ].map((a, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-2">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><a.icon className="h-4 w-4 text-foreground/60" /></div>
              <span className="text-[9px] text-muted-foreground">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 20: Widgets iOS-style ───
export function Design20() {
  return (
    <div className="bg-[#f2f2f7] dark:bg-[#1c1c1e] min-h-full pb-6">
      <div className="px-4 pt-3">
        <p className="text-[10px] text-muted-foreground uppercase">Wednesday</p>
        <p className="text-xl font-black">Widgets</p>
      </div>
      <div className="px-3 mt-3 space-y-2">
        {/* Large widget: Next lesson */}
        <div className="bg-white dark:bg-card rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center"><Calendar className="h-3.5 w-3.5 text-white" /></div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">NEXT LESSON</span>
          </div>
          <p className="text-lg font-bold">{PUPIL}</p>
          <p className="text-xs text-muted-foreground">10:30 AM · {LOCATION} · in 25 min</p>
        </div>
        {/* 2-col widgets */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-[20px] p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center"><PoundSterling className="h-3 w-3 text-white" /></div>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase">EARNINGS</span>
            </div>
            <p className="text-2xl font-black">£140</p>
            <p className="text-[10px] text-muted-foreground">4 lessons</p>
          </div>
          <div className="bg-white dark:bg-card rounded-[20px] p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-md bg-violet-500 flex items-center justify-center"><Target className="h-3 w-3 text-white" /></div>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase">GOAL</span>
            </div>
            <p className="text-2xl font-black">72%</p>
            <div className="mt-1 h-1.5 bg-muted rounded-full"><div className="h-full w-[72%] bg-violet-500 rounded-full" /></div>
          </div>
        </div>
        {/* Messages widget */}
        <div className="bg-white dark:bg-card rounded-[20px] p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-rose-500 flex items-center justify-center"><Mail className="h-3.5 w-3.5 text-white" /></div>
            <div>
              <p className="text-sm font-semibold">Messages</p>
              <p className="text-[10px] text-muted-foreground">2 unread</p>
            </div>
          </div>
          <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        {/* Schedule widget */}
        <div className="bg-white dark:bg-card rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center"><ListChecks className="h-3 w-3 text-white" /></div>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">SCHEDULE</span>
          </div>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0 border-border/30">
              <span className="text-[10px] font-mono text-muted-foreground w-10">{l.time}</span>
              <span className="text-xs font-medium flex-1">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.loc}</span>
            </div>
          ))}
        </div>
        {/* Actions widget */}
        <div className="bg-white dark:bg-card rounded-[20px] p-3 shadow-sm grid grid-cols-4 gap-2">
          {[
            { icon: Calendar, label: "Diary", color: "bg-primary" },
            { icon: Navigation, label: "SatNav", color: "bg-emerald-500" },
            { icon: Car, label: "Vehicle", color: "bg-sky-500" },
            { icon: PoundSterling, label: "Pay", color: "bg-amber-500" },
          ].map((a, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", a.color)}>
                <a.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-[9px] text-muted-foreground">{a.label}</span>
            </div>
          ))}
        </div>
        {/* Tomorrow widget */}
        <div className="bg-white dark:bg-card rounded-[20px] p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center"><Sun className="h-3 w-3 text-white" /></div>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">TOMORROW</span>
          </div>
          <p className="text-sm font-bold">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 21: Card Carousel ───
export function Design21() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Wednesday</p>
          <p className="text-lg font-black">Home</p>
        </div>
        <div className="flex gap-1.5">
          <div className="relative w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Mail className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-white text-[8px] font-bold flex items-center justify-center">2</span>
          </div>
        </div>
      </div>
      {/* Carousel cards */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          <div className="w-[260px] flex-shrink-0 bg-primary text-white rounded-2xl p-4">
            <p className="text-[10px] uppercase text-white/50">NEXT LESSON</p>
            <p className="text-lg font-bold mt-1">{PUPIL}</p>
            <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
            <button className="mt-3 px-4 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Start →</button>
          </div>
          <div className="w-[160px] flex-shrink-0 bg-emerald-500 text-white rounded-2xl p-4">
            <p className="text-[10px] uppercase text-white/50">EARNINGS</p>
            <p className="text-3xl font-black mt-1">£140</p>
            <p className="text-white/60 text-xs">4 lessons</p>
          </div>
          <div className="w-[160px] flex-shrink-0 bg-violet-500 text-white rounded-2xl p-4">
            <p className="text-[10px] uppercase text-white/50">GOAL</p>
            <p className="text-3xl font-black mt-1">72%</p>
            <p className="text-white/60 text-xs">Weekly</p>
          </div>
        </div>
      </div>
      {/* Schedule */}
      <div className="px-4 mt-2">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
        <div className="bg-card border rounded-2xl divide-y divide-border/50">
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{l.name.charAt(0)}</div>
                <span className="text-sm font-medium">{l.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Actions */}
      <div className="px-4 mt-3 grid grid-cols-4 gap-2">
        {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
          <div key={i} className="bg-card border rounded-xl p-3 flex flex-col items-center gap-1">
            <Icon className="h-5 w-5 text-foreground/60" />
            <span className="text-[9px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 bg-muted/50 rounded-xl p-3">
        <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 22: Progress Ring ───
export function Design22() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="flex flex-col items-center pt-5 pb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-primary" strokeWidth="8" strokeDasharray={`${72 * 2.64} ${100 * 2.64}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-black">72%</p>
            <p className="text-[9px] text-muted-foreground">GOAL</p>
          </div>
        </div>
        <div className="flex gap-6 mt-3">
          <div className="text-center"><p className="text-lg font-bold">4</p><p className="text-[9px] text-muted-foreground">Lessons</p></div>
          <div className="text-center"><p className="text-lg font-bold">£140</p><p className="text-[9px] text-muted-foreground">Earned</p></div>
          <div className="text-center"><p className="text-lg font-bold">2</p><p className="text-[9px] text-muted-foreground">Msgs</p></div>
        </div>
      </div>
      <div className="px-4 space-y-2">
        {/* Next */}
        <div className="bg-card border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Play className="h-5 w-5 text-primary" /></div>
          <div className="flex-1"><p className="text-sm font-bold">{PUPIL}</p><p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p></div>
          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold">Start</button>
        </div>
        <div className="bg-card border rounded-2xl p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
              <span className="text-xs font-medium">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="bg-card border rounded-xl p-2.5 flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-foreground/60" />
              <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 23: Sidebar Tabs ───
export function Design23() {
  return (
    <div className="bg-background min-h-full flex">
      {/* Left sidebar mini nav */}
      <div className="w-12 bg-primary flex flex-col items-center py-4 gap-4">
        {[Calendar, PoundSterling, Mail, Car, Heart].map((Icon, i) => (
          <div key={i} className={cn("w-8 h-8 rounded-lg flex items-center justify-center", i === 0 ? "bg-white/20" : "bg-transparent hover:bg-white/10")}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        ))}
      </div>
      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-3 pt-4">
          <p className="text-lg font-black">Today</p>
          <p className="text-xs text-muted-foreground">4 lessons · £140</p>
        </div>
        {/* Stats */}
        <div className="px-3 mt-3 grid grid-cols-2 gap-2">
          <div className="bg-primary/5 rounded-xl p-2.5 text-center">
            <p className="text-xl font-black text-primary">£140</p>
            <p className="text-[9px] text-muted-foreground">Earned</p>
          </div>
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-2.5 text-center">
            <p className="text-xl font-black text-violet-600">72%</p>
            <p className="text-[9px] text-muted-foreground">Goal</p>
          </div>
        </div>
        {/* Next + Schedule */}
        <div className="px-3 mt-3 space-y-2">
          <div className="border rounded-xl p-3 bg-primary/5 border-primary/20">
            <p className="text-[10px] text-primary font-bold uppercase">NEXT</p>
            <p className="text-sm font-bold mt-0.5">{PUPIL} · 10:30</p>
            <p className="text-[10px] text-muted-foreground">{LOCATION}</p>
          </div>
          {SCHEDULE.slice(1).map((l, i) => (
            <div key={i} className="border rounded-xl p-3">
              <p className="text-xs font-medium">{l.name}</p>
              <p className="text-[10px] text-muted-foreground">{l.time} · {l.loc}</p>
            </div>
          ))}
          <div className="border rounded-xl p-3 bg-muted/30">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
            <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 24: Stacked Layers ───
export function Design24() {
  return (
    <div className="bg-[#f5f5f5] dark:bg-[#111] min-h-full pb-6">
      {/* Floating top bar */}
      <div className="mx-3 mt-3 bg-card border rounded-2xl p-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-bold">EVERY DRIVER</p>
          <p className="text-[10px] text-muted-foreground">Wednesday</p>
        </div>
        <div className="flex gap-1.5">
          <div className="relative w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Mail className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive text-white text-[7px] font-bold flex items-center justify-center">2</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">JD</div>
        </div>
      </div>
      {/* Layered cards with slight overlap */}
      <div className="px-3 mt-3 space-y-[-4px]">
        <div className="bg-primary text-white rounded-2xl p-4 relative z-30 shadow-md">
          <p className="text-[10px] uppercase text-white/50">NEXT LESSON</p>
          <div className="flex items-center justify-between mt-1">
            <div>
              <p className="text-lg font-bold">{PUPIL}</p>
              <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
            </div>
            <button className="px-3 py-1.5 bg-white text-primary rounded-xl text-xs font-bold">Start</button>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-4 pt-6 relative z-20 shadow-sm">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xl font-black text-primary">4</p><p className="text-[9px] text-muted-foreground">Lessons</p></div>
            <div><p className="text-xl font-black text-emerald-600">£140</p><p className="text-[9px] text-muted-foreground">Earned</p></div>
            <div><p className="text-xl font-black text-violet-600">72%</p><p className="text-[9px] text-muted-foreground">Goal</p></div>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-4 pt-6 relative z-10 shadow-sm">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
              <span className="text-xs font-medium">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 mt-3 grid grid-cols-4 gap-2">
        {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
          <div key={i} className="bg-card border rounded-xl p-3 flex flex-col items-center gap-1">
            <Icon className="h-4 w-4 text-foreground/60" />
            <span className="text-[9px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-3 mt-3 bg-card border rounded-2xl p-3">
        <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 25: Activity Ring + List ───
export function Design25() {
  return (
    <div className="bg-black text-white min-h-full pb-6">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-lg font-bold">Activity</p>
        <div className="flex gap-1.5">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><Mail className="h-3.5 w-3.5" /></div>
        </div>
      </div>
      {/* Three rings */}
      <div className="flex justify-center py-4">
        <div className="relative w-32 h-32">
          {[
            { r: 55, pct: 72, color: "#ef4444" },
            { r: 43, pct: 100, color: "#22c55e" },
            { r: 31, pct: 60, color: "#3b82f6" },
          ].map((ring, i) => (
            <svg key={i} className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={ring.r} fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="8" />
              <circle cx="65" cy="65" r={ring.r} fill="none" stroke={ring.color} strokeWidth="8" strokeDasharray={`${ring.pct * ring.r * 0.0628} ${100 * ring.r * 0.0628}`} strokeLinecap="round" />
            </svg>
          ))}
        </div>
      </div>
      <div className="px-4 flex justify-center gap-4 mb-4">
        <span className="text-[10px] text-red-400">● Goal 72%</span>
        <span className="text-[10px] text-green-400">● Lessons 4/4</span>
        <span className="text-[10px] text-blue-400">● Hours 60%</span>
      </div>
      {/* Next */}
      <div className="mx-4 bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">{PUPIL}</p>
          <p className="text-[10px] text-white/40">10:30 · {LOCATION}</p>
        </div>
        <button className="px-3 py-1.5 bg-red-500 rounded-xl text-[10px] font-bold">Start</button>
      </div>
      {/* Schedule */}
      <div className="mx-4 mt-3">
        {SCHEDULE.map((l, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
            <span className="text-[10px] font-mono text-white/30 w-10">{l.time}</span>
            <span className="text-sm flex-1">{l.name}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Icon className="h-4 w-4 text-white/50" /></div>
            <span className="text-[8px] text-white/30">{["Diary", "Nav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 bg-white/5 rounded-xl p-3">
        <p className="text-[10px] text-white/30 uppercase">Tomorrow</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 26: Map Header ───
export function Design26() {
  return (
    <div className="bg-background min-h-full pb-6">
      {/* Fake map header */}
      <div className="h-36 bg-gradient-to-b from-emerald-200 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        {/* Location pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <MapPin className="h-4 w-4 text-white" />
          </div>
        </div>
        {/* Overlay info */}
        <div className="absolute bottom-2 left-3 right-3 bg-card/90 backdrop-blur rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold">Next: {PUPIL}</p>
            <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
          </div>
          <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold">Go</button>
        </div>
      </div>
      <div className="px-4 mt-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-primary">4</p>
            <p className="text-[9px] text-muted-foreground">Lessons</p>
          </div>
          <div className="bg-card border rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-emerald-600">£140</p>
            <p className="text-[9px] text-muted-foreground">Earned</p>
          </div>
          <div className="bg-card border rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-rose-500">2</p>
            <p className="text-[9px] text-muted-foreground">Msgs</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
              <span className="text-xs font-medium">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="bg-card border rounded-xl p-2.5 flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-foreground/60" />
              <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 27: Accordion Sections ───
export function Design27() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xl font-black">Home</p>
        <p className="text-xs text-muted-foreground">Wed · 4 lessons · £140</p>
      </div>
      {/* Accordion-style sections */}
      <div className="px-4 space-y-1 mt-2">
        {/* Next - always open */}
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-primary">▶ NEXT LESSON</span>
            <span className="text-[10px] text-muted-foreground">in 25 min</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div><p className="text-sm font-bold">{PUPIL}</p><p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p></div>
            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold">Start</button>
          </div>
        </div>
        {/* Stats */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between bg-muted/30">
            <span className="text-xs font-bold">📊 STATS</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-lg font-black">4</p><p className="text-[9px] text-muted-foreground">Lessons</p></div>
            <div><p className="text-lg font-black">£140</p><p className="text-[9px] text-muted-foreground">Earned</p></div>
            <div><p className="text-lg font-black">72%</p><p className="text-[9px] text-muted-foreground">Goal</p></div>
          </div>
        </div>
        {/* Messages */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between bg-muted/30">
            <span className="text-xs font-bold">✉️ MESSAGES</span>
            <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
          </div>
        </div>
        {/* Schedule */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between bg-muted/30">
            <span className="text-xs font-bold">📅 SCHEDULE</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="px-4 py-2">
            {SCHEDULE.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
                <span className="text-xs font-medium">{l.name}</span>
                <span className="text-[10px] text-muted-foreground">{l.time}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Actions */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30">
            <span className="text-xs font-bold">⚡ QUICK ACTIONS</span>
          </div>
          <div className="px-4 py-3 grid grid-cols-4 gap-2">
            {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Icon className="h-4 w-4 text-foreground/60" /></div>
                <span className="text-[9px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Tomorrow */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-bold">🔮 TOMORROW</span>
            <span className="text-xs font-medium">3 lessons · £105</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 28: Big Type ───
export function Design28() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-5 pt-5 space-y-6">
        <div>
          <p className="text-3xl font-black leading-tight">4 lessons<br/>£140 today</p>
          <p className="text-sm text-muted-foreground mt-1">Wednesday · 72% of weekly goal</p>
        </div>
        {/* Next */}
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">NEXT UP</p>
          <p className="text-xl font-bold">{PUPIL}</p>
          <p className="text-sm text-muted-foreground">10:30 AM · {LOCATION}</p>
          <button className="mt-2 text-sm font-bold text-primary">Start lesson →</button>
        </div>
        {/* Messages */}
        <div className="flex items-center justify-between py-3 border-y border-border">
          <p className="text-sm font-bold">2 unread messages</p>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        {/* Schedule */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="py-2 border-b border-border/50 last:border-0">
              <p className="text-sm font-medium">{l.name}</p>
              <p className="text-xs text-muted-foreground">{l.time} · {l.loc}</p>
            </div>
          ))}
        </div>
        {/* Actions as text links */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-2 gap-2">
            {["Open Diary", "Navigate", "Vehicle Health", "Take Payment", "Health Hub", "Fuel Log"].map((a, i) => (
              <button key={i} className="text-left text-sm font-medium text-primary py-1">{a} →</button>
            ))}
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">TOMORROW</p>
          <p className="text-lg font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 29: Streak/Gamified ───
export function Design29() {
  return (
    <div className="bg-[#0f0f0f] text-white min-h-full pb-6">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-400 font-bold">🔥 12 day streak</p>
          <p className="text-lg font-black mt-0.5">Wednesday</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-400">⭐ Level 8</div>
        </div>
      </div>
      {/* XP Bar */}
      <div className="mx-4 mt-1">
        <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
          <span>Daily XP</span><span>720/1000</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full"><div className="h-full w-[72%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" /></div>
      </div>
      {/* Stats as achievements */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
          <p className="text-xl font-black">4</p>
          <p className="text-[9px] text-white/40">Lessons</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-emerald-400">£140</p>
          <p className="text-[9px] text-white/40">Earned</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-purple-400">2</p>
          <p className="text-[9px] text-white/40">Msgs</p>
        </div>
      </div>
      {/* Next quest */}
      <div className="mx-4 mt-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
        <p className="text-[10px] text-amber-400 font-bold uppercase">CURRENT QUEST</p>
        <p className="text-sm font-bold mt-1">{PUPIL} — 10:30</p>
        <p className="text-[10px] text-white/40">{LOCATION} · +180 XP</p>
        <button className="mt-2 px-4 py-1.5 bg-amber-500 text-black rounded-xl text-xs font-bold">Start Quest</button>
      </div>
      {/* Schedule */}
      <div className="mx-4 mt-3">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">UPCOMING</p>
        {SCHEDULE.slice(1).map((l, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <span className="text-[10px] font-mono text-white/30 w-10">{l.time}</span>
            <span className="text-sm flex-1">{l.name}</span>
            <span className="text-[10px] text-amber-400/60">+180 XP</span>
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Icon className="h-4 w-4 text-white/50" /></div>
            <span className="text-[8px] text-white/30">{["Diary", "Nav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 bg-white/5 rounded-xl p-3">
        <p className="text-[10px] text-white/30 uppercase">Tomorrow</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105 · +540 XP</p>
      </div>
    </div>
  );
}

// ─── DESIGN 30: Duo-tone Split ───
export function Design30() {
  return (
    <div className="min-h-full">
      {/* Top half - dark */}
      <div className="bg-[#1a1a2e] text-white px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold">EVERY DRIVER</p>
          <div className="flex gap-1.5">
            <div className="relative w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <Mail className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-[7px] font-bold flex items-center justify-center">2</span>
            </div>
          </div>
        </div>
        <p className="text-3xl font-black">£140</p>
        <p className="text-white/50 text-xs mt-0.5">4 lessons · 72% goal</p>
        {/* Next lesson inline */}
        <div className="mt-3 bg-white/10 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">{PUPIL}</p>
            <p className="text-[10px] text-white/50">10:30 · {LOCATION}</p>
          </div>
          <button className="px-3 py-1.5 bg-[#e94560] rounded-xl text-[10px] font-bold">Start</button>
        </div>
      </div>
      {/* Bottom half - light */}
      <div className="bg-[#f8f8f8] dark:bg-[#111] px-4 pt-4 pb-6 space-y-2">
        <div className="bg-white dark:bg-card border rounded-2xl p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
              <span className="text-xs font-medium">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Calendar, label: "Diary", bg: "bg-[#1a1a2e]" },
            { icon: Navigation, label: "SatNav", bg: "bg-[#e94560]" },
            { icon: Car, label: "Vehicle", bg: "bg-emerald-600" },
            { icon: PoundSterling, label: "Pay", bg: "bg-amber-500" },
          ].map((a, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", a.bg)}>
                <a.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-[9px] text-muted-foreground">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-card border rounded-2xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}
