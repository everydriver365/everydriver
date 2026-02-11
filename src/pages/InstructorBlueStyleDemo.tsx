import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, CloudSun, Clock,
  Calendar, MapPin, Plus, Car, Heart, Navigation, Phone,
  MessageSquare, Check, ChevronDown, Mail, AlertTriangle,
  BatteryFull, Key, Wifi, Send, CalendarClock, X,
  ChevronRight, Loader2,
} from "lucide-react";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

// ── Shared gradient header ──────────────────────────────────────
function GradientHeader({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`relative bg-gradient-to-br from-primary to-primary/80 ${compact ? "px-4 py-3" : "px-4 py-4"} text-white`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-5 mb-2">{children}</p>
  );
}

// ── Phone Frame ─────────────────────────────────────────────────
function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="w-[375px] h-[812px] bg-[#E8F1FE] rounded-[3rem] overflow-hidden shadow-2xl border-[6px] border-gray-800 relative">
        <div className="h-11 bg-black/5 flex items-center justify-between px-8 text-[11px] font-semibold text-foreground/60">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div className="h-[calc(100%-44px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── CURRENT STYLE (Before) ──────────────────────────────────────
function CurrentStyle() {
  return (
    <PhoneFrame label="Current Style">
      <div>
        {/* Hero */}
        <div className="relative h-[38vh] min-h-[180px] max-h-[280px]">
          <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Ready to Teach (current white card) */}
        <div className="relative -mt-8 mx-4">
          <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">K</div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-foreground">Ready to teach, Ken?</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </span>
                  <span className="text-xs text-muted-foreground"><CloudSun className="h-3 w-3 inline mr-0.5" />14°C</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: BookOpen, label: "Lessons", value: "4", bg: "bg-blue-500/10", color: "text-blue-500" },
                { icon: PoundSterling, label: "Expected", value: "£180", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                { icon: Target, label: "Weekly", value: "72%", bg: "bg-violet-500/10", color: "text-violet-500" },
                { icon: Timer, label: "Sarah", value: "14:30 • SO31", bg: "bg-amber-500/10", color: "text-amber-500" },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 mt-3 space-y-3">
          {/* Job Offers (current) */}
          <div className="flex items-center justify-between w-full bg-gradient-to-r from-amber-100 to-card border border-amber-200/60 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <span className="font-medium text-sm text-amber-900">View Job Offers</span>
            </div>
            <span className="min-w-[24px] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">3</span>
          </div>

          {/* Messages (current) */}
          <div className="flex items-center justify-between w-full bg-gradient-to-r from-blue-100 to-card border border-blue-200/60 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-sm text-blue-900">View Messages</span>
            </div>
            <span className="min-w-[24px] h-6 px-2 rounded-full bg-destructive text-white text-xs font-bold flex items-center justify-center">2</span>
          </div>

          {/* Vehicle Health (current) */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                  <Car className="h-4 w-4 text-sky-600" />
                </div>
                <span className="text-sm font-semibold text-foreground">Vehicle Health</span>
                <span className="text-xs font-medium bg-primary text-primary-foreground rounded px-1.5 py-0.5">AB12 CDE</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: BatteryFull, label: "Battery", value: "87%", bg: "bg-blue-500/10", color: "text-primary" },
                { icon: Key, label: "Ignition", value: "ON", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                { icon: Wifi, label: "Status", value: "Live", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                { icon: Car, label: "Seen", value: "2m", bg: "bg-amber-500/10", color: "text-amber-500" },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <div>
                    <p className={`text-sm font-bold leading-none ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Up (current) */}
          <div className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden">
            <div className="relative bg-muted/50 h-24 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Map Preview</span>
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow">
                  <Clock className="h-3 w-3" /> NEXT UP
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 border border-border/60 text-[11px] font-bold">
                  <Timer className="h-3 w-3" /> in 2h
                </span>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="font-bold text-foreground text-base">Sarah Johnson</p>
              <p className="text-xs text-muted-foreground">SO31 4NG</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Today · 2:30 PM
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">2h lesson</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mt-2">
                <Car className="h-3.5 w-3.5" /> ETA 14:15 (25 min)
              </div>
            </div>
          </div>

          {/* Timeline (current) */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Schedule</h3>
            </div>
            <div className="space-y-2 text-xs">
              {["09:00 James ✓", "11:00 Priya ✓", "14:30 Sarah ●", "16:00 Tom"].map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${i < 2 ? "bg-emerald-500" : i === 2 ? "bg-primary animate-pulse" : "bg-border"}`} />
                  <span className={i < 2 ? "line-through" : i === 2 ? "font-semibold text-foreground" : ""}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-6" />
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── BLUE GRADIENT STYLE (After) ─────────────────────────────────
function BlueGradientStyle() {
  return (
    <PhoneFrame label="Blue Gradient Style">
      <div>
        {/* Hero */}
        <div className="relative h-[38vh] min-h-[180px] max-h-[280px]">
          <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Ready to Teach (gradient overlap) */}
        <div className="relative -mt-10 mx-4">
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
            <GradientHeader>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">K</div>
                <div className="flex-1">
                  <h2 className="text-base font-bold">Ready to teach, Ken?</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/30 text-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                    </span>
                    <span className="text-white/70 text-xs"><CloudSun className="h-3 w-3 inline mr-0.5" />14°C • Partly Cloudy</span>
                  </div>
                </div>
              </div>
            </GradientHeader>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: BookOpen, label: "Lessons", value: "4", bg: "bg-blue-500/10", color: "text-blue-500" },
                  { icon: PoundSterling, label: "Expected", value: "£180", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                  { icon: Target, label: "Weekly", value: "72%", bg: "bg-violet-500/10", color: "text-violet-500" },
                  { icon: Timer, label: "Sarah", value: "14:30 • SO31", bg: "bg-amber-500/10", color: "text-amber-500" },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-3 space-y-3">
          {/* Job Offers (blue-styled) */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
            <GradientHeader compact>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Job Offers</span>
                    <p className="text-white/70 text-[10px]">3 pending offers</p>
                  </div>
                </div>
                <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-white/90 text-primary text-xs font-bold flex items-center justify-center shadow-sm">3</span>
              </div>
            </GradientHeader>
          </div>

          {/* Messages (blue-styled) */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
            <GradientHeader compact>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Messages</span>
                    <p className="text-white/70 text-[10px]">2 unread messages</p>
                  </div>
                </div>
                <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center shadow-sm">2</span>
              </div>
            </GradientHeader>
          </div>

          {/* Vehicle Health (blue-styled) */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
            <GradientHeader compact>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Vehicle Health</span>
                    <p className="text-white/70 text-[10px]">All systems normal</p>
                  </div>
                </div>
                <span className="text-xs font-medium bg-white/90 text-primary rounded px-2 py-0.5 shadow-sm">AB12 CDE</span>
              </div>
            </GradientHeader>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: BatteryFull, label: "Battery", value: "87%", bg: "bg-blue-500/10", color: "text-primary" },
                  { icon: Key, label: "Ignition", value: "ON", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                  { icon: Wifi, label: "Status", value: "Live", bg: "bg-emerald-500/10", color: "text-emerald-500" },
                  { icon: Car, label: "Seen", value: "2m", bg: "bg-amber-500/10", color: "text-amber-500" },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <div>
                      <p className={`text-sm font-bold leading-none ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Up (blue-styled) */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
            <GradientHeader compact>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-primary text-xs font-extrabold tracking-wide shadow-sm">
                    <Clock className="h-3 w-3" /> NEXT UP
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
                  <Timer className="h-3 w-3" /> in 2h
                </span>
              </div>
            </GradientHeader>
            {/* Map area */}
            <div className="relative bg-muted/30 h-20 flex items-center justify-center border-b border-border/20">
              <span className="text-xs text-muted-foreground">Map Preview</span>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">SJ</div>
                <div>
                  <p className="font-bold text-foreground text-base">Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">SO31 4NG</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-primary/5 border border-primary/10 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Today · 2:30 PM
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">2h lesson</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-3">
                <Car className="h-3.5 w-3.5" /> ETA 14:15 (25 min)
              </div>
              <div className="flex items-center gap-1.5">
                <button className="flex-1 h-8 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1">
                  <Navigation className="h-3.5 w-3.5" /> Navigate
                </button>
                <button className="h-8 rounded-xl bg-primary/10 text-primary text-xs font-medium px-3 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> On Way
                </button>
                <button className="h-8 w-8 rounded-full border border-border flex items-center justify-center">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button className="h-8 w-8 rounded-full border border-border flex items-center justify-center">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline (blue-styled) */}
          <div className="bg-card rounded-3xl shadow-xl overflow-hidden">
            <GradientHeader compact>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Today's Schedule</span>
              </div>
            </GradientHeader>
            <div className="p-4 space-y-2 text-xs">
              {[
                { time: "09:00", name: "James", done: true },
                { time: "11:00", name: "Priya", done: true },
                { time: "14:30", name: "Sarah", current: true },
                { time: "16:00", name: "Tom" },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    t.done ? "bg-emerald-500 border-emerald-500" : t.current ? "bg-primary border-primary animate-pulse" : "bg-card border-border"
                  }`}>
                    {t.done ? <Check className="h-3 w-3 text-white" /> : (
                      <span className={`text-[8px] font-bold ${t.current ? "text-white" : "text-muted-foreground"}`}>{t.name[0]}</span>
                    )}
                  </div>
                  <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : t.current ? "font-semibold text-foreground" : "text-foreground"}`}>{t.name}</span>
                  <span className={t.current ? "text-primary font-semibold" : "text-muted-foreground"}>{t.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── Main Demo Page ──────────────────────────────────────────────
export default function InstructorBlueStyleDemo() {
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-[850px] mx-auto">
        <h1 className="text-2xl font-bold mb-1">Blue Gradient Style — Before & After</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Side-by-side comparison of all homepage tiles with the unified gradient blue treatment applied.
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          <CurrentStyle />
          <BlueGradientStyle />
        </div>
      </div>
    </div>
  );
}
