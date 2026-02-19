import { useState } from "react";
import {
  BookOpen, PoundSterling, Target, Timer, Clock, MapPin, Play,
  Cloud, ChevronDown, ChevronRight, Mail, Briefcase, Car,
  TrendingUp, Calendar, User, Bell, Sun, Heart, Zap, BarChart3,
  ArrowRight, Star, Shield, Navigation, Menu, Layers, Grid3X3,
  CircleDot, Fuel, CheckCircle, AlertTriangle, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Design11, Design12, Design13, Design14, Design15,
  Design16, Design17, Design18, Design19, Design20,
  Design21, Design22, Design23, Design24, Design25,
  Design26, Design27, Design28, Design29, Design30,
} from "./HomepageRedesignsExtra";

// Phone frame wrapper
function PhoneFrame({ title, description, children, number }: {
  title: string;
  description: string;
  children: React.ReactNode;
  number: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center max-w-[320px]">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">{number}</span>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="w-[320px] h-[640px] rounded-[36px] border-[6px] border-foreground/20 bg-background overflow-hidden shadow-2xl relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/20 rounded-b-2xl z-10" />
        {/* Content */}
        <div className="h-full overflow-y-auto pt-8 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
}

// Shared mock data
const STATS = { lessons: 4, earnings: 140, weekly: 72, nextTime: "10:30" };
const PUPIL = "Sarah M";
const LOCATION = "SW1A 1AA";

// ─── DESIGN 1: Command Center ───
function Design1() {
  return (
    <div className="bg-[#0f172a] text-white min-h-full">
      {/* Status bar */}
      <div className="px-4 pt-2 pb-3 flex items-center justify-between text-[10px] text-white/50">
        <span>EVERY DRIVER</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ONLINE</span>
      </div>
      {/* Hero metric */}
      <div className="px-5 py-6">
        <p className="text-white/40 text-[10px] uppercase tracking-widest">Today's Earnings</p>
        <p className="text-5xl font-black mt-1">£{STATS.earnings}</p>
        <p className="text-white/50 text-xs mt-1">{STATS.lessons} lessons · 72% weekly goal</p>
      </div>
      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-2">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <Clock className="h-4 w-4 text-sky-400 mb-1.5" />
          <p className="text-lg font-bold">10:30</p>
          <p className="text-[10px] text-white/40">Next Lesson</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <User className="h-4 w-4 text-violet-400 mb-1.5" />
          <p className="text-sm font-bold truncate">{PUPIL}</p>
          <p className="text-[10px] text-white/40">{LOCATION}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <TrendingUp className="h-4 w-4 text-emerald-400 mb-1.5" />
          <p className="text-lg font-bold">£420</p>
          <p className="text-[10px] text-white/40">This Week</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <Target className="h-4 w-4 text-amber-400 mb-1.5" />
          <p className="text-lg font-bold">72%</p>
          <p className="text-[10px] text-white/40">Weekly Goal</p>
        </div>
      </div>
      {/* Timeline */}
      <div className="px-4 mt-4">
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">SCHEDULE</p>
        {["09:00 · Sarah M", "11:00 · James R", "13:30 · Emma W", "15:00 · Tom B"].map((l, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
            <div className="w-1 h-6 rounded-full bg-sky-500" />
            <span className="text-sm">{l}</span>
          </div>
        ))}
      </div>
      {/* Messages */}
      <div className="px-4 mt-4">
        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-sky-400" />
            <span className="text-sm">2 unread messages</span>
          </div>
          <ChevronRight className="h-4 w-4 text-white/30" />
        </div>
      </div>
      {/* Quick Actions */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2 pb-6">
        {[
          { icon: Navigation, label: "SatNav" },
          { icon: Calendar, label: "Diary" },
          { icon: Car, label: "Vehicle" },
          { icon: BarChart3, label: "Earnings" },
        ].map((a, i) => (
          <div key={i} className="flex flex-col items-center gap-1 p-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <a.icon className="h-5 w-5 text-white/60" />
            </div>
            <span className="text-[9px] text-white/40">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DESIGN 2: Card Stack ───
function Design2() {
  return (
    <div className="bg-[#f2f2f7] min-h-full pb-6">
      <div className="bg-primary px-4 pt-3 pb-12 text-white">
        <p className="text-[10px] uppercase tracking-wider text-white/50">Good morning</p>
        <p className="text-xl font-bold mt-0.5">4 lessons today</p>
        <p className="text-white/60 text-xs">£140 expected · 72% goal</p>
      </div>
      <div className="px-4 -mt-8 space-y-3">
        {/* Next up card */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">NEXT UP</span>
            <span className="text-xs text-primary font-medium">in 25 min</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{PUPIL}</p>
              <p className="text-xs text-muted-foreground">10:30 · {LOCATION}</p>
            </div>
          </div>
          <button className="w-full mt-3 py-2 bg-primary text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
            <Play className="h-3.5 w-3.5" /> Start Lesson
          </button>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Lessons", value: "4", color: "bg-primary/10", icon: BookOpen, iconColor: "text-primary" },
            { label: "Earned", value: "£140", color: "bg-emerald-50", icon: PoundSterling, iconColor: "text-emerald-600" },
            { label: "Goal", value: "72%", color: "bg-violet-50", icon: Target, iconColor: "text-violet-600" },
          ].map((s, i) => (
            <div key={i} className={`${s.color} rounded-xl p-3 text-center`}>
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.iconColor}`} />
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Messages */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Mail className="h-4 w-4 text-primary" /></div>
            <div><p className="text-sm font-medium">Messages</p><p className="text-[10px] text-muted-foreground">2 unread</p></div>
          </div>
          <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        {/* Schedule preview */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">TODAY'S SCHEDULE</p>
          {["09:00 Sarah M", "11:00 James R", "13:30 Emma W", "15:00 Tom B"].map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <div className="w-1 h-4 rounded-full bg-primary/40" />
              <span className="text-xs">{l}</span>
            </div>
          ))}
        </div>
        {/* Plan Ahead */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">TOMORROW</p>
          <p className="text-sm">3 lessons · £105 expected</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 3: Bento Grid ───
function Design3() {
  return (
    <div className="bg-[#f2f2f7] min-h-full p-3 pt-4 pb-6">
      <p className="text-lg font-bold mb-3 px-1">Good morning ☀️</p>
      <div className="grid grid-cols-2 gap-2">
        {/* Large: Next lesson */}
        <div className="col-span-2 bg-primary text-white rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <p className="text-[10px] uppercase tracking-wider text-white/50">NEXT LESSON</p>
          <p className="text-xl font-bold mt-1">{PUPIL}</p>
          <p className="text-white/70 text-xs">10:30 · {LOCATION} · in 25 min</p>
          <button className="mt-3 px-4 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Start →</button>
        </div>
        {/* Stats */}
        <div className="bg-white rounded-2xl p-3">
          <BookOpen className="h-4 w-4 text-primary mb-1" />
          <p className="text-2xl font-black">4</p>
          <p className="text-[10px] text-muted-foreground">Lessons today</p>
        </div>
        <div className="bg-white rounded-2xl p-3">
          <PoundSterling className="h-4 w-4 text-emerald-600 mb-1" />
          <p className="text-2xl font-black">£140</p>
          <p className="text-[10px] text-muted-foreground">Expected</p>
        </div>
        {/* Messages - wide */}
        <div className="col-span-2 bg-white rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Messages</p>
              <p className="text-[10px] text-muted-foreground">2 unread from pupils</p>
            </div>
          </div>
          <span className="w-6 h-6 rounded-full bg-destructive text-white text-xs font-bold flex items-center justify-center">2</span>
        </div>
        {/* Goal */}
        <div className="bg-violet-50 rounded-2xl p-3">
          <Target className="h-4 w-4 text-violet-600 mb-1" />
          <p className="text-2xl font-black text-violet-700">72%</p>
          <p className="text-[10px] text-muted-foreground">Weekly goal</p>
        </div>
        {/* Weather */}
        <div className="bg-sky-50 rounded-2xl p-3">
          <Sun className="h-4 w-4 text-amber-500 mb-1" />
          <p className="text-lg font-bold">14°C</p>
          <p className="text-[10px] text-muted-foreground">Partly cloudy</p>
        </div>
        {/* Quick Actions */}
        <div className="col-span-2 bg-white rounded-2xl p-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Navigation, label: "SatNav" },
              { icon: Calendar, label: "Diary" },
              { icon: Car, label: "Vehicle" },
              { icon: Briefcase, label: "Jobs" },
            ].map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><a.icon className="h-5 w-5 text-foreground/60" /></div>
                <span className="text-[9px] text-muted-foreground">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Plan Ahead */}
        <div className="col-span-2 bg-white rounded-2xl p-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">TOMORROW</p>
          <p className="text-sm font-medium">Thursday · 3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 4: Timeline Feed ───
function Design4() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-4 pt-4 pb-3 border-b">
        <p className="text-lg font-bold">Today's Feed</p>
        <p className="text-xs text-muted-foreground">Wednesday · 14°C Partly cloudy</p>
      </div>
      <div className="px-4 mt-4">
        {/* Timeline */}
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {/* Summary dot */}
          <div className="relative">
            <div className="absolute -left-[17px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
            <div className="bg-primary/5 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary">Summary</p>
              <p className="text-sm font-bold mt-0.5">4 lessons · £140 · 72% goal</p>
            </div>
          </div>
          {/* Messages */}
          <div className="relative">
            <div className="absolute -left-[17px] w-3 h-3 rounded-full bg-destructive border-2 border-background" />
            <div className="bg-card rounded-xl p-3 border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">2 Unread Messages</p>
                <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
              </div>
            </div>
          </div>
          {/* Lessons */}
          {[
            { time: "09:00", name: "Sarah M", loc: "SW1A 1AA", status: "done" },
            { time: "11:00", name: "James R", loc: "EC1A 1BB", status: "next" },
            { time: "13:30", name: "Emma W", loc: "W1A 1AB", status: "upcoming" },
            { time: "15:00", name: "Tom B", loc: "SE1 7PB", status: "upcoming" },
          ].map((l, i) => (
            <div key={i} className="relative">
              <div className={cn(
                "absolute -left-[17px] w-3 h-3 rounded-full border-2 border-background",
                l.status === "done" ? "bg-emerald-500" : l.status === "next" ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
              )} />
              <div className={cn("rounded-xl p-3 border", l.status === "next" ? "bg-primary/5 border-primary/20" : "bg-card")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground">{l.time} · {l.loc}</p>
                  </div>
                  {l.status === "next" && (
                    <button className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-medium">Start</button>
                  )}
                  {l.status === "done" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                </div>
              </div>
            </div>
          ))}
          {/* Plan ahead */}
          <div className="relative">
            <div className="absolute -left-[17px] w-3 h-3 rounded-full bg-violet-500 border-2 border-background" />
            <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3">
              <p className="text-xs font-semibold text-violet-600">Tomorrow</p>
              <p className="text-sm mt-0.5">3 lessons · £105 expected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 5: Split Hero ───
function Design5() {
  return (
    <div className="min-h-full bg-[#f2f2f7]">
      {/* Fixed top half */}
      <div className="bg-primary text-white px-5 pt-4 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Wednesday</p>
            <p className="text-xl font-bold">£{STATS.earnings}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Bell className="h-4 w-4" /></div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">JD</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mb-1 flex items-center justify-between text-[10px] text-white/50">
          <span>Weekly goal</span><span>72%</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full"><div className="h-full w-[72%] bg-emerald-400 rounded-full" /></div>
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center"><p className="text-lg font-bold">4</p><p className="text-[9px] text-white/50">Lessons</p></div>
          <div className="text-center"><p className="text-lg font-bold">6.5h</p><p className="text-[9px] text-white/50">Teaching</p></div>
          <div className="text-center"><p className="text-lg font-bold">14°C</p><p className="text-[9px] text-white/50">Weather</p></div>
        </div>
      </div>
      {/* Scrollable bottom */}
      <div className="px-4 -mt-3 space-y-2 pb-6">
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">NEXT UP · IN 25 MIN</span>
            <button className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-medium">Start</button>
          </div>
          <p className="text-sm font-semibold">{PUPIL}</p>
          <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm">2 messages</span></div>
          <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">SCHEDULE</p>
          {["09:00 Sarah M ✓", "11:00 James R", "13:30 Emma W", "15:00 Tom B"].map((l, i) => (
            <p key={i} className="text-xs py-1 border-b border-border/50 last:border-0">{l}</p>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">QUICK ACTIONS</p>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {["SatNav", "Diary", "Vehicle", "Jobs"].map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Grid3X3 className="h-4 w-4 text-muted-foreground" /></div>
                <span className="text-[9px] text-muted-foreground">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 6: Minimal List ───
function Design6() {
  return (
    <div className="bg-background min-h-full pb-6">
      <div className="px-5 pt-6">
        <p className="text-2xl font-black tracking-tight">Wednesday</p>
        <p className="text-muted-foreground text-sm mt-0.5">4 lessons · £140 expected</p>
      </div>
      {/* Divider */}
      <div className="h-px bg-border mx-5 my-4" />
      {/* Key metric */}
      <div className="px-5 flex items-baseline gap-2">
        <span className="text-4xl font-black text-primary">72%</span>
        <span className="text-sm text-muted-foreground">of weekly goal</span>
      </div>
      <div className="h-1 bg-muted mx-5 mt-2 rounded-full"><div className="h-full w-[72%] bg-primary rounded-full" /></div>
      {/* Messages */}
      <div className="mx-5 mt-5 py-3 border-b flex items-center justify-between">
        <span className="text-sm font-medium">Messages</span>
        <span className="text-xs text-destructive font-medium">2 unread →</span>
      </div>
      {/* Schedule */}
      <div className="px-5 mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Schedule</p>
        {[
          { time: "10:30", name: "Sarah M", next: true },
          { time: "11:00", name: "James R" },
          { time: "13:30", name: "Emma W" },
          { time: "15:00", name: "Tom B" },
        ].map((l, i) => (
          <div key={i} className={cn("py-3 border-b border-border/50 flex items-center justify-between", l.next && "font-semibold")}>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10">{l.time}</span>
              <span className="text-sm">{l.name}</span>
            </div>
            {l.next && <span className="text-[10px] text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">Next</span>}
          </div>
        ))}
      </div>
      {/* Tomorrow */}
      <div className="px-5 mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tomorrow</p>
        <p className="text-sm">3 lessons · £105</p>
      </div>
      {/* Actions */}
      <div className="px-5 mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Actions</p>
        {["Open Diary", "SatNav", "Vehicle Health", "Earnings"].map((a, i) => (
          <div key={i} className="py-2.5 border-b border-border/50 flex items-center justify-between">
            <span className="text-sm">{a}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DESIGN 7: Glassmorphism ───
function Design7() {
  return (
    <div className="min-h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-4 pt-6 pb-8">
      <p className="text-white/60 text-[10px] uppercase tracking-wider">Good morning</p>
      <p className="text-xl font-bold">4 lessons today</p>
      {/* Glass cards */}
      <div className="mt-4 space-y-3">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
          <p className="text-white/50 text-[10px] uppercase">NEXT LESSON</p>
          <p className="text-lg font-bold mt-1">{PUPIL}</p>
          <p className="text-white/60 text-xs">10:30 · {LOCATION}</p>
          <button className="mt-2 px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Start Lesson →</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Earned", value: "£140" },
            { label: "Goal", value: "72%" },
            { label: "Weather", value: "14°C" },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-2.5 text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[9px] text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-white/70" />
            <span className="text-sm">2 unread messages</span>
          </div>
          <span className="w-5 h-5 rounded-full bg-red-400 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3">
          <p className="text-[10px] uppercase text-white/40 mb-2">TODAY</p>
          {["09:00 Sarah M", "11:00 James R", "13:30 Emma W", "15:00 Tom B"].map((l, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/10 last:border-0">
              <CircleDot className="h-2.5 w-2.5 text-white/40" />
              <span className="text-xs">{l}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3">
          <p className="text-[10px] uppercase text-white/40 mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Navigation, label: "SatNav" },
              { icon: Calendar, label: "Diary" },
              { icon: Car, label: "Vehicle" },
              { icon: BarChart3, label: "Earnings" },
            ].map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"><a.icon className="h-4 w-4" /></div>
                <span className="text-[9px] text-white/50">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3">
          <p className="text-[10px] uppercase text-white/40 mb-1">TOMORROW</p>
          <p className="text-sm">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 8: Horizontal Scroll Sections ───
function Design8() {
  return (
    <div className="bg-[#f2f2f7] min-h-full pb-6">
      <div className="px-4 pt-4">
        <p className="text-lg font-bold">Home</p>
        <p className="text-xs text-muted-foreground">Wednesday · 14°C</p>
      </div>
      {/* Horizontal stat cards */}
      <div className="flex gap-2 overflow-x-auto px-4 mt-3 pb-1 scrollbar-hide">
        {[
          { label: "Lessons", value: "4", bg: "bg-primary", text: "text-white" },
          { label: "Earned", value: "£140", bg: "bg-emerald-500", text: "text-white" },
          { label: "Goal", value: "72%", bg: "bg-violet-500", text: "text-white" },
          { label: "Messages", value: "2", bg: "bg-red-500", text: "text-white" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} ${s.text} rounded-2xl p-3 min-w-[100px] shrink-0`}>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-[10px] opacity-70">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Next lesson */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">NEXT LESSON</span>
            <span className="text-xs text-primary font-medium">25 min</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{PUPIL}</p>
              <p className="text-[10px] text-muted-foreground">10:30 · {LOCATION}</p>
            </div>
            <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><Play className="h-3.5 w-3.5 text-white" /></button>
          </div>
        </div>
      </div>
      {/* Schedule as horizontal cards */}
      <div className="mt-4 px-4">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">TODAY'S SCHEDULE</p>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {[
          { time: "09:00", name: "Sarah M", done: true },
          { time: "11:00", name: "James R", done: false },
          { time: "13:30", name: "Emma W", done: false },
          { time: "15:00", name: "Tom B", done: false },
        ].map((l, i) => (
          <div key={i} className={cn("bg-white rounded-xl p-3 min-w-[120px] shrink-0 shadow-sm", l.done && "opacity-50")}>
            <p className="text-xs font-bold">{l.time}</p>
            <p className="text-sm mt-0.5">{l.name}</p>
            {l.done && <p className="text-[9px] text-emerald-600 mt-0.5">✓ Done</p>}
          </div>
        ))}
      </div>
      {/* Quick actions horizontal */}
      <div className="mt-4 px-4">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">QUICK ACTIONS</p>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {["SatNav", "Diary", "Vehicle", "Earnings", "Jobs", "Fuel"].map((a, i) => (
          <div key={i} className="bg-white rounded-xl p-3 min-w-[80px] shrink-0 shadow-sm flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Grid3X3 className="h-4 w-4 text-muted-foreground" /></div>
            <span className="text-[9px] text-muted-foreground">{a}</span>
          </div>
        ))}
      </div>
      {/* Plan ahead */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">PLAN AHEAD</p>
          <p className="text-sm">Tomorrow · 3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN 9: Tabbed Sections ───
function Design9() {
  const [tab, setTab] = useState<"today" | "plan" | "tools">("today");
  return (
    <div className="bg-[#f2f2f7] min-h-full pb-6">
      <div className="bg-primary text-white px-4 pt-3 pb-4">
        <p className="text-white/50 text-[10px]">EVERY DRIVER</p>
        <p className="text-xl font-bold">£{STATS.earnings}</p>
        <p className="text-white/60 text-xs">{STATS.lessons} lessons · 72% goal</p>
      </div>
      {/* Tabs */}
      <div className="flex bg-white border-b mx-0 sticky top-0 z-10">
        {(["today", "plan", "tools"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            )}
          >{t}</button>
        ))}
      </div>
      <div className="px-4 mt-3 space-y-3">
        {tab === "today" && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] uppercase text-muted-foreground mb-2">NEXT UP</p>
              <p className="font-semibold">{PUPIL}</p>
              <p className="text-xs text-muted-foreground">10:30 · {LOCATION}</p>
              <button className="mt-2 w-full py-2 bg-primary text-white rounded-xl text-xs font-medium">Start Lesson</button>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm">Messages</span></div>
              <span className="w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">2</span>
            </div>
            {["09:00 Sarah M", "11:00 James R", "13:30 Emma W", "15:00 Tom B"].map((l, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm text-sm">{l}</div>
            ))}
          </>
        )}
        {tab === "plan" && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">TOMORROW</p>
              <p className="font-semibold">3 lessons · £105</p>
              <p className="text-xs text-muted-foreground mt-1">First lesson 09:30</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">EARNINGS FORECAST</p>
              <p className="text-2xl font-black text-primary">£580</p>
              <p className="text-xs text-muted-foreground">Projected this month</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">VEHICLE</p>
              <p className="text-sm">All clear — no issues</p>
            </div>
          </>
        )}
        {tab === "tools" && (
          <div className="grid grid-cols-3 gap-2">
            {["SatNav", "Diary", "Vehicle", "Earnings", "Pupils", "Messages", "Fuel", "Jobs", "Settings"].map((a, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Grid3X3 className="h-5 w-5 text-muted-foreground" /></div>
                <span className="text-[10px] font-medium">{a}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DESIGN 10: Compact Dashboard ───
function Design10() {
  return (
    <div className="bg-background min-h-full pb-6">
      {/* Compact header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Wednesday</p>
          <p className="text-[10px] text-muted-foreground">14°C · Online</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-white text-[8px] font-bold flex items-center justify-center">2</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">JD</div>
        </div>
      </div>
      {/* Inline stats strip */}
      <div className="flex items-center justify-around py-2.5 bg-muted/50 border-b">
        <div className="text-center"><p className="text-sm font-bold">4</p><p className="text-[8px] text-muted-foreground">LESSONS</p></div>
        <div className="w-px h-6 bg-border" />
        <div className="text-center"><p className="text-sm font-bold text-emerald-600">£140</p><p className="text-[8px] text-muted-foreground">EARNED</p></div>
        <div className="w-px h-6 bg-border" />
        <div className="text-center"><p className="text-sm font-bold text-violet-600">72%</p><p className="text-[8px] text-muted-foreground">GOAL</p></div>
        <div className="w-px h-6 bg-border" />
        <div className="text-center"><p className="text-sm font-bold">6.5h</p><p className="text-[8px] text-muted-foreground">HOURS</p></div>
      </div>
      {/* Next lesson prominent */}
      <div className="mx-4 mt-3 bg-primary text-white rounded-xl p-3 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-[10px]">NEXT · 25 MIN</p>
          <p className="font-bold text-sm">{PUPIL}</p>
          <p className="text-white/70 text-[10px]">10:30 · {LOCATION}</p>
        </div>
        <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><Play className="h-4 w-4" /></button>
      </div>
      {/* Dense schedule list */}
      <div className="mx-4 mt-3 bg-card rounded-xl border overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30"><p className="text-[10px] font-semibold uppercase text-muted-foreground">SCHEDULE</p></div>
        {[
          { time: "09:00", name: "Sarah M", done: true },
          { time: "11:00", name: "James R" },
          { time: "13:30", name: "Emma W" },
          { time: "15:00", name: "Tom B" },
        ].map((l, i) => (
          <div key={i} className="px-3 py-2 border-b last:border-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-8">{l.time}</span>
              <span className={cn("text-xs", l.done && "line-through text-muted-foreground")}>{l.name}</span>
            </div>
            {l.done && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
          </div>
        ))}
      </div>
      {/* Quick actions dense */}
      <div className="mx-4 mt-3 bg-card rounded-xl border overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30"><p className="text-[10px] font-semibold uppercase text-muted-foreground">ACTIONS</p></div>
        <div className="grid grid-cols-4 p-2 gap-1">
          {[
            { icon: Navigation, label: "SatNav" },
            { icon: Calendar, label: "Diary" },
            { icon: Car, label: "Vehicle" },
            { icon: BarChart3, label: "Earnings" },
            { icon: Briefcase, label: "Jobs" },
            { icon: Fuel, label: "Fuel" },
            { icon: User, label: "Pupils" },
            { icon: Menu, label: "More" },
          ].map((a, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 p-1.5">
              <a.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Tomorrow + Forecast */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <div className="bg-card rounded-xl border p-3">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">TOMORROW</p>
          <p className="text-sm font-bold mt-0.5">3 lessons</p>
          <p className="text-[10px] text-muted-foreground">£105</p>
        </div>
        <div className="bg-card rounded-xl border p-3">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">FORECAST</p>
          <p className="text-sm font-bold mt-0.5 text-primary">£580</p>
          <p className="text-[10px] text-muted-foreground">This month</p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN SHOWCASE PAGE ───
export default function HomepageRedesignsShowcase() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Homepage Redesign Concepts</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            30 layout concepts for the instructor mobile homepage. All retain the same features: 
            next lesson, schedule, messages, stats, quick actions, plan ahead, earnings forecast, weather &amp; alerts.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 justify-items-center">
          <PhoneFrame number={1} title="Command Center" description="Dark, data-dense cockpit. Giant hero metric, grid stats, timeline schedule.">
            <Design1 />
          </PhoneFrame>
          <PhoneFrame number={2} title="Card Stack" description="Friendly stacked cards with rounded corners. Gradient header, clear hierarchy.">
            <Design2 />
          </PhoneFrame>
          <PhoneFrame number={3} title="Bento Grid" description="Modern bento layout. Mixed-size tiles, visual variety, scannable at a glance.">
            <Design3 />
          </PhoneFrame>
          <PhoneFrame number={4} title="Timeline Feed" description="Vertical timeline with status dots. Social-feed feel, chronological flow.">
            <Design4 />
          </PhoneFrame>
          <PhoneFrame number={5} title="Split Screen" description="Fixed navy header with key metrics. Scrollable card list below.">
            <Design5 />
          </PhoneFrame>
          <PhoneFrame number={6} title="Minimal List" description="Ultra-clean typographic design. No icons, no color — pure content hierarchy.">
            <Design6 />
          </PhoneFrame>
          <PhoneFrame number={7} title="Glassmorphism" description="Vibrant gradient background with frosted glass cards. Bold and modern.">
            <Design7 />
          </PhoneFrame>
          <PhoneFrame number={8} title="Horizontal Scroll" description="Instagram-style horizontal card strips for stats, schedule, and actions.">
            <Design8 />
          </PhoneFrame>
          <PhoneFrame number={9} title="Tabbed Sections" description="Three-tab layout: Today / Plan / Tools. Reduces scroll, focused views.">
            <Design9 />
          </PhoneFrame>
          <PhoneFrame number={10} title="Compact Dashboard" description="Dense, info-rich layout. Inline stat strip, tight schedule list, 8-icon grid.">
            <Design10 />
          </PhoneFrame>
          <PhoneFrame number={11} title="Pill Dashboard" description="Scrollable pill stats at top, hero next-lesson card, 8-icon action grid.">
            <Design11 />
          </PhoneFrame>
          <PhoneFrame number={12} title="Newspaper" description="Editorial layout with serif fonts, two-column grid, headline-style sections.">
            <Design12 />
          </PhoneFrame>
          <PhoneFrame number={13} title="Neon Dark" description="Dark mode with cyan/purple neon accents. Glowing gradients, futuristic feel.">
            <Design13 />
          </PhoneFrame>
          <PhoneFrame number={14} title="Bubble Cards" description="Chat-like message bubbles for info. Conversational, friendly, informal.">
            <Design14 />
          </PhoneFrame>
          <PhoneFrame number={15} title="Dashboard Panels" description="Indigo/purple gradient header. Clean white panels below. Corporate polish.">
            <Design15 />
          </PhoneFrame>
          <PhoneFrame number={16} title="Kanban Lanes" description="Horizontal scrolling lanes: Done / Now / Later. Task-board feel.">
            <Design16 />
          </PhoneFrame>
          <PhoneFrame number={17} title="Gradient Sections" description="Emerald/teal gradient header with rounded bottom. Fresh, energetic.">
            <Design17 />
          </PhoneFrame>
          <PhoneFrame number={18} title="Single Column Focus" description="Left-aligned, border-accent, divider-separated. Calm, focused reading.">
            <Design18 />
          </PhoneFrame>
          <PhoneFrame number={19} title="Status Bar" description="Persistent status ticker at top. Notification-first design.">
            <Design19 />
          </PhoneFrame>
          <PhoneFrame number={20} title="Widgets (iOS)" description="iOS-style widget cards with colored icon badges. Native Apple feel.">
            <Design20 />
          </PhoneFrame>
          <PhoneFrame number={21} title="Card Carousel" description="Swipeable hero cards with avatar initials in schedule list.">
            <Design21 />
          </PhoneFrame>
          <PhoneFrame number={22} title="Progress Ring" description="Central SVG progress ring for goal tracking. Data visualization focus.">
            <Design22 />
          </PhoneFrame>
          <PhoneFrame number={23} title="Sidebar Tabs" description="Vertical icon sidebar navigation. Desktop-like feel on mobile.">
            <Design23 />
          </PhoneFrame>
          <PhoneFrame number={24} title="Stacked Layers" description="Overlapping cards with z-index layering. Depth and dimension.">
            <Design24 />
          </PhoneFrame>
          <PhoneFrame number={25} title="Activity Rings" description="Apple Watch-style triple activity rings. Fitness tracker aesthetic.">
            <Design25 />
          </PhoneFrame>
          <PhoneFrame number={26} title="Map Header" description="Map-style hero with location pin. Geographic, contextual design.">
            <Design26 />
          </PhoneFrame>
          <PhoneFrame number={27} title="Accordion Sections" description="Collapsible bordered sections with emoji headers. Organized, tidy.">
            <Design27 />
          </PhoneFrame>
          <PhoneFrame number={28} title="Big Type" description="Oversized typography, minimal UI chrome. Content-first editorial.">
            <Design28 />
          </PhoneFrame>
          <PhoneFrame number={29} title="Streak/Gamified" description="XP bars, streaks, quests. Gamification layer for engagement.">
            <Design29 />
          </PhoneFrame>
          <PhoneFrame number={30} title="Duo-tone Split" description="Dark top / light bottom split. Bold color contrast, red accents.">
            <Design30 />
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
