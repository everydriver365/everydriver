import {
  BookOpen, PoundSterling, Target, Clock, MapPin, Play,
  ChevronRight, Mail, Car, TrendingUp, Calendar, User, Bell, Sun,
  Zap, BarChart3, Star, Navigation, CheckCircle, MessageSquare,
  Briefcase, ArrowRight, Heart, Shield, Fuel, AlertTriangle,
} from "lucide-react";

const STATS = { lessons: 4, earnings: 140, weekly: 72, nextTime: "10:30" };
const PUPIL = "Sarah M";
const LOCATION = "SW1A 1AA";
const SCHEDULE = ["09:00 · Sarah M", "11:00 · James R", "13:30 · Emma W", "15:00 · Tom B"];
const ACTIONS = [
  { icon: Navigation, label: "SatNav" },
  { icon: Calendar, label: "Diary" },
  { icon: Car, label: "Vehicle" },
  { icon: Briefcase, label: "Jobs" },
];

// ─── 51: Layered Panels ───
export function Design51() {
  return (
    <div className="min-h-full bg-[#1a1a2e] text-white p-4 pt-6 pb-8">
      <p className="text-[10px] uppercase tracking-widest text-white/40">Dashboard</p>
      <p className="text-xl font-bold mt-1">Good morning ☀️</p>
      <div className="mt-4 space-y-3">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <p className="text-[10px] text-white/60 uppercase">Next Lesson</p>
          <p className="text-lg font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-white/60">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-3 px-4 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Start →</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "4", l: "Lessons", c: "from-sky-500/20 to-sky-600/20" },
            { v: "£140", l: "Earned", c: "from-emerald-500/20 to-emerald-600/20" },
            { v: "72%", l: "Goal", c: "from-violet-500/20 to-violet-600/20" },
          ].map((s,i) => (
            <div key={i} className={`bg-gradient-to-b ${s.c} rounded-xl p-3 text-center`}>
              <p className="text-lg font-bold">{s.v}</p>
              <p className="text-[9px] text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-400" /><span className="text-sm">2 unread</span></div>
          <ChevronRight className="h-4 w-4 text-white/30" />
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-[10px] uppercase text-white/40 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1 border-b border-white/5 last:border-0">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><a.icon className="h-5 w-5 text-white/50" /></div>
              <span className="text-[9px] text-white/40">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 52: Floating Bubbles ───
export function Design52() {
  return (
    <div className="min-h-full bg-[#0d1117] text-white p-4 pt-6 pb-8 relative overflow-hidden">
      <div className="absolute top-10 left-4 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-20 right-0 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
      <p className="text-xl font-bold relative z-10">Today</p>
      <p className="text-xs text-white/40 relative z-10">Wednesday · 4 lessons</p>
      <div className="mt-4 space-y-3 relative z-10">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center"><User className="h-5 w-5 text-cyan-400" /></div>
            <div>
              <p className="font-bold text-sm">{PUPIL}</p>
              <p className="text-[10px] text-white/50">{STATS.nextTime} · {LOCATION}</p>
            </div>
          </div>
          <button className="w-full mt-3 py-2 bg-cyan-500 rounded-xl text-sm font-medium text-black">Start Lesson</button>
        </div>
        <div className="flex gap-2">
          {[{ v: "£140", l: "Earned", bg: "bg-emerald-500/10 border-emerald-500/20" }, { v: "72%", l: "Goal", bg: "bg-violet-500/10 border-violet-500/20" }].map((s,i) => (
            <div key={i} className={`flex-1 ${s.bg} border backdrop-blur-sm rounded-xl p-3 text-center`}>
              <p className="text-lg font-bold">{s.v}</p>
              <p className="text-[9px] text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-cyan-400" /><span className="text-sm">2 messages</span></div>
          <span className="w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
          <p className="text-[10px] uppercase text-white/40 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-white/5 last:border-0">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><a.icon className="h-5 w-5 text-white/50" /></div>
              <span className="text-[9px] text-white/40">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 53: Accordion Stack ───
export function Design53() {
  return (
    <div className="min-h-full bg-[#f8f9fa] p-4 pt-6 pb-8">
      <p className="text-xl font-bold text-[#1a1a2e]">Dashboard</p>
      <p className="text-xs text-gray-500">Wed · 4 lessons · £140 expected</p>
      <div className="mt-4 space-y-2">
        {[
          { title: "▼ Next Lesson", content: <div className="mt-2"><p className="font-semibold text-sm">{PUPIL}</p><p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p><button className="mt-2 px-3 py-1.5 bg-[#1a1a2e] text-white rounded-lg text-xs">Start</button></div> },
          { title: "▼ Today's Stats", content: <div className="mt-2 grid grid-cols-3 gap-2">{[{v:"4",l:"Lessons"},{v:"£140",l:"Earned"},{v:"72%",l:"Goal"}].map((s,i)=><div key={i} className="text-center"><p className="text-lg font-bold text-[#1a1a2e]">{s.v}</p><p className="text-[9px] text-gray-400">{s.l}</p></div>)}</div> },
          { title: "▼ Messages (2)", content: <div className="mt-2 text-xs text-gray-600">2 unread from pupils</div> },
          { title: "▼ Schedule", content: <div className="mt-2">{SCHEDULE.map((s,i)=><p key={i} className="text-xs py-1 border-b border-gray-100 last:border-0 text-gray-700">{s}</p>)}</div> },
          { title: "▼ Quick Actions", content: <div className="mt-2 grid grid-cols-4 gap-2">{ACTIONS.map((a,i)=><div key={i} className="flex flex-col items-center gap-1"><div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><a.icon className="h-4 w-4 text-gray-500" /></div><span className="text-[8px] text-gray-400">{a.label}</span></div>)}</div> },
          { title: "▼ Tomorrow", content: <div className="mt-2 text-xs text-gray-600">3 lessons · £105 expected</div> },
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-xs font-semibold text-[#1a1a2e]">{section.title}</p>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 54: Gradient Ribbon ───
export function Design54() {
  return (
    <div className="min-h-full bg-white pb-8">
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-4 pt-4 pb-16 text-white">
        <p className="text-[10px] uppercase tracking-wider text-white/50">Every Driver</p>
        <p className="text-2xl font-black mt-1">£{STATS.earnings}</p>
        <p className="text-xs text-white/60">{STATS.lessons} lessons today · 72% goal</p>
      </div>
      <div className="px-4 -mt-10 space-y-3">
        <div className="bg-white rounded-2xl shadow-lg p-4 border">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Next Up</p>
          <p className="font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-3 w-full py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start Lesson</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 border flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#1a1a2e]" /><span className="text-sm font-medium">Messages</span></div>
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 border">
          <p className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b last:border-0 text-gray-700">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-2xl bg-[#1a1a2e]/5 flex items-center justify-center"><a.icon className="h-5 w-5 text-[#1a1a2e]/60" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 55: Compact Rows ───
export function Design55() {
  return (
    <div className="min-h-full bg-[#f2f2f7] pb-8">
      <div className="bg-[#1a1a2e] px-4 pt-4 pb-3 text-white flex items-center justify-between">
        <div><p className="text-lg font-bold">£{STATS.earnings}</p><p className="text-[10px] text-white/50">{STATS.lessons} lessons · Wed</p></div>
        <div className="flex items-center gap-2">
          <div className="relative"><Bell className="h-5 w-5 text-white/70" /><span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-[#1a1a2e]" /></div>
        </div>
      </div>
      <div className="px-4 mt-3 space-y-2">
        <div className="bg-white rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center"><Play className="h-4 w-4 text-[#1a1a2e]" /></div>
            <div><p className="text-sm font-semibold">{PUPIL}</p><p className="text-[10px] text-gray-500">{STATS.nextTime} · {LOCATION}</p></div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{v:"4",l:"Lessons",c:"bg-sky-50 text-sky-700"},{v:"£140",l:"Earned",c:"bg-emerald-50 text-emerald-700"},{v:"72%",l:"Goal",c:"bg-violet-50 text-violet-700"}].map((s,i) => (
            <div key={i} className={`${s.c} rounded-xl p-2.5 text-center`}>
              <p className="text-sm font-bold">{s.v}</p>
              <p className="text-[8px] opacity-60">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#1a1a2e]" /><span className="text-sm">2 unread</span></div>
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        {SCHEDULE.map((s,i) => (
          <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-[#1a1a2e]/20" />
            <span className="text-xs text-gray-700">{s}</span>
          </div>
        ))}
        <div className="grid grid-cols-4 gap-2 mt-1">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 56: Gradient Cards ───
export function Design56() {
  return (
    <div className="min-h-full bg-gray-950 text-white p-4 pt-6 pb-8">
      <p className="text-xl font-bold">Your Day</p>
      <p className="text-xs text-white/40">Wednesday · Partly cloudy 14°C</p>
      <div className="mt-4 space-y-3">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-4">
          <p className="text-[10px] uppercase text-white/60">Next</p>
          <p className="text-lg font-bold">{PUPIL}</p>
          <p className="text-xs text-white/70">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-2 px-4 py-1.5 bg-white/20 rounded-lg text-xs font-medium">Start →</button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl p-3 text-center">
            <p className="text-xl font-bold">£140</p><p className="text-[9px] text-white/60">Earned</p>
          </div>
          <div className="flex-1 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl p-3 text-center">
            <p className="text-xl font-bold">72%</p><p className="text-[9px] text-white/60">Goal</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-600/20 to-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-rose-400" /><span className="text-sm">2 messages</span></div>
          <span className="w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-[10px] uppercase text-white/40 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-white/5 last:border-0">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><a.icon className="h-5 w-5 text-white/50" /></div>
              <span className="text-[9px] text-white/40">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 57: Pill Stats ───
export function Design57() {
  return (
    <div className="min-h-full bg-[#f2f2f7] p-4 pt-6 pb-8">
      <p className="text-xl font-bold text-[#1a1a2e]">Today</p>
      <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
        {[{v:"4 lessons",c:"bg-[#1a1a2e] text-white"},{v:"£140",c:"bg-emerald-500 text-white"},{v:"72% goal",c:"bg-violet-500 text-white"},{v:"2 msgs",c:"bg-rose-500 text-white"}].map((p,i) => (
          <span key={i} className={`${p.c} px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap`}>{p.v}</span>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center"><User className="h-5 w-5 text-[#1a1a2e]" /></div>
            <div><p className="font-bold">{PUPIL}</p><p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION} · in 25 min</p></div>
          </div>
          <button className="w-full mt-3 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start Lesson</button>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a2e]" />
              <span className="text-xs text-gray-700">{s}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-3 border border-gray-100">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Tomorrow</p>
          <p className="text-sm mt-1">3 lessons · £105 expected</p>
        </div>
      </div>
    </div>
  );
}

// ─── 58: Sidebar Ticker ───
export function Design58() {
  return (
    <div className="min-h-full bg-[#f2f2f7] flex">
      <div className="w-14 bg-[#1a1a2e] flex flex-col items-center py-6 gap-4 text-white shrink-0">
        <div className="text-center"><p className="text-sm font-bold">4</p><p className="text-[7px] text-white/40">LES</p></div>
        <div className="text-center"><p className="text-sm font-bold">£140</p><p className="text-[7px] text-white/40">£</p></div>
        <div className="text-center"><p className="text-sm font-bold">72%</p><p className="text-[7px] text-white/40">GOAL</p></div>
        <div className="relative mt-auto"><Mail className="h-4 w-4 text-white/60" /><span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 text-[7px] font-bold flex items-center justify-center">2</span></div>
      </div>
      <div className="flex-1 p-3 pt-5 pb-8 overflow-y-auto space-y-3">
        <p className="text-lg font-bold text-[#1a1a2e]">Today</p>
        <div className="bg-white rounded-xl p-3 border">
          <p className="text-[10px] uppercase text-gray-400">Next Up</p>
          <p className="font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-2 px-3 py-1.5 bg-[#1a1a2e] text-white rounded-lg text-xs">Start</button>
        </div>
        {SCHEDULE.map((s,i) => (
          <div key={i} className="bg-white rounded-xl p-2.5 border flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-[#1a1a2e]/20" />
            <span className="text-xs">{s}</span>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.slice(0,3).map((a,i) => (
            <div key={i} className="bg-white rounded-xl p-2.5 border flex flex-col items-center gap-1">
              <a.icon className="h-4 w-4 text-[#1a1a2e]/50" />
              <span className="text-[8px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 59: Outlined Minimal ───
export function Design59() {
  return (
    <div className="min-h-full bg-white p-4 pt-6 pb-8">
      <p className="text-2xl font-black text-[#1a1a2e]">Today</p>
      <p className="text-xs text-gray-400 mt-0.5">Wednesday · 14°C</p>
      <div className="mt-4 space-y-3">
        <div className="border-2 border-[#1a1a2e] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Next Lesson</p>
          <p className="text-lg font-bold text-[#1a1a2e] mt-1">{PUPIL}</p>
          <p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-3 px-4 py-2 bg-[#1a1a2e] text-white rounded-xl text-xs font-medium">Start →</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{v:"4",l:"Lessons"},{v:"£140",l:"Earned"},{v:"72%",l:"Goal"}].map((s,i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#1a1a2e]">{s.v}</p>
              <p className="text-[9px] text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[#1a1a2e]">Messages</span>
          <span className="w-6 h-6 rounded-full border-2 border-red-500 text-red-500 text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-gray-100 last:border-0 text-gray-700">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center"><a.icon className="h-5 w-5 text-gray-400" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 60: Map Hero ───
export function Design60() {
  return (
    <div className="min-h-full bg-[#f2f2f7] pb-8">
      <div className="h-32 bg-gradient-to-br from-[#1a1a2e] to-[#2d3561] relative flex items-end px-4 pb-3">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-width='.5'/%3E%3C/svg%3E\")"}} />
        <div className="relative z-10">
          <p className="text-white/50 text-[10px] uppercase">Next destination</p>
          <p className="text-white font-bold">{LOCATION}</p>
          <p className="text-white/60 text-xs">{PUPIL} · {STATS.nextTime}</p>
        </div>
        <button className="ml-auto relative z-10 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Navigation className="h-3 w-3" /> Navigate</button>
      </div>
      <div className="px-4 mt-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[{v:"4",l:"Lessons",c:"bg-white"},{v:"£140",l:"Earned",c:"bg-white"},{v:"72%",l:"Goal",c:"bg-white"}].map((s,i) => (
            <div key={i} className={`${s.c} rounded-xl p-3 text-center shadow-sm`}>
              <p className="text-lg font-bold text-[#1a1a2e]">{s.v}</p>
              <p className="text-[9px] text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#1a1a2e]" /><span className="text-sm">Messages</span></div>
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-gray-100 last:border-0 text-gray-700">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 61: Progress Ring ───
export function Design61() {
  return (
    <div className="min-h-full bg-[#f2f2f7] p-4 pt-6 pb-8">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset="27.3" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><p className="text-sm font-bold text-[#1a1a2e]">72%</p></div>
        </div>
        <div><p className="text-lg font-bold text-[#1a1a2e]">Weekly Goal</p><p className="text-xs text-gray-500">£420 / £580 target</p></div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase text-gray-400">Next Up</p>
          <p className="font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-2 w-full py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start Lesson</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-[#1a1a2e]">4</p><p className="text-[9px] text-gray-400">Lessons today</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xl font-bold text-emerald-600">£140</p><p className="text-[9px] text-gray-400">Earned</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#1a1a2e]" /><span className="text-sm">2 unread</span></div>
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-gray-100 last:border-0">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 62: Stacked Cards ───
export function Design62() {
  return (
    <div className="min-h-full bg-[#1a1a2e] p-4 pt-6 pb-8">
      <div className="flex items-center justify-between text-white mb-4">
        <div><p className="text-lg font-bold">Dashboard</p><p className="text-[10px] text-white/40">Wednesday</p></div>
        <Bell className="h-5 w-5 text-white/50" />
      </div>
      <div className="space-y-2">
        {[
          <div className="flex items-center justify-between"><div><p className="text-white/50 text-[10px]">EARNINGS</p><p className="text-2xl font-bold text-white">£140</p></div><div className="text-right"><p className="text-white/50 text-[10px]">GOAL</p><p className="text-lg font-bold text-emerald-400">72%</p></div></div>,
          <div><p className="text-white/50 text-[10px]">NEXT LESSON</p><div className="flex items-center gap-3 mt-1"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><User className="h-4 w-4 text-white/70" /></div><div><p className="text-sm font-bold text-white">{PUPIL}</p><p className="text-[10px] text-white/50">{STATS.nextTime} · {LOCATION}</p></div></div></div>,
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-cyan-400" /><span className="text-sm text-white">Messages</span></div><span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span></div>,
          <div><p className="text-white/50 text-[10px] mb-1">SCHEDULE</p>{SCHEDULE.map((s,i) => <p key={i} className="text-xs text-white/70 py-1 border-b border-white/5 last:border-0">{s}</p>)}</div>,
        ].map((content, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">{content}</div>
        ))}
        <div className="grid grid-cols-4 gap-2 mt-1">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><a.icon className="h-5 w-5 text-white/40" /></div>
              <span className="text-[9px] text-white/30">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 63: Duotone Header ───
export function Design63() {
  return (
    <div className="min-h-full bg-white pb-8">
      <div className="bg-[#1a1a2e] px-4 pt-4 pb-6">
        <div className="flex items-center justify-between text-white">
          <p className="text-lg font-bold">Every Driver</p>
          <div className="flex gap-2">
            <div className="relative"><Mail className="h-5 w-5 text-white/70" /><span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-[#1a1a2e]" /></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[{v:"4",l:"Lessons"},{v:"£140",l:"Earned"},{v:"72%",l:"Goal"}].map((s,i) => (
            <div key={i} className="text-center text-white">
              <p className="text-xl font-bold">{s.v}</p>
              <p className="text-[9px] text-white/40">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 -mt-3 space-y-3">
        <div className="bg-white rounded-2xl shadow-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center"><User className="h-5 w-5 text-[#1a1a2e]" /></div>
            <div><p className="font-bold">{PUPIL}</p><p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION} · in 25 min</p></div>
          </div>
          <button className="w-full mt-3 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start Lesson</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-3 border">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <div className="w-1 h-4 rounded-full bg-[#1a1a2e]/20" />
              <span className="text-xs">{s}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-2xl bg-[#1a1a2e]/5 flex items-center justify-center"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] uppercase text-gray-400">Tomorrow</p>
          <p className="text-sm mt-1">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── 64: Color Block Rows ───
export function Design64() {
  return (
    <div className="min-h-full bg-[#f2f2f7] pb-8">
      <div className="bg-[#1a1a2e] px-4 py-3 text-white"><p className="text-lg font-bold">Today</p></div>
      <div className="bg-emerald-500 px-4 py-3 text-white flex items-center justify-between">
        <div><p className="text-xl font-bold">£{STATS.earnings}</p><p className="text-[10px] text-white/70">earned today</p></div>
        <div className="text-right"><p className="text-lg font-bold">72%</p><p className="text-[10px] text-white/70">goal</p></div>
      </div>
      <div className="bg-sky-500 px-4 py-3 text-white">
        <p className="text-[10px] uppercase text-white/60">Next Lesson</p>
        <p className="font-bold">{PUPIL} · {STATS.nextTime}</p>
        <p className="text-xs text-white/70">{LOCATION}</p>
      </div>
      <div className="bg-rose-500 px-4 py-2 text-white flex items-center justify-between">
        <span className="text-sm font-medium">2 unread messages</span>
        <ChevronRight className="h-4 w-4" />
      </div>
      <div className="px-4 mt-3 space-y-2">
        <div className="bg-white rounded-xl p-3">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-gray-100 last:border-0">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 65: Tabbed Compact ───
export function Design65() {
  return (
    <div className="min-h-full bg-white pb-8">
      <div className="bg-[#1a1a2e] px-4 pt-4 pb-3 text-white">
        <p className="text-lg font-bold">Dashboard</p>
      </div>
      <div className="flex border-b">
        {["Overview","Schedule","Actions"].map((t,i) => (
          <button key={i} className={`flex-1 py-2.5 text-xs font-semibold ${i===0?"text-[#1a1a2e] border-b-2 border-[#1a1a2e]":"text-gray-400"}`}>{t}</button>
        ))}
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[{v:"4",l:"Lessons",c:"text-[#1a1a2e]"},{v:"£140",l:"Earned",c:"text-emerald-600"},{v:"72%",l:"Goal",c:"text-violet-600"}].map((s,i) => (
            <div key={i} className="text-center p-2">
              <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-[9px] text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-[10px] uppercase text-gray-400">Next</p>
          <p className="font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-2 w-full py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start</button>
        </div>
        <div className="border rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span className="text-sm">Messages</span></div>
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="border rounded-xl p-3">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b last:border-0">{s}</p>)}
        </div>
      </div>
    </div>
  );
}

// ─── 66: Circular Icons ───
export function Design66() {
  return (
    <div className="min-h-full bg-[#fafafa] p-4 pt-6 pb-8">
      <p className="text-xl font-bold text-[#1a1a2e]">Hi there 👋</p>
      <p className="text-xs text-gray-500">4 lessons · £140 · 72% goal</p>
      <div className="flex justify-around mt-5">
        {[{icon:Calendar,label:"Diary",c:"bg-sky-100 text-sky-600"},{icon:MessageSquare,label:"Msgs",c:"bg-rose-100 text-rose-600",badge:2},{icon:Navigation,label:"SatNav",c:"bg-emerald-100 text-emerald-600"},{icon:Car,label:"Vehicle",c:"bg-amber-100 text-amber-600"}].map((a,i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 relative">
            <div className={`w-14 h-14 rounded-full ${a.c} flex items-center justify-center`}><a.icon className="h-6 w-6" /></div>
            {a.badge && <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{a.badge}</span>}
            <span className="text-[10px] text-gray-500">{a.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] uppercase text-gray-400">Next Lesson</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center"><User className="h-5 w-5 text-[#1a1a2e]" /></div>
            <div><p className="font-bold">{PUPIL}</p><p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p></div>
          </div>
          <button className="w-full mt-3 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start</button>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-gray-100 last:border-0">{s}</p>)}
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] uppercase text-gray-400">Tomorrow</p>
          <p className="text-sm mt-1">3 lessons · £105</p>
        </div>
      </div>
    </div>
  );
}

// ─── 67: Split Metric ───
export function Design67() {
  return (
    <div className="min-h-full bg-[#f2f2f7] pb-8">
      <div className="grid grid-cols-2">
        <div className="bg-[#1a1a2e] px-4 py-5 text-white"><p className="text-3xl font-black">£140</p><p className="text-[9px] text-white/40 uppercase">Earned</p></div>
        <div className="bg-emerald-600 px-4 py-5 text-white"><p className="text-3xl font-black">72%</p><p className="text-[9px] text-white/60 uppercase">Goal</p></div>
      </div>
      <div className="px-4 mt-3 space-y-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase text-gray-400">Next Lesson</p>
          <p className="font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-gray-500">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-2 w-full py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start</button>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#1a1a2e]" /><span className="text-sm">2 unread</span></div>
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-gray-100 last:border-0">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 68: Neon Accents ───
export function Design68() {
  return (
    <div className="min-h-full bg-[#0a0a0f] text-white p-4 pt-6 pb-8">
      <p className="text-xl font-bold">Dashboard</p>
      <p className="text-xs text-white/30">Wednesday</p>
      <div className="mt-4 space-y-3">
        <div className="border border-cyan-500/30 rounded-xl p-4 bg-cyan-500/5">
          <p className="text-[10px] text-cyan-400 uppercase">Next</p>
          <p className="text-lg font-bold mt-1">{PUPIL}</p>
          <p className="text-xs text-white/50">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-2 px-4 py-1.5 bg-cyan-500 text-black rounded-lg text-xs font-bold">START</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{v:"4",l:"Lessons",c:"border-green-500/30 bg-green-500/5 text-green-400"},{v:"£140",l:"Earned",c:"border-yellow-500/30 bg-yellow-500/5 text-yellow-400"},{v:"72%",l:"Goal",c:"border-purple-500/30 bg-purple-500/5 text-purple-400"}].map((s,i) => (
            <div key={i} className={`border ${s.c} rounded-xl p-3 text-center`}>
              <p className="text-lg font-bold">{s.v}</p>
              <p className="text-[9px] text-white/30">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-red-400" /><span className="text-sm">2 messages</span></div>
          <span className="text-red-400 font-bold text-xs">2</span>
        </div>
        <div className="border border-white/10 rounded-xl p-3">
          <p className="text-[10px] uppercase text-white/30 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-white/5 last:border-0 text-white/60">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center"><a.icon className="h-5 w-5 text-white/30" /></div>
              <span className="text-[9px] text-white/20">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 69: Horizontal Scroll Cards ───
export function Design69() {
  return (
    <div className="min-h-full bg-[#f2f2f7] pb-8">
      <div className="bg-[#1a1a2e] px-4 pt-4 pb-3 text-white"><p className="text-lg font-bold">Today</p><p className="text-[10px] text-white/40">Wednesday · 4 lessons</p></div>
      <div className="flex gap-3 overflow-x-auto px-4 mt-3 scrollbar-hide pb-1">
        {[{v:"£140",l:"Earned",c:"bg-emerald-500"},{v:"72%",l:"Goal",c:"bg-violet-500"},{v:"4",l:"Lessons",c:"bg-sky-500"},{v:"2",l:"Messages",c:"bg-rose-500"}].map((s,i) => (
          <div key={i} className={`${s.c} rounded-xl p-3 text-white min-w-[100px] shrink-0 text-center`}>
            <p className="text-xl font-bold">{s.v}</p>
            <p className="text-[9px] text-white/60">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="px-4 mt-3 space-y-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-[10px] uppercase text-gray-400">Next</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-9 h-9 rounded-full bg-[#1a1a2e]/10 flex items-center justify-center"><User className="h-4 w-4 text-[#1a1a2e]" /></div>
            <div><p className="font-semibold text-sm">{PUPIL}</p><p className="text-[10px] text-gray-500">{STATS.nextTime} · {LOCATION}</p></div>
          </div>
          <button className="w-full mt-3 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start Lesson</button>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-[10px] uppercase text-gray-400 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-xs py-1.5 border-b border-gray-100 last:border-0">{s}</p>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><a.icon className="h-5 w-5 text-[#1a1a2e]/50" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 70: Big Typography ───
export function Design70() {
  return (
    <div className="min-h-full bg-white p-4 pt-6 pb-8">
      <p className="text-4xl font-black text-[#1a1a2e] leading-none">£140</p>
      <p className="text-sm text-gray-400 mt-1">4 lessons · 72% goal · Wed</p>
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-300 mb-1">Next</p>
          <p className="text-xl font-bold text-[#1a1a2e]">{PUPIL}</p>
          <p className="text-sm text-gray-500">{STATS.nextTime} · {LOCATION}</p>
          <button className="mt-2 px-5 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-medium">Start Lesson →</button>
        </div>
        <div className="h-px bg-gray-100" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-300 mb-1">Messages</p>
          <p className="text-lg font-bold text-[#1a1a2e]">2 unread</p>
        </div>
        <div className="h-px bg-gray-100" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-300 mb-2">Schedule</p>
          {SCHEDULE.map((s,i) => <p key={i} className="text-sm py-1.5 border-b border-gray-50 last:border-0 text-gray-700">{s}</p>)}
        </div>
        <div className="h-px bg-gray-100" />
        <div className="grid grid-cols-4 gap-3">
          {ACTIONS.map((a,i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center"><a.icon className="h-5 w-5 text-gray-400" /></div>
              <span className="text-[9px] text-gray-400">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
