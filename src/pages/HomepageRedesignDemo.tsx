import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, PoundSterling, MessageSquare, Calendar, Users, Briefcase,
  BookOpen, MapPin, Settings, ChevronRight, Clock, Play, Navigation,
  CheckCircle, Target, TrendingUp, Sparkles, Bell, Sun, Fuel,
  Award, Heart, ListTodo, BarChart3, Timer,
} from "lucide-react";

// ─── Shared mock data ───
const MOCK_INSTRUCTOR = { name: "James", initials: "JM" };
const MOCK_NEXT = { pupil: "Sarah Mitchell", time: "10:30 AM", location: "High St, Bristol", duration: "2hr", type: "Standard" };
const MOCK_STATS = { lessons: 4, earned: 156, hours: 6.5, completed: 2 };
const MOCK_LESSONS = [
  { time: "10:30", pupil: "Sarah M.", type: "Standard", done: false },
  { time: "13:00", pupil: "Jake T.", type: "Motorway", done: false },
  { time: "15:30", pupil: "Emma W.", type: "Test Prep", done: false },
  { time: "17:00", pupil: "Tom R.", type: "Standard", done: false },
];

// ─── Phone Frame ───
function PhoneFrame({ children, label, selected, onClick }: {
  children: React.ReactNode; label: string; selected?: boolean; onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button onClick={onClick} className="focus:outline-none group">
        <div className={`relative w-[320px] h-[640px] rounded-[40px] overflow-hidden shadow-2xl transition-all duration-300 ${
          selected ? "ring-4 ring-primary scale-[1.02]" : "ring-1 ring-border/30 group-hover:ring-2 group-hover:ring-primary/40"
        }`}>
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-2xl z-30" />
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-[44px] z-20 flex items-end justify-between px-8 pb-1">
            <span className="text-[10px] font-semibold text-white/90">9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-2 rounded-sm border border-white/60 relative">
                <div className="absolute inset-[1px] right-[3px] bg-white/80 rounded-[1px]" />
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="h-full overflow-y-auto scrollbar-hide">
            {children}
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-black/20 rounded-full z-30" />
        </div>
      </button>
      <div className="text-center">
        <p className={`text-sm font-semibold transition-colors ${selected ? "text-primary" : "text-foreground"}`}>{label}</p>
        {selected && <span className="text-[10px] text-primary font-medium">✓ Selected</span>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// CONCEPT 1: Command Centre
// ──────────────────────────────────────
function CommandCentre() {
  const progress = (MOCK_STATS.completed / MOCK_STATS.lessons) * 100;
  return (
    <div className="min-h-full" style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E293B 40%, #F1F5F9 40.5%)" }}>
      {/* Dark hero */}
      <div className="pt-[52px] px-5 pb-8">
        <p className="text-white/50 text-[11px] font-medium">GOOD MORNING</p>
        <h1 className="text-white text-[22px] font-bold mt-0.5">{MOCK_INSTRUCTOR.name}</h1>
        
        {/* Progress ring */}
        <div className="flex items-center justify-center mt-5">
          <div className="relative w-[120px] h-[120px]">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#3B82F6" strokeWidth="8"
                strokeDasharray={`${progress * 3.267} 326.7`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-[28px] font-bold">{MOCK_STATS.completed}/{MOCK_STATS.lessons}</span>
              <span className="text-white/50 text-[10px]">lessons today</span>
            </div>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex justify-between mt-5 gap-2">
          {[
            { label: "Earned", value: `£${MOCK_STATS.earned}`, color: "#22C55E" },
            { label: "Hours", value: `${MOCK_STATS.hours}h`, color: "#3B82F6" },
            { label: "Messages", value: "3", color: "#F59E0B" },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/5 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-[10px] text-white/40">{s.label}</p>
              <p className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Light feed section */}
      <div className="px-4 pt-4 pb-20 space-y-3">
        {/* Next up */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Next Up</span>
            <span className="text-[10px] text-slate-400">{MOCK_NEXT.time}</span>
          </div>
          <p className="text-[15px] font-semibold text-slate-900">{MOCK_NEXT.pupil}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{MOCK_NEXT.type} • {MOCK_NEXT.duration}</p>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-blue-600 text-white text-[12px] font-semibold py-2 rounded-xl flex items-center justify-center gap-1">
              <Navigation className="h-3.5 w-3.5" /> Navigate
            </button>
            <button className="flex-1 bg-slate-100 text-slate-700 text-[12px] font-semibold py-2 rounded-xl flex items-center justify-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </button>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Today's Schedule</p>
          {MOCK_LESSONS.map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <span className="text-[12px] font-mono text-slate-400 w-[40px]">{l.time}</span>
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-slate-800">{l.pupil}</p>
                <p className="text-[10px] text-slate-400">{l.type}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Smart nudge */}
        <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3.5 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-amber-900">Gap at 12:00 — fill it?</p>
            <p className="text-[10px] text-amber-700/70">3 pupils nearby could book</p>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400" />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// CONCEPT 2: Widgets Board (iOS style)
// ──────────────────────────────────────
function WidgetsBoard() {
  return (
    <div className="min-h-full bg-[#F2F2F7] pt-[52px] px-4 pb-20">
      {/* Greeting */}
      <div className="mb-4">
        <p className="text-[13px] text-[#8E8E93]">Friday, 7 March</p>
        <h1 className="text-[26px] font-bold text-[#1C1C1E]">Good morning, {MOCK_INSTRUCTOR.name}</h1>
      </div>

      {/* Grid of widgets */}
      <div className="grid grid-cols-2 gap-3">
        {/* Large next lesson widget - full width */}
        <div className="col-span-2 bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Car className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#8E8E93] uppercase">Next Lesson</p>
              <p className="text-[14px] font-semibold text-[#1C1C1E]">{MOCK_NEXT.time}</p>
            </div>
          </div>
          <p className="text-[16px] font-semibold text-[#1C1C1E]">{MOCK_NEXT.pupil}</p>
          <p className="text-[12px] text-[#8E8E93]">{MOCK_NEXT.location}</p>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-[#007AFF] text-white text-[12px] font-semibold py-2.5 rounded-[14px]">Start</button>
            <button className="flex-1 bg-[#F2F2F7] text-[#007AFF] text-[12px] font-semibold py-2.5 rounded-[14px]">Navigate</button>
          </div>
        </div>

        {/* Small stat widgets */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <PoundSterling className="h-5 w-5 text-[#34C759] mb-2" />
          <p className="text-[22px] font-bold text-[#1C1C1E]">£{MOCK_STATS.earned}</p>
          <p className="text-[11px] text-[#8E8E93]">Today's earnings</p>
        </div>
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <BookOpen className="h-5 w-5 text-[#007AFF] mb-2" />
          <p className="text-[22px] font-bold text-[#1C1C1E]">{MOCK_STATS.lessons}</p>
          <p className="text-[11px] text-[#8E8E93]">Lessons today</p>
        </div>

        {/* Messages widget */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <MessageSquare className="h-5 w-5 text-[#FF9500] mb-2" />
          <p className="text-[22px] font-bold text-[#1C1C1E]">3</p>
          <p className="text-[11px] text-[#8E8E93]">Unread messages</p>
        </div>
        {/* Weekly progress */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <Target className="h-5 w-5 text-[#FF3B30] mb-2" />
          <p className="text-[22px] font-bold text-[#1C1C1E]">72%</p>
          <p className="text-[11px] text-[#8E8E93]">Weekly goal</p>
        </div>

        {/* Schedule widget - full width */}
        <div className="col-span-2 bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-3">Schedule</p>
          {MOCK_LESSONS.map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#F2F2F7] last:border-0">
              <span className="text-[12px] font-medium text-[#8E8E93] w-[42px]">{l.time}</span>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#1C1C1E]">{l.pupil}</p>
              </div>
              <span className="text-[10px] bg-[#F2F2F7] text-[#8E8E93] px-2 py-0.5 rounded-full">{l.type}</span>
            </div>
          ))}
        </div>

        {/* Quick actions row - full width */}
        <div className="col-span-2 bg-white rounded-[20px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Calendar, label: "Schedule", color: "#FF3B30" },
              { icon: Users, label: "Pupils", color: "#5856D6" },
              { icon: PoundSterling, label: "Payments", color: "#34C759" },
              { icon: Settings, label: "Settings", color: "#8E8E93" },
            ].map(a => (
              <div key={a.label} className="flex flex-col items-center gap-1.5">
                <div className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center" style={{ backgroundColor: a.color + "15" }}>
                  <a.icon className="h-5 w-5" style={{ color: a.color }} />
                </div>
                <span className="text-[10px] text-[#8E8E93]">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// CONCEPT 3: Stories + Feed
// ──────────────────────────────────────
function StoriesFeed() {
  const stories = [
    { name: "Sarah", color: "#3B82F6", alert: true },
    { name: "Jake", color: "#10B981", alert: false },
    { name: "Emma", color: "#8B5CF6", alert: true },
    { name: "Tom", color: "#F59E0B", alert: false },
    { name: "Lucy", color: "#EC4899", alert: false },
  ];
  return (
    <div className="min-h-full bg-white pt-[52px] pb-20">
      {/* Header */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#1C1C1E]">Home</h1>
          <p className="text-[12px] text-[#8E8E93]">4 lessons today • £156 expected</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <span className="text-white text-[13px] font-bold">{MOCK_INSTRUCTOR.initials}</span>
        </div>
      </div>

      {/* Stories row */}
      <div className="px-4 py-3 flex gap-4 overflow-x-auto scrollbar-hide border-b border-[#F2F2F7]">
        {stories.map(s => (
          <div key={s.name} className="flex flex-col items-center gap-1 shrink-0">
            <div className={`w-[56px] h-[56px] rounded-full p-[2px] ${s.alert ? "bg-gradient-to-br from-blue-500 to-purple-500" : "bg-[#E5E5EA]"}`}>
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="text-[14px] font-bold" style={{ color: s.color }}>{s.name[0]}</span>
              </div>
            </div>
            <span className="text-[10px] text-[#8E8E93]">{s.name}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-[56px] h-[56px] rounded-full border-2 border-dashed border-[#C7C7CC] flex items-center justify-center">
            <span className="text-[20px] text-[#C7C7CC]">+</span>
          </div>
          <span className="text-[10px] text-[#8E8E93]">Add</span>
        </div>
      </div>

      {/* Feed cards */}
      <div className="px-4 pt-4 space-y-3">
        {/* Now playing / Next up */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-1.5 mb-2">
            <Play className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Up Next</span>
          </div>
          <p className="text-[17px] font-bold">{MOCK_NEXT.pupil}</p>
          <p className="text-[12px] opacity-80 mt-0.5">{MOCK_NEXT.time} • {MOCK_NEXT.location}</p>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-white/20 backdrop-blur text-white text-[12px] font-semibold py-2 rounded-xl">Navigate</button>
            <button className="flex-1 bg-white text-blue-600 text-[12px] font-semibold py-2 rounded-xl">Start</button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-2">
          {[
            { icon: PoundSterling, value: `£${MOCK_STATS.earned}`, label: "Earned", bg: "#F0FDF4", color: "#16A34A" },
            { icon: Clock, value: `${MOCK_STATS.hours}h`, label: "Hours", bg: "#EFF6FF", color: "#2563EB" },
            { icon: Target, value: "72%", label: "Goal", bg: "#FFF7ED", color: "#EA580C" },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-2xl p-3" style={{ backgroundColor: s.bg }}>
              <s.icon className="h-4 w-4 mb-1" style={{ color: s.color }} />
              <p className="text-[16px] font-bold text-[#1C1C1E]">{s.value}</p>
              <p className="text-[10px]" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Lesson feed */}
        <div className="bg-[#F9FAFB] rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#F2F2F7]">
            <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">Today's Lessons</p>
          </div>
          {MOCK_LESSONS.map((l, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#F2F2F7] last:border-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-[12px] font-bold text-blue-600">{l.pupil.split(" ").map(w => w[0]).join("")}</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#1C1C1E]">{l.pupil}</p>
                <p className="text-[11px] text-[#8E8E93]">{l.time} • {l.type}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#C7C7CC]" />
            </div>
          ))}
        </div>

        {/* Nudge */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-purple-900">Jake hasn't booked in 3 weeks</p>
            <p className="text-[10px] text-purple-600/70">Tap to send a check-in</p>
          </div>
          <ChevronRight className="h-4 w-4 text-purple-300" />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// CONCEPT 4: Notion-style Blocks
// ──────────────────────────────────────
function NotionBlocks() {
  return (
    <div className="min-h-full bg-[#FAFAFA] pt-[52px] px-5 pb-20">
      {/* Minimal header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Today</h1>
          <p className="text-[13px] text-[#86868B]">Fri 7 Mar • 4 lessons</p>
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 rounded-full bg-[#F2F2F7] flex items-center justify-center">
            <Bell className="h-4 w-4 text-[#8E8E93]" />
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1C1C1E] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">{MOCK_INSTRUCTOR.initials}</span>
          </div>
        </div>
      </div>

      {/* Stats blocks */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-[16px] p-3 border border-[#E5E5EA]/50">
          <p className="text-[10px] text-[#86868B] mb-0.5">Earned</p>
          <p className="text-[20px] font-bold text-[#1C1C1E]">£{MOCK_STATS.earned}</p>
        </div>
        <div className="bg-white rounded-[16px] p-3 border border-[#E5E5EA]/50">
          <p className="text-[10px] text-[#86868B] mb-0.5">Hours</p>
          <p className="text-[20px] font-bold text-[#1C1C1E]">{MOCK_STATS.hours}</p>
        </div>
        <div className="bg-white rounded-[16px] p-3 border border-[#E5E5EA]/50">
          <p className="text-[10px] text-[#86868B] mb-0.5">Goal</p>
          <p className="text-[20px] font-bold text-[#1C1C1E]">72%</p>
        </div>
      </div>

      {/* Focus block - Next lesson */}
      <div className="bg-white rounded-[16px] p-4 mb-3 border border-[#E5E5EA]/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-blue-500" />
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Focus</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-blue-50 flex items-center justify-center">
            <Car className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-[#1C1C1E]">{MOCK_NEXT.pupil}</p>
            <p className="text-[12px] text-[#86868B]">{MOCK_NEXT.time} • {MOCK_NEXT.type}</p>
          </div>
          <button className="bg-[#1C1C1E] text-white text-[11px] font-semibold px-4 py-2 rounded-[10px]">Go</button>
        </div>
      </div>

      {/* Schedule block */}
      <div className="bg-white rounded-[16px] p-4 mb-3 border border-[#E5E5EA]/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-orange-400" />
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Schedule</span>
        </div>
        <div className="space-y-0">
          {MOCK_LESSONS.map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#F2F2F7] last:border-0">
              <div className="w-8 h-8 rounded-[10px] bg-[#F2F2F7] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#8E8E93]">{l.pupil.split(" ").map(w => w[0]).join("")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1C1C1E]">{l.pupil}</p>
                <p className="text-[11px] text-[#86868B]">{l.time}</p>
              </div>
              <span className="text-[10px] text-[#86868B] bg-[#F2F2F7] px-2 py-0.5 rounded-md">{l.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links block */}
      <div className="bg-white rounded-[16px] p-4 mb-3 border border-[#E5E5EA]/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Quick Links</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Calendar, label: "Schedule" },
            { icon: Users, label: "Pupils" },
            { icon: PoundSterling, label: "Payments" },
            { icon: MessageSquare, label: "Messages" },
            { icon: Briefcase, label: "Jobs" },
            { icon: Settings, label: "Settings" },
          ].map(q => (
            <div key={q.label} className="flex items-center gap-2.5 py-2 px-2.5 rounded-[10px] hover:bg-[#F9F9F9]">
              <q.icon className="h-4 w-4 text-[#86868B]" />
              <span className="text-[13px] text-[#1C1C1E]">{q.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight nudge */}
      <div className="bg-[#FEF9C3] rounded-[16px] p-3.5 flex items-center gap-3 border border-[#FDE68A]/50">
        <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="flex-1">
          <p className="text-[12px] font-medium text-amber-900">You're 28% ahead of last week</p>
          <p className="text-[10px] text-amber-700/70">Keep it up — 3 more lessons to hit your goal</p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// DEMO PAGE
// ──────────────────────────────────────
export default function HomepageRedesignDemo() {
  const [selected, setSelected] = useState<number | null>(null);

  const concepts = [
    { label: "Command Centre", component: <CommandCentre /> },
    { label: "iOS Widgets", component: <WidgetsBoard /> },
    { label: "Stories + Feed", component: <StoriesFeed /> },
    { label: "Notion Blocks", component: <NotionBlocks /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Homepage Redesign Concepts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tap a design to select it. All keep current functionality with an iOS-native aesthetic.</p>
      </div>

      {/* Concepts grid */}
      <div className="px-6 py-8">
        <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
          {concepts.map((c, i) => (
            <div key={i} className="snap-center shrink-0">
              <PhoneFrame
                label={c.label}
                selected={selected === i}
                onClick={() => setSelected(i)}
              >
                {c.component}
              </PhoneFrame>
            </div>
          ))}
        </div>
      </div>

      {/* Selection indicator */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">{concepts[selected].label} selected</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
