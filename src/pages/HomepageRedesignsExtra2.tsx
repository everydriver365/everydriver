import {
  BookOpen, PoundSterling, Target, Clock, MapPin, Play,
  ChevronDown, ChevronRight, Mail, Car,
  TrendingUp, Calendar, User, Bell, Sun, Heart, Zap, BarChart3,
  ArrowRight, Star, Navigation, Layers,
  Fuel, CheckCircle, MessageSquare, Compass, Gauge, Route,
  Trophy, Sparkles, ListChecks, Timer, ArrowUpRight,
  GraduationCap, Lightbulb, Gift, Flame, Eye, Map,
  Radio, Smartphone, Crown, Diamond, Rocket, Waves,
  CircleDot, Shield, Menu, Grid3X3,
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

// ─── DESIGN 31: Warm Sunrise ───
export function Design31() {
  return (
    <div className="min-h-full bg-gradient-to-b from-orange-50 to-amber-50/50 dark:from-orange-950/20 dark:to-background pb-6">
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">GOOD MORNING</p>
        <p className="text-2xl font-black mt-0.5">Wednesday</p>
        <p className="text-sm text-muted-foreground">☀️ 14°C · Clear skies</p>
      </div>
      {/* Warm stat cards */}
      <div className="px-4 grid grid-cols-3 gap-2">
        {[
          { v: "4", l: "Lessons", bg: "bg-orange-100 dark:bg-orange-900/20", tc: "text-orange-700 dark:text-orange-400" },
          { v: "£140", l: "Earned", bg: "bg-amber-100 dark:bg-amber-900/20", tc: "text-amber-700 dark:text-amber-400" },
          { v: "72%", l: "Goal", bg: "bg-rose-100 dark:bg-rose-900/20", tc: "text-rose-700 dark:text-rose-400" },
        ].map((s, i) => (
          <div key={i} className={cn("rounded-2xl p-3 text-center", s.bg)}>
            <p className={cn("text-xl font-black", s.tc)}>{s.v}</p>
            <p className="text-[9px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
      {/* Next lesson */}
      <div className="mx-4 mt-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4">
        <p className="text-[10px] uppercase text-white/60">NEXT LESSON</p>
        <p className="text-lg font-bold mt-1">{PUPIL}</p>
        <p className="text-white/70 text-xs">10:30 · {LOCATION}</p>
        <button className="mt-2 px-4 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Start →</button>
      </div>
      {/* Schedule */}
      <div className="mx-4 mt-3 bg-white dark:bg-card border rounded-2xl p-3">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
        {SCHEDULE.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
            <span className="text-xs font-medium">{l.name}</span>
            <span className="text-[10px] text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 bg-white dark:bg-card border rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange-500" /><span className="text-sm font-medium">Messages</span></div>
        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
      </div>
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
          <div key={i} className="bg-white dark:bg-card border rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 bg-white dark:bg-card border rounded-2xl p-3">
        <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 32: Monochrome Minimal ───
export function Design32() {
  return (
    <div className="bg-white dark:bg-[#111] min-h-full pb-6">
      <div className="px-5 pt-5 pb-4 border-b border-foreground/10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">EVERY DRIVER</p>
        <div className="flex items-baseline gap-4 mt-2">
          <p className="text-4xl font-black">4</p>
          <p className="text-sm text-muted-foreground">lessons today</p>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-foreground/10 flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">Earnings</p><p className="text-xl font-black">£140</p></div>
        <div className="text-right"><p className="text-xs text-muted-foreground">Goal</p><p className="text-xl font-black">72%</p></div>
      </div>
      {/* Next */}
      <div className="px-5 py-3 border-b border-foreground/10">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">NEXT</p>
        <p className="text-lg font-bold">{PUPIL}</p>
        <p className="text-xs text-muted-foreground">10:30 · {LOCATION}</p>
      </div>
      {/* Messages */}
      <div className="px-5 py-3 border-b border-foreground/10 flex items-center justify-between">
        <p className="text-sm font-medium">2 messages</p>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      {/* Schedule */}
      <div className="px-5 py-3 border-b border-foreground/10">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">SCHEDULE</p>
        {SCHEDULE.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <span className="text-sm">{l.name}</span>
            <span className="text-xs text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="px-5 py-3 border-b border-foreground/10">
        <div className="flex gap-3 flex-wrap">
          {["Diary", "SatNav", "Vehicle", "Pay", "Health", "Fuel"].map((a, i) => (
            <span key={i} className="text-xs font-medium border-b border-foreground/30 pb-0.5 cursor-pointer">{a}</span>
          ))}
        </div>
      </div>
      <div className="px-5 py-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">TOMORROW</p>
        <p className="text-sm font-medium mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 33: Rounded Pastel ───
export function Design33() {
  return (
    <div className="bg-[#f8f7ff] dark:bg-background min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xl font-black text-violet-900 dark:text-violet-300">Hello! 💜</p>
        <p className="text-xs text-muted-foreground">Wednesday · 14°C</p>
      </div>
      {/* Pastel stats */}
      <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[
          { v: "4", l: "Lessons", bg: "bg-violet-200/60 dark:bg-violet-900/30" },
          { v: "£140", l: "Earned", bg: "bg-pink-200/60 dark:bg-pink-900/30" },
          { v: "72%", l: "Goal", bg: "bg-sky-200/60 dark:bg-sky-900/30" },
          { v: "2", l: "Msgs", bg: "bg-amber-200/60 dark:bg-amber-900/30" },
        ].map((s, i) => (
          <div key={i} className={cn("flex-shrink-0 rounded-2xl px-4 py-3 text-center min-w-[70px]", s.bg)}>
            <p className="text-lg font-black">{s.v}</p>
            <p className="text-[9px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
      {/* Next */}
      <div className="mx-4 mt-3 bg-violet-500 text-white rounded-3xl p-4">
        <p className="text-[10px] uppercase text-white/50">NEXT LESSON</p>
        <p className="text-lg font-bold mt-1">{PUPIL}</p>
        <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
        <button className="mt-2 px-4 py-1.5 bg-white/20 rounded-full text-xs font-medium">Start →</button>
      </div>
      {/* Schedule */}
      <div className="mx-4 mt-3 bg-white dark:bg-card rounded-3xl border p-4">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
        {SCHEDULE.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/30">
            <span className="text-xs font-medium">{l.name}</span>
            <span className="text-[10px] text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {[
          { icon: Calendar, bg: "bg-violet-200/60 dark:bg-violet-900/30" },
          { icon: Navigation, bg: "bg-pink-200/60 dark:bg-pink-900/30" },
          { icon: Car, bg: "bg-sky-200/60 dark:bg-sky-900/30" },
          { icon: PoundSterling, bg: "bg-amber-200/60 dark:bg-amber-900/30" },
        ].map((a, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", a.bg)}>
              <a.icon className="h-5 w-5 text-foreground/60" />
            </div>
            <span className="text-[9px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 bg-white dark:bg-card rounded-3xl border p-3">
        <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 34: Metro Tiles ───
export function Design34() {
  return (
    <div className="bg-[#1d1d1d] text-white min-h-full pb-6 p-2 pt-4">
      <p className="text-lg font-light px-2 mb-3">every driver</p>
      <div className="grid grid-cols-3 gap-1">
        {/* Large tile */}
        <div className="col-span-2 row-span-2 bg-[#2d89ef] p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase text-white/60">NEXT</p>
            <p className="text-xl font-bold mt-1">{PUPIL}</p>
            <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
          </div>
          <button className="self-start mt-2 px-3 py-1.5 bg-white/20 text-xs font-medium">Start</button>
        </div>
        <div className="bg-[#00a300] p-3 flex flex-col justify-center items-center">
          <p className="text-2xl font-bold">4</p>
          <p className="text-[8px] text-white/60">LESSONS</p>
        </div>
        <div className="bg-[#ffc40d] p-3 flex flex-col justify-center items-center">
          <p className="text-2xl font-bold text-black">£140</p>
          <p className="text-[8px] text-black/60">EARNED</p>
        </div>
        {/* Messages */}
        <div className="col-span-2 bg-[#ee1111] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span className="text-sm">2 messages</span></div>
          <ChevronRight className="h-4 w-4 text-white/50" />
        </div>
        <div className="bg-[#7e3878] p-3 flex flex-col justify-center items-center">
          <p className="text-xl font-bold">72%</p>
          <p className="text-[8px] text-white/60">GOAL</p>
        </div>
        {/* Schedule */}
        <div className="col-span-3 bg-[#2b5797] p-3">
          <p className="text-[9px] uppercase text-white/50 mb-1">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-xs">{l.name}</span>
              <span className="text-[10px] text-white/50">{l.time}</span>
            </div>
          ))}
        </div>
        {/* Actions */}
        {[
          { icon: Calendar, bg: "bg-[#00a300]", l: "Diary" },
          { icon: Navigation, bg: "bg-[#2d89ef]", l: "SatNav" },
          { icon: Car, bg: "bg-[#ffc40d]", l: "Vehicle" },
        ].map((a, i) => (
          <div key={i} className={cn("p-3 flex flex-col items-center justify-center gap-1", a.bg)}>
            <a.icon className="h-5 w-5 text-white" />
            <span className="text-[8px]">{a.l}</span>
          </div>
        ))}
        {/* Tomorrow */}
        <div className="col-span-3 bg-[#603cba] p-3">
          <p className="text-[9px] uppercase text-white/50">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 35: Neumorphic ───
export function Design35() {
  return (
    <div className="bg-[#e8e8e8] dark:bg-[#1a1a1a] min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-lg font-black">Dashboard</p>
        <p className="text-xs text-muted-foreground">Wednesday · 4 lessons</p>
      </div>
      <div className="px-4 space-y-3">
        {/* Next lesson - neumorphic */}
        <div className="rounded-2xl p-4 bg-[#e8e8e8] dark:bg-[#1a1a1a] shadow-[6px_6px_12px_#c5c5c5,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#111,-6px_-6px_12px_#222]">
          <p className="text-[10px] uppercase text-primary font-bold">NEXT LESSON</p>
          <p className="text-lg font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-muted-foreground">10:30 · {LOCATION}</p>
          <button className="mt-2 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md">Start</button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: "4", l: "Lessons" },
            { v: "£140", l: "Earned" },
            { v: "72%", l: "Goal" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center bg-[#e8e8e8] dark:bg-[#1a1a1a] shadow-[4px_4px_8px_#c5c5c5,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#111,-4px_-4px_8px_#222]">
              <p className="text-xl font-black">{s.v}</p>
              <p className="text-[9px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
        {/* Messages */}
        <div className="rounded-2xl p-3 bg-[#e8e8e8] dark:bg-[#1a1a1a] shadow-[4px_4px_8px_#c5c5c5,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#111,-4px_-4px_8px_#222] flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Messages</span></div>
          <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        {/* Schedule */}
        <div className="rounded-2xl p-3 bg-[#e8e8e8] dark:bg-[#1a1a1a] shadow-[4px_4px_8px_#c5c5c5,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#111,-4px_-4px_8px_#222]">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-xs font-medium">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        {/* Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#e8e8e8] dark:bg-[#1a1a1a] shadow-[3px_3px_6px_#c5c5c5,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#111,-3px_-3px_6px_#222]">
                <Icon className="h-4 w-4 text-foreground/60" />
              </div>
              <span className="text-[9px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-3 bg-[#e8e8e8] dark:bg-[#1a1a1a] shadow-[4px_4px_8px_#c5c5c5,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_#111,-4px_-4px_8px_#222]">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 36: Ticket/Coupon ───
export function Design36() {
  return (
    <div className="bg-muted/50 min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-lg font-black">Today's Tickets</p>
        <p className="text-xs text-muted-foreground">Wednesday · 4 lessons · £140</p>
      </div>
      {/* Tickets */}
      <div className="px-4 space-y-2 mt-2">
        {SCHEDULE.map((l, i) => (
          <div key={i} className="bg-card border rounded-xl overflow-hidden flex">
            <div className={cn("w-2", i === 0 ? "bg-emerald-500" : i === 1 ? "bg-primary" : "bg-muted-foreground/20")} />
            <div className="flex-1 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{l.name}</p>
                <p className="text-[10px] text-muted-foreground">{l.time} · {l.loc}</p>
              </div>
              {i === 1 && <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold">Start</button>}
              {i === 0 && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            </div>
            <div className="w-6 border-l border-dashed border-border flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
      {/* Stats row */}
      <div className="px-4 mt-3 grid grid-cols-3 gap-2">
        {[
          { v: "£140", l: "Earned" },
          { v: "72%", l: "Goal" },
          { v: "2", l: "Msgs" },
        ].map((s, i) => (
          <div key={i} className="bg-card border rounded-xl p-2.5 text-center">
            <p className="text-lg font-black">{s.v}</p>
            <p className="text-[9px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="px-4 mt-3 grid grid-cols-4 gap-2">
        {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
          <div key={i} className="bg-card border rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Icon className="h-4 w-4 text-foreground/60" />
            <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 bg-card border rounded-xl p-3">
        <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 37: Full-Width Sections ───
export function Design37() {
  return (
    <div className="bg-background min-h-full pb-6">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-5 pt-4 pb-6">
        <p className="text-white/50 text-[10px] uppercase tracking-wider">EVERY DRIVER</p>
        <p className="text-3xl font-black mt-1">£140</p>
        <p className="text-white/60 text-sm">4 lessons · 72% weekly goal</p>
      </div>
      {/* Floating next card */}
      <div className="mx-4 -mt-4 bg-card border rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-rose-500 font-bold uppercase">NEXT LESSON</p>
            <p className="text-sm font-bold mt-0.5">{PUPIL}</p>
            <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
          </div>
          <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold">Start</button>
        </div>
      </div>
      {/* Full-width sections */}
      <div className="mt-4">
        <div className="px-4 py-3 border-y border-border flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-rose-500" /><span className="text-sm font-medium">2 unread messages</span></div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="px-4 mt-4">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">SCHEDULE</p>
        {SCHEDULE.map((l, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-xs font-bold text-rose-600">{l.name.charAt(0)}</div>
              <span className="text-sm font-medium">{l.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
          <div key={i} className="bg-muted/50 rounded-xl p-3 flex flex-col items-center gap-1">
            <Icon className="h-5 w-5 text-rose-500" />
            <span className="text-[9px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-4 bg-muted/50 rounded-xl p-3">
        <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
        <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
      </div>
    </div>
  );
}

// ─── DESIGN 38: Clock Face ───
export function Design38() {
  return (
    <div className="bg-background min-h-full pb-6">
      {/* Clock-inspired header */}
      <div className="flex flex-col items-center pt-5 pb-3">
        <div className="w-28 h-28 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
          <div className="text-center">
            <p className="text-3xl font-black text-primary">10:30</p>
            <p className="text-[9px] text-muted-foreground">NEXT LESSON</p>
          </div>
        </div>
        <p className="text-sm font-bold mt-2">{PUPIL}</p>
        <p className="text-[10px] text-muted-foreground">{LOCATION} · in 25 min</p>
        <button className="mt-2 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">Start</button>
      </div>
      <div className="px-4 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border rounded-xl p-2.5 text-center"><p className="text-lg font-black">4</p><p className="text-[9px] text-muted-foreground">Lessons</p></div>
          <div className="bg-card border rounded-xl p-2.5 text-center"><p className="text-lg font-black">£140</p><p className="text-[9px] text-muted-foreground">Earned</p></div>
          <div className="bg-card border rounded-xl p-2.5 text-center"><p className="text-lg font-black">72%</p><p className="text-[9px] text-muted-foreground">Goal</p></div>
        </div>
        <div className="bg-card border rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm font-medium">Messages</span></div>
          <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
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

// ─── DESIGN 39: Gradient Mesh ───
export function Design39() {
  return (
    <div className="min-h-full pb-6" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="px-4 pt-4 pb-3 text-white">
        <p className="text-white/50 text-[10px] uppercase tracking-wider">EVERY DRIVER</p>
        <p className="text-xl font-black mt-0.5">Good morning</p>
      </div>
      <div className="px-3 space-y-2">
        {/* Glass cards */}
        <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-white/50">NEXT LESSON</p>
              <p className="text-lg font-bold mt-1">{PUPIL}</p>
              <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
            </div>
            <button className="px-4 py-2 bg-white/25 rounded-xl text-xs font-bold">Start</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "4", l: "Lessons" },
            { v: "£140", l: "Earned" },
            { v: "72%", l: "Goal" },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center text-white">
              <p className="text-xl font-black">{s.v}</p>
              <p className="text-[9px] text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span className="text-sm">2 messages</span></div>
          <span className="w-5 h-5 rounded-full bg-white/25 text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-white">
          <p className="text-[10px] uppercase text-white/40 mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-white/10">
              <span className="text-xs">{l.name}</span>
              <span className="text-[10px] text-white/50">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center"><Icon className="h-4 w-4 text-white/70" /></div>
              <span className="text-[9px] text-white/40">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-white">
          <p className="text-[10px] text-white/40 uppercase">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 40: Retro Terminal ───
export function Design40() {
  return (
    <div className="bg-black text-green-400 min-h-full pb-6 font-mono">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] text-green-600">$ everydriver --status</p>
        <p className="text-sm mt-1">SYSTEM ONLINE · WED · 14°C</p>
      </div>
      <div className="px-4 space-y-2 mt-2">
        <div className="border border-green-900 p-3">
          <p className="text-[10px] text-green-600">// NEXT_LESSON</p>
          <p className="text-sm mt-1">PUPIL: {PUPIL}</p>
          <p className="text-sm">TIME: 10:30 | LOC: {LOCATION}</p>
          <p className="text-xs text-green-600 mt-1 cursor-pointer">[START] [NAVIGATE]</p>
        </div>
        <div className="border border-green-900 p-3 grid grid-cols-3 gap-2">
          <div><p className="text-[10px] text-green-600">LESSONS</p><p className="text-lg">4</p></div>
          <div><p className="text-[10px] text-green-600">EARNED</p><p className="text-lg">£140</p></div>
          <div><p className="text-[10px] text-green-600">GOAL</p><p className="text-lg">72%</p></div>
        </div>
        <div className="border border-green-900 p-3">
          <p className="text-[10px] text-green-600">// INBOX (2 UNREAD)</p>
          <p className="text-xs mt-1">→ James R: "Running 5 min late"</p>
          <p className="text-xs">→ Emma W: "Can we reschedule?"</p>
        </div>
        <div className="border border-green-900 p-3">
          <p className="text-[10px] text-green-600">// SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <p key={i} className="text-xs mt-0.5">{l.time} {l.name} [{l.loc}]</p>
          ))}
        </div>
        <div className="border border-green-900 p-3">
          <p className="text-[10px] text-green-600">// COMMANDS</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {["diary", "satnav", "vehicle", "pay", "health", "fuel"].map((c, i) => (
              <span key={i} className="text-xs cursor-pointer hover:text-green-300">$ {c}</span>
            ))}
          </div>
        </div>
        <div className="border border-green-900 p-3">
          <p className="text-[10px] text-green-600">// TOMORROW</p>
          <p className="text-xs mt-0.5">3 LESSONS | £105 PROJECTED</p>
        </div>
        <p className="text-[10px] text-green-800 animate-pulse">█</p>
      </div>
    </div>
  );
}

// ─── DESIGN 41: Magazine Cover ───
export function Design41() {
  return (
    <div className="bg-background min-h-full pb-6">
      {/* Cover image area */}
      <div className="h-44 bg-gradient-to-br from-sky-400 to-indigo-600 relative flex items-end p-4">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative text-white">
          <p className="text-[10px] uppercase tracking-[0.3em]">WEDNESDAY EDITION</p>
          <p className="text-3xl font-black leading-tight mt-1">Your Day<br/>Ahead</p>
        </div>
      </div>
      <div className="px-4 mt-4 space-y-3">
        {/* Feature story */}
        <div>
          <p className="text-xs font-bold text-primary uppercase">FEATURE</p>
          <p className="text-lg font-bold mt-0.5">Next: {PUPIL} at 10:30</p>
          <p className="text-sm text-muted-foreground">{LOCATION} · in 25 minutes</p>
          <button className="mt-2 text-sm font-bold text-primary">Start lesson →</button>
        </div>
        <div className="h-px bg-border" />
        {/* Stats bar */}
        <div className="flex items-center justify-between">
          <div className="text-center"><p className="text-xl font-black">4</p><p className="text-[9px] text-muted-foreground">Lessons</p></div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center"><p className="text-xl font-black">£140</p><p className="text-[9px] text-muted-foreground">Earned</p></div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center"><p className="text-xl font-black">72%</p><p className="text-[9px] text-muted-foreground">Goal</p></div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center"><p className="text-xl font-black text-destructive">2</p><p className="text-[9px] text-muted-foreground">Msgs</p></div>
        </div>
        <div className="h-px bg-border" />
        {/* Schedule */}
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground mb-2">TODAY'S LINEUP</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="py-2 border-b border-border/50 last:border-0 flex justify-between">
              <span className="text-sm font-medium">{l.name}</span>
              <span className="text-xs text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-2.5 flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-foreground/60" />
              <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">COMING UP</p>
          <p className="text-sm font-bold mt-0.5">Tomorrow: 3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 42: Sidebar Stats ───
export function Design42() {
  return (
    <div className="min-h-full flex bg-background pb-6">
      {/* Left stat rail */}
      <div className="w-14 bg-primary/5 border-r border-border flex flex-col items-center py-4 gap-3">
        <div className="text-center"><p className="text-sm font-black text-primary">4</p><p className="text-[7px] text-muted-foreground">LES</p></div>
        <div className="w-6 h-px bg-border" />
        <div className="text-center"><p className="text-sm font-black text-emerald-600">£140</p><p className="text-[7px] text-muted-foreground">£</p></div>
        <div className="w-6 h-px bg-border" />
        <div className="text-center"><p className="text-sm font-black text-violet-600">72%</p><p className="text-[7px] text-muted-foreground">GOAL</p></div>
        <div className="w-6 h-px bg-border" />
        <div className="relative text-center">
          <p className="text-sm font-black text-rose-500">2</p><p className="text-[7px] text-muted-foreground">MSG</p>
        </div>
      </div>
      {/* Main area */}
      <div className="flex-1 overflow-y-auto px-3 pt-4">
        <p className="text-lg font-black">Today</p>
        <p className="text-[10px] text-muted-foreground mb-3">Wednesday</p>
        {/* Next */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-2">
          <p className="text-[10px] text-primary font-bold uppercase">NEXT</p>
          <p className="text-sm font-bold mt-0.5">{PUPIL} · 10:30</p>
          <p className="text-[10px] text-muted-foreground">{LOCATION}</p>
          <button className="mt-2 px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold">Start</button>
        </div>
        {/* Schedule */}
        {SCHEDULE.slice(1).map((l, i) => (
          <div key={i} className="border rounded-xl p-3 mb-2">
            <p className="text-xs font-medium">{l.name}</p>
            <p className="text-[10px] text-muted-foreground">{l.time} · {l.loc}</p>
          </div>
        ))}
        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[Calendar, Navigation, Car].map((Icon, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-2.5 flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-foreground/60" />
              <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-muted/30 rounded-xl p-3 mt-2">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 43: Emoji Dashboard ───
export function Design43() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-2xl">👋</p>
        <p className="text-lg font-black mt-1">Wednesday</p>
      </div>
      <div className="px-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border rounded-2xl p-3"><p className="text-lg">📚</p><p className="text-xl font-black mt-1">4 lessons</p></div>
          <div className="bg-card border rounded-2xl p-3"><p className="text-lg">💰</p><p className="text-xl font-black mt-1">£140</p></div>
        </div>
        <div className="bg-primary text-white rounded-2xl p-4">
          <p className="text-lg">🚗</p>
          <p className="text-lg font-bold mt-1">{PUPIL}</p>
          <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
          <button className="mt-2 px-4 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Start →</button>
        </div>
        <div className="bg-card border rounded-2xl p-3 flex items-center justify-between">
          <span className="text-sm">✉️ 2 messages</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="bg-card border rounded-2xl p-3">
          <p className="text-sm font-bold mb-2">📅 Schedule</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
              <span className="text-xs">{l.name}</span>
              <span className="text-[10px] text-muted-foreground">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["📅 Diary", "🧭 Nav", "🚗 Car", "💷 Pay"].map((a, i) => (
            <div key={i} className="bg-card border rounded-xl p-2 text-center">
              <p className="text-[10px]">{a}</p>
            </div>
          ))}
        </div>
        <div className="bg-card border rounded-2xl p-3">
          <p className="text-sm">🔮 Tomorrow: 3 lessons · £105</p>
        </div>
        <div className="bg-card border rounded-2xl p-3">
          <p className="text-sm">🎯 72% weekly goal</p>
          <div className="mt-1 h-2 bg-muted rounded-full"><div className="h-full w-[72%] bg-primary rounded-full" /></div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 44: Bottom Sheet Style ───
export function Design44() {
  return (
    <div className="min-h-full bg-primary relative">
      {/* Top area on primary */}
      <div className="px-4 pt-4 pb-20 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[10px] uppercase">Wednesday</p>
            <p className="text-xl font-bold mt-0.5">4 lessons · £140</p>
          </div>
          <div className="flex gap-1.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"><Bell className="h-4 w-4" /></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center"><p className="text-2xl font-black">4</p><p className="text-[9px] text-white/50">Lessons</p></div>
          <div className="text-center"><p className="text-2xl font-black">£140</p><p className="text-[9px] text-white/50">Earned</p></div>
          <div className="text-center"><p className="text-2xl font-black">72%</p><p className="text-[9px] text-white/50">Goal</p></div>
        </div>
      </div>
      {/* Bottom sheet */}
      <div className="bg-background rounded-t-[28px] -mt-8 relative z-10 min-h-[400px]">
        <div className="flex justify-center pt-2 pb-3"><div className="w-10 h-1 rounded-full bg-muted-foreground/20" /></div>
        <div className="px-4 space-y-2">
          <div className="bg-card border rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary font-bold uppercase">NEXT UP</p>
              <p className="text-sm font-bold mt-0.5">{PUPIL}</p>
              <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
            </div>
            <button className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold">Start</button>
          </div>
          <div className="bg-card border rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm">Messages</span></div>
            <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
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
              <div key={i} className="bg-muted/50 rounded-xl p-2.5 flex flex-col items-center gap-1">
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
    </div>
  );
}

// ─── DESIGN 45: Dot Grid ───
export function Design45() {
  return (
    <div className="bg-background min-h-full pb-6 relative">
      {/* Dot pattern background */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
      <div className="relative px-4 pt-4">
        <p className="text-lg font-black">Dashboard</p>
        <p className="text-xs text-muted-foreground">Wednesday</p>
      </div>
      <div className="relative px-4 mt-3 space-y-2">
        <div className="bg-card/80 backdrop-blur border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary font-bold uppercase">NEXT</p>
              <p className="text-sm font-bold mt-0.5">{PUPIL}</p>
              <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
            </div>
            <button className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold">Start</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: "4", l: "Lessons", c: "text-primary" },
            { v: "£140", l: "Earned", c: "text-emerald-600" },
            { v: "72%", l: "Goal", c: "text-violet-600" },
            { v: "2", l: "Msgs", c: "text-rose-500" },
          ].map((s, i) => (
            <div key={i} className="bg-card/80 backdrop-blur border rounded-xl p-2 text-center">
              <p className={cn("text-sm font-black", s.c)}>{s.v}</p>
              <p className="text-[8px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-card/80 backdrop-blur border rounded-2xl p-3">
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
            <div key={i} className="bg-card/80 backdrop-blur border rounded-xl p-2.5 flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-foreground/60" />
              <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-card/80 backdrop-blur border rounded-xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 46: Floating Orbs ───
export function Design46() {
  return (
    <div className="min-h-full bg-[#0c0c1d] text-white pb-6 relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute top-10 -left-10 w-40 h-40 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute top-40 -right-10 w-32 h-32 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-28 h-28 rounded-full bg-pink-500/15 blur-3xl" />
      <div className="relative px-4 pt-4 pb-2">
        <p className="text-white/40 text-[10px] uppercase tracking-widest">EVERY DRIVER</p>
        <p className="text-xl font-black mt-0.5">Wednesday</p>
      </div>
      <div className="relative px-4 space-y-2">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-3xl font-black">£140</p>
          <p className="text-white/40 text-xs">4 lessons · 72% goal</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-purple-400 uppercase">NEXT</p>
            <p className="text-sm font-bold mt-0.5">{PUPIL}</p>
            <p className="text-[10px] text-white/40">10:30 · {LOCATION}</p>
          </div>
          <button className="px-3 py-1.5 bg-purple-600 rounded-xl text-[10px] font-bold">Start</button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-cyan-400" /><span className="text-sm">2 messages</span></div>
          <span className="w-5 h-5 rounded-full bg-cyan-500 text-[10px] text-black font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <p className="text-[10px] text-white/30 uppercase mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-white/5">
              <span className="text-xs">{l.name}</span>
              <span className="text-[10px] text-white/30">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Icon className="h-4 w-4 text-white/40" /></div>
              <span className="text-[8px] text-white/30">{["Diary", "Nav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] text-white/30 uppercase">Tomorrow</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 47: Staggered Grid ───
export function Design47() {
  return (
    <div className="bg-muted/30 min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xl font-black">Home</p>
        <p className="text-xs text-muted-foreground">Wednesday · 4 lessons</p>
      </div>
      <div className="px-4">
        {/* Staggered: left col + right col offset */}
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <div className="bg-primary text-white rounded-2xl p-3">
              <p className="text-[10px] uppercase text-white/50">NEXT</p>
              <p className="text-sm font-bold mt-1">{PUPIL}</p>
              <p className="text-[10px] text-white/60">10:30</p>
              <button className="mt-2 px-3 py-1 bg-white/20 rounded-lg text-[10px] font-medium">Start</button>
            </div>
            <div className="bg-card border rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-600">£140</p>
              <p className="text-[9px] text-muted-foreground">Earned</p>
            </div>
            <div className="bg-card border rounded-2xl p-3">
              {SCHEDULE.slice(2).map((l, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span className="text-xs">{l.name}</span>
                  <span className="text-[10px] text-muted-foreground">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2 mt-6">
            <div className="bg-card border rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-primary">4</p>
              <p className="text-[9px] text-muted-foreground">Lessons</p>
            </div>
            <div className="bg-card border rounded-2xl p-3 flex items-center justify-between">
              <Mail className="h-4 w-4 text-rose-500" />
              <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
            </div>
            <div className="bg-card border rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-violet-600">72%</p>
              <p className="text-[9px] text-muted-foreground">Goal</p>
            </div>
            <div className="bg-card border rounded-2xl p-3">
              {SCHEDULE.slice(0, 2).map((l, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span className="text-xs">{l.name}</span>
                  <span className="text-[10px] text-muted-foreground">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Bottom row */}
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="bg-card border rounded-xl p-2.5 flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-foreground/60" />
              <span className="text-[8px] text-muted-foreground">{["Diary", "SatNav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 bg-card border rounded-xl p-3">
          <p className="text-[10px] uppercase text-muted-foreground font-bold">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 48: Spotlight ───
export function Design48() {
  return (
    <div className="bg-black text-white min-h-full pb-6">
      {/* Spotlight effect */}
      <div className="relative h-48 flex items-center justify-center" style={{ background: "radial-gradient(circle at 50% 60%, rgba(99,102,241,0.3) 0%, transparent 60%)" }}>
        <div className="text-center">
          <p className="text-5xl font-black">£140</p>
          <p className="text-white/40 text-xs mt-1">4 lessons · 72% goal</p>
        </div>
      </div>
      <div className="px-4 space-y-2">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-indigo-400 uppercase">NEXT</p>
            <p className="text-sm font-bold mt-0.5">{PUPIL}</p>
            <p className="text-[10px] text-white/40">10:30 · {LOCATION}</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold">Start</button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-sm">✉️ 2 messages</span>
          <ChevronRight className="h-4 w-4 text-white/30" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <p className="text-[10px] text-white/30 uppercase mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-white/5">
              <span className="text-xs">{l.name}</span>
              <span className="text-[10px] text-white/30">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[Calendar, Navigation, Car, PoundSterling].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Icon className="h-4 w-4 text-white/40" /></div>
              <span className="text-[8px] text-white/30">{["Diary", "Nav", "Car", "Pay"][i]}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] text-white/30 uppercase">Tomorrow</p>
          <p className="text-sm font-bold mt-0.5">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 49: Horizontal Cards ───
export function Design49() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-4 pt-4 pb-2">
        <p className="text-lg font-black">Home</p>
        <p className="text-xs text-muted-foreground">Wednesday</p>
      </div>
      {/* Horizontal scrollable summary */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 pb-1">
          <div className="flex-shrink-0 w-40 bg-primary text-white rounded-xl p-3">
            <p className="text-2xl font-black">4</p>
            <p className="text-white/60 text-[10px]">Lessons today</p>
          </div>
          <div className="flex-shrink-0 w-40 bg-emerald-600 text-white rounded-xl p-3">
            <p className="text-2xl font-black">£140</p>
            <p className="text-white/60 text-[10px]">Expected</p>
          </div>
          <div className="flex-shrink-0 w-40 bg-violet-600 text-white rounded-xl p-3">
            <p className="text-2xl font-black">72%</p>
            <p className="text-white/60 text-[10px]">Weekly goal</p>
          </div>
        </div>
      </div>
      <div className="px-4 mt-3 space-y-2">
        <div className="bg-card border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-primary font-bold uppercase">NEXT LESSON</p>
            <p className="text-sm font-bold mt-0.5">{PUPIL}</p>
            <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
          </div>
          <button className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold">Start</button>
        </div>
        <div className="bg-card border rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm">Messages</span></div>
          <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
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

// ─── DESIGN 50: Brutalist ───
export function Design50() {
  return (
    <div className="bg-[#ffffcc] dark:bg-[#1a1a00] min-h-full pb-6">
      <div className="px-4 pt-4 border-b-4 border-black dark:border-white pb-2">
        <p className="text-2xl font-black uppercase">EVERY DRIVER</p>
        <p className="text-xs">WEDNESDAY · 4 LESSONS · £140</p>
      </div>
      <div className="px-4 mt-3 space-y-2">
        <div className="border-4 border-black dark:border-white p-4">
          <p className="text-xs font-black uppercase">★ NEXT LESSON</p>
          <p className="text-xl font-black mt-1">{PUPIL}</p>
          <p className="text-sm">10:30 · {LOCATION}</p>
          <button className="mt-2 px-4 py-2 bg-black dark:bg-white text-[#ffffcc] dark:text-[#1a1a00] font-black text-sm uppercase">START →</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="border-4 border-black dark:border-white p-2 text-center"><p className="text-2xl font-black">4</p><p className="text-[9px] font-bold uppercase">LESSONS</p></div>
          <div className="border-4 border-black dark:border-white p-2 text-center"><p className="text-2xl font-black">£140</p><p className="text-[9px] font-bold uppercase">EARNED</p></div>
          <div className="border-4 border-black dark:border-white p-2 text-center"><p className="text-2xl font-black">72%</p><p className="text-[9px] font-bold uppercase">GOAL</p></div>
        </div>
        <div className="border-4 border-black dark:border-white p-3 flex items-center justify-between">
          <span className="font-black text-sm">✉ 2 MSGS</span>
          <span className="font-black">→</span>
        </div>
        <div className="border-4 border-black dark:border-white p-3">
          <p className="font-black text-xs uppercase mb-2">SCHEDULE</p>
          {SCHEDULE.map((l, i) => (
            <div key={i} className="flex justify-between py-1 border-b-2 border-black/20 dark:border-white/20 last:border-0">
              <span className="text-xs font-bold">{l.name}</span>
              <span className="text-xs">{l.time}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {["DIARY", "SATNAV", "VEHICLE", "PAY"].map((a, i) => (
            <span key={i} className="border-2 border-black dark:border-white px-3 py-1.5 text-xs font-black uppercase">{a}</span>
          ))}
        </div>
        <div className="border-4 border-black dark:border-white p-3">
          <p className="font-black text-xs uppercase">TOMORROW</p>
          <p className="text-sm font-black mt-0.5">3 LESSONS · £105</p>
        </div>
      </div>
    </div>
  );
}
