import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, PoundSterling, MapPin, ChevronRight, ArrowLeft, ArrowRight,
  MessageSquare, Briefcase, Bell, Sun, Trophy, Flame, Star, Zap, Award,
  Target, TrendingUp, Calendar, User, Heart, CheckCircle,
  CloudSun, BookOpen, Navigation, Car, Receipt, Settings, ListTodo, Users,
  CreditCard, Phone, Wallet, Route, Shield, Gauge, Timer, Gift,
  Sparkles, BarChart3, Compass, Mic, Globe, Eye, Activity, Layers,
  Smartphone, WifiOff, BatteryCharging, CircleDot, Gem, Crown, Rocket,
  Search, Grid3X3, Lock, Focus, FolderOpen, BellRing, Newspaper,
  Wand2, HeartPulse, Map, CreditCard as WalletIcon, Pencil,
  Play, Pause, SkipForward, SkipBack, Volume2, Music,
  Repeat, Shuffle, FileText, Send, Cpu, Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/calendar-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import trackIcon from "@/assets/track-icon.png";
import satnavIcon from "@/assets/satnav-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import availabilityIcon from "@/assets/availability-icon.png";
import healthHubIcon from "@/assets/health-hub-icon.png";
import findFuelIcon from "@/assets/find-fuel-icon.png";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";
import expensesIcon from "@/assets/expenses-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import settingsIcon from "@/assets/settings-icon.png";

const customIconImages: Record<string, string> = {
  messages: messagesIcon, "take-payment": takePaymentIcon, payments: paymentsIcon,
  schedule: scheduleIcon, pupils: pupilsIcon, "track-lesson": trackIcon,
  satnav: satnavIcon, "find-my-car": findMyCarIcon, jobs: jobOffersIcon,
  availability: availabilityIcon, "health-hub": healthHubIcon, "find-fuel": findFuelIcon,
  "vehicle-health": vehicleHealthIcon, expenses: expensesIcon, todos: todoIcon,
  settings: settingsIcon,
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Users, Briefcase, CreditCard, Clock, Settings, Car, Receipt,
  Navigation, Award, MapPin, MessageSquare, Heart, ListTodo,
};

const BG = "#f2f2f7";
const CARD = "#ffffff";
const SEP = "#c6c6c8";
const BLUE = "#007AFF";
const GREEN = "#34C759";
const ORANGE = "#FF9500";
const RED = "#FF3B30";
const PURPLE = "#AF52DE";
const TEAL = "#5AC8FA";
const INDIGO = "#5856D6";
const PINK = "#FF2D55";
const MINT = "#00C7BE";
const CYAN = "#32ADE6";
const BROWN = "#A2845E";
const YELLOW = "#FFCC00";

const mock = {
  name: "Kenneth", initials: "KM",
  lessons: 4, hours: 6, earnings: 240,
  weeklyHours: 13.5, weeklyGoal: 30, weeklyPercent: 45, weeklyEarnings: 540,
  nextPupil: "Sarah Johnson", nextTime: "10:30", nextPostcode: "SW1A 1AA", nextMinutes: 25, nextDuration: "2hr",
  unread: 3, pendingJobs: 2,
  passRate: 87, totalPasses: 142, streak: 12,
  rating: 4.9, reviews: 67, pupils: 23,
  todayMiles: 48, fuelLevel: 62,
  timeline: [
    { time: "09:00", pupil: "Emma Wilson", done: true, postcode: "SE1 7PB", type: "Standard" },
    { time: "10:30", pupil: "Sarah Johnson", done: false, postcode: "SW1A 1AA", type: "Intensive" },
    { time: "13:00", pupil: "Jake Morris", done: false, postcode: "W1D 3QF", type: "Test Prep" },
    { time: "15:00", pupil: "Lucy Chen", done: false, postcode: "EC2R 8AH", type: "Standard" },
  ],
  quickActions: [
    { id: "schedule", title: "Schedule", icon: "Calendar" },
    { id: "pupils", title: "Pupils", icon: "Users" },
    { id: "take-payment", title: "Take Payment", icon: "CreditCard" },
    { id: "track-lesson", title: "Track Lesson", icon: "Navigation" },
    { id: "jobs", title: "Job Offers", icon: "Briefcase" },
    { id: "satnav", title: "Sat Nav", icon: "Navigation" },
    { id: "payments", title: "Payments", icon: "CreditCard" },
    { id: "messages", title: "Messages", icon: "MessageSquare" },
    { id: "todos", title: "To Do", icon: "ListTodo" },
    { id: "vehicle-health", title: "Vehicle", icon: "Car" },
    { id: "find-fuel", title: "Find Fuel", icon: "Car" },
    { id: "find-my-car", title: "Find Car", icon: "Car" },
    { id: "health-hub", title: "Health Hub", icon: "Heart" },
    { id: "availability", title: "Availability", icon: "Clock" },
    { id: "expenses", title: "Expenses", icon: "Receipt" },
    { id: "settings", title: "Settings", icon: "Settings" },
  ],
};

const greeting = (() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Hello";
})();

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-4 rounded-[14px] overflow-hidden ${className}`} style={{ backgroundColor: CARD }}>
    {children}
  </div>
);

const Row = ({ left, title, subtitle, right, last = false }: { left?: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode; last?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-[11px] ${!last ? "border-b" : ""}`} style={{ borderColor: SEP + "40" }}>
    {left}
    <div className="flex-1 min-w-0">
      <p className="text-[15px] text-[#1c1c1e] truncate">{title}</p>
      {subtitle && <p className="text-[13px] text-[#8e8e93] truncate">{subtitle}</p>}
    </div>
    {right || <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />}
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[13px] font-normal text-[#6d6d72] uppercase px-5 pt-5 pb-[6px]">{children}</p>
);

const IconGrid = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-5 py-3">
    {mock.quickActions.slice(0, count).map(a => {
      const img = customIconImages[a.id];
      const badge = a.id === "messages" ? mock.unread : a.id === "jobs" ? mock.pendingJobs : 0;
      return (
        <div key={a.id} className="flex flex-col items-center gap-1">
          <div className="relative w-[52px] h-[52px] rounded-[12px] overflow-hidden shadow-sm" style={{ backgroundColor: img ? undefined : "#e5e5ea" }}>
            {img ? <img src={img} alt={a.title} className="w-full h-full object-cover" /> : (() => { const I = iconMap[a.icon] || Calendar; return <div className="w-full h-full flex items-center justify-center"><I className="h-6 w-6 text-[#8e8e93]" /></div>; })()}
            {badge > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: RED }}>{badge}</span>}
          </div>
          <span className="text-[10px] text-[#3c3c43] text-center leading-tight">{a.title}</span>
        </div>
      );
    })}
  </div>
);

const Ring = ({ percent, size = 100, color = BLUE, thickness = 8 }: { percent: number; size?: number; color?: string; thickness?: number }) => {
  const r = (size - thickness - 2) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e5ea" strokeWidth={thickness} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeDasharray={c} strokeDashoffset={c - (percent / 100) * c} strokeLinecap="round" />
    </svg>
  );
};

const StatPill = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex-1 rounded-[10px] py-2.5 px-2 text-center" style={{ backgroundColor: color + "15" }}>
    <p className="text-[17px] font-bold" style={{ color }}>{value}</p>
    <p className="text-[10px] text-[#8e8e93] mt-0.5">{label}</p>
  </div>
);

// ═══════════════ 20 iOS DESIGNS — SET 3 ═══════════════

// 1 — Spotlight Search
function Design1() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-4 pt-6">
        <div className="rounded-[10px] px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: "#e5e5ea" }}>
          <Search className="h-4 w-4 text-[#8e8e93]" />
          <span className="text-[15px] text-[#8e8e93]">Search actions, pupils...</span>
        </div>
      </div>
      <SectionLabel>Siri Suggestions</SectionLabel>
      <Card>
        {[
          { icon: <Clock className="h-4 w-4 text-white" />, bg: BLUE, title: `Next: ${mock.nextPupil}`, sub: `${mock.nextTime} · ${mock.nextPostcode}` },
          { icon: <PoundSterling className="h-4 w-4 text-white" />, bg: GREEN, title: "Take Payment", sub: `£${mock.earnings} earned today` },
          { icon: <MessageSquare className="h-4 w-4 text-white" />, bg: ORANGE, title: "Messages", sub: `${mock.unread} unread` },
        ].map((item, i) => (
          <Row key={i} left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: item.bg }}>{item.icon}</div>} title={item.title} subtitle={item.sub} last={i === 2} />
        ))}
      </Card>
      <SectionLabel>All Apps</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 2 — Widget Board
function Design2() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[22px] font-bold text-[#1c1c1e]">{greeting}</p>
      <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
        {/* Small widget */}
        <div className="rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="h-3.5 w-3.5" style={{ color: RED }} />
            <span className="text-[11px] font-semibold text-[#8e8e93] uppercase">Schedule</span>
          </div>
          <p className="text-[28px] font-bold text-[#1c1c1e]">{mock.lessons}</p>
          <p className="text-[11px] text-[#8e8e93]">lessons today</p>
        </div>
        {/* Small widget */}
        <div className="rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center gap-1.5 mb-2">
            <PoundSterling className="h-3.5 w-3.5" style={{ color: GREEN }} />
            <span className="text-[11px] font-semibold text-[#8e8e93] uppercase">Earnings</span>
          </div>
          <p className="text-[28px] font-bold text-[#1c1c1e]">£{mock.earnings}</p>
          <p className="text-[11px] text-[#8e8e93]">today</p>
        </div>
        {/* Medium widget */}
        <div className="col-span-2 rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5" style={{ color: BLUE }} />
            <span className="text-[11px] font-semibold text-[#8e8e93] uppercase">Next Up</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[17px] font-semibold text-[#1c1c1e]">{mock.nextPupil}</p>
              <p className="text-[13px] text-[#8e8e93]">{mock.nextTime} · {mock.nextPostcode}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: BLUE }}>
              <Navigation className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        {/* Large widget */}
        <div className="col-span-2 rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="h-3.5 w-3.5" style={{ color: PURPLE }} />
            <span className="text-[11px] font-semibold text-[#8e8e93] uppercase">Weekly Goal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Ring percent={mock.weeklyPercent} size={70} color={PURPLE} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[14px] font-bold text-[#1c1c1e]">{mock.weeklyPercent}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[{ l: "Hours", v: `${mock.weeklyHours}/${mock.weeklyGoal}h`, c: PURPLE }, { l: "Earned", v: `£${mock.weeklyEarnings}`, c: GREEN }, { l: "Pass Rate", v: `${mock.passRate}%`, c: BLUE }].map(s => (
                <div key={s.l} className="flex justify-between text-[13px]">
                  <span className="text-[#8e8e93]">{s.l}</span>
                  <span className="font-medium" style={{ color: s.c }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3 — Lock Screen
function Design3() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="min-h-full pb-8 relative" style={{ background: "linear-gradient(180deg, #1a1a2e, #16213e, #0f3460)" }}>
      <div className="text-center pt-10 pb-6">
        <p className="text-[13px] text-white/60">{dateStr}</p>
        <p className="text-[72px] font-thin text-white tracking-tight leading-none mt-1">{timeStr}</p>
      </div>
      {/* Notification stack */}
      <div className="space-y-2 mx-4">
        {[
          { icon: <Clock className="h-4 w-4" />, app: "Schedule", title: mock.nextPupil, sub: `${mock.nextTime} · ${mock.nextPostcode}`, time: `${mock.nextMinutes}m` },
          { icon: <MessageSquare className="h-4 w-4" />, app: "Messages", title: `${mock.unread} new messages`, sub: "Tap to view", time: "5m" },
          { icon: <PoundSterling className="h-4 w-4" />, app: "Payments", title: `£${mock.earnings} earned`, sub: `${mock.lessons} lessons completed`, time: "1h" },
        ].map((n, i) => (
          <div key={i} className="rounded-[14px] p-3 backdrop-blur-xl" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-[5px] flex items-center justify-center" style={{ backgroundColor: BLUE }}>{n.icon}</div>
              <span className="text-[11px] font-semibold text-white/70 uppercase flex-1">{n.app}</span>
              <span className="text-[11px] text-white/40">{n.time}</span>
            </div>
            <p className="text-[14px] font-medium text-white">{n.title}</p>
            <p className="text-[12px] text-white/60">{n.sub}</p>
          </div>
        ))}
      </div>
      {/* Bottom quick actions */}
      <div className="flex justify-center gap-6 mt-8">
        <div className="w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          <Phone className="h-5 w-5 text-white" />
        </div>
        <div className="w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          <Navigation className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// 4 — Focus Mode
function Design4() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[14px] p-3 flex items-center gap-3" style={{ backgroundColor: INDIGO + "15" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: INDIGO }}>
          <Car className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold" style={{ color: INDIGO }}>Driving Focus</p>
          <p className="text-[11px] text-[#8e8e93]">Only essential info shown</p>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: INDIGO }} />
      </div>
      <Card className="mt-4">
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: BLUE }}><User className="h-4 w-4 text-white" /></div>} title={mock.nextPupil} subtitle={`${mock.nextTime} · ${mock.nextDuration}`} />
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: GREEN }}><Navigation className="h-4 w-4 text-white" /></div>} title={mock.nextPostcode} subtitle={`${mock.nextMinutes} min away`} />
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: ORANGE }}><Gauge className="h-4 w-4 text-white" /></div>} title="Fuel Level" subtitle={`${mock.fuelLevel}%`} last />
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <div className="grid grid-cols-4 gap-3 mx-4">
        {[
          { icon: <Navigation className="h-5 w-5" />, label: "Navigate", bg: BLUE },
          { icon: <Phone className="h-5 w-5" />, label: "Call", bg: GREEN },
          { icon: <MessageSquare className="h-5 w-5" />, label: "Message", bg: ORANGE },
          { icon: <Car className="h-5 w-5" />, label: "Track", bg: PURPLE },
        ].map(a => (
          <div key={a.label} className="flex flex-col items-center gap-1.5">
            <div className="w-[52px] h-[52px] rounded-[12px] flex items-center justify-center text-white" style={{ backgroundColor: a.bg }}>{a.icon}</div>
            <span className="text-[10px] text-[#3c3c43]">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5 — App Library
function Design5() {
  const categories = [
    { name: "Teaching", color: BLUE, items: ["schedule", "pupils", "track-lesson", "satnav"] },
    { name: "Finance", color: GREEN, items: ["take-payment", "payments", "expenses", "todos"] },
    { name: "Vehicle", color: ORANGE, items: ["vehicle-health", "find-fuel", "find-my-car", "satnav"] },
    { name: "Admin", color: PURPLE, items: ["messages", "jobs", "availability", "settings"] },
  ];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-4 pt-6 mb-2">
        <div className="rounded-[10px] px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "#e5e5ea" }}>
          <Search className="h-4 w-4 text-[#8e8e93]" />
          <span className="text-[15px] text-[#8e8e93]">App Library</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
        {categories.map(cat => (
          <div key={cat.name} className="rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
            <p className="text-[13px] font-semibold text-[#1c1c1e] mb-2">{cat.name}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {cat.items.map(id => {
                const img = customIconImages[id];
                return (
                  <div key={id} className="w-[40px] h-[40px] rounded-[10px] overflow-hidden" style={{ backgroundColor: img ? undefined : cat.color + "20" }}>
                    {img ? <img src={img} alt={id} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FolderOpen className="h-4 w-4" style={{ color: cat.color }} /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6 — Stacked Notifications
function Design6() {
  const groups = [
    { title: "Lessons", color: BLUE, icon: <Calendar className="h-3.5 w-3.5 text-white" />, count: mock.lessons, items: mock.timeline.slice(0, 2).map(t => ({ title: t.pupil, sub: `${t.time} · ${t.type}` })) },
    { title: "Payments", color: GREEN, icon: <PoundSterling className="h-3.5 w-3.5 text-white" />, count: 2, items: [{ title: "Payment received", sub: "£60 from Emma Wilson" }, { title: "Payment pending", sub: "£120 from Jake Morris" }] },
    { title: "Messages", color: ORANGE, icon: <MessageSquare className="h-3.5 w-3.5 text-white" />, count: mock.unread, items: [{ title: "Sarah Johnson", sub: "Can we move to 11am?" }, { title: "Lucy Chen", sub: "See you Thursday!" }] },
  ];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[22px] font-bold text-[#1c1c1e]">Notifications</p>
      <div className="space-y-3 mx-4 mt-4">
        {groups.map(g => (
          <div key={g.title} className="rounded-[14px] overflow-hidden" style={{ backgroundColor: CARD }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: SEP + "40" }}>
              <div className="w-5 h-5 rounded-[5px] flex items-center justify-center" style={{ backgroundColor: g.color }}>{g.icon}</div>
              <span className="text-[13px] font-semibold text-[#1c1c1e] flex-1">{g.title}</span>
              <span className="text-[12px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: g.color }}>{g.count}</span>
            </div>
            {g.items.map((item, i) => (
              <div key={i} className={`px-3 py-2.5 ${i < g.items.length - 1 ? "border-b" : ""}`} style={{ borderColor: SEP + "40" }}>
                <p className="text-[14px] text-[#1c1c1e]">{item.title}</p>
                <p className="text-[12px] text-[#8e8e93]">{item.sub}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// 7 — Today View
function Design7() {
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-5 pt-6">
        <p className="text-[28px] font-bold text-[#1c1c1e]">Today</p>
        <p className="text-[13px] text-[#8e8e93]">{dateStr}</p>
      </div>
      {/* Weather widget */}
      <Card className="mt-4">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <CloudSun className="h-8 w-8" style={{ color: ORANGE }} />
            <div>
              <p className="text-[22px] font-bold text-[#1c1c1e]">14°</p>
              <p className="text-[12px] text-[#8e8e93]">Partly cloudy · Good for driving</p>
            </div>
          </div>
        </div>
      </Card>
      {/* Schedule widget */}
      <Card className="mt-3">
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <Calendar className="h-3.5 w-3.5" style={{ color: RED }} />
          <span className="text-[11px] font-semibold text-[#8e8e93] uppercase">Schedule</span>
        </div>
        {mock.timeline.slice(0, 3).map((t, i) => (
          <Row key={i} left={<span className="text-[13px] font-mono text-[#8e8e93] w-[42px]">{t.time}</span>} title={t.pupil} subtitle={t.type} last={i === 2} />
        ))}
      </Card>
      {/* Stats widget */}
      <Card className="mt-3">
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <BarChart3 className="h-3.5 w-3.5" style={{ color: BLUE }} />
          <span className="text-[11px] font-semibold text-[#8e8e93] uppercase">Stats</span>
        </div>
        <div className="flex px-3 pb-3 gap-3">
          {[{ l: "Lessons", v: mock.lessons, c: BLUE }, { l: "Hours", v: `${mock.hours}h`, c: GREEN }, { l: "Earned", v: `£${mock.earnings}`, c: ORANGE }].map(s => (
            <div key={s.l} className="flex-1 text-center">
              <p className="text-[20px] font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// 8 — Siri Suggestions
function Design8() {
  const suggestions = [
    { icon: <Navigation className="h-4 w-4 text-white" />, bg: BLUE, title: `Navigate to ${mock.nextPostcode}`, reason: "Based on your schedule" },
    { icon: <PoundSterling className="h-4 w-4 text-white" />, bg: GREEN, title: "Log payment from Emma", reason: "Lesson completed" },
    { icon: <MessageSquare className="h-4 w-4 text-white" />, bg: ORANGE, title: `Reply to Sarah`, reason: `${mock.unread} unread` },
    { icon: <FileText className="h-4 w-4 text-white" />, bg: PURPLE, title: "Update lesson notes", reason: "Emma Wilson's lesson" },
  ];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-5 pt-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: PURPLE }} />
        <p className="text-[22px] font-bold text-[#1c1c1e]">Suggested for You</p>
      </div>
      <div className="space-y-2 mx-4 mt-4">
        {suggestions.map((s, i) => (
          <div key={i} className="rounded-[12px] p-3 flex items-center gap-3" style={{ backgroundColor: CARD }}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: s.bg }}>{s.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#1c1c1e] truncate">{s.title}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.reason}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />
          </div>
        ))}
      </div>
      <SectionLabel>All Apps</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 9 — Health Dashboard
function Design9() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[28px] font-bold text-[#1c1c1e]">Summary</p>
      <div className="flex justify-center mt-4">
        <div className="relative w-[140px] h-[140px]">
          <div className="absolute inset-0"><Ring percent={mock.weeklyPercent} size={140} color={RED} thickness={12} /></div>
          <div className="absolute inset-[16px]"><Ring percent={70} size={108} color={GREEN} thickness={12} /></div>
          <div className="absolute inset-[32px]"><Ring percent={55} size={76} color={CYAN} thickness={12} /></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Activity className="h-5 w-5 text-[#8e8e93]" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 justify-center mt-3">
        <span className="flex items-center gap-1.5 text-[12px]"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: RED }} />Hours</span>
        <span className="flex items-center gap-1.5 text-[12px]"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: GREEN }} />Earnings</span>
        <span className="flex items-center gap-1.5 text-[12px]"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: CYAN }} />Pupils</span>
      </div>
      <div className="mx-4 mt-4 space-y-2">
        {[
          { title: "Teaching Hours", value: `${mock.weeklyHours}h`, sub: `of ${mock.weeklyGoal}h goal`, color: RED, icon: <Clock className="h-4 w-4" /> },
          { title: "Earnings", value: `£${mock.weeklyEarnings}`, sub: "this week", color: GREEN, icon: <PoundSterling className="h-4 w-4" /> },
          { title: "Active Pupils", value: `${mock.pupils}`, sub: `${mock.passRate}% pass rate`, color: CYAN, icon: <Users className="h-4 w-4" /> },
        ].map(card => (
          <div key={card.title} className="rounded-[14px] p-3 flex items-center gap-3" style={{ backgroundColor: CARD }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: card.color + "20", color: card.color }}>{card.icon}</div>
            <div className="flex-1">
              <p className="text-[13px] text-[#8e8e93]">{card.title}</p>
              <p className="text-[17px] font-bold text-[#1c1c1e]">{card.value}</p>
            </div>
            <span className="text-[12px] text-[#8e8e93]">{card.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 10 — Maps Card
function Design10() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[14px] overflow-hidden" style={{ backgroundColor: CARD }}>
        <div className="h-[130px] relative" style={{ background: "linear-gradient(160deg, #c8e6c9, #e8f5e9, #dcedc8, #b2dfdb)" }}>
          {/* Mock map elements */}
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[12px] font-semibold text-white" style={{ backgroundColor: BLUE }}>
            {mock.nextMinutes} min
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: RED }}>
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="mt-1 px-2 py-0.5 rounded bg-white/90 text-[10px] font-medium shadow-sm">{mock.nextPostcode}</div>
          </div>
          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 130">
            <path d="M40,100 Q170,20 300,60" fill="none" stroke={BLUE} strokeWidth="3" strokeDasharray="6,4" opacity="0.6" />
          </svg>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[17px] font-semibold text-[#1c1c1e]">{mock.nextPupil}</p>
              <p className="text-[13px] text-[#8e8e93]">{mock.nextTime} · {mock.nextDuration}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold text-white text-center" style={{ backgroundColor: BLUE }}>Directions</button>
            <button className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold text-center" style={{ backgroundColor: BLUE + "15", color: BLUE }}>Call</button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-3">
        <StatPill label="Lessons" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 11 — Wallet Pass
function Design11() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[16px] overflow-hidden shadow-lg" style={{ background: `linear-gradient(145deg, ${BLUE}, ${INDIGO})` }}>
        <div className="p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-wider opacity-60">Lesson Pass</span>
            <span className="text-[11px] opacity-60">EVERY DRIVER</span>
          </div>
          <p className="text-[24px] font-bold">{mock.nextPupil}</p>
          <div className="flex gap-6 mt-3 text-[13px]">
            <div>
              <p className="opacity-60 text-[10px] uppercase">Time</p>
              <p className="font-semibold">{mock.nextTime}</p>
            </div>
            <div>
              <p className="opacity-60 text-[10px] uppercase">Duration</p>
              <p className="font-semibold">{mock.nextDuration}</p>
            </div>
            <div>
              <p className="opacity-60 text-[10px] uppercase">Location</p>
              <p className="font-semibold">{mock.nextPostcode}</p>
            </div>
          </div>
        </div>
        {/* Barcode area */}
        <div className="bg-white/10 px-4 py-3 flex items-center justify-center">
          <div className="flex gap-[2px]">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="h-[28px] bg-white/80 rounded-sm" style={{ width: Math.random() > 0.5 ? 3 : 2 }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-4">
        <StatPill label="Today" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={GREEN} />
        <StatPill label="Pass Rate" value={`${mock.passRate}%`} color={PURPLE} />
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 12 — Journal Entry
function Design12() {
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-5 pt-6">
        <p className="text-[11px] text-[#8e8e93] uppercase tracking-wider">Daily Journal</p>
        <p className="text-[28px] font-bold text-[#1c1c1e]">{dateStr}</p>
      </div>
      <Card className="mt-4">
        <div className="p-4">
          {/* Photo placeholder */}
          <div className="h-[100px] rounded-[10px] flex items-center justify-center mb-3" style={{ background: `linear-gradient(135deg, ${BLUE}20, ${PURPLE}20)` }}>
            <div className="text-center">
              <Car className="h-8 w-8 mx-auto mb-1" style={{ color: BLUE + "80" }} />
              <p className="text-[11px] text-[#8e8e93]">Today's journey</p>
            </div>
          </div>
          <div className="flex gap-3 mb-3">
            {[{ l: "Lessons", v: mock.lessons, c: BLUE }, { l: "Hours", v: `${mock.hours}h`, c: GREEN }, { l: "Miles", v: mock.todayMiles, c: ORANGE }].map(s => (
              <div key={s.l} className="flex-1 rounded-[8px] py-2 text-center" style={{ backgroundColor: s.c + "10" }}>
                <p className="text-[15px] font-bold" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[10px] text-[#8e8e93]">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[10px] p-3" style={{ backgroundColor: BG }}>
            <p className="text-[13px] text-[#8e8e93] italic">How was your teaching day? Tap to add a reflection...</p>
          </div>
        </div>
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 13 — Action Button Menu
function Design13() {
  const actions = [
    { icon: <Navigation className="h-5 w-5" />, label: "Navigate", color: BLUE, angle: -60 },
    { icon: <PoundSterling className="h-5 w-5" />, label: "Payment", color: GREEN, angle: -30 },
    { icon: <Calendar className="h-5 w-5" />, label: "Schedule", color: ORANGE, angle: 0 },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Message", color: PURPLE, angle: 30 },
    { icon: <Car className="h-5 w-5" />, label: "Track", color: RED, angle: 60 },
  ];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="relative pt-6 pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: "#1c1c1e" }}>
            <Zap className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex justify-center gap-3 px-6">
          {actions.map(a => (
            <div key={a.label} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md" style={{ backgroundColor: a.color }}>{a.icon}</div>
              <span className="text-[10px] text-[#3c3c43]">{a.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-2">
        <StatPill label="Lessons" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
      <Card className="mt-3">
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: BLUE }}><Clock className="h-4 w-4 text-white" /></div>} title={mock.nextPupil} subtitle={`${mock.nextTime} · ${mock.nextPostcode}`} />
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: GREEN }}><Briefcase className="h-4 w-4 text-white" /></div>} title="Job Offers" subtitle={`${mock.pendingJobs} pending`} last />
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 14 — Standby Mode
function Design14() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="min-h-full pb-8" style={{ backgroundColor: "#000000" }}>
      <div className="grid grid-cols-2 gap-3 mx-4 pt-8">
        {/* Left panel: Clock */}
        <div className="rounded-[16px] p-4 flex flex-col items-center justify-center" style={{ backgroundColor: "#1c1c1e", minHeight: "200px" }}>
          <p className="text-[44px] font-thin text-white tracking-tight">{timeStr.split(":")[0]}</p>
          <p className="text-[44px] font-thin tracking-tight" style={{ color: ORANGE }}>{timeStr.split(":")[1]}</p>
          <p className="text-[11px] text-[#8e8e93] mt-2">{now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
        </div>
        {/* Right panel: Next lesson */}
        <div className="rounded-[16px] p-4 flex flex-col justify-center" style={{ backgroundColor: "#1c1c1e", minHeight: "200px" }}>
          <p className="text-[11px] text-[#8e8e93] uppercase mb-2">Next Up</p>
          <p className="text-[17px] font-semibold text-white">{mock.nextPupil}</p>
          <p className="text-[13px] text-[#8e8e93] mt-1">{mock.nextTime}</p>
          <p className="text-[13px] text-[#8e8e93]">{mock.nextPostcode}</p>
          <div className="mt-3 px-2.5 py-1 rounded-full self-start text-[11px] font-medium" style={{ backgroundColor: GREEN + "30", color: GREEN }}>
            In {mock.nextMinutes}min
          </div>
        </div>
      </div>
      {/* Bottom stats */}
      <div className="flex gap-2 mx-4 mt-4">
        {[{ l: "Lessons", v: mock.lessons, c: BLUE }, { l: "Hours", v: `${mock.hours}h`, c: GREEN }, { l: "Earned", v: `£${mock.earnings}`, c: ORANGE }].map(s => (
          <div key={s.l} className="flex-1 rounded-[12px] py-3 px-2 text-center" style={{ backgroundColor: "#1c1c1e" }}>
            <p className="text-[20px] font-bold" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px] text-[#8e8e93]">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 15 — Photo Memories
function Design15() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="h-[160px] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE}, ${PINK})` }}>
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <p className="text-[11px] text-white/60 uppercase tracking-wider">Memories</p>
          <p className="text-[28px] font-bold text-white">Your Week</p>
          <p className="text-[13px] text-white/70">{mock.weeklyHours}h taught · {mock.pupils} pupils · £{mock.weeklyEarnings} earned</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 mx-4 mt-4">
        {mock.timeline.map((t, i) => (
          <div key={i} className="aspect-square rounded-[10px] flex flex-col items-center justify-center" style={{ backgroundColor: [BLUE, GREEN, ORANGE, PURPLE][i % 4] + "15" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold mb-1" style={{ backgroundColor: [BLUE, GREEN, ORANGE, PURPLE][i % 4] }}>
              {t.pupil.split(" ").map(n => n[0]).join("")}
            </div>
            <p className="text-[10px] text-[#1c1c1e] font-medium">{t.pupil.split(" ")[0]}</p>
            <p className="text-[9px] text-[#8e8e93]">{t.time}</p>
          </div>
        ))}
        <div className="aspect-square rounded-[10px] flex flex-col items-center justify-center" style={{ backgroundColor: "#e5e5ea" }}>
          <Trophy className="h-5 w-5 mb-1" style={{ color: YELLOW }} />
          <p className="text-[10px] text-[#1c1c1e] font-medium">{mock.passRate}%</p>
          <p className="text-[9px] text-[#8e8e93]">Pass Rate</p>
        </div>
        <div className="aspect-square rounded-[10px] flex flex-col items-center justify-center" style={{ backgroundColor: "#e5e5ea" }}>
          <Star className="h-5 w-5 mb-1" style={{ color: ORANGE }} />
          <p className="text-[10px] text-[#1c1c1e] font-medium">{mock.rating}★</p>
          <p className="text-[9px] text-[#8e8e93]">{mock.reviews} reviews</p>
        </div>
      </div>
    </div>
  );
}

// 16 — Contact Card
function Design16() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[28px] font-bold" style={{ backgroundColor: BLUE }}>
          {mock.nextPupil.split(" ").map(n => n[0]).join("")}
        </div>
        <p className="text-[22px] font-bold text-[#1c1c1e] mt-3">{mock.nextPupil}</p>
        <p className="text-[13px] text-[#8e8e93]">Next lesson · {mock.nextTime}</p>
        <div className="flex gap-4 mt-4">
          {[
            { icon: <Phone className="h-5 w-5" />, label: "Call", color: GREEN },
            { icon: <MessageSquare className="h-5 w-5" />, label: "Message", color: BLUE },
            { icon: <Navigation className="h-5 w-5" />, label: "Navigate", color: ORANGE },
          ].map(a => (
            <div key={a.label} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: a.color + "15", color: a.color }}>{a.icon}</div>
              <span className="text-[10px]" style={{ color: a.color }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
      <Card>
        <Row title="Location" right={<span className="text-[14px] text-[#8e8e93]">{mock.nextPostcode}</span>} />
        <Row title="Duration" right={<span className="text-[14px] text-[#8e8e93]">{mock.nextDuration}</span>} />
        <Row title="Lesson Type" right={<span className="text-[14px] text-[#8e8e93]">Intensive</span>} last />
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 17 — Live Activities Bar
function Design17() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      {/* Live activity bar */}
      <div className="mx-4 mt-6 rounded-[16px] p-[2px]" style={{ background: `linear-gradient(90deg, ${BLUE}, ${CYAN}, ${GREEN})` }}>
        <div className="rounded-[14px] p-3 flex items-center gap-3" style={{ backgroundColor: "#1c1c1e" }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: BLUE }}>
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[1.5px]" style={{ borderColor: "#1c1c1e", backgroundColor: GREEN }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{mock.nextPupil}</p>
            <p className="text-[11px] text-[#8e8e93]">Starts in {mock.nextMinutes}min</p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-bold text-white">{mock.nextTime}</p>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="flex gap-2 mx-4 mt-4">
        <StatPill label="Lessons" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
      {/* Timeline */}
      <Card className="mt-3">
        {mock.timeline.map((t, i) => (
          <Row key={i} left={<div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: t.done ? GREEN : BLUE }} />} title={t.pupil} subtitle={`${t.time} · ${t.type}`} last={i === mock.timeline.length - 1} />
        ))}
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 18 — Shortcuts Automation
function Design18() {
  const shortcuts = [
    { title: "Log Today's Hours", sub: "Automatically records your teaching hours", icon: <Clock className="h-5 w-5" />, colors: [BLUE, CYAN], steps: 3 },
    { title: "Send Lesson Reminders", sub: "Remind tomorrow's pupils via SMS", icon: <Send className="h-5 w-5" />, colors: [GREEN, MINT], steps: 4 },
    { title: "Weekly Report", sub: "Generate earnings & hours summary", icon: <BarChart3 className="h-5 w-5" />, colors: [ORANGE, YELLOW], steps: 5 },
    { title: "Update Availability", sub: "Sync schedule with your calendar", icon: <Calendar className="h-5 w-5" />, colors: [PURPLE, PINK], steps: 2 },
  ];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-5 pt-6 flex items-center gap-2">
        <Workflow className="h-5 w-5" style={{ color: PINK }} />
        <p className="text-[22px] font-bold text-[#1c1c1e]">Shortcuts</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mx-4 mt-4">
        {shortcuts.map(s => (
          <div key={s.title} className="rounded-[14px] p-3 text-white" style={{ background: `linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]})` }}>
            <div className="mb-2">{s.icon}</div>
            <p className="text-[13px] font-semibold">{s.title}</p>
            <p className="text-[10px] opacity-70 mt-0.5">{s.steps} steps</p>
          </div>
        ))}
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 19 — Screen Time
function Design19() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = [5, 7, 6, 8, 4, 3, 0];
  const maxH = Math.max(...hours);
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-5 pt-6">
        <p className="text-[11px] text-[#8e8e93] uppercase">This Week</p>
        <p className="text-[28px] font-bold text-[#1c1c1e]">Teaching Time</p>
        <p className="text-[13px] text-[#8e8e93]">{mock.weeklyHours}h total · avg {(mock.weeklyHours / 5).toFixed(1)}h/day</p>
      </div>
      {/* Bar chart */}
      <Card className="mt-4">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-end gap-2 h-[100px]">
            {days.map((d, i) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-[4px] transition-all" style={{ height: `${(hours[i] / maxH) * 80}px`, backgroundColor: i === new Date().getDay() - 1 ? BLUE : BLUE + "40" }} />
                <span className="text-[10px] text-[#8e8e93]">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      {/* Category breakdown */}
      <Card className="mt-3">
        <div className="px-3 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-[#8e8e93] uppercase">Categories</span>
        </div>
        <Row left={<div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLUE }} />} title="Standard Lessons" right={<span className="text-[14px] text-[#8e8e93]">18h</span>} />
        <Row left={<div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GREEN }} />} title="Intensive Courses" right={<span className="text-[14px] text-[#8e8e93]">8h</span>} />
        <Row left={<div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ORANGE }} />} title="Test Preparation" right={<span className="text-[14px] text-[#8e8e93]">5h</span>} last />
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 20 — Apple Music Now Playing
function Design20() {
  const lessonProgress = 65;
  return (
    <div className="min-h-full pb-8" style={{ background: `linear-gradient(180deg, ${BLUE}30, ${BG})` }}>
      <div className="flex flex-col items-center pt-8 px-8">
        {/* Album art = pupil avatar */}
        <div className="w-[200px] h-[200px] rounded-[20px] flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${BLUE}, ${INDIGO})` }}>
          <span className="text-[64px] font-bold text-white/90">
            {mock.nextPupil.split(" ").map(n => n[0]).join("")}
          </span>
        </div>
        {/* Track info */}
        <div className="text-center mt-5 w-full">
          <p className="text-[20px] font-bold text-[#1c1c1e]">{mock.nextPupil}</p>
          <p className="text-[14px] text-[#8e8e93]">Intensive Lesson · {mock.nextDuration}</p>
        </div>
        {/* Progress bar */}
        <div className="w-full mt-5">
          <div className="h-[4px] rounded-full overflow-hidden" style={{ backgroundColor: "#e5e5ea" }}>
            <div className="h-full rounded-full" style={{ width: `${lessonProgress}%`, backgroundColor: BLUE }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-[#8e8e93]">1:18</span>
            <span className="text-[11px] text-[#8e8e93]">-0:42</span>
          </div>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-8 mt-4">
          <SkipBack className="h-6 w-6 text-[#1c1c1e]" />
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1c1c1e" }}>
            <Play className="h-7 w-7 text-white ml-0.5" />
          </div>
          <SkipForward className="h-6 w-6 text-[#1c1c1e]" />
        </div>
        {/* Volume */}
        <div className="flex items-center gap-2 w-full mt-5">
          <Volume2 className="h-3.5 w-3.5 text-[#8e8e93]" />
          <div className="flex-1 h-[3px] rounded-full" style={{ backgroundColor: "#e5e5ea" }}>
            <div className="h-full rounded-full w-[70%]" style={{ backgroundColor: "#8e8e93" }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-6">
        <StatPill label="Lessons" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
    </div>
  );
}

// ═══════════════ PAGE ═══════════════

const designs: { title: string; Component: React.FC }[] = [
  { title: "1. Spotlight Search", Component: Design1 },
  { title: "2. Widget Board", Component: Design2 },
  { title: "3. Lock Screen", Component: Design3 },
  { title: "4. Focus Mode", Component: Design4 },
  { title: "5. App Library", Component: Design5 },
  { title: "6. Stacked Notifications", Component: Design6 },
  { title: "7. Today View", Component: Design7 },
  { title: "8. Siri Suggestions", Component: Design8 },
  { title: "9. Health Dashboard", Component: Design9 },
  { title: "10. Maps Card", Component: Design10 },
  { title: "11. Wallet Pass", Component: Design11 },
  { title: "12. Journal Entry", Component: Design12 },
  { title: "13. Action Button Menu", Component: Design13 },
  { title: "14. Standby Mode", Component: Design14 },
  { title: "15. Photo Memories", Component: Design15 },
  { title: "16. Contact Card", Component: Design16 },
  { title: "17. Live Activities Bar", Component: Design17 },
  { title: "18. Shortcuts Automation", Component: Design18 },
  { title: "19. Screen Time", Component: Design19 },
  { title: "20. Apple Music Now Playing", Component: Design20 },
];

export default function InstructorIOSDemo3() {
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () => setActiveIdx(i => Math.max(0, i - 1));
  const next = () => setActiveIdx(i => Math.min(designs.length - 1, i + 1));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link to="/" className="text-[13px] text-[#8e8e93] hover:text-white transition">← Back</Link>
          <p className="text-[15px] font-semibold">iOS Designs — Set 3</p>
          <span className="text-[13px] text-[#8e8e93]">{activeIdx + 1}/20</span>
        </div>
      </div>

      {/* Main carousel */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-4">
          <button onClick={prev} disabled={activeIdx === 0} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/20 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Phone frame */}
          <div className="w-[375px] h-[720px] rounded-[40px] border-[3px] border-white/20 overflow-hidden relative bg-black shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-[14px] z-10" />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full overflow-y-auto pt-[36px]"
              >
                {(() => { const D = designs[activeIdx].Component; return <D />; })()}
              </motion.div>
            </AnimatePresence>
          </div>

          <button onClick={next} disabled={activeIdx === designs.length - 1} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/20 transition">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <p className="text-center text-[17px] font-semibold mt-4">{designs[activeIdx].title}</p>

        {/* Thumbnail pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xl mx-auto">
          {designs.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${i === activeIdx ? "text-white" : "text-[#8e8e93] hover:text-white"}`}
              style={{ backgroundColor: i === activeIdx ? BLUE : "rgba(255,255,255,0.08)" }}
            >
              {i + 1}. {d.title.split(". ")[1] || d.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
