import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, MapPin, Clock, Calendar,
  ChevronRight, MessageSquare, Briefcase, Heart, Car, Navigation,
  CheckCircle, CloudSun, ListTodo, Users, Flame, ArrowLeft, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";

// ── Mock data matching the real InstructorMobileHome ──
const mock = {
  name: "Sarah",
  firstName: "Sarah",
  initials: "S",
  isOnline: true,
  weather: { temp: 14, desc: "Partly cloudy", icon: "CloudSun" },
  lessons: 5,
  earnings: 175,
  weeklyProgress: 72,
  streak: 12,
  unread: 3,
  pendingJobs: 2,
  nextLesson: { time: "10:30", pupil: "James W.", postcode: "LS1 4AP", minutesUntil: 25, duration: "1hr", phone: "07700 900123" },
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
  if (h >= 5 && h < 12) return `Good morning, ${mock.firstName}!`;
  if (h >= 12 && h < 17) return `Good afternoon, ${mock.firstName}!`;
  if (h >= 17 && h < 21) return `Good evening, ${mock.firstName}!`;
  return `Ready to teach, ${mock.firstName}?`;
};

// ══════════════════════════════════════════════════════
// iOS-Style Redesign
// Matches Apple's design language: SF-style typography,
// grouped inset lists, subtle separators, system colors
// ══════════════════════════════════════════════════════

function IOSRedesign() {
  return (
    <div className="bg-[#f2f2f7] min-h-full">
      {/* Hero Image — full bleed like current */}
      <div className="w-full h-[38vh] min-h-[220px] max-h-[320px] overflow-hidden relative">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Overlap Card — iOS grouped style */}
      <div className="relative -mt-10 mx-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Gradient header (brand blue — same as current) */}
          <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-4 text-white">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
            </div>
            <div className="relative flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                {mock.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold truncate">{getGreeting()}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/30 text-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <CloudSun className="h-3.5 w-3.5 text-white/70" />
                    {mock.weather.temp}°C · {mock.weather.desc}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid — same 4-stat layout as current */}
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0075c9]/8">
                <BookOpen className="h-4 w-4 text-[#0075c9]" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 leading-none">{mock.lessons}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Lessons</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/8">
                <PoundSterling className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 leading-none">£{mock.earnings}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Expected</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/8">
                <Target className="h-4 w-4 text-violet-500" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 leading-none">{mock.weeklyProgress}%</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Weekly</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/8">
                <Timer className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-[15px] font-semibold text-gray-900 leading-none">{mock.nextLesson.time}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{mock.nextLesson.pupil}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Offers & Messages — iOS grouped inset list style */}
      <div className="px-4 mt-3 space-y-2">
        {mock.pendingJobs > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
              </div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={jobOffersIcon} alt="Job Offers" className="h-10 w-10 object-cover" />
                  <div>
                    <span className="font-semibold text-[15px]">Job Offers</span>
                    <p className="text-white/70 text-[11px]">{mock.pendingJobs} pending offer{mock.pendingJobs !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-white/90 text-[#0075c9] text-xs font-bold flex items-center justify-center">
                  {mock.pendingJobs}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={messagesIcon} alt="Messages" className="h-10 w-10 object-cover" />
                <div>
                  <span className="font-semibold text-[15px]">Messages</span>
                  <p className="text-white/70 text-[11px]">{mock.unread > 0 ? `${mock.unread} unread` : "No unread messages"}</p>
                </div>
              </div>
              {mock.unread > 0 && (
                <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">
                  {mock.unread}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* YOUR DAY — iOS grouped inset card */}
      <div className="px-4 mt-5">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
        
        {/* Next lesson card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 text-[13px] text-amber-600 font-medium mb-2.5">
              <Timer className="h-3.5 w-3.5" />
              Next in {mock.nextLesson.minutesUntil} min
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[17px] font-semibold text-gray-900">{mock.nextLesson.pupil}</p>
                <p className="text-[13px] text-gray-500 mt-0.5">{mock.nextLesson.time} · {mock.nextLesson.postcode} · {mock.nextLesson.duration}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#0075c9] flex items-center justify-center">
                <Navigation className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Timeline — iOS list with separators */}
          <div className="border-t border-gray-100">
            {mock.timeline.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < mock.timeline.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-[#0075c9] ring-2 ring-[#0075c9]/20" : "bg-gray-200"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] ${item.done ? "text-gray-400" : "text-gray-500"}`}>{item.time}</span>
                    <span className={`text-[15px] font-medium ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.pupil}</span>
                  </div>
                </div>
                {item.isNext && <span className="text-[11px] font-medium text-[#0075c9] bg-[#0075c9]/10 px-2 py-0.5 rounded-full">Next</span>}
                {item.done && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
                {!item.done && !item.isNext && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS — iOS rounded grid */}
      <div className="px-4 mt-5">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Quick Actions</p>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-4 gap-y-4">
            {mock.quickActions.map(q => (
              <div key={q.label} className="flex flex-col items-center gap-1.5">
                <div className={`h-[52px] w-[52px] rounded-[14px] ${q.bg} flex items-center justify-center`}>
                  <q.icon className={`h-5.5 w-5.5 ${q.color}`} />
                </div>
                <span className="text-[11px] text-gray-500 font-medium">{q.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AGENDA — iOS grouped card */}
      <div className="px-4 mt-5">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[15px] font-semibold text-gray-900">This Week</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div className="h-full bg-[#0075c9] rounded-full transition-all" style={{ width: `${mock.weeklyProgress}%` }} />
          </div>
          <p className="text-[13px] text-gray-500 mt-1.5">{mock.weeklyProgress}% of weekly goal</p>
        </div>
      </div>

      {/* PLAN AHEAD — iOS grouped card */}
      <div className="px-4 mt-5 pb-8">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Plan Ahead</p>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-[12px] bg-violet-500/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-gray-900">Tomorrow</p>
              <p className="text-[13px] text-gray-500">{mock.tomorrow.lessons} lessons · {mock.tomorrow.hours}hrs · £{mock.tomorrow.earnings}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Demo shell
// ══════════════════════════════════════════════════════

export default function MobileHomeIOSDemo() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/instructor" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-base font-semibold">iOS-Style Redesign Preview</h1>
          <span className="text-sm text-gray-500">1/1</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-col items-center gap-6 pt-8">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold">iOS Native Style</h2>
            <p className="text-sm text-gray-400 mt-1">Same content, iOS design language — grouped cards, SF-style type, system colours</p>
          </div>

          {/* Side-by-side comparison */}
          <div className="flex gap-8 flex-wrap justify-center">
            {/* Current Design */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-gray-400">Current Design</p>
              <div className="relative">
                <div className="w-[375px] h-[812px] bg-black rounded-[50px] p-3 shadow-2xl border border-white/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-2xl z-10" />
                  <div className="w-full h-full rounded-[40px] overflow-hidden bg-[#E8F1FE]">
                    <div className="h-full overflow-y-auto">
                      <CurrentDesignMock />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full" />
              </div>
            </div>

            {/* iOS Redesign */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-[#0075c9]">iOS Redesign</p>
              <div className="relative">
                <div className="w-[375px] h-[812px] bg-black rounded-[50px] p-3 shadow-2xl shadow-[#0075c9]/10 border border-white/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-2xl z-10" />
                  <div className="w-full h-full rounded-[40px] overflow-hidden bg-[#f2f2f7]">
                    <div className="h-full overflow-y-auto">
                      <IOSRedesign />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Current design mock (simplified replica for comparison) ──
function CurrentDesignMock() {
  return (
    <div className="min-h-full" style={{ backgroundColor: "#E8F1FE" }}>
      <div className="w-full h-[38vh] min-h-[220px] max-h-[320px] overflow-hidden relative">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div className="relative -mt-10 mx-4">
        <div className="bg-white shadow-xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-4 text-white">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
            </div>
            <div className="relative flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">{mock.initials}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold truncate">{getGreeting()}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/30 text-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                  <span className="text-white/70 text-xs flex items-center gap-1"><CloudSun className="h-3.5 w-3.5" /> {mock.weather.temp}°C</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0075c9]/10">
                <BookOpen className="h-4 w-4 text-[#0075c9]" /><div><p className="text-sm font-bold leading-none">{mock.lessons}</p><p className="text-[10px] text-gray-500 mt-0.5">Lessons</p></div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10">
                <PoundSterling className="h-4 w-4 text-emerald-500" /><div><p className="text-sm font-bold leading-none">£{mock.earnings}</p><p className="text-[10px] text-gray-500 mt-0.5">Expected</p></div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/10">
                <Target className="h-4 w-4 text-violet-500" /><div><p className="text-sm font-bold leading-none">{mock.weeklyProgress}%</p><p className="text-[10px] text-gray-500 mt-0.5">Weekly</p></div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10">
                <Timer className="h-4 w-4 text-amber-500" /><div><p className="text-sm font-bold leading-none">{mock.nextLesson.time}</p><p className="text-[10px] text-gray-500 mt-0.5">{mock.nextLesson.pupil}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-3 space-y-2">
        <div className="bg-white shadow-xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
            <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5"><img src={jobOffersIcon} alt="" className="h-10 w-10" /><div><span className="font-semibold text-sm">Job Offers</span><p className="text-white/70 text-[10px]">{mock.pendingJobs} pending</p></div></div>
              <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-white/90 text-[#0075c9] text-xs font-bold flex items-center justify-center">{mock.pendingJobs}</span>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
            <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5"><img src={messagesIcon} alt="" className="h-10 w-10" /><div><span className="font-semibold text-sm">Messages</span><p className="text-white/70 text-[10px]">{mock.unread} unread</p></div></div>
              <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">{mock.unread}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">YOUR DAY</p>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mb-2"><Timer className="h-3.5 w-3.5" /> Next in {mock.nextLesson.minutesUntil}min</div>
          <div className="flex items-center justify-between">
            <div><p className="font-semibold text-gray-900">{mock.nextLesson.pupil}</p><p className="text-xs text-gray-500">{mock.nextLesson.time} · {mock.nextLesson.postcode}</p></div>
            <div className="h-9 w-9 rounded-full bg-[#0075c9] flex items-center justify-center"><Navigation className="h-4 w-4 text-white" /></div>
          </div>
        </div>
        {/* Timeline */}
        <div className="mt-3 space-y-0">
          {mock.timeline.map((item, i) => (
            <div key={i} className="flex gap-2.5 pb-2">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-[#0075c9] ring-3 ring-[#0075c9]/20" : "bg-gray-200"}`} />
                {i < mock.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-0.5" />}
              </div>
              <div className="flex-1 pb-1">
                <p className={`text-xs ${item.done ? "text-gray-400" : "text-gray-500"}`}>{item.time}</p>
                <p className={`text-sm font-medium ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.pupil}</p>
              </div>
              {item.isNext && <span className="text-[10px] font-medium text-[#0075c9] bg-[#0075c9]/10 px-2 py-0.5 rounded-full self-start mt-1">Next</span>}
              {item.done && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-1.5 shrink-0" />}
            </div>
          ))}
        </div>
        {/* Quick actions */}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-5 mb-2">QUICK ACTIONS</p>
        <div className="grid grid-cols-4 gap-3">
          {mock.quickActions.map(q => (
            <div key={q.label} className="flex flex-col items-center gap-1.5">
              <div className={`h-12 w-12 rounded-2xl ${q.bg} flex items-center justify-center`}><q.icon className={`h-5 w-5 ${q.color}`} /></div>
              <span className="text-[10px] text-gray-500">{q.label}</span>
            </div>
          ))}
        </div>
        {/* Agenda */}
        <div className="mt-5 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-gray-900">This Week</span><ChevronRight className="h-4 w-4 text-gray-300" /></div>
          <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-[#0075c9] rounded-full" style={{ width: `${mock.weeklyProgress}%` }} /></div>
          <p className="text-xs text-gray-500 mt-1">{mock.weeklyProgress}% of weekly goal</p>
        </div>
        {/* Plan ahead */}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-5 mb-2">PLAN AHEAD</p>
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0"><Calendar className="h-5 w-5 text-violet-500" /></div>
          <div className="flex-1"><p className="text-sm font-medium text-gray-900">Tomorrow</p><p className="text-xs text-gray-500">{mock.tomorrow.lessons} lessons · {mock.tomorrow.hours}hrs · £{mock.tomorrow.earnings}</p></div>
          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        </div>
      </div>
    </div>
  );
}
