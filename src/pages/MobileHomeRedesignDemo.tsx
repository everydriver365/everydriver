import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, PoundSterling, Target, Timer, MapPin, Clock, Calendar, 
  ChevronRight, MessageSquare, Briefcase, Heart, Car, Star, Zap,
  TrendingUp, Users, Play, Sun, Cloud, Navigation, CheckCircle,
  ArrowLeft, ArrowRight, LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

// Mock data for all concepts
const mockData = {
  name: "Sarah",
  lessons: 5,
  earnings: 175,
  weeklyProgress: 72,
  nextLesson: { time: "10:30", pupil: "James W.", postcode: "LS1 4AP", minutesUntil: 25 },
  weather: { temp: 14, desc: "Partly cloudy" },
  unread: 3,
  pendingJobs: 2,
  streak: 12,
};

// ========== CONCEPT 1: Minimal Card Stack ==========
function Concept1() {
  return (
    <div className="bg-gray-50 min-h-full">
      {/* Slim header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <span className="text-lg font-bold text-gray-900">Good morning, {mockData.name}</span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Sun className="h-3.5 w-3.5 text-amber-400" /> {mockData.weather.temp}°
        </div>
      </div>
      {/* Next lesson prominent card */}
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Clock className="h-3 w-3" /> Next in {mockData.nextLesson.minutesUntil}min
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{mockData.nextLesson.pupil}</p>
              <p className="text-xs text-gray-500">{mockData.nextLesson.time} · {mockData.nextLesson.postcode}</p>
            </div>
            <button className="h-10 w-10 rounded-full bg-[#0075c9] flex items-center justify-center">
              <Navigation className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Lessons", value: mockData.lessons, icon: BookOpen, color: "text-[#0075c9]" },
            { label: "Earned", value: `£${mockData.earnings}`, icon: PoundSterling, color: "text-emerald-500" },
            { label: "Weekly", value: `${mockData.weeklyProgress}%`, icon: Target, color: "text-violet-500" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        {/* Action list */}
        {[
          { label: "Messages", sub: `${mockData.unread} unread`, icon: MessageSquare },
          { label: "Job Offers", sub: `${mockData.pendingJobs} pending`, icon: Briefcase },
          { label: "Schedule", sub: "View full day", icon: Calendar },
        ].map(a => (
          <div key={a.label} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-100">
            <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center">
              <a.icon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{a.label}</p>
              <p className="text-xs text-gray-400">{a.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== CONCEPT 2: Bold Hero Gradient ==========
function Concept2() {
  return (
    <div className="bg-white min-h-full">
      <div className="bg-gradient-to-br from-[#0075c9] to-[#003d6b] px-5 pt-6 pb-10 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <p className="text-sm text-white/70">Good morning</p>
        <h1 className="text-2xl font-bold mt-1">{mockData.name}</h1>
        <div className="grid grid-cols-2 gap-3 mt-5">
          {[
            { v: mockData.lessons, l: "Lessons today", icon: BookOpen },
            { v: `£${mockData.earnings}`, l: "Expected", icon: PoundSterling },
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <s.icon className="h-4 w-4 text-white/70 mb-1" />
              <p className="text-xl font-bold">{s.v}</p>
              <p className="text-[10px] text-white/60">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Overlap card */}
      <div className="-mt-5 mx-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Timer className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Next lesson in {mockData.nextLesson.minutesUntil}min</p>
            <p className="font-semibold">{mockData.nextLesson.pupil} · {mockData.nextLesson.time}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>
        <div className="h-px bg-gray-100" />
        <div className="flex gap-2">
          {["Schedule", "Pupils", "Messages", "Pay"].map(a => (
            <button key={a} className="flex-1 py-2 rounded-lg bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100">{a}</button>
          ))}
        </div>
      </div>
      <div className="px-4 mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Quick Actions</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Track", icon: MapPin, bg: "bg-emerald-50", c: "text-emerald-600" },
            { label: "Gaps", icon: Calendar, bg: "bg-violet-50", c: "text-violet-600" },
            { label: "Health", icon: Heart, bg: "bg-pink-50", c: "text-pink-600" },
            { label: "Vehicle", icon: Car, bg: "bg-sky-50", c: "text-sky-600" },
          ].map(q => (
            <div key={q.label} className="flex flex-col items-center gap-1.5">
              <div className={`h-12 w-12 rounded-2xl ${q.bg} flex items-center justify-center`}>
                <q.icon className={`h-5 w-5 ${q.c}`} />
              </div>
              <span className="text-[10px] text-gray-500">{q.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== CONCEPT 3: Dark Mode Premium ==========
function Concept3() {
  return (
    <div className="bg-[#0f1117] min-h-full text-white">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-400">Welcome back</p>
            <h1 className="text-xl font-bold">{mockData.name}</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0075c9] to-[#00a3ff] flex items-center justify-center text-sm font-bold">S</div>
        </div>
        {/* Glassmorphism next lesson */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">NEXT UP</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{mockData.nextLesson.pupil}</p>
              <p className="text-sm text-gray-400">{mockData.nextLesson.time} · {mockData.nextLesson.postcode}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#00a3ff]">{mockData.nextLesson.minutesUntil}</p>
              <p className="text-[10px] text-gray-500">minutes</p>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { v: mockData.lessons, l: "Lessons", c: "from-[#0075c9] to-[#00a3ff]" },
            { v: `£${mockData.earnings}`, l: "Earned", c: "from-emerald-500 to-emerald-400" },
            { v: `${mockData.weeklyProgress}%`, l: "Goal", c: "from-violet-500 to-violet-400" },
          ].map(s => (
            <div key={s.l} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className={`text-lg font-bold bg-gradient-to-r ${s.c} bg-clip-text text-transparent`}>{s.v}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
        {/* Streak */}
        <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl p-3 mb-4 border border-amber-500/20">
          <Star className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">{mockData.streak}-day streak!</span>
          <span className="text-xs text-amber-500/60 ml-auto">Keep going 🔥</span>
        </div>
        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Messages", sub: `${mockData.unread} new`, icon: MessageSquare },
            { label: "Jobs", sub: `${mockData.pendingJobs} offers`, icon: Briefcase },
            { label: "Schedule", sub: "Full day", icon: Calendar },
            { label: "Quick Pay", sub: "Take payment", icon: PoundSterling },
          ].map(a => (
            <div key={a.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <a.icon className="h-4 w-4 text-gray-400 mb-2" />
              <p className="text-sm font-medium">{a.label}</p>
              <p className="text-[10px] text-gray-500">{a.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== CONCEPT 4: Split Panel ==========
function Concept4() {
  return (
    <div className="bg-white min-h-full">
      {/* Top half blue */}
      <div className="bg-[#0075c9] px-5 pt-5 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">Hi {mockData.name} 👋</h1>
          <div className="flex items-center gap-1 text-xs bg-white/20 rounded-full px-2.5 py-1">
            <Sun className="h-3 w-3" /> {mockData.weather.temp}°
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/15 rounded-xl p-3">
            <p className="text-2xl font-bold">{mockData.lessons}</p>
            <p className="text-xs text-white/70">Lessons</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-xl p-3">
            <p className="text-2xl font-bold">£{mockData.earnings}</p>
            <p className="text-xs text-white/70">Expected</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-xl p-3">
            <p className="text-2xl font-bold">{mockData.weeklyProgress}%</p>
            <p className="text-xs text-white/70">Goal</p>
          </div>
        </div>
      </div>
      {/* Bottom half */}
      <div className="px-4 -mt-3 space-y-3">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#0075c9]/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-[#0075c9] ml-0.5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{mockData.nextLesson.pupil}</p>
              <p className="text-xs text-gray-500">Starts at {mockData.nextLesson.time} · {mockData.nextLesson.postcode}</p>
            </div>
            <span className="text-xs font-medium text-[#0075c9] bg-[#0075c9]/10 px-2 py-1 rounded-full">{mockData.nextLesson.minutesUntil}m</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Messages", s: `${mockData.unread} unread`, i: MessageSquare, bg: "bg-blue-50", c: "text-[#0075c9]" },
            { l: "Job Offers", s: `${mockData.pendingJobs} new`, i: Briefcase, bg: "bg-amber-50", c: "text-amber-600" },
            { l: "Pupils", s: "Manage", i: Users, bg: "bg-emerald-50", c: "text-emerald-600" },
            { l: "Earnings", s: "This week", i: TrendingUp, bg: "bg-violet-50", c: "text-violet-600" },
          ].map(a => (
            <div key={a.l} className={`${a.bg} rounded-xl p-3.5`}>
              <a.i className={`h-5 w-5 ${a.c} mb-2`} />
              <p className="text-sm font-medium text-gray-900">{a.l}</p>
              <p className="text-[10px] text-gray-500">{a.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== CONCEPT 5: Photo Hero Card ==========
function Concept5() {
  return (
    <div className="bg-gray-100 min-h-full">
      <div className="relative h-[180px] overflow-hidden">
        <img src={instructorHeroImg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-lg font-bold">Morning, {mockData.name}</p>
          <p className="text-xs text-white/70">{mockData.lessons} lessons · £{mockData.earnings} expected</p>
        </div>
      </div>
      <div className="px-4 -mt-3 space-y-3">
        {/* Pill stats */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { l: `${mockData.lessons} Lessons`, c: "bg-[#0075c9] text-white" },
            { l: `£${mockData.earnings}`, c: "bg-emerald-500 text-white" },
            { l: `${mockData.streak}🔥 Streak`, c: "bg-amber-500 text-white" },
            { l: `${mockData.weeklyProgress}% Goal`, c: "bg-violet-500 text-white" },
          ].map(p => (
            <span key={p.l} className={`${p.c} rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0`}>{p.l}</span>
          ))}
        </div>
        {/* Next lesson */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-[#0075c9] font-medium mb-2">
            <Zap className="h-3.5 w-3.5" /> NEXT LESSON
          </div>
          <p className="font-semibold">{mockData.nextLesson.pupil}</p>
          <p className="text-sm text-gray-500">{mockData.nextLesson.time} · {mockData.nextLesson.postcode}</p>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-[#0075c9] text-white text-xs font-medium py-2 rounded-lg">Navigate</button>
            <button className="flex-1 bg-gray-100 text-gray-700 text-xs font-medium py-2 rounded-lg">Details</button>
          </div>
        </div>
        {/* Quick grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: "Schedule", i: Calendar, bg: "bg-blue-50", c: "text-[#0075c9]" },
            { l: "Messages", i: MessageSquare, bg: "bg-red-50", c: "text-red-500", badge: mockData.unread },
            { l: "Jobs", i: Briefcase, bg: "bg-amber-50", c: "text-amber-600", badge: mockData.pendingJobs },
            { l: "More", i: LayoutGrid, bg: "bg-gray-100", c: "text-gray-600" },
          ].map(q => (
            <div key={q.l} className="flex flex-col items-center gap-1">
              <div className={`relative h-12 w-12 rounded-xl ${q.bg} flex items-center justify-center`}>
                <q.i className={`h-5 w-5 ${q.c}`} />
                {q.badge && q.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">{q.badge}</span>
                )}
              </div>
              <span className="text-[10px] text-gray-500">{q.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== CONCEPT 6: Timeline Focus ==========
function Concept6() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Today</h1>
            <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div className="flex gap-1.5">
            <span className="bg-[#0075c9]/10 text-[#0075c9] text-xs font-medium px-2.5 py-1 rounded-full">{mockData.lessons} lessons</span>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-1 rounded-full">£{mockData.earnings}</span>
          </div>
        </div>
      </div>
      <div className="px-5 pt-4 space-y-0">
        {/* Timeline items */}
        {[
          { time: "09:00", pupil: "Alice B.", postcode: "LS2 3AA", status: "done" },
          { time: "10:30", pupil: "James W.", postcode: "LS1 4AP", status: "next" },
          { time: "12:00", pupil: "Maria G.", postcode: "LS6 2NB", status: "upcoming" },
          { time: "14:00", pupil: "Tom S.", postcode: "LS7 1RR", status: "upcoming" },
          { time: "16:00", pupil: "Emma L.", postcode: "LS3 1AB", status: "upcoming" },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full shrink-0 mt-1 ${
                item.status === "done" ? "bg-emerald-400" : item.status === "next" ? "bg-[#0075c9] ring-4 ring-[#0075c9]/20" : "bg-gray-200"
              }`} />
              {i < 4 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
            </div>
            <div className={`flex-1 rounded-xl p-3 ${
              item.status === "next" ? "bg-[#0075c9]/5 border border-[#0075c9]/20" : "bg-gray-50"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${item.status === "done" ? "text-gray-400 line-through" : "text-gray-500"}`}>{item.time}</p>
                  <p className={`font-medium text-sm ${item.status === "done" ? "text-gray-400" : "text-gray-900"}`}>{item.pupil}</p>
                </div>
                {item.status === "next" && (
                  <span className="text-xs font-medium text-[#0075c9] bg-[#0075c9]/10 px-2 py-0.5 rounded-full">Now</span>
                )}
                {item.status === "done" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom actions */}
      <div className="px-5 mt-2 grid grid-cols-3 gap-2">
        {[
          { l: "Messages", i: MessageSquare, badge: mockData.unread },
          { l: "Jobs", i: Briefcase, badge: mockData.pendingJobs },
          { l: "All Actions", i: LayoutGrid },
        ].map(a => (
          <div key={a.l} className="relative bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1">
            <a.i className="h-5 w-5 text-gray-500" />
            <span className="text-[10px] text-gray-500">{a.l}</span>
            {a.badge && a.badge > 0 && (
              <span className="absolute top-1 right-2 min-w-[14px] h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">{a.badge}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== CONCEPT 7: Bento Grid ==========
function Concept7() {
  return (
    <div className="bg-[#f5f5f0] min-h-full p-3 space-y-2">
      {/* Greeting */}
      <div className="bg-[#0075c9] rounded-2xl p-4 text-white">
        <p className="text-sm text-white/70">Good morning</p>
        <h1 className="text-xl font-bold">{mockData.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-white/70"><Sun className="h-3 w-3 inline mr-1" />{mockData.weather.temp}° {mockData.weather.desc}</span>
        </div>
      </div>
      {/* Bento */}
      <div className="grid grid-cols-2 gap-2">
        {/* Big next lesson */}
        <div className="col-span-2 bg-white rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mb-1"><Timer className="h-3.5 w-3.5" /> {mockData.nextLesson.minutesUntil}min away</div>
          <p className="font-bold text-gray-900">{mockData.nextLesson.pupil}</p>
          <p className="text-xs text-gray-500">{mockData.nextLesson.time} · {mockData.nextLesson.postcode}</p>
        </div>
        <div className="bg-white rounded-2xl p-3">
          <BookOpen className="h-5 w-5 text-[#0075c9] mb-2" />
          <p className="text-2xl font-bold text-gray-900">{mockData.lessons}</p>
          <p className="text-[10px] text-gray-400">Lessons today</p>
        </div>
        <div className="bg-white rounded-2xl p-3">
          <PoundSterling className="h-5 w-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">£{mockData.earnings}</p>
          <p className="text-[10px] text-gray-400">Expected</p>
        </div>
        <div className="bg-white rounded-2xl p-3">
          <Target className="h-5 w-5 text-violet-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{mockData.weeklyProgress}%</p>
          <p className="text-[10px] text-gray-400">Weekly goal</p>
        </div>
        <div className="bg-white rounded-2xl p-3 relative">
          <MessageSquare className="h-5 w-5 text-rose-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{mockData.unread}</p>
          <p className="text-[10px] text-gray-400">Unread</p>
          {mockData.unread > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500" />}
        </div>
        {/* Streak */}
        <div className="col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3 flex items-center gap-3 border border-amber-100">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold text-gray-900">{mockData.streak}-day streak</p>
            <p className="text-xs text-gray-500">Keep the momentum going!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== CONCEPT 8: iOS Widget Style ==========
function Concept8() {
  return (
    <div className="bg-[#f2f2f7] min-h-full">
      <div className="px-4 pt-5 pb-3">
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("en-GB", { weekday: "long" })}</p>
        <h1 className="text-2xl font-bold text-gray-900">{mockData.name}'s Dashboard</h1>
      </div>
      <div className="px-4 space-y-3">
        {/* Widget: Next lesson */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-[#0075c9] flex items-center justify-center"><Calendar className="h-3.5 w-3.5 text-white" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Next Lesson</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{mockData.nextLesson.pupil}</p>
              <p className="text-sm text-gray-500">{mockData.nextLesson.time} · {mockData.nextLesson.postcode}</p>
            </div>
            <div className="bg-[#0075c9]/10 rounded-full px-3 py-1 text-xs font-medium text-[#0075c9]">{mockData.nextLesson.minutesUntil}min</div>
          </div>
        </div>
        {/* Widget: Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center"><PoundSterling className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">£{mockData.earnings}</p>
            <p className="text-xs text-emerald-500 mt-0.5">+12% vs last week</p>
          </div>
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-violet-500 flex items-center justify-center"><Target className="h-3.5 w-3.5 text-white" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">Goal</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{mockData.weeklyProgress}%</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-2"><div className="h-full bg-violet-500 rounded-full" style={{width:`${mockData.weeklyProgress}%`}} /></div>
          </div>
        </div>
        {/* Widget: Inbox */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-rose-500 flex items-center justify-center"><MessageSquare className="h-3.5 w-3.5 text-white" /></div>
            <span className="text-xs font-semibold text-gray-400 uppercase">Inbox</span>
            <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{mockData.unread}</span>
          </div>
          <div className="space-y-2">
            {["New message from Alice B.", "Payment received - James W.", "Booking request - Tom S."].map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0075c9] shrink-0" />
                <p className="text-sm text-gray-700 truncate">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== CONCEPT 9: Compact Dashboard ==========
function Concept9() {
  return (
    <div className="bg-white min-h-full">
      {/* Compact header bar */}
      <div className="bg-gradient-to-r from-[#0075c9] to-[#0090e0] px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">S</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{mockData.name}</p>
          <p className="text-[10px] text-white/70">{mockData.lessons} lessons · £{mockData.earnings} today</p>
        </div>
        <div className="flex gap-1">
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px] text-white">{mockData.weather.temp}°</span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {/* Horizontal stats scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { v: mockData.lessons, l: "Lessons", c: "border-[#0075c9]", tc: "text-[#0075c9]" },
            { v: `£${mockData.earnings}`, l: "Earned", c: "border-emerald-400", tc: "text-emerald-600" },
            { v: `${mockData.weeklyProgress}%`, l: "Goal", c: "border-violet-400", tc: "text-violet-600" },
            { v: `${mockData.streak}🔥`, l: "Streak", c: "border-amber-400", tc: "text-amber-600" },
          ].map(s => (
            <div key={s.l} className={`shrink-0 border-l-2 ${s.c} pl-2 pr-4`}>
              <p className={`text-lg font-bold ${s.tc}`}>{s.v}</p>
              <p className="text-[10px] text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
        {/* Next lesson compact */}
        <div className="flex items-center gap-3 bg-[#0075c9]/5 rounded-xl p-3 border border-[#0075c9]/10">
          <div className="h-10 w-10 rounded-lg bg-[#0075c9] flex items-center justify-center shrink-0">
            <Timer className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#0075c9] font-medium">Next in {mockData.nextLesson.minutesUntil}min</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{mockData.nextLesson.pupil} · {mockData.nextLesson.time}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        </div>
        {/* Dense action grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "Schedule", i: Calendar, c: "text-[#0075c9]" },
            { l: "Messages", i: MessageSquare, c: "text-rose-500", b: mockData.unread },
            { l: "Jobs", i: Briefcase, c: "text-amber-600", b: mockData.pendingJobs },
            { l: "Pupils", i: Users, c: "text-emerald-600" },
            { l: "Pay", i: PoundSterling, c: "text-violet-600" },
            { l: "Track", i: MapPin, c: "text-sky-600" },
            { l: "Gaps", i: Calendar, c: "text-pink-600" },
            { l: "Vehicle", i: Car, c: "text-slate-600" },
            { l: "Health", i: Heart, c: "text-red-500" },
          ].map(a => (
            <div key={a.l} className="relative flex flex-col items-center gap-1 py-2.5 bg-gray-50 rounded-lg">
              <a.i className={`h-5 w-5 ${a.c}`} />
              <span className="text-[10px] text-gray-600">{a.l}</span>
              {a.b && a.b > 0 && (
                <span className="absolute top-1 right-2 min-w-[14px] h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">{a.b}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== CONCEPT 10: Fullscreen Hero Map ==========
function Concept10() {
  return (
    <div className="bg-[#1a1d23] min-h-full text-white">
      {/* Map placeholder as hero */}
      <div className="relative h-[180px] bg-gradient-to-br from-[#1e3a5f] to-[#0f1f33] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[30%] left-[20%] w-[60%] h-[1px] bg-[#0075c9]" />
          <div className="absolute top-[50%] left-[10%] w-[80%] h-[1px] bg-[#0075c9]/50" />
          <div className="absolute top-[70%] left-[30%] w-[40%] h-[1px] bg-[#0075c9]/30" />
          <div className="absolute top-[20%] left-[40%] w-[1px] h-[60%] bg-[#0075c9]/40" />
          <div className="absolute top-[10%] left-[60%] w-[1px] h-[80%] bg-[#0075c9]/20" />
        </div>
        <div className="absolute top-[45%] left-[55%] h-3 w-3 rounded-full bg-[#00a3ff] ring-4 ring-[#00a3ff]/20 animate-pulse" />
        <div className="absolute bottom-3 left-4">
          <p className="text-xs text-white/50">Current location</p>
          <p className="text-sm font-medium">Headingley, Leeds</p>
        </div>
      </div>
      {/* Content */}
      <div className="p-4 space-y-3 -mt-3">
        <div className="bg-[#252830] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#0075c9] flex items-center justify-center text-xs font-bold">S</div>
              <div>
                <p className="font-semibold text-sm">{mockData.name}</p>
                <p className="text-[10px] text-gray-500">{mockData.lessons} lessons today</p>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Online</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: `£${mockData.earnings}`, l: "Earned", c: "text-emerald-400" },
              { v: `${mockData.weeklyProgress}%`, l: "Goal", c: "text-violet-400" },
              { v: `${mockData.streak}🔥`, l: "Streak", c: "text-amber-400" },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[10px] text-gray-500">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Next lesson */}
        <div className="bg-[#252830] rounded-2xl p-4 border border-[#0075c9]/20">
          <div className="flex items-center gap-2 text-xs text-[#00a3ff] font-medium mb-2"><Navigation className="h-3.5 w-3.5" /> NEXT DESTINATION</div>
          <p className="font-semibold">{mockData.nextLesson.pupil} · {mockData.nextLesson.time}</p>
          <p className="text-sm text-gray-400">{mockData.nextLesson.postcode} · {mockData.nextLesson.minutesUntil}min away</p>
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: "Messages", i: MessageSquare },
            { l: "Jobs", i: Briefcase },
            { l: "Schedule", i: Calendar },
            { l: "Earnings", i: TrendingUp },
          ].map(a => (
            <div key={a.l} className="bg-[#252830] rounded-xl p-2.5 flex flex-col items-center gap-1 border border-white/5">
              <a.i className="h-4 w-4 text-gray-400" />
              <span className="text-[9px] text-gray-500">{a.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MAIN DEMO PAGE ==========
const concepts = [
  { id: 1, name: "Minimal Card Stack", desc: "Clean, white, card-based with prominent next lesson", Component: Concept1 },
  { id: 2, name: "Bold Hero Gradient", desc: "Large gradient header with overlap card", Component: Concept2 },
  { id: 3, name: "Dark Mode Premium", desc: "Dark glassmorphism with neon accents", Component: Concept3 },
  { id: 4, name: "Split Panel", desc: "Blue/white split with coloured action tiles", Component: Concept4 },
  { id: 5, name: "Photo Hero", desc: "Full-bleed photo hero with pill stats", Component: Concept5 },
  { id: 6, name: "Timeline Focus", desc: "Day timeline as primary navigation", Component: Concept6 },
  { id: 7, name: "Bento Grid", desc: "Magazine-style bento layout", Component: Concept7 },
  { id: 8, name: "iOS Widget Style", desc: "Apple-inspired widget cards", Component: Concept8 },
  { id: 9, name: "Compact Dashboard", desc: "Dense, data-rich compact layout", Component: Concept9 },
  { id: 10, name: "Map Explorer", desc: "Dark map-centric driving interface", Component: Concept10 },
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
                selected === i 
                  ? "bg-[#0075c9] text-white" 
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
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
            {/* Phone frame */}
            <div className="w-[375px] h-[812px] bg-black rounded-[50px] p-3 shadow-2xl shadow-[#0075c9]/10 border border-white/10">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-2xl z-10" />
              {/* Screen */}
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
                      {(() => {
                        const C = concepts[selected].Component;
                        return <C />;
                      })()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            {/* Home indicator */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full" />
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-4 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelected(Math.max(0, selected - 1))}
              disabled={selected === 0}
              className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelected(Math.min(9, selected + 1))}
              disabled={selected === 9}
              className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
            >
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
