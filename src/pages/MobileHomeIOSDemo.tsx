import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, MapPin, Clock, Calendar,
  ChevronRight, MessageSquare, Briefcase, Heart, Car, Navigation,
  CheckCircle, CloudSun, ListTodo, Users, ArrowLeft, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";

// ── Mock data matching the real InstructorMobileHome exactly ──
const mock = {
  name: "Sarah", firstName: "Sarah", initials: "S", isOnline: true,
  weather: { temp: 14, desc: "Partly cloudy", icon: "CloudSun" },
  lessons: 5, earnings: 175, weeklyProgress: 72, streak: 12, unread: 3, pendingJobs: 2,
  nextLesson: { time: "10:30", pupil: "James W.", postcode: "LS1 4AP", minutesUntil: 25, duration: "1hr" },
  timeline: [
    { time: "09:00", pupil: "Alice B.", done: true, isNext: false },
    { time: "10:30", pupil: "James W.", done: false, isNext: true },
    { time: "12:00", pupil: "Maria G.", done: false, isNext: false },
    { time: "14:00", pupil: "Tom S.", done: false, isNext: false },
    { time: "16:00", pupil: "Emma L.", done: false, isNext: false },
  ],
  tomorrow: { lessons: 4, hours: 6, earnings: 210 },
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

const greeting = (() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good morning, ${mock.firstName}!`;
  if (h >= 12 && h < 17) return `Good afternoon, ${mock.firstName}!`;
  if (h >= 17 && h < 21) return `Good evening, ${mock.firstName}!`;
  return `Ready to teach, ${mock.firstName}?`;
})();

// ── Reusable sub-sections (parameterised for each concept) ──

const IOS_BG = "#f2f2f7";

// Brand gradient header (same as current)
const GradientHeader = ({ rounded = false }: { rounded?: boolean }) => (
  <div className={`relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-4 text-white ${rounded ? "rounded-t-2xl" : ""}`}>
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
    </div>
    <div className="relative flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">{mock.initials}</div>
      <div className="flex-1 min-w-0">
        <h2 className="text-[15px] font-semibold truncate">{greeting}</h2>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/30 text-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
          </span>
          <span className="text-white/70 text-xs flex items-center gap-1">
            <CloudSun className="h-3.5 w-3.5 text-white/70" /> {mock.weather.temp}°C · {mock.weather.desc}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Stats grid (4 stats, same as current)
const StatsGrid = ({ bg = "bg-white", text = "text-gray-900", sub = "text-gray-500", roundedBottom = false }: { bg?: string; text?: string; sub?: string; roundedBottom?: boolean }) => (
  <div className={`p-3 ${bg} ${roundedBottom ? "rounded-b-2xl" : ""}`}>
    <div className="grid grid-cols-2 gap-2">
      {[
        { Icon: BookOpen, v: mock.lessons, l: "Lessons", ic: "text-[#0075c9]", ibg: "bg-[#0075c9]/8" },
        { Icon: PoundSterling, v: `£${mock.earnings}`, l: "Expected", ic: "text-emerald-500", ibg: "bg-emerald-500/8" },
        { Icon: Target, v: `${mock.weeklyProgress}%`, l: "Weekly", ic: "text-violet-500", ibg: "bg-violet-500/8" },
        { Icon: Timer, v: mock.nextLesson.time, l: mock.nextLesson.pupil, ic: "text-amber-500", ibg: "bg-amber-500/8" },
      ].map(s => (
        <div key={s.l} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${s.ibg}`}>
          <s.Icon className={`h-4 w-4 ${s.ic}`} />
          <div>
            <p className={`text-[15px] font-semibold ${text} leading-none`}>{s.v}</p>
            <p className={`text-[11px] ${sub} mt-0.5`}>{s.l}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Job & Message banners (same icons/content as current)
const Banners = ({ rounded = "rounded-2xl" }: { rounded?: string }) => (
  <div className="space-y-2">
    {mock.pendingJobs > 0 && (
      <div className={`bg-white ${rounded} overflow-hidden shadow-sm`}>
        <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
          <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={jobOffersIcon} alt="" className="h-10 w-10 object-cover" />
              <div><span className="font-semibold text-[15px]">Job Offers</span><p className="text-white/70 text-[11px]">{mock.pendingJobs} pending offer{mock.pendingJobs !== 1 ? "s" : ""}</p></div>
            </div>
            <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-white/90 text-[#0075c9] text-xs font-bold flex items-center justify-center">{mock.pendingJobs}</span>
          </div>
        </div>
      </div>
    )}
    <div className={`bg-white ${rounded} overflow-hidden shadow-sm`}>
      <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={messagesIcon} alt="" className="h-10 w-10 object-cover" />
            <div><span className="font-semibold text-[15px]">Messages</span><p className="text-white/70 text-[11px]">{mock.unread > 0 ? `${mock.unread} unread` : "No unread"}</p></div>
          </div>
          {mock.unread > 0 && <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">{mock.unread}</span>}
        </div>
      </div>
    </div>
  </div>
);

// YOUR DAY: next lesson + timeline
const YourDay = ({ cardClass = "bg-white rounded-2xl shadow-sm", text = "text-gray-900", sub = "text-gray-500", sep = "border-gray-50" }: { cardClass?: string; text?: string; sub?: string; sep?: string }) => (
  <div>
    <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
    <div className={`${cardClass} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-center gap-2 text-[13px] text-amber-600 font-medium mb-2.5">
          <Timer className="h-3.5 w-3.5" /> Next in {mock.nextLesson.minutesUntil} min
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[17px] font-semibold ${text}`}>{mock.nextLesson.pupil}</p>
            <p className={`text-[13px] ${sub} mt-0.5`}>{mock.nextLesson.time} · {mock.nextLesson.postcode} · {mock.nextLesson.duration}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#0075c9] flex items-center justify-center">
            <Navigation className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
      <div className={`border-t ${sep}`}>
        {mock.timeline.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < mock.timeline.length - 1 ? `border-b ${sep}` : ""}`}>
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-[#0075c9] ring-2 ring-[#0075c9]/20" : "bg-gray-200"}`} />
            <span className={`text-[13px] w-12 ${item.done ? "text-gray-400" : sub}`}>{item.time}</span>
            <span className={`text-[15px] font-medium flex-1 ${item.done ? "text-gray-400 line-through" : text}`}>{item.pupil}</span>
            {item.isNext && <span className="text-[11px] font-medium text-[#0075c9] bg-[#0075c9]/10 px-2 py-0.5 rounded-full">Next</span>}
            {item.done && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
            {!item.done && !item.isNext && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Quick Actions
const QuickActions = ({ cardClass = "bg-white rounded-2xl shadow-sm", tileRound = "rounded-[14px]" }: { cardClass?: string; tileRound?: string }) => (
  <div>
    <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Quick Actions</p>
    <div className={`${cardClass} p-4`}>
      <div className="grid grid-cols-4 gap-y-4">
        {mock.quickActions.map(q => (
          <div key={q.label} className="flex flex-col items-center gap-1.5">
            <div className={`h-[52px] w-[52px] ${tileRound} ${q.bg} flex items-center justify-center`}>
              <q.icon className={`h-5 w-5 ${q.color}`} />
            </div>
            <span className="text-[11px] text-gray-500 font-medium">{q.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Agenda
const Agenda = ({ cardClass = "bg-white rounded-2xl shadow-sm", text = "text-gray-900", sub = "text-gray-500" }: { cardClass?: string; text?: string; sub?: string }) => (
  <div className={`${cardClass} p-4`}>
    <div className="flex items-center justify-between mb-2.5">
      <span className={`text-[15px] font-semibold ${text}`}>This Week</span>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </div>
    <div className="h-2 bg-gray-100 rounded-full">
      <div className="h-full bg-[#0075c9] rounded-full" style={{ width: `${mock.weeklyProgress}%` }} />
    </div>
    <p className={`text-[13px] ${sub} mt-1.5`}>{mock.weeklyProgress}% of weekly goal</p>
  </div>
);

// Plan Ahead
const PlanAhead = ({ cardClass = "bg-white rounded-2xl shadow-sm", text = "text-gray-900", sub = "text-gray-500" }: { cardClass?: string; text?: string; sub?: string }) => (
  <div>
    <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Plan Ahead</p>
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-[12px] bg-violet-500/10 flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-semibold ${text}`}>Tomorrow</p>
          <p className={`text-[13px] ${sub}`}>{mock.tomorrow.lessons} lessons · {mock.tomorrow.hours}hrs · £{mock.tomorrow.earnings}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
      </div>
    </div>
  </div>
);

// Hero image
const Hero = ({ h = "h-[38vh] min-h-[220px] max-h-[320px]", overlay = "from-black/20 to-transparent", rounded = "" }: { h?: string; overlay?: string; rounded?: string }) => (
  <div className={`w-full ${h} overflow-hidden relative ${rounded}`}>
    <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
    <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${overlay}`} />
  </div>
);

// ══════════════════════════════════════════════════════════
// CONCEPT A: Classic iOS — Grouped Inset
// System background, rounded-2xl grouped cards, clear separators
// ══════════════════════════════════════════════════════════
function ConceptA() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero />
      <div className="relative -mt-10 mx-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <GradientHeader rounded />
          <StatsGrid roundedBottom />
        </div>
      </div>
      <div className="px-4 mt-3"><Banners /></div>
      <div className="px-4 mt-5 space-y-5 pb-8">
        <YourDay />
        <QuickActions />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// CONCEPT B: iOS Settings Style — Full-width grouped rows
// Flat header inside hero, list-style settings cards
// ══════════════════════════════════════════════════════════
function ConceptB() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[200px]" overlay="from-black/40 via-black/20 to-transparent" />
      {/* Floating profile overlapping hero */}
      <div className="-mt-16 flex flex-col items-center relative z-10 mb-4">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#0075c9] to-[#005a9e] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
          {mock.initials}
        </div>
        <h2 className="text-[17px] font-bold text-gray-900 mt-2">{greeting}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
          </span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <CloudSun className="h-3 w-3" /> {mock.weather.temp}°C · {mock.weather.desc}
          </span>
        </div>
      </div>
      {/* Stats as iOS grouped list */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {[
            { Icon: BookOpen, v: `${mock.lessons} lessons today`, l: "Schedule", ic: "text-[#0075c9] bg-[#0075c9]/10" },
            { Icon: PoundSterling, v: `£${mock.earnings} expected`, l: "Earnings", ic: "text-emerald-600 bg-emerald-500/10" },
            { Icon: Target, v: `${mock.weeklyProgress}% of goal`, l: "Weekly Progress", ic: "text-violet-600 bg-violet-500/10" },
            { Icon: Timer, v: `${mock.nextLesson.time} — ${mock.nextLesson.pupil}`, l: "Next Lesson", ic: "text-amber-600 bg-amber-500/10" },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-3 px-4 py-3">
              <div className={`h-8 w-8 rounded-lg ${s.ic.split(" ").slice(1).join(" ")} flex items-center justify-center`}>
                <s.Icon className={`h-4 w-4 ${s.ic.split(" ")[0]}`} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-gray-900">{s.v}</p>
                <p className="text-[11px] text-gray-400">{s.l}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 mt-3"><Banners /></div>
      <div className="px-4 mt-5 space-y-5 pb-8">
        <YourDay />
        <QuickActions />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// CONCEPT C: iOS Widget Board
// Large hero, widget-style cards with visible titles
// ══════════════════════════════════════════════════════════
function ConceptC() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero />
      {/* Floating greeting on hero */}
      <div className="-mt-16 px-5 relative z-10 mb-3">
        <p className="text-white text-[22px] font-bold drop-shadow-lg">{greeting}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-white/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online</span>
          <span className="text-[11px] text-white/60"><CloudSun className="h-3 w-3 inline" /> {mock.weather.temp}°C</span>
        </div>
      </div>
      {/* Stat widgets */}
      <div className="px-4 grid grid-cols-2 gap-2.5">
        {[
          { Icon: BookOpen, v: mock.lessons, l: "Lessons Today", c: "[#0075c9]" },
          { Icon: PoundSterling, v: `£${mock.earnings}`, l: "Expected", c: "emerald-500" },
          { Icon: Target, v: `${mock.weeklyProgress}%`, l: "Weekly Goal", c: "violet-500" },
          { Icon: Timer, v: mock.nextLesson.time, l: mock.nextLesson.pupil, c: "amber-500" },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl shadow-sm p-3.5">
            <div className="flex items-center justify-between mb-2">
              <s.Icon className={`h-4 w-4 text-${s.c}`} />
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            </div>
            <p className="text-[22px] font-bold text-gray-900 leading-none">{s.v}</p>
            <p className="text-[11px] text-gray-400 mt-1">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="px-4 mt-3"><Banners /></div>
      <div className="px-4 mt-5 space-y-5 pb-8">
        <YourDay />
        <QuickActions />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// CONCEPT D: iOS Maps / Weather style
// Hero behind header, segmented sections, compact
// ══════════════════════════════════════════════════════════
function ConceptD() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[160px]" overlay="from-[#f2f2f7] via-transparent to-transparent" />
      {/* Compact header card */}
      <div className="-mt-8 mx-4 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0075c9] flex items-center justify-center text-white font-bold text-sm">{mock.initials}</div>
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold text-gray-900">{greeting}</h2>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online</span>
                <span><CloudSun className="h-3 w-3 inline" /> {mock.weather.temp}°C · {mock.weather.desc}</span>
              </div>
            </div>
          </div>
          {/* Horizontal stat pills */}
          <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { v: mock.lessons, l: "Lessons", c: "bg-[#0075c9]/10 text-[#0075c9]" },
              { v: `£${mock.earnings}`, l: "Earned", c: "bg-emerald-500/10 text-emerald-600" },
              { v: `${mock.weeklyProgress}%`, l: "Goal", c: "bg-violet-500/10 text-violet-600" },
              { v: mock.nextLesson.time, l: "Next", c: "bg-amber-500/10 text-amber-600" },
            ].map(s => (
              <div key={s.l} className={`${s.c} rounded-full px-3.5 py-1.5 flex items-center gap-1.5 shrink-0`}>
                <span className="text-[13px] font-bold">{s.v}</span>
                <span className="text-[11px] opacity-60">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 mt-3"><Banners /></div>
      <div className="px-4 mt-5 space-y-5 pb-8">
        <YourDay />
        <QuickActions />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// CONCEPT E: iOS Health / Fitness style
// Gradient ring hero, activity-ring stats, clean cards
// ══════════════════════════════════════════════════════════
function ConceptE() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[180px]" overlay="from-black/50 to-transparent" />
      <div className="-mt-12 mx-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <GradientHeader rounded />
          {/* Activity ring style stats */}
          <div className="p-4 flex items-center gap-4">
            {/* Progress ring */}
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="#0075c9" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - mock.weeklyProgress / 100)}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[#0075c9]">{mock.weeklyProgress}%</span>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {[
                { v: mock.lessons, l: "Lessons", c: "text-[#0075c9]" },
                { v: `£${mock.earnings}`, l: "Expected", c: "text-emerald-500" },
                { v: `${mock.streak}🔥`, l: "Streak", c: "text-amber-500" },
                { v: mock.nextLesson.time, l: "Next up", c: "text-violet-500" },
              ].map(s => (
                <div key={s.l}>
                  <p className={`text-[15px] font-bold ${s.c} leading-none`}>{s.v}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-3"><Banners /></div>
      <div className="px-4 mt-5 space-y-5 pb-8">
        <YourDay />
        <QuickActions />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Demo shell
// ══════════════════════════════════════════════════════════
const concepts = [
  { id: "A", name: "Classic iOS Grouped", desc: "System bg, grouped inset cards, clear separators", Component: ConceptA },
  { id: "B", name: "iOS Settings Style", desc: "Centred profile, list-row stats, disclosure arrows", Component: ConceptB },
  { id: "C", name: "iOS Widget Board", desc: "Floating greeting on hero, large widget stat cards", Component: ConceptC },
  { id: "D", name: "iOS Maps / Weather", desc: "Blurred glass header, horizontal stat pills", Component: ConceptD },
  { id: "E", name: "iOS Health / Fitness", desc: "Activity ring progress, gradient header, clean cards", Component: ConceptE },
];

export default function MobileHomeIOSDemo() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/instructor" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-base font-semibold">iOS-Style Redesign Preview</h1>
          <span className="text-sm text-gray-500">{selected + 1}/{concepts.length}</span>
        </div>
      </div>

      {/* Concept selector */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {concepts.map((c, i) => (
            <button key={c.id} onClick={() => setSelected(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selected === i ? "bg-[#0075c9] text-white shadow-lg shadow-[#0075c9]/20" : "bg-white/5 text-gray-400 hover:bg-white/10"
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
              <div className="w-full h-full rounded-[40px] overflow-hidden" style={{ backgroundColor: IOS_BG }}>
                <div className="h-full overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div key={selected} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="min-h-full">
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
            <Button variant="outline" size="sm" onClick={() => setSelected(Math.min(concepts.length - 1, selected + 1))} disabled={selected === concepts.length - 1} className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Thumbnail grid */}
          <div className="w-full mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">All Concepts</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {concepts.map((c, i) => (
                <button key={c.id} onClick={() => { setSelected(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`rounded-2xl overflow-hidden border-2 transition-all ${selected === i ? "border-[#0075c9] shadow-lg shadow-[#0075c9]/20" : "border-white/10 hover:border-white/30"}`}
                >
                  <div className="h-[200px] overflow-hidden" style={{ backgroundColor: IOS_BG }}>
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
