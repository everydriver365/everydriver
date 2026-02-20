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
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

// Shared components
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

const Dot = ({ color }: { color: string }) => <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />;

const StatPill = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex-1 rounded-[10px] py-2.5 px-2 text-center" style={{ backgroundColor: color + "15" }}>
    <p className="text-[17px] font-bold" style={{ color }}>{value}</p>
    <p className="text-[10px] text-[#8e8e93] mt-0.5">{label}</p>
  </div>
);

// ═══════════════ 20 iOS DESIGNS ═══════════════

// 1 — Frosted Glass Header
function Design1() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[16px] p-4 backdrop-blur-xl" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.12), rgba(88,86,214,0.08))", border: "1px solid rgba(255,255,255,0.6)" }}>
        <p className="text-[13px] text-[#6d6d72]">{greeting}</p>
        <p className="text-[22px] font-bold text-[#1c1c1e]">{mock.name}</p>
        <div className="flex gap-4 mt-3">
          {[{ l: "Lessons", v: mock.lessons, c: BLUE }, { l: "Hours", v: `${mock.hours}h`, c: PURPLE }, { l: "Earned", v: `£${mock.earnings}`, c: GREEN }].map(s => (
            <div key={s.l}>
              <p className="text-[20px] font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 2 — Dual Ring Dashboard
function Design2() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="flex justify-center gap-4 pt-6 pb-2">
        <div className="relative">
          <Ring percent={mock.weeklyPercent} size={90} color={GREEN} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[16px] font-bold text-[#1c1c1e]">{mock.weeklyHours}</span>
            <span className="text-[9px] text-[#8e8e93]">hours</span>
          </div>
        </div>
        <div className="relative">
          <Ring percent={mock.passRate} size={90} color={BLUE} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[16px] font-bold text-[#1c1c1e]">{mock.passRate}%</span>
            <span className="text-[9px] text-[#8e8e93]">pass rate</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-2">
        <StatPill label="Today" value={`${mock.lessons}`} color={ORANGE} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={GREEN} />
        <StatPill label="Pupils" value={`${mock.pupils}`} color={BLUE} />
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 3 — Horizontal Scroll Cards
function Design3() {
  const cards = [
    { title: "Next Up", sub: `${mock.nextPupil} · ${mock.nextTime}`, color: BLUE, icon: <Clock className="h-4 w-4 text-white" /> },
    { title: "Earnings", sub: `£${mock.earnings} today`, color: GREEN, icon: <PoundSterling className="h-4 w-4 text-white" /> },
    { title: "Progress", sub: `${mock.weeklyPercent}% of goal`, color: PURPLE, icon: <Target className="h-4 w-4 text-white" /> },
    { title: "Rating", sub: `${mock.rating} ★ (${mock.reviews})`, color: ORANGE, icon: <Star className="h-4 w-4 text-white" /> },
  ];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[22px] font-bold text-[#1c1c1e]">{greeting}, {mock.name}</p>
      <div className="flex gap-3 overflow-x-auto px-4 py-4 scrollbar-hide">
        {cards.map(c => (
          <div key={c.title} className="min-w-[140px] rounded-[14px] p-3 text-white" style={{ backgroundColor: c.color }}>
            <div className="flex items-center gap-1.5 mb-2">{c.icon}<span className="text-[13px] font-semibold">{c.title}</span></div>
            <p className="text-[12px] opacity-90">{c.sub}</p>
          </div>
        ))}
      </div>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 4 — Control Centre Style
function Design4() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[13px] text-[#6d6d72]">{greeting}</p>
      <p className="px-5 text-[28px] font-bold text-[#1c1c1e]">{mock.name}</p>
      <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
        <div className="rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: BLUE }}><Calendar className="h-3.5 w-3.5 text-white" /></div><span className="text-[13px] text-[#8e8e93]">Lessons</span></div>
          <p className="text-[28px] font-bold text-[#1c1c1e]">{mock.lessons}</p>
        </div>
        <div className="rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: GREEN }}><Clock className="h-3.5 w-3.5 text-white" /></div><span className="text-[13px] text-[#8e8e93]">Hours</span></div>
          <p className="text-[28px] font-bold text-[#1c1c1e]">{mock.hours}h</p>
        </div>
        <div className="col-span-2 rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: ORANGE }}><PoundSterling className="h-3.5 w-3.5 text-white" /></div><span className="text-[13px] text-[#8e8e93]">Today's Earnings</span></div>
          </div>
          <p className="text-[34px] font-bold text-[#1c1c1e]">£{mock.earnings}</p>
        </div>
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 5 — Ticket / Pass Style
function Design5() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[16px] overflow-hidden" style={{ backgroundColor: CARD }}>
        <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${BLUE}, ${INDIGO})` }}>
          <p className="text-[11px] uppercase tracking-wider opacity-80">next lesson</p>
          <p className="text-[20px] font-bold mt-1">{mock.nextPupil}</p>
          <div className="flex items-center gap-3 mt-2 text-[13px] opacity-90">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mock.nextTime}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{mock.nextPostcode}</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ backgroundColor: BG }} />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ backgroundColor: BG }} />
          <div className="border-t border-dashed mx-6" style={{ borderColor: SEP }} />
        </div>
        <div className="flex divide-x p-3" style={{ borderColor: SEP + "40" }}>
          {[{ l: "Duration", v: mock.nextDuration }, { l: "In", v: `${mock.nextMinutes}min` }, { l: "Type", v: "Standard" }].map(s => (
            <div key={s.l} className="flex-1 text-center">
              <p className="text-[15px] font-semibold text-[#1c1c1e]">{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 6 — Wallet Stack
function Design6() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[22px] font-bold text-[#1c1c1e]">{greeting}</p>
      <div className="px-4 mt-4 space-y-[-20px]">
        {[
          { bg: `linear-gradient(135deg, ${BLUE}, ${CYAN})`, title: "Today", val: `£${mock.earnings}`, sub: `${mock.lessons} lessons · ${mock.hours}h` },
          { bg: `linear-gradient(135deg, ${GREEN}, ${MINT})`, title: "This Week", val: `£${mock.weeklyEarnings}`, sub: `${mock.weeklyHours}h / ${mock.weeklyGoal}h goal` },
          { bg: `linear-gradient(135deg, ${PURPLE}, ${PINK})`, title: "Pass Rate", val: `${mock.passRate}%`, sub: `${mock.totalPasses} total passes` },
        ].map((c, i) => (
          <div key={c.title} className="rounded-[14px] p-4 text-white relative" style={{ background: c.bg, zIndex: 3 - i, transform: `scale(${1 - i * 0.03})` }}>
            <p className="text-[11px] uppercase tracking-wider opacity-80">{c.title}</p>
            <p className="text-[28px] font-bold mt-1">{c.val}</p>
            <p className="text-[12px] opacity-80 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 7 — Segmented Header + List
function Design7() {
  const [tab, setTab] = useState(0);
  const tabs = ["Today", "Week", "Month"];
  const data = [
    { lessons: mock.lessons, hours: mock.hours, earned: mock.earnings },
    { lessons: 18, hours: mock.weeklyHours, earned: mock.weeklyEarnings },
    { lessons: 72, hours: 54, earned: 2160 },
  ];
  const d = data[tab];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-4 pt-6">
        <div className="flex rounded-[8px] p-0.5" style={{ backgroundColor: "#e5e5ea" }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`flex-1 py-1.5 text-[13px] font-medium rounded-[7px] transition-all ${tab === i ? "shadow-sm" : ""}`} style={{ backgroundColor: tab === i ? CARD : "transparent", color: tab === i ? "#1c1c1e" : "#8e8e93" }}>{t}</button>
          ))}
        </div>
      </div>
      <Card className="mt-4">
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: BLUE }}><BookOpen className="h-4 w-4 text-white" /></div>} title="Lessons" right={<span className="text-[15px] font-medium" style={{ color: BLUE }}>{d.lessons}</span>} />
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: GREEN }}><Clock className="h-4 w-4 text-white" /></div>} title="Hours" right={<span className="text-[15px] font-medium" style={{ color: GREEN }}>{d.hours}h</span>} />
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: ORANGE }}><PoundSterling className="h-4 w-4 text-white" /></div>} title="Earnings" right={<span className="text-[15px] font-medium" style={{ color: ORANGE }}>£{d.earned}</span>} last />
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 8 — Fitness Rings (Apple Watch style)
function Design8() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="flex flex-col items-center pt-6">
        <div className="relative w-[130px] h-[130px]">
          <div className="absolute inset-0"><Ring percent={mock.weeklyPercent} size={130} color={RED} thickness={10} /></div>
          <div className="absolute inset-[14px]"><Ring percent={70} size={102} color={GREEN} thickness={10} /></div>
          <div className="absolute inset-[28px]"><Ring percent={55} size={74} color={CYAN} thickness={10} /></div>
        </div>
        <div className="flex gap-4 mt-3">
          <span className="flex items-center gap-1 text-[12px]"><Dot color={RED} />Hours</span>
          <span className="flex items-center gap-1 text-[12px]"><Dot color={GREEN} />Earnings</span>
          <span className="flex items-center gap-1 text-[12px]"><Dot color={CYAN} />Lessons</span>
        </div>
      </div>
      <Card className="mt-4">
        <Row title="Weekly Hours" right={<span className="text-[15px] text-[#8e8e93]">{mock.weeklyHours} / {mock.weeklyGoal}h</span>} />
        <Row title="Today's Earnings" right={<span className="text-[15px] text-[#8e8e93]">£{mock.earnings}</span>} />
        <Row title="Lesson Count" right={<span className="text-[15px] text-[#8e8e93]">{mock.lessons} today</span>} last />
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 9 — Notification Stack (Dynamic Island inspired)
function Design9() {
  const items = [
    { icon: <Clock className="h-4 w-4" />, color: BLUE, title: `${mock.nextPupil} in ${mock.nextMinutes}min`, sub: mock.nextPostcode },
    { icon: <MessageSquare className="h-4 w-4" />, color: GREEN, title: `${mock.unread} unread messages`, sub: "Tap to view" },
    { icon: <Briefcase className="h-4 w-4" />, color: ORANGE, title: `${mock.pendingJobs} new job offers`, sub: "Review now" },
  ];
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[22px] font-bold text-[#1c1c1e]">{greeting}, {mock.name}</p>
      <div className="space-y-2 mx-4 mt-4">
        {items.map((it, i) => (
          <div key={i} className="rounded-[14px] p-3 flex items-center gap-3" style={{ backgroundColor: CARD }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: it.color }}>{it.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#1c1c1e] truncate">{it.title}</p>
              <p className="text-[12px] text-[#8e8e93]">{it.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />
          </div>
        ))}
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 10 — Dark Mode Premium
function Design10() {
  return (
    <div className="min-h-full pb-8" style={{ backgroundColor: "#000000" }}>
      <div className="px-5 pt-6">
        <p className="text-[13px] text-[#8e8e93]">{greeting}</p>
        <p className="text-[28px] font-bold text-white">{mock.name}</p>
      </div>
      <div className="flex gap-2 mx-4 mt-4">
        {[{ l: "Lessons", v: mock.lessons, c: BLUE }, { l: "Hours", v: `${mock.hours}h`, c: PURPLE }, { l: "Earned", v: `£${mock.earnings}`, c: GREEN }].map(s => (
          <div key={s.l} className="flex-1 rounded-[12px] py-3 px-2 text-center" style={{ backgroundColor: "#1c1c1e" }}>
            <p className="text-[20px] font-bold" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px] text-[#8e8e93]">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 rounded-[12px] p-3" style={{ backgroundColor: "#1c1c1e" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#8e8e93] uppercase">Next Up</p>
            <p className="text-[15px] font-semibold text-white mt-0.5">{mock.nextPupil}</p>
            <p className="text-[12px] text-[#8e8e93]">{mock.nextTime} · {mock.nextPostcode}</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: BLUE }}>
            <Navigation className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
      <p className="text-[13px] font-normal text-[#6d6d72] uppercase px-5 pt-5 pb-[6px]">Quick Actions</p>
      <div className="mx-4 rounded-[14px] overflow-hidden" style={{ backgroundColor: "#1c1c1e" }}>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-5 py-3">
          {mock.quickActions.slice(0, 12).map(a => {
            const img = customIconImages[a.id];
            const badge = a.id === "messages" ? mock.unread : a.id === "jobs" ? mock.pendingJobs : 0;
            return (
              <div key={a.id} className="flex flex-col items-center gap-1">
                <div className="relative w-[52px] h-[52px] rounded-[12px] overflow-hidden" style={{ backgroundColor: img ? undefined : "#2c2c2e" }}>
                  {img ? <img src={img} alt={a.title} className="w-full h-full object-cover" /> : (() => { const I = iconMap[a.icon] || Calendar; return <div className="w-full h-full flex items-center justify-center"><I className="h-6 w-6 text-[#8e8e93]" /></div>; })()}
                  {badge > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: RED }}>{badge}</span>}
                </div>
                <span className="text-[10px] text-[#8e8e93] text-center leading-tight">{a.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 11 — Weather Aware
function Design11() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[14px] p-4 text-white" style={{ background: "linear-gradient(180deg, #4A90D9, #87CEEB)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] opacity-80">{greeting}, {mock.name}</p>
            <p className="text-[34px] font-thin">14°</p>
            <p className="text-[13px] opacity-80">Partly Cloudy · Good driving conditions</p>
          </div>
          <CloudSun className="h-12 w-12 opacity-80" />
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-3">
        <StatPill label="Lessons" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 12 — Progress Journal
function Design12() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-5 pt-6">
        <p className="text-[28px] font-bold text-[#1c1c1e]">Today</p>
        <p className="text-[13px] text-[#8e8e93]">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>
      <Card className="mt-4">
        {mock.timeline.map((t, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < mock.timeline.length - 1 ? "border-b" : ""}`} style={{ borderColor: SEP + "40" }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold`} style={{ backgroundColor: t.done ? GREEN : BLUE }}>{t.done ? <CheckCircle className="h-4 w-4" /> : t.time.split(":")[0]}</div>
            <div className="flex-1">
              <p className="text-[15px] text-[#1c1c1e]">{t.pupil}</p>
              <p className="text-[12px] text-[#8e8e93]">{t.time} · {t.type}</p>
            </div>
            <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ backgroundColor: t.done ? GREEN + "20" : BLUE + "15", color: t.done ? GREEN : BLUE }}>{t.done ? "Done" : t.postcode}</span>
          </div>
        ))}
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 13 — Big Number Focus
function Design13() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="pt-8 pb-2 text-center">
        <p className="text-[11px] uppercase tracking-wider text-[#8e8e93]">Today's Earnings</p>
        <p className="text-[56px] font-bold tracking-tight" style={{ color: GREEN }}>£{mock.earnings}</p>
        <div className="flex justify-center gap-6 mt-1">
          <span className="text-[13px] text-[#8e8e93]">{mock.lessons} lessons</span>
          <span className="text-[13px] text-[#8e8e93]">{mock.hours} hours</span>
        </div>
      </div>
      <div className="mx-4 mt-2 h-[4px] rounded-full overflow-hidden" style={{ backgroundColor: "#e5e5ea" }}>
        <div className="h-full rounded-full" style={{ width: `${mock.weeklyPercent}%`, backgroundColor: GREEN }} />
      </div>
      <p className="text-center text-[11px] text-[#8e8e93] mt-1">{mock.weeklyPercent}% of weekly goal</p>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 14 — Bento Grid
function Design14() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[22px] font-bold text-[#1c1c1e]">{greeting}</p>
      <div className="grid grid-cols-2 gap-2 mx-4 mt-4">
        <div className="rounded-[14px] p-3 row-span-2" style={{ backgroundColor: CARD }}>
          <div className="flex flex-col items-center h-full justify-center">
            <Ring percent={mock.weeklyPercent} size={80} color={BLUE} />
            <p className="text-[13px] font-semibold text-[#1c1c1e] mt-2">{mock.weeklyHours}h</p>
            <p className="text-[11px] text-[#8e8e93]">of {mock.weeklyGoal}h</p>
          </div>
        </div>
        <div className="rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <PoundSterling className="h-4 w-4 mb-1" style={{ color: GREEN }} />
          <p className="text-[22px] font-bold text-[#1c1c1e]">£{mock.earnings}</p>
          <p className="text-[11px] text-[#8e8e93]">today</p>
        </div>
        <div className="rounded-[14px] p-3" style={{ backgroundColor: CARD }}>
          <Users className="h-4 w-4 mb-1" style={{ color: ORANGE }} />
          <p className="text-[22px] font-bold text-[#1c1c1e]">{mock.lessons}</p>
          <p className="text-[11px] text-[#8e8e93]">lessons</p>
        </div>
        <div className="col-span-2 rounded-[14px] p-3 flex items-center gap-3" style={{ backgroundColor: CARD }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: BLUE }}>
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1c1c1e]">{mock.nextPupil}</p>
            <p className="text-[12px] text-[#8e8e93]">{mock.nextTime} · {mock.nextPostcode}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#c7c7cc] ml-auto" />
        </div>
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid count={8} /></Card>
    </div>
  );
}

// 15 — Status Bar Header
function Design15() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="px-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: BLUE }}>{mock.initials}</div>
          <div className="flex-1">
            <p className="text-[17px] font-semibold text-[#1c1c1e]">{mock.name}</p>
            <p className="text-[12px] text-[#8e8e93]">ADI Grade A · {mock.rating}★</p>
          </div>
          <div className="flex gap-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#e5e5ea" }}><Bell className="h-4 w-4 text-[#3c3c43]" /></div>
          </div>
        </div>
      </div>
      <Card className="mt-4">
        <div className="flex px-4 py-3 gap-3">
          {[{ l: "Lessons", v: mock.lessons, c: BLUE }, { l: "Hours", v: `${mock.hours}h`, c: GREEN }, { l: "Earned", v: `£${mock.earnings}`, c: ORANGE }].map(s => (
            <div key={s.l} className="flex-1 text-center">
              <p className="text-[20px] font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-3">
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: BLUE }}><Clock className="h-4 w-4 text-white" /></div>} title={mock.nextPupil} subtitle={`${mock.nextTime} · ${mock.nextPostcode}`} />
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: GREEN }}><MessageSquare className="h-4 w-4 text-white" /></div>} title="Messages" subtitle={`${mock.unread} unread`} />
        <Row left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: ORANGE }}><Briefcase className="h-4 w-4 text-white" /></div>} title="Job Offers" subtitle={`${mock.pendingJobs} pending`} last />
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 16 — Streak & Gamification
function Design16() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="text-center pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: ORANGE + "20" }}>
          <Flame className="h-5 w-5" style={{ color: ORANGE }} />
          <span className="text-[15px] font-bold" style={{ color: ORANGE }}>{mock.streak} day streak!</span>
        </div>
      </div>
      <Card className="mt-4">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-[#8e8e93]">Weekly XP</span>
            <span className="text-[13px] font-semibold" style={{ color: PURPLE }}>{mock.weeklyPercent}%</span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: "#e5e5ea" }}>
            <div className="h-full rounded-full" style={{ width: `${mock.weeklyPercent}%`, background: `linear-gradient(90deg, ${PURPLE}, ${PINK})` }} />
          </div>
        </div>
      </Card>
      <div className="flex gap-2 mx-4 mt-3">
        {[
          { icon: <Trophy className="h-4 w-4" />, label: `${mock.totalPasses}`, sub: "passes", color: YELLOW },
          { icon: <Star className="h-4 w-4" />, label: `${mock.rating}`, sub: "rating", color: ORANGE },
          { icon: <Zap className="h-4 w-4" />, label: `${mock.lessons}`, sub: "today", color: BLUE },
        ].map(b => (
          <div key={b.sub} className="flex-1 rounded-[12px] p-2.5 text-center" style={{ backgroundColor: CARD }}>
            <div className="flex justify-center mb-1" style={{ color: b.color }}>{b.icon}</div>
            <p className="text-[17px] font-bold text-[#1c1c1e]">{b.label}</p>
            <p className="text-[10px] text-[#8e8e93]">{b.sub}</p>
          </div>
        ))}
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 17 — Map Preview Card
function Design17() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[14px] overflow-hidden" style={{ backgroundColor: CARD }}>
        <div className="h-[120px] relative" style={{ background: "linear-gradient(135deg, #c8e6c9, #e8f5e9, #dcedc8)" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: RED }}><MapPin className="h-4 w-4 text-white" /></div>
              <p className="text-[10px] mt-1 font-medium text-[#1c1c1e] bg-white/80 px-2 py-0.5 rounded">{mock.nextPostcode}</p>
            </div>
          </div>
        </div>
        <div className="p-3">
          <p className="text-[15px] font-semibold text-[#1c1c1e]">{mock.nextPupil}</p>
          <p className="text-[12px] text-[#8e8e93]">{mock.nextTime} · {mock.nextMinutes}min away · {mock.nextDuration}</p>
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-3">
        <StatPill label="Lessons" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 18 — Compact Timeline
function Design18() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <p className="px-5 pt-6 text-[22px] font-bold text-[#1c1c1e]">Your Day</p>
      <Card className="mt-3">
        {mock.timeline.map((t, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < mock.timeline.length - 1 ? "border-b" : ""}`} style={{ borderColor: SEP + "40" }}>
            <span className="text-[13px] font-mono w-[42px] text-[#8e8e93]">{t.time}</span>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.done ? GREEN : BLUE }} />
            <p className="text-[15px] text-[#1c1c1e] flex-1">{t.pupil}</p>
            <span className="text-[11px] text-[#8e8e93]">{t.postcode}</span>
          </div>
        ))}
      </Card>
      <div className="flex gap-2 mx-4 mt-3">
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 19 — Quote & Motivation
function Design19() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[14px] p-4" style={{ background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})` }}>
        <p className="text-[13px] text-white/70 italic">"The road to success is always under construction."</p>
        <p className="text-[11px] text-white/50 mt-1">— Lily Tomlin</p>
      </div>
      <Card className="mt-3">
        <div className="flex divide-x" style={{ borderColor: SEP + "40" }}>
          {[{ l: "Lessons", v: mock.lessons, c: BLUE }, { l: "Hours", v: `${mock.hours}h`, c: GREEN }, { l: "Earned", v: `£${mock.earnings}`, c: ORANGE }].map(s => (
            <div key={s.l} className="flex-1 py-3 text-center">
              <p className="text-[20px] font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </Card>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// 20 — Live Activity Banner
function Design20() {
  return (
    <div style={{ backgroundColor: BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-6 rounded-[20px] p-[2px]" style={{ background: `linear-gradient(135deg, ${BLUE}, ${CYAN}, ${GREEN})` }}>
        <div className="rounded-[18px] p-4" style={{ backgroundColor: "#1c1c1e" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: BLUE }}>
                <Car className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: "#1c1c1e", backgroundColor: GREEN }} />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-white">{mock.nextPupil}</p>
              <p className="text-[12px] text-[#8e8e93]">{mock.nextPostcode} · {mock.nextMinutes}min</p>
            </div>
            <div className="text-right">
              <p className="text-[17px] font-bold text-white">{mock.nextTime}</p>
              <p className="text-[11px]" style={{ color: GREEN }}>On time</p>
            </div>
          </div>
          <div className="mt-3 h-[3px] rounded-full overflow-hidden bg-[#2c2c2e]">
            <div className="h-full rounded-full" style={{ width: "65%", background: `linear-gradient(90deg, ${BLUE}, ${CYAN})` }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mx-4 mt-4">
        <StatPill label="Lessons" value={`${mock.lessons}`} color={BLUE} />
        <StatPill label="Hours" value={`${mock.hours}h`} color={GREEN} />
        <StatPill label="Earned" value={`£${mock.earnings}`} color={ORANGE} />
      </div>
      <SectionLabel>Quick Actions</SectionLabel>
      <Card><IconGrid /></Card>
    </div>
  );
}

// ═══════════════ PAGE ═══════════════

const designs: { title: string; Component: React.FC }[] = [
  { title: "1. Frosted Glass Header", Component: Design1 },
  { title: "2. Dual Ring Dashboard", Component: Design2 },
  { title: "3. Horizontal Scroll Cards", Component: Design3 },
  { title: "4. Control Centre Style", Component: Design4 },
  { title: "5. Ticket / Pass Style", Component: Design5 },
  { title: "6. Wallet Stack", Component: Design6 },
  { title: "7. Segmented Header + List", Component: Design7 },
  { title: "8. Fitness Rings (Watch)", Component: Design8 },
  { title: "9. Notification Stack", Component: Design9 },
  { title: "10. Dark Mode Premium", Component: Design10 },
  { title: "11. Weather Aware", Component: Design11 },
  { title: "12. Progress Journal", Component: Design12 },
  { title: "13. Big Number Focus", Component: Design13 },
  { title: "14. Bento Grid", Component: Design14 },
  { title: "15. Status Bar Header", Component: Design15 },
  { title: "16. Streak & Gamification", Component: Design16 },
  { title: "17. Map Preview Card", Component: Design17 },
  { title: "18. Compact Timeline", Component: Design18 },
  { title: "19. Quote & Motivation", Component: Design19 },
  { title: "20. Live Activity Banner", Component: Design20 },
];

export default function InstructorIOSDemo2() {
  const [activeIdx, setActiveIdx] = useState(0);
  const prev = () => setActiveIdx(i => Math.max(0, i - 1));
  const next = () => setActiveIdx(i => Math.min(designs.length - 1, i + 1));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link to="/" className="text-[13px] text-[#8e8e93] hover:text-white transition">← Back</Link>
          <p className="text-[15px] font-semibold">iOS Designs — Set 2</p>
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
              {i + 1}. {d.title.split(". ")[1]?.split(" (")[0] || d.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
