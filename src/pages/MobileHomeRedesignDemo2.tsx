import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, MapPin, Clock, Calendar,
  ChevronRight, MessageSquare, Briefcase, Heart, Car, Star, Zap,
  TrendingUp, Users, Play, Sun, Cloud, Navigation, CheckCircle,
  ArrowLeft, ArrowRight, CloudSun, ListTodo, Flame, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

const mock = {
  name: "Sarah",
  initials: "S",
  isOnline: true,
  weather: { temp: 14, desc: "Partly cloudy" },
  lessons: 5,
  earnings: 175,
  weeklyProgress: 72,
  streak: 12,
  unread: 3,
  pendingJobs: 2,
  nextLesson: { time: "10:30", pupil: "James W.", postcode: "LS1 4AP", minutesUntil: 25, duration: "1hr" },
  timeline: [
    { time: "09:00", pupil: "Alice B.", postcode: "LS2 3AA", done: true },
    { time: "10:30", pupil: "James W.", postcode: "LS1 4AP", done: false, isNext: true },
    { time: "12:00", pupil: "Maria G.", postcode: "LS6 2NB", done: false },
    { time: "14:00", pupil: "Tom S.", postcode: "LS7 1RR", done: false },
    { time: "16:00", pupil: "Emma L.", postcode: "LS3 1AB", done: false },
  ],
  tomorrow: { lessons: 4, hours: 6, earnings: 210, firstTime: "08:30" },
  quickActions: [
    { label: "Schedule", icon: Calendar, color: "text-[#0075c9]", bg: "bg-[#0075c9]/10" },
    { label: "Pupils", icon: Users, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Pay", icon: PoundSterling, color: "text-violet-600", bg: "bg-violet-500/10" },
    { label: "Track", icon: MapPin, color: "text-rose-600", bg: "bg-rose-500/10" },
    { label: "Gaps", icon: Calendar, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Vehicle", icon: Car, color: "text-sky-600", bg: "bg-sky-500/10" },
    { label: "Health", icon: Heart, color: "text-pink-600", bg: "bg-pink-500/10" },
    { label: "To Do", icon: ListTodo, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  ],
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ── Shared sub-components ──
const HeroImage = ({ className = "", overlay = "from-black/30 to-transparent" }: { className?: string; overlay?: string }) => (
  <div className={`w-full overflow-hidden relative ${className}`}>
    <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
    <div className={`absolute inset-0 bg-gradient-to-t ${overlay}`} />
  </div>
);

const MiniTimeline = ({ dark = false }: { dark?: boolean }) => (
  <div className="space-y-0 mt-3">
    {mock.timeline.map((item, i) => (
      <div key={i} className="flex gap-2.5 pb-2">
        <div className="flex flex-col items-center">
          <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-[#0075c9] ring-3 ring-[#0075c9]/20" : dark ? "bg-white/20" : "bg-gray-200"}`} />
          {i < mock.timeline.length - 1 && <div className={`w-0.5 flex-1 ${dark ? "bg-white/10" : "bg-gray-100"} mt-0.5`} />}
        </div>
        <div className="flex-1 pb-1">
          <p className={`text-xs ${item.done ? (dark ? "text-gray-600" : "text-gray-400") : dark ? "text-gray-400" : "text-gray-500"}`}>{item.time}</p>
          <p className={`text-sm font-medium ${item.done ? (dark ? "text-gray-600 line-through" : "text-gray-400 line-through") : dark ? "text-white" : "text-gray-900"}`}>{item.pupil}</p>
        </div>
        {item.isNext && <span className="text-[10px] font-medium text-[#0075c9] bg-[#0075c9]/10 px-2 py-0.5 rounded-full self-start mt-1">Next</span>}
        {item.done && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-1.5 shrink-0" />}
      </div>
    ))}
  </div>
);

const QuickActionsGrid = ({ cols = 4, rounded = "rounded-2xl", iconSize = "h-12 w-12", dark = false }: { cols?: number; rounded?: string; iconSize?: string; dark?: boolean }) => (
  <div>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"} mb-2`}>QUICK ACTIONS</p>
    <div className={`grid grid-cols-${cols} gap-3`}>
      {mock.quickActions.map(q => (
        <div key={q.label} className="flex flex-col items-center gap-1.5">
          <div className={`${iconSize} ${rounded} ${q.bg} flex items-center justify-center`}>
            <q.icon className={`h-5 w-5 ${q.color}`} />
          </div>
          <span className={`text-[10px] ${dark ? "text-gray-400" : "text-gray-500"}`}>{q.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const AlertBanners = ({ dark = false }: { dark?: boolean }) => (
  <div className="space-y-2">
    {mock.pendingJobs > 0 && (
      <div className={`${dark ? "bg-white/5 border border-white/10" : "bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] text-white"} rounded-xl px-4 py-3 relative overflow-hidden`}>
        {!dark && <><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></>}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className={`h-5 w-5 ${dark ? "text-[#00a3ff]" : ""}`} />
            <div><span className="font-semibold text-sm">Job Offers</span><p className={`${dark ? "text-gray-500" : "text-white/70"} text-[10px]`}>{mock.pendingJobs} pending</p></div>
          </div>
          <span className={`min-w-[28px] h-7 px-2.5 rounded-full ${dark ? "bg-[#0075c9]" : "bg-white/90 text-[#0075c9]"} text-xs font-bold flex items-center justify-center`}>{mock.pendingJobs}</span>
        </div>
      </div>
    )}
    {mock.unread > 0 && (
      <div className={`${dark ? "bg-white/5 border border-white/10" : "bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] text-white"} rounded-xl px-4 py-3 relative overflow-hidden`}>
        {!dark && <><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></>}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className={`h-5 w-5 ${dark ? "text-rose-400" : ""}`} />
            <div><span className="font-semibold text-sm">Messages</span><p className={`${dark ? "text-gray-500" : "text-white/70"} text-[10px]`}>{mock.unread} unread</p></div>
          </div>
          <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{mock.unread}</span>
        </div>
      </div>
    )}
  </div>
);

const AgendaSection = ({ dark = false }: { dark?: boolean }) => (
  <div>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"} mb-2`}>AGENDA</p>
    <div className={`${dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100 shadow-sm"} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>This Week</span>
        <ChevronRight className={`h-4 w-4 ${dark ? "text-gray-600" : "text-gray-300"}`} />
      </div>
      <div className={`h-1.5 ${dark ? "bg-white/10" : "bg-gray-100"} rounded-full`}>
        <div className="h-full bg-[#0075c9] rounded-full" style={{ width: `${mock.weeklyProgress}%` }} />
      </div>
      <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-500"} mt-1`}>{mock.weeklyProgress}% of weekly goal</p>
    </div>
  </div>
);

const PlanAheadSection = ({ dark = false }: { dark?: boolean }) => (
  <div>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"} mb-2`}>PLAN AHEAD</p>
    <div className={`${dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100 shadow-sm"} rounded-xl p-3 flex items-center gap-3`}>
      <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
        <Calendar className="h-5 w-5 text-violet-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>Tomorrow</p>
        <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}>{mock.tomorrow.lessons} lessons · {mock.tomorrow.hours}hrs · £{mock.tomorrow.earnings}</p>
      </div>
      <ChevronRight className={`h-4 w-4 ${dark ? "text-gray-600" : "text-gray-300"} shrink-0`} />
    </div>
  </div>
);

const NextLessonCard = ({ dark = false }: { dark?: boolean }) => (
  <div>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"} mb-2`}>YOUR DAY</p>
    <div className={`${dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100 shadow-sm"} rounded-xl p-4`}>
      <div className={`flex items-center gap-2 text-xs ${dark ? "text-[#00a3ff]" : "text-amber-600"} font-medium mb-2`}>
        <Timer className="h-3.5 w-3.5" /> Next in {mock.nextLesson.minutesUntil}min
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{mock.nextLesson.pupil}</p>
          <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>{mock.nextLesson.time} · {mock.nextLesson.postcode} · {mock.nextLesson.duration}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-[#0075c9] flex items-center justify-center">
          <Navigation className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════
// CONCEPT 11: Rounded Pill
// Soft, bubbly design with pill-shaped elements
// ══════════════════════════════════════════════════════
function Concept11() {
  return (
    <div className="bg-[#f0f4ff] min-h-full">
      <HeroImage className="h-[140px] rounded-b-[32px]" overlay="from-[#f0f4ff] via-transparent to-transparent" />
      <div className="-mt-10 mx-4 relative z-10">
        <div className="bg-white rounded-[28px] shadow-lg shadow-[#0075c9]/8 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0075c9] to-[#4da6ff] flex items-center justify-center text-white font-bold">{mock.initials}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{getGreeting()}, {mock.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
                <span className="bg-gray-50 px-2 py-0.5 rounded-full"><CloudSun className="h-3 w-3 inline" /> {mock.weather.temp}°</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { v: mock.lessons, l: "Lessons", c: "bg-[#0075c9]/10 text-[#0075c9]" },
              { v: `£${mock.earnings}`, l: "Earned", c: "bg-emerald-500/10 text-emerald-600" },
              { v: `${mock.weeklyProgress}%`, l: "Goal", c: "bg-violet-500/10 text-violet-600" },
            ].map(s => (
              <div key={s.l} className={`flex-1 ${s.c} rounded-2xl p-3 text-center`}>
                <p className="text-base font-bold">{s.v}</p>
                <p className="text-[9px] opacity-60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 mt-3"><AlertBanners /></div>
      <div className="px-4 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid rounded="rounded-full" />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 12: Newspaper Editorial
// Typography-heavy, editorial look
// ══════════════════════════════════════════════════════
function Concept12() {
  return (
    <div className="bg-[#faf9f7] min-h-full">
      <HeroImage className="h-[120px]" overlay="from-[#faf9f7] to-transparent" />
      <div className="px-5 -mt-4 relative z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-black text-gray-900 leading-tight">{getGreeting()},<br/>{mock.name}.</h1>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
          <span>{mock.weather.temp}° · {mock.weather.desc}</span>
        </div>
        {/* Stats as horizontal strip */}
        <div className="flex gap-4 mt-4 py-3 border-t border-b border-gray-200">
          {[
            { v: mock.lessons, l: "Lessons" },
            { v: `£${mock.earnings}`, l: "Earned" },
            { v: `${mock.weeklyProgress}%`, l: "Goal" },
            { v: mock.streak, l: "Streak" },
          ].map(s => (
            <div key={s.l} className="flex-1 text-center">
              <p className="text-lg font-black text-gray-900">{s.v}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 mt-3"><AlertBanners /></div>
      <div className="px-5 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid rounded="rounded-lg" />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 13: Frosted Glass
// ══════════════════════════════════════════════════════
function Concept13() {
  return (
    <div className="min-h-full relative">
      <HeroImage className="h-full absolute inset-0" overlay="from-black/60 via-black/40 to-black/70" />
      <div className="relative z-10 min-h-full px-4 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold border border-white/20">{mock.initials}</div>
          <div className="flex-1">
            <p className="font-bold text-white">{getGreeting()}, {mock.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-white/50">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
              <span>{mock.weather.temp}° {mock.weather.desc}</span>
            </div>
          </div>
        </div>
        {/* Frosted stats */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-4 grid grid-cols-4 gap-2">
          {[
            { v: mock.lessons, l: "Lessons" },
            { v: `£${mock.earnings}`, l: "Earned" },
            { v: `${mock.weeklyProgress}%`, l: "Goal" },
            { v: `${mock.streak}🔥`, l: "Streak" },
          ].map(s => (
            <div key={s.l} className="text-center">
              <p className="text-sm font-bold text-white">{s.v}</p>
              <p className="text-[9px] text-white/40">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-3"><AlertBanners dark /></div>
        <div className="mt-4 space-y-5">
          <NextLessonCard dark />
          <MiniTimeline dark />
          <QuickActionsGrid dark />
          <AgendaSection dark />
          <PlanAheadSection dark />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 14: Stripe-Inspired
// Clean lines, subtle depth, professional
// ══════════════════════════════════════════════════════
function Concept14() {
  return (
    <div className="bg-white min-h-full">
      <div className="bg-gradient-to-br from-[#0a2540] to-[#0075c9] pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-400/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-400/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
        <img src={instructorHeroImg} alt="Hero" className="w-full h-[100px] object-cover opacity-20" />
        <div className="px-5 -mt-4 relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm">{mock.initials}</div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">{getGreeting()}, {mock.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-white/50">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
                <span>{mock.weather.temp}° {mock.weather.desc}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { v: mock.lessons, l: "Lessons" },
              { v: `£${mock.earnings}`, l: "Earned" },
              { v: `${mock.weeklyProgress}%`, l: "Goal" },
              { v: `${mock.streak}`, l: "Streak" },
            ].map(s => (
              <div key={s.l} className="bg-white/10 rounded-lg px-2 py-2 text-center">
                <p className="text-sm font-bold text-white">{s.v}</p>
                <p className="text-[9px] text-white/40">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 -mt-0 space-y-2"><AlertBanners /></div>
      <div className="px-5 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid rounded="rounded-lg" iconSize="h-11 w-11" />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 15: Warm Sunset
// ══════════════════════════════════════════════════════
function Concept15() {
  return (
    <div className="bg-[#fef7f0] min-h-full">
      <HeroImage className="h-[160px]" overlay="from-[#fef7f0] via-orange-900/20 to-transparent" />
      <div className="-mt-10 mx-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-orange-200/40 p-4 border border-orange-100/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold">{mock.initials}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{getGreeting()}, {mock.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
                <span>{mock.weather.temp}° {mock.weather.desc}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: mock.lessons, l: "Lessons", Icon: BookOpen, c: "text-orange-500 bg-orange-50" },
              { v: `£${mock.earnings}`, l: "Earned", Icon: PoundSterling, c: "text-emerald-500 bg-emerald-50" },
              { v: `${mock.weeklyProgress}%`, l: "Goal", Icon: Target, c: "text-violet-500 bg-violet-50" },
              { v: `${mock.streak}🔥`, l: "Streak", Icon: Flame, c: "text-rose-500 bg-rose-50" },
            ].map(s => (
              <div key={s.l} className={`flex items-center gap-2 p-2.5 rounded-xl ${s.c.split(" ")[1]}`}>
                <s.Icon className={`h-4 w-4 ${s.c.split(" ")[0]}`} />
                <div><p className="text-sm font-bold text-gray-900">{s.v}</p><p className="text-[10px] text-gray-400">{s.l}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 mt-3"><AlertBanners /></div>
      <div className="px-4 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 16: Neon Accent
// Almost-black bg with neon blue highlights
// ══════════════════════════════════════════════════════
function Concept16() {
  return (
    <div className="bg-[#0c0c14] min-h-full text-white">
      <div className="relative">
        <HeroImage className="h-[130px]" overlay="from-[#0c0c14] via-[#0c0c14]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent" />
      </div>
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#0075c9] flex items-center justify-center font-bold text-sm shadow-lg shadow-[#00d4ff]/20">{mock.initials}</div>
          <div className="flex-1">
            <p className="font-bold">{getGreeting()}, {mock.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#00d4ff] animate-pulse" /> Online</span>
              <span>{mock.weather.temp}° {mock.weather.desc}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: mock.lessons, l: "Lessons" },
            { v: `£${mock.earnings}`, l: "Earned" },
            { v: `${mock.weeklyProgress}%`, l: "Goal" },
            { v: `${mock.streak}`, l: "Streak" },
          ].map(s => (
            <div key={s.l} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-center">
              <p className="text-sm font-bold text-[#00d4ff]">{s.v}</p>
              <p className="text-[9px] text-gray-600">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 mt-3"><AlertBanners dark /></div>
      <div className="px-4 mt-4 space-y-5 pb-6">
        <NextLessonCard dark />
        <MiniTimeline dark />
        <QuickActionsGrid dark />
        <AgendaSection dark />
        <PlanAheadSection dark />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 17: Horizontal Scroll Cards
// Stats scroll horizontally, modern iOS feel
// ══════════════════════════════════════════════════════
function Concept17() {
  return (
    <div className="bg-gray-50 min-h-full">
      <HeroImage className="h-[180px]" overlay="from-black/50 to-transparent" />
      <div className="absolute top-[120px] left-4 right-4 z-10" style={{ position: "relative", marginTop: "-70px" }}>
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#0075c9] font-bold border-2 border-white">{mock.initials}</div>
          <div className="flex-1">
            <p className="font-bold text-white text-lg drop-shadow">{getGreeting()}, {mock.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-white/70">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
              <span>{mock.weather.temp}° {mock.weather.desc}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Horizontal scroll stats */}
      <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 -mt-2 no-scrollbar">
        {[
          { v: mock.lessons, l: "Lessons Today", c: "from-[#0075c9] to-[#4da6ff]" },
          { v: `£${mock.earnings}`, l: "Expected", c: "from-emerald-500 to-emerald-400" },
          { v: `${mock.weeklyProgress}%`, l: "Weekly Goal", c: "from-violet-500 to-violet-400" },
          { v: `${mock.streak} days`, l: "Streak", c: "from-amber-500 to-amber-400" },
        ].map(s => (
          <div key={s.l} className={`bg-gradient-to-br ${s.c} text-white rounded-2xl p-4 min-w-[130px] shrink-0`}>
            <p className="text-xl font-bold">{s.v}</p>
            <p className="text-[10px] text-white/60 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="px-4 mt-3"><AlertBanners /></div>
      <div className="px-4 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 18: Side Accent Bar
// Left accent bars on each card
// ══════════════════════════════════════════════════════
function Concept18() {
  return (
    <div className="bg-gray-50 min-h-full">
      <HeroImage className="h-[130px]" />
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-md border-l-4 border-[#0075c9] p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0075c9] flex items-center justify-center text-white font-bold text-sm">{mock.initials}</div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{getGreeting()}, {mock.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
                <span>{mock.weather.temp}° {mock.weather.desc}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Stats with accent bars */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { v: mock.lessons, l: "Lessons", bc: "border-[#0075c9]" },
            { v: `£${mock.earnings}`, l: "Expected", bc: "border-emerald-500" },
            { v: `${mock.weeklyProgress}%`, l: "Weekly", bc: "border-violet-500" },
            { v: `${mock.streak}🔥`, l: "Streak", bc: "border-amber-500" },
          ].map(s => (
            <div key={s.l} className={`bg-white rounded-lg shadow-sm border-l-3 ${s.bc} p-3`}>
              <p className="text-lg font-bold text-gray-900">{s.v}</p>
              <p className="text-[10px] text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
        <AlertBanners />
      </div>
      <div className="px-4 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid rounded="rounded-xl" />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 19: Monochrome Elegant
// Black & white with a single blue accent
// ══════════════════════════════════════════════════════
function Concept19() {
  return (
    <div className="bg-white min-h-full">
      <HeroImage className="h-[160px] grayscale" overlay="from-white via-white/40 to-transparent" />
      <div className="-mt-12 px-5 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white font-bold">{mock.initials}</div>
          <div className="flex-1">
            <p className="text-xl font-black text-black">{getGreeting()}, {mock.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#0075c9]" /> Online</span>
              <span>{mock.weather.temp}° {mock.weather.desc}</span>
            </div>
          </div>
        </div>
        {/* Minimal number row */}
        <div className="flex items-center gap-6 py-3 border-b border-black/10">
          {[
            { v: mock.lessons, l: "Lessons" },
            { v: `£${mock.earnings}`, l: "Earned" },
            { v: `${mock.weeklyProgress}%`, l: "Goal" },
          ].map(s => (
            <div key={s.l}>
              <p className="text-2xl font-black text-black leading-none">{s.v}</p>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 mt-3"><AlertBanners /></div>
      <div className="px-5 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid rounded="rounded-none" iconSize="h-11 w-11" />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 20: Notification Center
// Hero at top, everything as notification-style rows
// ══════════════════════════════════════════════════════
function Concept20() {
  return (
    <div className="bg-[#f5f5f7] min-h-full">
      <HeroImage className="h-[140px]" overlay="from-[#f5f5f7] via-transparent to-transparent" />
      <div className="-mt-6 px-4 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-[#0075c9] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#0075c9]/30">{mock.initials}</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{getGreeting()}, {mock.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
              <span>{mock.weather.temp}° {mock.weather.desc}</span>
            </div>
          </div>
        </div>

        {/* Stats as notification rows */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          {[
            { Icon: BookOpen, v: `${mock.lessons} lessons today`, l: "Schedule", c: "text-[#0075c9] bg-[#0075c9]/10" },
            { Icon: PoundSterling, v: `£${mock.earnings} expected`, l: "Earnings", c: "text-emerald-600 bg-emerald-500/10" },
            { Icon: Target, v: `${mock.weeklyProgress}% of weekly goal`, l: "Progress", c: "text-violet-600 bg-violet-500/10" },
            { Icon: Flame, v: `${mock.streak} day streak`, l: "Consistency", c: "text-amber-600 bg-amber-500/10" },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-3 px-4 py-3">
              <div className={`h-9 w-9 rounded-xl ${s.c.split(" ").slice(1).join(" ")} flex items-center justify-center`}>
                <s.Icon className={`h-4 w-4 ${s.c.split(" ")[0]}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{s.v}</p>
                <p className="text-[10px] text-gray-400">{s.l}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 mt-3"><AlertBanners /></div>
      <div className="px-4 mt-4 space-y-5 pb-6">
        <NextLessonCard />
        <MiniTimeline />
        <QuickActionsGrid />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Demo shell
// ══════════════════════════════════════════════════════
const concepts = [
  { id: 11, name: "Rounded Pill", desc: "Soft bubbly pills & rounded shapes", Component: Concept11 },
  { id: 12, name: "Newspaper Editorial", desc: "Typography-heavy editorial layout", Component: Concept12 },
  { id: 13, name: "Frosted Glass", desc: "Full-bleed hero with glass overlays", Component: Concept13 },
  { id: 14, name: "Stripe-Inspired", desc: "Professional dark header, clean body", Component: Concept14 },
  { id: 15, name: "Warm Sunset", desc: "Warm orange & rose tones", Component: Concept15 },
  { id: 16, name: "Neon Accent", desc: "Dark bg with neon cyan highlights", Component: Concept16 },
  { id: 17, name: "Horizontal Scroll", desc: "Swipeable stat cards, modern iOS", Component: Concept17 },
  { id: 18, name: "Side Accent Bar", desc: "Left accent bars on every card", Component: Concept18 },
  { id: 19, name: "Monochrome Elegant", desc: "B&W with a single blue accent", Component: Concept19 },
  { id: 20, name: "Notification Center", desc: "Stats as notification-style rows", Component: Concept20 },
];

export default function MobileHomeRedesignDemo2() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/mobile-home-redesign" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Set 1 (1–10)
          </Link>
          <h1 className="text-base font-semibold">Mobile Home Redesign · Set 2</h1>
          <span className="text-sm text-gray-500">{selected + 1}/10</span>
        </div>
      </div>

      {/* Concept selector row */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {concepts.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selected === i
                  ? "bg-[#0075c9] text-white shadow-lg shadow-[#0075c9]/20"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {c.id}. {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold">{concepts[selected].name}</h2>
            <p className="text-sm text-gray-400 mt-1">{concepts[selected].desc}</p>
          </div>

          <div className="relative">
            <div className="w-[375px] h-[812px] bg-black rounded-[50px] p-3 shadow-2xl shadow-[#0075c9]/10 border border-white/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-2xl z-10" />
              <div className="w-full h-full rounded-[40px] overflow-hidden bg-white">
                <div className="h-full overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selected}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="min-h-full"
                    >
                      {(() => { const C = concepts[selected].Component; return <C />; })()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full" />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={() => setSelected(Math.max(0, selected - 1))} disabled={selected === 0} className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30">
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(Math.min(9, selected + 1))} disabled={selected === 9} className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="w-full mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">All Concepts</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {concepts.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setSelected(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`rounded-2xl overflow-hidden border-2 transition-all ${
                    selected === i ? "border-[#0075c9] shadow-lg shadow-[#0075c9]/20" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="h-[200px] overflow-hidden bg-white">
                    <div className="transform scale-[0.28] origin-top-left w-[375px] h-[714px] pointer-events-none">
                      <c.Component />
                    </div>
                  </div>
                  <div className="bg-gray-900 px-2 py-2 text-left">
                    <p className="text-xs font-medium truncate">{c.id}. {c.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
