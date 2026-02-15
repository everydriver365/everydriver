import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, MapPin, Clock, Calendar,
  ChevronRight, MessageSquare, Briefcase, Heart, Car, Star, Zap,
  TrendingUp, Users, Play, Sun, Cloud, Navigation, CheckCircle,
  ArrowLeft, ArrowRight, LayoutGrid, CloudSun, Gauge, Receipt,
  Settings, Award, ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

// ── Mock data ──
const mock = {
  name: "Sarah",
  initials: "S",
  profileImg: null as string | null,
  isOnline: true,
  weather: { temp: 14, desc: "Partly cloudy", icon: "CloudSun" },
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
    { label: "Schedule", icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
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
  if (h < 21) return "Good evening";
  return "Hey";
};

// ── Shared sub-components (different visual wrappers) ──

// Hero image block
const HeroImage = ({ className = "", overlay = "from-black/30 to-transparent" }: { className?: string; overlay?: string }) => (
  <div className={`w-full overflow-hidden relative ${className}`}>
    <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
    <div className={`absolute inset-0 bg-gradient-to-t ${overlay}`} />
  </div>
);

// Stat chip
const StatItem = ({ icon: Icon, value, label, iconColor, bg }: { icon: any; value: string; label: string; iconColor: string; bg: string }) => (
  <div className={`flex items-center gap-2 p-2.5 rounded-xl ${bg}`}>
    <Icon className={`h-4 w-4 ${iconColor}`} />
    <div>
      <p className="text-sm font-bold leading-none">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

// Job/Message banner
const AlertBanner = ({ icon, label, count, onClick, variant = "blue" }: { icon: string; label: string; count: number; onClick?: () => void; variant?: "blue" | "red" }) => {
  if (count <= 0) return null;
  return (
    <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-none px-4 py-3 text-white relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {label === "Messages" ? <MessageSquare className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
          <div>
            <span className="font-semibold text-sm">{label}</span>
            <p className="text-white/70 text-[10px]">{count} {label === "Messages" ? "unread" : "pending"}</p>
          </div>
        </div>
        <span className={`min-w-[28px] h-7 px-2.5 rounded-full ${variant === "red" ? "bg-red-400 text-white" : "bg-white/90 text-primary"} text-xs font-bold flex items-center justify-center`}>
          {count > 9 ? "9+" : count}
        </span>
      </div>
    </div>
  );
};

// Next lesson card
const NextLessonCard = ({ style = "default" }: { style?: string }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">YOUR DAY</p>
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mb-2">
        <Timer className="h-3.5 w-3.5" /> Next in {mock.nextLesson.minutesUntil}min
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{mock.nextLesson.pupil}</p>
          <p className="text-xs text-gray-500">{mock.nextLesson.time} · {mock.nextLesson.postcode} · {mock.nextLesson.duration}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
          <Navigation className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  </div>
);

// Timeline mini
const MiniTimeline = () => (
  <div className="space-y-0 mt-3">
    {mock.timeline.map((item, i) => (
      <div key={i} className="flex gap-2.5 pb-2">
        <div className="flex flex-col items-center">
          <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-primary ring-3 ring-primary/20" : "bg-gray-200"}`} />
          {i < mock.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-0.5" />}
        </div>
        <div className="flex-1 pb-1">
          <p className={`text-xs ${item.done ? "text-gray-400" : "text-gray-500"}`}>{item.time}</p>
          <p className={`text-sm font-medium ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.pupil}</p>
        </div>
        {item.isNext && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full self-start mt-1">Next</span>}
        {item.done && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-1.5 shrink-0" />}
      </div>
    ))}
  </div>
);

// Quick actions grid
const QuickActionsGrid = ({ cols = 4, rounded = "rounded-2xl", iconSize = "h-12 w-12" }: { cols?: number; rounded?: string; iconSize?: string }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">QUICK ACTIONS</p>
    <div className={`grid grid-cols-${cols} gap-3`}>
      {mock.quickActions.map(q => (
        <div key={q.label} className="flex flex-col items-center gap-1.5">
          <div className={`${iconSize} ${rounded} ${q.bg} flex items-center justify-center`}>
            <q.icon className={`h-5 w-5 ${q.color}`} />
          </div>
          <span className="text-[10px] text-gray-500">{q.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// Agenda placeholder
const AgendaSection = () => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">AGENDA</p>
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">This Week</span>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-full bg-primary rounded-full" style={{ width: `${mock.weeklyProgress}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{mock.weeklyProgress}% of weekly goal</p>
    </div>
  </div>
);

// Plan ahead / tomorrow
const PlanAheadSection = () => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">PLAN AHEAD</p>
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
        <Calendar className="h-5 w-5 text-violet-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Tomorrow</p>
        <p className="text-xs text-gray-500">{mock.tomorrow.lessons} lessons · {mock.tomorrow.hours}hrs · £{mock.tomorrow.earnings}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </div>
  </div>
);

// ══════════════════════════════════════════════════════
// CONCEPT 1: Minimal White
// ══════════════════════════════════════════════════════
function Concept1() {
  return (
    <div className="bg-gray-50 min-h-full">
      <HeroImage className="h-[160px]" />
      {/* Overlap card */}
      <div className="-mt-8 mx-3 bg-white rounded-2xl shadow-lg p-4 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{mock.initials}</div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">{getGreeting()}, {mock.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
              <span><CloudSun className="h-3 w-3 inline" /> {mock.weather.temp}°</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatItem icon={BookOpen} value={String(mock.lessons)} label="Lessons" iconColor="text-primary" bg="bg-primary/5" />
          <StatItem icon={PoundSterling} value={`£${mock.earnings}`} label="Expected" iconColor="text-emerald-500" bg="bg-emerald-500/5" />
          <StatItem icon={Target} value={`${mock.weeklyProgress}%`} label="Weekly" iconColor="text-violet-500" bg="bg-violet-500/5" />
          <StatItem icon={Timer} value={mock.nextLesson.time} label={mock.nextLesson.pupil} iconColor="text-amber-500" bg="bg-amber-500/5" />
        </div>
      </div>
      <div className="px-3 mt-3 space-y-2">
        <AlertBanner icon="briefcase" label="Job Offers" count={mock.pendingJobs} />
        <AlertBanner icon="message" label="Messages" count={mock.unread} variant="red" />
      </div>
      <div className="px-3 mt-4 space-y-5 pb-6">
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
// CONCEPT 2: Bold Gradient
// ══════════════════════════════════════════════════════
function Concept2() {
  return (
    <div className="bg-white min-h-full">
      <HeroImage className="h-[150px]" overlay="from-primary/80 via-primary/40 to-transparent" />
      <div className="-mt-6 mx-3 relative z-10">
        {/* Big gradient card */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-4 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center font-bold">{mock.initials}</div>
              <div className="flex-1">
                <p className="font-bold">{getGreeting()}, {mock.name}!</p>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                  <span>{mock.weather.temp}°C · {mock.weather.desc}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { v: mock.lessons, l: "Lessons" },
                { v: `£${mock.earnings}`, l: "Earned" },
                { v: `${mock.weeklyProgress}%`, l: "Goal" },
                { v: `${mock.streak}🔥`, l: "Streak" },
              ].map(s => (
                <div key={s.l} className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold">{s.v}</p>
                  <p className="text-[9px] text-white/50">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-3 mt-3 space-y-2">
        <AlertBanner icon="briefcase" label="Job Offers" count={mock.pendingJobs} />
        <AlertBanner icon="message" label="Messages" count={mock.unread} variant="red" />
      </div>
      <div className="px-3 mt-4 space-y-5 pb-6">
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
// CONCEPT 3: Dark Premium
// ══════════════════════════════════════════════════════
function Concept3() {
  return (
    <div className="bg-[#0f1117] min-h-full text-white">
      <HeroImage className="h-[150px]" overlay="from-[#0f1117] via-[#0f1117]/60 to-transparent" />
      <div className="-mt-8 mx-3 relative z-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-[#00a3ff] flex items-center justify-center text-sm font-bold">{mock.initials}</div>
            <div className="flex-1">
              <p className="font-bold text-sm">{getGreeting()}, {mock.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                <span>{mock.weather.temp}° {mock.weather.desc}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: mock.lessons, l: "Lessons", c: "from-primary to-[#00a3ff]" },
              { v: `£${mock.earnings}`, l: "Earned", c: "from-emerald-400 to-emerald-300" },
              { v: `${mock.weeklyProgress}%`, l: "Goal", c: "from-violet-400 to-violet-300" },
              { v: `${mock.streak}🔥`, l: "Streak", c: "from-amber-400 to-amber-300" },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className={`text-base font-bold bg-gradient-to-r ${s.c} bg-clip-text text-transparent`}>{s.v}</p>
                <p className="text-[9px] text-gray-500">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Banners dark style */}
      <div className="px-3 mt-3 space-y-2">
        {mock.pendingJobs > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5"><Briefcase className="h-5 w-5 text-[#00a3ff]" /><div><span className="font-semibold text-sm">Job Offers</span><p className="text-gray-500 text-[10px]">{mock.pendingJobs} pending</p></div></div>
            <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{mock.pendingJobs}</span>
          </div>
        )}
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><MessageSquare className="h-5 w-5 text-rose-400" /><div><span className="font-semibold text-sm">Messages</span><p className="text-gray-500 text-[10px]">{mock.unread} unread</p></div></div>
          {mock.unread > 0 && <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">{mock.unread}</span>}
        </div>
      </div>
      {/* Content in dark theme */}
      <div className="px-3 mt-4 space-y-5 pb-6">
        {/* Next lesson dark */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">YOUR DAY</p>
          <div className="bg-white/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#00a3ff] font-medium mb-2"><Zap className="h-3.5 w-3.5" /> Next in {mock.nextLesson.minutesUntil}min</div>
            <div className="flex items-center justify-between">
              <div><p className="font-semibold">{mock.nextLesson.pupil}</p><p className="text-xs text-gray-400">{mock.nextLesson.time} · {mock.nextLesson.postcode}</p></div>
              <div className="text-right"><p className="text-2xl font-bold text-[#00a3ff]">{mock.nextLesson.minutesUntil}</p><p className="text-[10px] text-gray-500">min</p></div>
            </div>
          </div>
        </div>
        {/* Timeline dark */}
        <div className="space-y-0">
          {mock.timeline.map((item, i) => (
            <div key={i} className="flex gap-2.5 pb-2">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-[#00a3ff] ring-3 ring-[#00a3ff]/20" : "bg-gray-600"}`} />
                {i < mock.timeline.length - 1 && <div className="w-0.5 flex-1 bg-white/5 mt-0.5" />}
              </div>
              <div className="flex-1 pb-1">
                <p className={`text-xs ${item.done ? "text-gray-600" : "text-gray-400"}`}>{item.time}</p>
                <p className={`text-sm font-medium ${item.done ? "text-gray-600 line-through" : "text-white"}`}>{item.pupil}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Quick actions dark */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-4 gap-3">
            {mock.quickActions.map(q => (
              <div key={q.label} className="flex flex-col items-center gap-1.5">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><q.icon className="h-5 w-5 text-gray-300" /></div>
                <span className="text-[10px] text-gray-500">{q.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Agenda dark */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">AGENDA</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">This Week</span><ChevronRight className="h-4 w-4 text-gray-600" /></div>
            <div className="h-1.5 bg-white/10 rounded-full"><div className="h-full bg-gradient-to-r from-primary to-[#00a3ff] rounded-full" style={{ width: `${mock.weeklyProgress}%` }} /></div>
            <p className="text-xs text-gray-500 mt-1">{mock.weeklyProgress}% of weekly goal</p>
          </div>
        </div>
        {/* Plan ahead dark */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">PLAN AHEAD</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0"><Calendar className="h-5 w-5 text-violet-400" /></div>
            <div className="flex-1"><p className="text-sm font-medium">Tomorrow</p><p className="text-xs text-gray-500">{mock.tomorrow.lessons} lessons · £{mock.tomorrow.earnings}</p></div>
            <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 4: Split Blue/White
// ══════════════════════════════════════════════════════
function Concept4() {
  return (
    <div className="bg-gray-50 min-h-full">
      <HeroImage className="h-[130px]" />
      {/* Blue stat bar */}
      <div className="bg-primary px-4 py-3 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{mock.initials}</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{getGreeting()}, {mock.name}</p>
            <p className="text-[10px] text-white/60">{mock.weather.temp}° · {mock.weather.desc}</p>
          </div>
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{mock.isOnline ? "Online" : "Offline"}</span>
        </div>
        <div className="flex gap-2">
          {[
            { v: mock.lessons, l: "Lessons" },
            { v: `£${mock.earnings}`, l: "Earned" },
            { v: `${mock.weeklyProgress}%`, l: "Goal" },
          ].map(s => (
            <div key={s.l} className="flex-1 bg-white/15 rounded-lg p-2 text-center">
              <p className="text-base font-bold">{s.v}</p>
              <p className="text-[9px] text-white/60">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 mt-3 space-y-2">
        <AlertBanner icon="briefcase" label="Job Offers" count={mock.pendingJobs} />
        <AlertBanner icon="message" label="Messages" count={mock.unread} variant="red" />
      </div>
      <div className="px-3 mt-4 space-y-5 pb-6">
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
// CONCEPT 5: Full Bleed Photo + Pill Stats
// ══════════════════════════════════════════════════════
function Concept5() {
  return (
    <div className="bg-gray-100 min-h-full">
      <div className="relative h-[200px] overflow-hidden">
        <img src={instructorHeroImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-lg font-bold">{getGreeting()}, {mock.name}</p>
          <div className="flex items-center gap-2 text-xs text-white/70 mt-0.5">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
            <span>{mock.weather.temp}° {mock.weather.desc}</span>
          </div>
        </div>
      </div>
      {/* Pill stats scroll */}
      <div className="flex gap-2 overflow-x-auto px-3 -mt-4 relative z-10 pb-1">
        {[
          { l: `${mock.lessons} Lessons`, c: "bg-primary text-white" },
          { l: `£${mock.earnings}`, c: "bg-emerald-500 text-white" },
          { l: `${mock.streak}🔥 Streak`, c: "bg-amber-500 text-white" },
          { l: `${mock.weeklyProgress}% Goal`, c: "bg-violet-500 text-white" },
        ].map(p => (
          <span key={p.l} className={`${p.c} rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 shadow-md`}>{p.l}</span>
        ))}
      </div>
      <div className="px-3 mt-3 space-y-2">
        <AlertBanner icon="briefcase" label="Job Offers" count={mock.pendingJobs} />
        <AlertBanner icon="message" label="Messages" count={mock.unread} variant="red" />
      </div>
      <div className="px-3 mt-4 space-y-5 pb-6">
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
// CONCEPT 6: Timeline-Centric
// ══════════════════════════════════════════════════════
function Concept6() {
  return (
    <div className="bg-white min-h-full">
      <HeroImage className="h-[120px]" />
      <div className="-mt-6 mx-3 bg-white rounded-t-2xl shadow-lg relative z-10">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{getGreeting()}, {mock.name}</p>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
            <div className="flex gap-1.5">
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">{mock.lessons}</span>
              <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-2 py-0.5 rounded-full">£{mock.earnings}</span>
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatItem icon={BookOpen} value={String(mock.lessons)} label="Lessons" iconColor="text-primary" bg="bg-primary/5" />
            <StatItem icon={PoundSterling} value={`£${mock.earnings}`} label="Earned" iconColor="text-emerald-500" bg="bg-emerald-500/5" />
            <StatItem icon={Target} value={`${mock.weeklyProgress}%`} label="Weekly" iconColor="text-violet-500" bg="bg-violet-500/5" />
            <StatItem icon={Star} value={`${mock.streak}`} label="Streak" iconColor="text-amber-500" bg="bg-amber-500/5" />
          </div>
        </div>
      </div>
      <div className="px-3 mt-2 space-y-2">
        <AlertBanner icon="briefcase" label="Job Offers" count={mock.pendingJobs} />
        <AlertBanner icon="message" label="Messages" count={mock.unread} variant="red" />
      </div>
      <div className="px-3 mt-4 space-y-5 pb-6">
        {/* Primary timeline view */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">YOUR DAY</p>
          {mock.timeline.map((item, i) => (
            <div key={i} className="flex gap-3 pb-3">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full shrink-0 mt-1 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-primary ring-4 ring-primary/20" : "bg-gray-200"}`} />
                {i < mock.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
              </div>
              <div className={`flex-1 rounded-xl p-3 ${item.isNext ? "bg-primary/5 border border-primary/20" : "bg-gray-50"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${item.done ? "text-gray-400" : "text-gray-500"}`}>{item.time}</p>
                    <p className={`font-medium text-sm ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.pupil}</p>
                    <p className="text-[10px] text-gray-400">{item.postcode}</p>
                  </div>
                  {item.isNext && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Next</span>}
                  {item.done && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                </div>
              </div>
            </div>
          ))}
        </div>
        <QuickActionsGrid />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 7: Bento Grid
// ══════════════════════════════════════════════════════
function Concept7() {
  return (
    <div className="bg-[#f5f5f0] min-h-full">
      <HeroImage className="h-[140px]" />
      <div className="p-3 -mt-6 relative z-10 space-y-2">
        {/* Greeting bento */}
        <div className="bg-primary rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">{mock.initials}</div>
            <div className="flex-1">
              <p className="font-bold">{getGreeting()}, {mock.name}</p>
              <p className="text-xs text-white/60">{mock.weather.temp}° · {mock.weather.desc}</p>
            </div>
          </div>
        </div>
        {/* Stats bento */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <BookOpen className="h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold text-gray-900">{mock.lessons}</p>
            <p className="text-[10px] text-gray-400">Lessons today</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <PoundSterling className="h-5 w-5 text-emerald-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">£{mock.earnings}</p>
            <p className="text-[10px] text-gray-400">Expected</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <Target className="h-5 w-5 text-violet-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{mock.weeklyProgress}%</p>
            <p className="text-[10px] text-gray-400">Weekly goal</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm relative">
            <MessageSquare className="h-5 w-5 text-rose-500 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{mock.unread}</p>
            <p className="text-[10px] text-gray-400">Unread</p>
            {mock.unread > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />}
          </div>
          {/* Next lesson spans full */}
          <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mb-1"><Timer className="h-3.5 w-3.5" /> {mock.nextLesson.minutesUntil}min away</div>
            <p className="font-bold text-gray-900">{mock.nextLesson.pupil}</p>
            <p className="text-xs text-gray-500">{mock.nextLesson.time} · {mock.nextLesson.postcode}</p>
          </div>
          {/* Streak */}
          <div className="col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3 flex items-center gap-3 border border-amber-100">
            <span className="text-2xl">🔥</span>
            <div><p className="font-bold text-gray-900">{mock.streak}-day streak</p><p className="text-xs text-gray-500">Keep going!</p></div>
          </div>
        </div>
        {/* Job banner */}
        <AlertBanner icon="briefcase" label="Job Offers" count={mock.pendingJobs} />
        {/* Rest */}
        <div className="space-y-5 pt-2 pb-6">
          <MiniTimeline />
          <QuickActionsGrid />
          <AgendaSection />
          <PlanAheadSection />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 8: iOS Widget Style
// ══════════════════════════════════════════════════════
function Concept8() {
  return (
    <div className="bg-[#f2f2f7] min-h-full">
      <HeroImage className="h-[140px]" overlay="from-[#f2f2f7] via-transparent to-transparent" />
      <div className="px-4 -mt-4 relative z-10 space-y-3 pb-6">
        {/* Widget: Greeting */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold">{mock.initials}</div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{getGreeting()}, {mock.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
                <span>{mock.weather.temp}° {mock.weather.desc}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Widget: Next lesson */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center"><Calendar className="h-3.5 w-3.5 text-white" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Next Lesson</span>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="font-semibold text-gray-900">{mock.nextLesson.pupil}</p><p className="text-sm text-gray-500">{mock.nextLesson.time} · {mock.nextLesson.postcode}</p></div>
            <div className="bg-primary/10 rounded-full px-3 py-1 text-xs font-medium text-primary">{mock.nextLesson.minutesUntil}min</div>
          </div>
        </div>
        {/* Widget: Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center"><PoundSterling className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">£{mock.earnings}</p>
          </div>
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-violet-500 flex items-center justify-center"><Target className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Goal</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{mock.weeklyProgress}%</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-2"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${mock.weeklyProgress}%` }} /></div>
          </div>
        </div>
        {/* Widget: Inbox */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-rose-500 flex items-center justify-center"><MessageSquare className="h-3.5 w-3.5 text-white" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Inbox</span>
            <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{mock.unread}</span>
          </div>
          <div className="space-y-2">
            {["New message from Alice B.", "Payment received - James W."].map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1"><div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /><p className="text-sm text-gray-700 truncate">{m}</p></div>
            ))}
          </div>
        </div>
        {/* Job offers widget */}
        {mock.pendingJobs > 0 && (
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-amber-500 flex items-center justify-center"><Briefcase className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Job Offers</span>
              <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{mock.pendingJobs}</span>
            </div>
            <p className="text-sm text-gray-600">{mock.pendingJobs} new offers waiting for review</p>
          </div>
        )}
        {/* Timeline widget */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center"><Clock className="h-3.5 w-3.5 text-white" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Schedule</span>
          </div>
          <MiniTimeline />
        </div>
        <QuickActionsGrid rounded="rounded-[16px]" />
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 9: Compact Dense
// ══════════════════════════════════════════════════════
function Concept9() {
  return (
    <div className="bg-white min-h-full">
      <HeroImage className="h-[120px]" />
      {/* Compact header bar */}
      <div className="bg-gradient-to-r from-primary to-[#0090e0] px-4 py-2.5 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">{mock.initials}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{mock.name}</p>
          <p className="text-[10px] text-white/70">{mock.lessons} lessons · £{mock.earnings} today</p>
        </div>
        <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px] text-white">{mock.weather.temp}°</span>
      </div>
      <div className="p-3 space-y-3 pb-6">
        {/* Horizontal stats */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { v: mock.lessons, l: "Lessons", c: "border-primary", tc: "text-primary" },
            { v: `£${mock.earnings}`, l: "Earned", c: "border-emerald-400", tc: "text-emerald-600" },
            { v: `${mock.weeklyProgress}%`, l: "Goal", c: "border-violet-400", tc: "text-violet-600" },
            { v: `${mock.streak}🔥`, l: "Streak", c: "border-amber-400", tc: "text-amber-600" },
          ].map(s => (
            <div key={s.l} className={`shrink-0 border-l-2 ${s.c} pl-2 pr-4`}>
              <p className={`text-lg font-bold ${s.tc}`}>{s.v}</p>
              <p className="text-[10px] text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
        {/* Next lesson compact */}
        <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3 border border-primary/10">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0"><Timer className="h-5 w-5 text-white" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium">Next in {mock.nextLesson.minutesUntil}min</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{mock.nextLesson.pupil} · {mock.nextLesson.time}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        </div>
        <AlertBanner icon="briefcase" label="Job Offers" count={mock.pendingJobs} />
        <AlertBanner icon="message" label="Messages" count={mock.unread} variant="red" />
        <MiniTimeline />
        {/* Dense quick grid */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-4 gap-1.5">
            {mock.quickActions.map(a => (
              <div key={a.label} className="flex flex-col items-center gap-1 py-2.5 bg-gray-50 rounded-lg">
                <a.icon className={`h-5 w-5 ${a.color}`} />
                <span className="text-[10px] text-gray-600">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
        <AgendaSection />
        <PlanAheadSection />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CONCEPT 10: Rounded Soft
// ══════════════════════════════════════════════════════
function Concept10() {
  return (
    <div className="bg-[#eef3f9] min-h-full">
      <div className="relative h-[170px] overflow-hidden rounded-b-[32px]">
        <img src={instructorHeroImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-lg font-bold">{getGreeting()}, {mock.name}</p>
          <div className="flex items-center gap-2 text-xs text-white/70 mt-0.5">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</span>
            <span>{mock.weather.temp}° {mock.weather.desc}</span>
          </div>
        </div>
      </div>
      <div className="px-4 -mt-5 relative z-10 space-y-3 pb-6">
        {/* Stats pills floating */}
        <div className="flex gap-2">
          {[
            { v: `${mock.lessons} lessons`, bg: "bg-white", c: "text-primary" },
            { v: `£${mock.earnings}`, bg: "bg-white", c: "text-emerald-600" },
            { v: `${mock.weeklyProgress}% goal`, bg: "bg-white", c: "text-violet-600" },
          ].map(p => (
            <span key={p.v} className={`${p.bg} ${p.c} rounded-full px-3 py-1.5 text-xs font-semibold shadow-md flex-1 text-center`}>{p.v}</span>
          ))}
        </div>
        {/* Next lesson soft card */}
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-primary font-medium mb-2"><Zap className="h-3.5 w-3.5" /> NEXT LESSON</div>
          <div className="flex items-center justify-between">
            <div><p className="font-semibold text-gray-900">{mock.nextLesson.pupil}</p><p className="text-xs text-gray-500">{mock.nextLesson.time} · {mock.nextLesson.postcode}</p></div>
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center"><Navigation className="h-4 w-4 text-white" /></div>
            </div>
          </div>
        </div>
        {/* Alerts soft */}
        {mock.pendingJobs > 0 && (
          <div className="bg-white rounded-3xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center"><Briefcase className="h-5 w-5 text-amber-600" /></div>
            <div className="flex-1"><p className="font-medium text-sm">Job Offers</p><p className="text-xs text-gray-400">{mock.pendingJobs} pending</p></div>
            <span className="min-w-[24px] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">{mock.pendingJobs}</span>
          </div>
        )}
        <div className="bg-white rounded-3xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center"><MessageSquare className="h-5 w-5 text-rose-600" /></div>
          <div className="flex-1"><p className="font-medium text-sm">Messages</p><p className="text-xs text-gray-400">{mock.unread} unread</p></div>
          {mock.unread > 0 && <span className="min-w-[24px] h-6 px-2 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">{mock.unread}</span>}
        </div>
        {/* Timeline soft */}
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">TODAY'S TIMELINE</p>
          <MiniTimeline />
        </div>
        {/* Quick actions with round icons */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-4 gap-3">
            {mock.quickActions.map(q => (
              <div key={q.label} className="flex flex-col items-center gap-1.5">
                <div className={`h-14 w-14 rounded-full ${q.bg} flex items-center justify-center shadow-sm`}><q.icon className={`h-6 w-6 ${q.color}`} /></div>
                <span className="text-[10px] text-gray-500">{q.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Agenda soft */}
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-gray-900">This Week</span><ChevronRight className="h-4 w-4 text-gray-300" /></div>
          <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-gradient-to-r from-primary to-[#00a3ff] rounded-full" style={{ width: `${mock.weeklyProgress}%` }} /></div>
          <p className="text-xs text-gray-500 mt-1">{mock.weeklyProgress}% of weekly goal</p>
        </div>
        {/* Tomorrow soft */}
        <div className="bg-white rounded-3xl p-3 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0"><Calendar className="h-5 w-5 text-violet-500" /></div>
          <div className="flex-1"><p className="text-sm font-medium text-gray-900">Tomorrow</p><p className="text-xs text-gray-500">{mock.tomorrow.lessons} lessons · £{mock.tomorrow.earnings}</p></div>
          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════ MAIN DEMO PAGE ═══════════════
const concepts = [
  { id: 1, name: "Minimal White", desc: "Clean white cards with rounded overlap hero", Component: Concept1 },
  { id: 2, name: "Bold Gradient", desc: "Large gradient card with decorative circles", Component: Concept2 },
  { id: 3, name: "Dark Premium", desc: "Dark glassmorphism with neon accents", Component: Concept3 },
  { id: 4, name: "Split Blue", desc: "Blue stat bar with white content below", Component: Concept4 },
  { id: 5, name: "Photo + Pills", desc: "Full-bleed photo hero with scrollable stat pills", Component: Concept5 },
  { id: 6, name: "Timeline First", desc: "Schedule timeline as the primary focus", Component: Concept6 },
  { id: 7, name: "Bento Grid", desc: "Magazine-style bento card layout", Component: Concept7 },
  { id: 8, name: "iOS Widgets", desc: "Apple-inspired widget card system", Component: Concept8 },
  { id: 9, name: "Compact Dense", desc: "Maximum info density, minimal space", Component: Concept9 },
  { id: 10, name: "Rounded Soft", desc: "Soft rounded cards on light blue background", Component: Concept10 },
];

export default function MobileHomeRedesignDemo() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/instructor" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-sm font-semibold">Mobile Home Redesign Concepts</h1>
          <span className="text-xs text-gray-500">{selected + 1}/10</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Concept selector pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {concepts.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selected === i ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {c.id}. {c.name}
            </button>
          ))}
        </div>

        {/* Phone mockup */}
        <div className="flex flex-col items-center gap-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold">{concepts[selected].name}</h2>
            <p className="text-sm text-gray-400 mt-1">{concepts[selected].desc}</p>
          </div>

          <div className="relative">
            <div className="w-[375px] h-[812px] bg-black rounded-[50px] p-3 shadow-2xl shadow-primary/10 border border-white/10">
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

          {/* Navigation arrows */}
          <div className="flex items-center gap-4 mt-4">
            <Button variant="outline" size="sm" onClick={() => setSelected(Math.max(0, selected - 1))} disabled={selected === 0} className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30">
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(Math.min(9, selected + 1))} disabled={selected === 9} className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* All thumbnails grid */}
          <div className="w-full mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">All Concepts</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {concepts.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setSelected(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`rounded-2xl overflow-hidden border-2 transition-all ${
                    selected === i ? "border-primary shadow-lg shadow-primary/20" : "border-white/10 hover:border-white/30"
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
