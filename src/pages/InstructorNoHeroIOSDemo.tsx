import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, PoundSterling, MapPin, ChevronRight, ArrowLeft, ArrowRight,
  MessageSquare, Briefcase, Bell, Sun, Trophy, Flame, Star, Zap, Award,
  Target, TrendingUp, Calendar, Quote, User, Heart, CheckCircle,
  CloudSun, BookOpen, Navigation, Car, Receipt, Settings, ListTodo, Users,
  CreditCard, Phone,
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

const IOS_BG = "#f2f2f7";
const IOS_CARD = "#ffffff";
const IOS_SEP = "#c6c6c8";
const IOS_BLUE = "#007AFF";
const IOS_GREEN = "#34C759";
const IOS_ORANGE = "#FF9500";
const IOS_RED = "#FF3B30";
const IOS_PURPLE = "#AF52DE";
const IOS_TEAL = "#5AC8FA";
const IOS_INDIGO = "#5856D6";

const mock = {
  name: "Kenneth", initials: "K",
  lessons: 4, hours: 6, earnings: 240,
  weeklyHours: 13.5, weeklyGoal: 30, weeklyPercent: 45, weeklyEarnings: 540,
  nextPupil: "Sarah Johnson", nextTime: "10:30", nextPostcode: "SW1A 1AA", nextMinutes: 25, nextDuration: "2hr",
  unread: 3, pendingJobs: 2,
  timeline: [
    { time: "09:00", pupil: "Emma Wilson", done: true, postcode: "SE1 7PB" },
    { time: "10:30", pupil: "Sarah Johnson", done: false, postcode: "SW1A 1AA" },
    { time: "13:00", pupil: "Jake Morris", done: false, postcode: "W1D 3QF" },
    { time: "15:00", pupil: "Lucy Chen", done: false, postcode: "EC2R 8AH" },
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

// iOS grouped inset card
const IOSCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-4 rounded-[10px] overflow-hidden ${className}`} style={{ backgroundColor: IOS_CARD }}>
    {children}
  </div>
);

// iOS list row
const IOSRow = ({ left, title, subtitle, right, last = false }: { left?: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode; last?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-[11px] ${!last ? "border-b" : ""}`} style={{ borderColor: IOS_SEP + "40" }}>
    {left}
    <div className="flex-1 min-w-0">
      <p className="text-[15px] text-[#1c1c1e] truncate">{title}</p>
      {subtitle && <p className="text-[13px] text-[#8e8e93] truncate">{subtitle}</p>}
    </div>
    {right || <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />}
  </div>
);

// iOS section header
const IOSHeader = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[13px] font-normal text-[#6d6d72] uppercase px-5 pt-5 pb-[6px]">{children}</p>
);

// iOS icon grid (4-col)
const IOSIconGrid = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-5 py-3">
    {mock.quickActions.slice(0, count).map(a => {
      const img = customIconImages[a.id];
      const badge = a.id === "messages" ? mock.unread : a.id === "jobs" ? mock.pendingJobs : 0;
      return (
        <div key={a.id} className="flex flex-col items-center gap-1">
          <div className="relative w-[52px] h-[52px] rounded-[12px] overflow-hidden shadow-sm" style={{ backgroundColor: img ? undefined : "#e5e5ea" }}>
            {img ? <img src={img} alt={a.title} className="w-full h-full object-cover" /> : (() => { const I = iconMap[a.icon] || Calendar; return <div className="w-full h-full flex items-center justify-center"><I className="h-6 w-6 text-[#8e8e93]" /></div>; })()}
            {badge > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: IOS_RED }}>{badge}</span>}
          </div>
          <span className="text-[10px] text-[#3c3c43] text-center leading-tight">{a.title}</span>
        </div>
      );
    })}
  </div>
);

// Progress ring
const Ring = ({ percent, size = 100, color = IOS_BLUE }: { percent: number; size?: number; color?: string }) => {
  const r = (size - 10) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e5ea" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c - (percent / 100) * c} strokeLinecap="round" />
    </svg>
  );
};

// ═══════════════════ 20 CONCEPTS ═══════════════════

// 1. Classic Grouped — Stat rows, disclosure arrows
function Concept1() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <IOSHeader>Today's Overview</IOSHeader>
      <IOSCard>
        <IOSRow left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: IOS_BLUE }}><BookOpen className="h-4 w-4 text-white" /></div>} title="Lessons" right={<span className="text-[15px] text-[#8e8e93]">{mock.lessons}</span>} />
        <IOSRow left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: IOS_GREEN }}><Clock className="h-4 w-4 text-white" /></div>} title="Hours" right={<span className="text-[15px] text-[#8e8e93]">{mock.hours}h</span>} />
        <IOSRow left={<div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: IOS_ORANGE }}><PoundSterling className="h-4 w-4 text-white" /></div>} title="Earnings" right={<span className="text-[15px] text-[#8e8e93]">£{mock.earnings}</span>} last />
      </IOSCard>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 2. Profile Card Top
function Concept2() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="pt-8 pb-4 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold" style={{ backgroundColor: IOS_BLUE }}>{mock.initials}</div>
        <p className="text-[17px] font-semibold text-[#1c1c1e] mt-2">{greeting}, {mock.name}</p>
        <p className="text-[13px] text-[#8e8e93]">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</p>
      </div>
      <IOSCard>
        <div className="flex divide-x" style={{ borderColor: IOS_SEP + "40" }}>
          {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: `${mock.hours}h` }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
            <div key={s.l} className="flex-1 py-3 text-center">
              <p className="text-[20px] font-bold" style={{ color: IOS_BLUE }}>{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </IOSCard>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 3. Activity Ring
function Concept3() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8 flex flex-col items-center">
      <div className="pt-8 pb-2 relative">
        <Ring percent={mock.weeklyPercent} size={120} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-bold text-[#1c1c1e]">{mock.weeklyHours}</span>
          <span className="text-[11px] text-[#8e8e93]">/ {mock.weeklyGoal}h</span>
        </div>
      </div>
      <p className="text-[13px] text-[#8e8e93] mb-3">Weekly progress</p>
      <IOSCard className="w-[calc(100%-32px)]">
        <div className="flex divide-x" style={{ borderColor: IOS_SEP + "40" }}>
          {[{ l: "Today", v: `${mock.lessons}` }, { l: "Hours", v: `${mock.hours}h` }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
            <div key={s.l} className="flex-1 py-2.5 text-center">
              <p className="text-[17px] font-semibold text-[#1c1c1e]">{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </IOSCard>
      <div className="w-full mt-1"><IOSHeader>Quick Actions</IOSHeader></div>
      <IOSCard className="w-[calc(100%-32px)]"><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 4. Next Lesson Prominent
function Concept4() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <IOSHeader>Next Up</IOSHeader>
      <IOSCard>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: IOS_BLUE }}>SJ</div>
            <div className="flex-1">
              <p className="text-[17px] font-semibold text-[#1c1c1e]">{mock.nextPupil}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3 text-[#8e8e93]" />
                <span className="text-[13px] text-[#8e8e93]">{mock.nextTime} · {mock.nextMinutes} min away</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#8e8e93]">{mock.nextPostcode}</p>
              <p className="text-[11px] text-[#8e8e93]">{mock.nextDuration}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 rounded-lg text-[13px] font-medium text-white" style={{ backgroundColor: IOS_BLUE }}>Navigate</button>
            <button className="flex-1 py-2 rounded-lg text-[13px] font-medium" style={{ backgroundColor: "#e5e5ea", color: "#1c1c1e" }}>Call</button>
          </div>
        </div>
      </IOSCard>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 5. Compact 2x2 Widget Grid
function Concept5() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="grid grid-cols-2 gap-3 px-4 pt-6 mb-2">
        {[
          { l: "Lessons", v: mock.lessons, color: IOS_BLUE, icon: BookOpen },
          { l: "Hours", v: `${mock.hours}h`, color: IOS_GREEN, icon: Clock },
          { l: "Earnings", v: `£${mock.earnings}`, color: IOS_ORANGE, icon: PoundSterling },
          { l: "Weekly", v: `${mock.weeklyPercent}%`, color: IOS_PURPLE, icon: TrendingUp },
        ].map(s => (
          <div key={s.l} className="rounded-[14px] p-3.5 flex items-center gap-2.5" style={{ backgroundColor: IOS_CARD }}>
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: s.color + "18" }}>
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[17px] font-bold text-[#1c1c1e]">{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          </div>
        ))}
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 6. Timeline
function Concept6() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <IOSHeader>Today's Schedule</IOSHeader>
      <IOSCard>
        {mock.timeline.map((l, i) => (
          <IOSRow key={i}
            left={<div className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: l.done ? IOS_GREEN : l.pupil === mock.nextPupil ? IOS_BLUE : "#c7c7cc" }} />}
            title={l.pupil}
            subtitle={`${l.time} · ${l.postcode}`}
            right={l.done ? <CheckCircle className="h-4 w-4" style={{ color: IOS_GREEN }} /> : <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />}
            last={i === mock.timeline.length - 1}
          />
        ))}
      </IOSCard>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 7. Gradient Banner
function Concept7() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-5 rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${IOS_BLUE}, ${IOS_INDIGO})` }}>
        <div className="px-5 py-5 text-white">
          <p className="text-[13px] opacity-80">{greeting},</p>
          <h2 className="text-[22px] font-bold mt-0.5">{mock.name}</h2>
          <p className="text-[12px] opacity-70 mt-2">{mock.weeklyHours}h of {mock.weeklyGoal}h · £{mock.weeklyEarnings} this week</p>
          <div className="mt-2.5 h-[5px] bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full" style={{ width: `${mock.weeklyPercent}%` }} />
          </div>
        </div>
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 8. Big Earnings
function Concept8() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8 flex flex-col items-center">
      <div className="pt-10 pb-3 text-center">
        <p className="text-[13px] text-[#8e8e93] uppercase tracking-wider">Today's Earnings</p>
        <h1 className="text-[48px] font-black mt-1" style={{ color: IOS_GREEN }}>£{mock.earnings}</h1>
        <div className="flex gap-5 mt-2 justify-center">
          <span className="text-[13px] text-[#8e8e93]">{mock.lessons} lessons</span>
          <span className="text-[13px] text-[#8e8e93]">{mock.hours} hours</span>
        </div>
      </div>
      <IOSCard className="w-[calc(100%-32px)]"><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 9. Map Peek
function Concept9() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-5 rounded-2xl overflow-hidden" style={{ backgroundColor: IOS_CARD }}>
        <div className="h-28 flex items-center justify-center" style={{ backgroundColor: "#e8ecf0" }}>
          <div className="text-center">
            <MapPin className="h-7 w-7 mx-auto mb-1" style={{ color: IOS_RED }} />
            <p className="text-[13px] font-medium text-[#1c1c1e]">{mock.nextPostcode}</p>
            <p className="text-[11px] text-[#8e8e93]">{mock.nextMinutes} min · Next pickup</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-t" style={{ borderColor: IOS_SEP + "40" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: IOS_BLUE }}>SJ</div>
          <div className="flex-1">
            <p className="text-[15px] font-medium text-[#1c1c1e]">{mock.nextPupil}</p>
            <p className="text-[12px] text-[#8e8e93]">{mock.nextTime} · {mock.nextDuration}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />
        </div>
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 10. Minimal Clean
function Concept10() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="px-5 pt-10">
        <p className="text-[17px] text-[#1c1c1e]">{greeting}, <span className="font-semibold">{mock.name}</span></p>
        <div className="mt-4 h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: "#e5e5ea" }}>
          <div className="h-full rounded-full" style={{ width: `${mock.weeklyPercent}%`, backgroundColor: IOS_BLUE }} />
        </div>
        <p className="text-[11px] text-[#8e8e93] mt-1 mb-4">{mock.weeklyHours}h / {mock.weeklyGoal}h this week</p>
      </div>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 11. Card Stack
function Concept11() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <IOSHeader>Next Lesson</IOSHeader>
      <IOSCard>
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#1c1c1e]">{mock.nextPupil}</p>
            <p className="text-[13px] text-[#8e8e93]">{mock.nextTime} · {mock.nextPostcode}</p>
          </div>
          <div className="text-right">
            <span className="text-[20px] font-bold" style={{ color: IOS_BLUE }}>{mock.nextMinutes}</span>
            <p className="text-[11px] text-[#8e8e93]">min</p>
          </div>
        </div>
      </IOSCard>
      <IOSHeader>Weekly Progress</IOSHeader>
      <IOSCard>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] text-[#8e8e93]">{mock.weeklyHours}h of {mock.weeklyGoal}h</p>
            <span className="text-[13px] font-semibold" style={{ color: IOS_BLUE }}>{mock.weeklyPercent}%</span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: "#e5e5ea" }}>
            <div className="h-full rounded-full" style={{ width: `${mock.weeklyPercent}%`, backgroundColor: IOS_BLUE }} />
          </div>
        </div>
      </IOSCard>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 12. Split Stats
function Concept12() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="flex gap-3 px-4 pt-6">
        <div className="flex-1 rounded-[14px] p-4 text-center" style={{ backgroundColor: IOS_CARD }}>
          <p className="text-[34px] font-black" style={{ color: IOS_BLUE }}>{mock.hours}h</p>
          <p className="text-[11px] text-[#8e8e93]">Today</p>
        </div>
        <div className="flex-1 rounded-[14px] p-4 text-center" style={{ backgroundColor: IOS_CARD }}>
          <p className="text-[34px] font-black" style={{ color: IOS_GREEN }}>£{mock.earnings}</p>
          <p className="text-[11px] text-[#8e8e93]">Earnings</p>
        </div>
      </div>
      <div className="mx-4 mt-3">
        <div className="h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: "#e5e5ea" }}>
          <div className="h-full rounded-full" style={{ width: `${mock.weeklyPercent}%`, backgroundColor: IOS_BLUE }} />
        </div>
        <p className="text-[11px] text-[#8e8e93] mt-1">{mock.weeklyPercent}% weekly goal</p>
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 13. Tabbed
function Concept13() {
  const [tab, setTab] = useState(0);
  const tabs = ["Today", "Week", "Month"];
  const data = [
    [{ l: "Lessons", v: `${mock.lessons}` }, { l: "Hours", v: `${mock.hours}h` }, { l: "Earned", v: `£${mock.earnings}` }],
    [{ l: "Hours", v: `${mock.weeklyHours}` }, { l: "Goal", v: `${mock.weeklyGoal}h` }, { l: "Earned", v: `£${mock.weeklyEarnings}` }],
    [{ l: "Hours", v: "52" }, { l: "Lessons", v: "68" }, { l: "Earned", v: "£2,080" }],
  ];
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-5 rounded-[10px] overflow-hidden" style={{ backgroundColor: IOS_CARD }}>
        <div className="flex p-1 m-3 rounded-lg" style={{ backgroundColor: "#e5e5ea" }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${tab === i ? "bg-white text-[#1c1c1e] shadow-sm" : "text-[#8e8e93]"}`}>{t}</button>
          ))}
        </div>
        <div className="flex divide-x pb-3" style={{ borderColor: IOS_SEP + "40" }}>
          {data[tab].map(s => (
            <div key={s.l} className="flex-1 text-center">
              <p className="text-[20px] font-bold text-[#1c1c1e]">{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 14. Weather Banner
function Concept14() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="mx-4 mt-5 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #4A90D9, #5AC8FA)" }}>
        <div className="px-4 py-4 flex items-center gap-3 text-white">
          <Sun className="h-10 w-10 text-yellow-200 shrink-0" />
          <div>
            <p className="text-[17px] font-semibold">14°C · Clear</p>
            <p className="text-[12px] opacity-80">Great driving conditions today ☀️</p>
          </div>
        </div>
      </div>
      <div className="mx-4 mt-3 rounded-[14px] overflow-hidden" style={{ backgroundColor: IOS_CARD }}>
        <div className="flex divide-x" style={{ borderColor: IOS_SEP + "40" }}>
          {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: `${mock.hours}h` }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
            <div key={s.l} className="flex-1 py-3 text-center">
              <p className="text-[17px] font-bold text-[#1c1c1e]">{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 15. Agenda List
function Concept15() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <IOSHeader>Today · {mock.lessons} lessons</IOSHeader>
      <IOSCard>
        {mock.timeline.map((l, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-[10px] ${i < mock.timeline.length - 1 ? "border-b" : ""}`} style={{ borderColor: IOS_SEP + "40" }}>
            <span className="text-[13px] font-mono text-[#8e8e93] w-10">{l.time}</span>
            <div className="flex-1">
              <p className={`text-[15px] ${l.done ? "text-[#8e8e93] line-through" : "text-[#1c1c1e] font-medium"}`}>{l.pupil}</p>
            </div>
            <span className="text-[12px] text-[#8e8e93]">{l.postcode}</span>
            {l.done && <CheckCircle className="h-4 w-4" style={{ color: IOS_GREEN }} />}
          </div>
        ))}
      </IOSCard>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 16. Gamified
function Concept16() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="flex gap-2 px-4 pt-6 mb-3">
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: "#FFF3E0" }}>
          <Flame className="h-4 w-4" style={{ color: IOS_ORANGE }} />
          <span className="text-[12px] font-bold" style={{ color: IOS_ORANGE }}>5 day streak</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: IOS_INDIGO + "15" }}>
          <Zap className="h-4 w-4" style={{ color: IOS_INDIGO }} />
          <span className="text-[12px] font-bold" style={{ color: IOS_INDIGO }}>Level 12</span>
        </div>
      </div>
      <IOSCard>
        <div className="px-4 py-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-[13px] text-[#8e8e93]">XP Progress</span>
            <span className="text-[13px] font-semibold" style={{ color: IOS_INDIGO }}>1,250 / 2,000</span>
          </div>
          <div className="h-[8px] rounded-full overflow-hidden" style={{ backgroundColor: "#e5e5ea" }}>
            <div className="h-full rounded-full" style={{ width: "62%", backgroundColor: IOS_INDIGO }} />
          </div>
        </div>
      </IOSCard>
      <div className="flex gap-2 px-4 mt-3">
        {[
          { icon: Trophy, label: "First Pass", color: IOS_ORANGE },
          { icon: Star, label: "5★ Review", color: IOS_BLUE },
          { icon: Award, label: "100 Hours", color: IOS_GREEN },
        ].map((b, i) => (
          <div key={i} className="flex-1 rounded-[14px] py-3 flex flex-col items-center gap-1" style={{ backgroundColor: IOS_CARD }}>
            <b.icon className="h-5 w-5" style={{ color: b.color }} />
            <span className="text-[10px] text-[#8e8e93]">{b.label}</span>
          </div>
        ))}
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 17. Pill Navigation
function Concept17() {
  const [active, setActive] = useState("Today");
  const pills = ["Today", "Pupils", "Money", "Schedule", "Stats"];
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <div className="pt-6 pb-2 px-4 overflow-x-auto flex gap-2">
        {pills.map(p => (
          <button key={p} onClick={() => setActive(p)} className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 transition-all"
            style={{ backgroundColor: active === p ? IOS_BLUE : "#e5e5ea", color: active === p ? "white" : "#8e8e93" }}>{p}</button>
        ))}
      </div>
      <div className="mx-4 mt-2 rounded-[14px] overflow-hidden" style={{ backgroundColor: IOS_CARD }}>
        <div className="flex divide-x" style={{ borderColor: IOS_SEP + "40" }}>
          {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: `${mock.hours}h` }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
            <div key={s.l} className="flex-1 py-3 text-center">
              <p className="text-[17px] font-bold text-[#1c1c1e]">{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 18. Quote + Stats
function Concept18() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <IOSCard className="mt-5">
        <div className="px-4 py-4">
          <Quote className="h-4 w-4 mb-1" style={{ color: IOS_SEP }} />
          <p className="text-[15px] italic text-[#1c1c1e] leading-snug">"The expert in anything was once a beginner."</p>
          <p className="text-[11px] text-[#8e8e93] mt-1">— Helen Hayes</p>
        </div>
      </IOSCard>
      <div className="mx-4 mt-3 rounded-[14px] overflow-hidden" style={{ backgroundColor: IOS_CARD }}>
        <div className="flex divide-x" style={{ borderColor: IOS_SEP + "40" }}>
          {[{ l: "Lessons", v: mock.lessons, c: IOS_BLUE }, { l: "Hours", v: `${mock.hours}h`, c: IOS_GREEN }, { l: "Earned", v: `£${mock.earnings}`, c: IOS_ORANGE }].map(s => (
            <div key={s.l} className="flex-1 py-3 text-center">
              <p className="text-[17px] font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 19. Big Avatar
function Concept19() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8 flex flex-col items-center">
      <div className="pt-10 pb-3 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ backgroundColor: IOS_BLUE }}>{mock.initials}</div>
        <p className="text-[13px] text-[#8e8e93] mt-3">{greeting},</p>
        <h2 className="text-[22px] font-bold text-[#1c1c1e]">{mock.name}</h2>
      </div>
      <IOSCard className="w-[calc(100%-32px)]">
        <div className="flex divide-x" style={{ borderColor: IOS_SEP + "40" }}>
          {[{ l: "Lessons", v: mock.lessons }, { l: "Hours", v: `${mock.hours}h` }, { l: "Earned", v: `£${mock.earnings}` }].map(s => (
            <div key={s.l} className="flex-1 py-2.5 text-center">
              <p className="text-[17px] font-semibold text-[#1c1c1e]">{s.v}</p>
              <p className="text-[11px] text-[#8e8e93]">{s.l}</p>
            </div>
          ))}
        </div>
      </IOSCard>
      <div className="w-full mt-1"><IOSHeader>Quick Actions</IOSHeader></div>
      <IOSCard className="w-[calc(100%-32px)]"><IOSIconGrid /></IOSCard>
    </div>
  );
}

// 20. Notification Centre
function Concept20() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full pb-8">
      <IOSHeader>Notifications</IOSHeader>
      <div className="space-y-2 mx-4">
        {[
          { icon: MessageSquare, label: `${mock.unread} unread messages`, sub: "Sarah, Emma, Jake", color: IOS_BLUE },
          { icon: Briefcase, label: `${mock.pendingJobs} new job offers`, sub: "Intensive courses available", color: IOS_ORANGE },
          { icon: Clock, label: `Next lesson in ${mock.nextMinutes} min`, sub: `${mock.nextPupil} · ${mock.nextPostcode}`, color: IOS_GREEN },
        ].map((n, i) => (
          <div key={i} className="rounded-[14px] flex items-center gap-3 px-4 py-3" style={{ backgroundColor: IOS_CARD }}>
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: n.color + "18" }}>
              <n.icon className="h-4 w-4" style={{ color: n.color }} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#1c1c1e]">{n.label}</p>
              <p className="text-[12px] text-[#8e8e93]">{n.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#c7c7cc]" />
          </div>
        ))}
      </div>
      <IOSHeader>Quick Actions</IOSHeader>
      <IOSCard><IOSIconGrid /></IOSCard>
    </div>
  );
}

// ═══════════════════ DEMO SHELL ═══════════════════

const concepts = [
  { id: 1, name: "Classic Grouped", desc: "iOS grouped inset cards with disclosure rows", Component: Concept1 },
  { id: 2, name: "Profile Card", desc: "Centred avatar, name, date, stat dividers", Component: Concept2 },
  { id: 3, name: "Activity Ring", desc: "Health-style progress ring, stats below", Component: Concept3 },
  { id: 4, name: "Next Lesson", desc: "Prominent next-up card with navigate + call CTAs", Component: Concept4 },
  { id: 5, name: "Widget Grid", desc: "2x2 coloured stat widgets, compact", Component: Concept5 },
  { id: 6, name: "Timeline", desc: "Chronological lesson list with status dots", Component: Concept6 },
  { id: 7, name: "Gradient Banner", desc: "Blue-indigo gradient header with progress bar", Component: Concept7 },
  { id: 8, name: "Earnings Focus", desc: "Large green earnings number, minimal stats", Component: Concept8 },
  { id: 9, name: "Map Peek", desc: "Map placeholder with next pickup location", Component: Concept9 },
  { id: 10, name: "Minimal Clean", desc: "Greeting + thin progress bar + grid only", Component: Concept10 },
  { id: 11, name: "Card Stack", desc: "Stacked next-lesson + weekly progress cards", Component: Concept11 },
  { id: 12, name: "Split Stats", desc: "Side-by-side hero numbers, progress bar below", Component: Concept12 },
  { id: 13, name: "Tabbed Sections", desc: "iOS segmented control: Today / Week / Month", Component: Concept13 },
  { id: 14, name: "Weather Banner", desc: "Sky gradient weather card + stat strip", Component: Concept14 },
  { id: 15, name: "Agenda List", desc: "Compact timeline with checkmarks", Component: Concept15 },
  { id: 16, name: "Gamified", desc: "XP bar, streak badge, achievement icons", Component: Concept16 },
  { id: 17, name: "Pill Nav", desc: "Scrollable pill buttons + stat strip", Component: Concept17 },
  { id: 18, name: "Quote + Stats", desc: "Motivational quote card + coloured stats", Component: Concept18 },
  { id: 19, name: "Big Avatar", desc: "Large profile circle with greeting", Component: Concept19 },
  { id: 20, name: "Notifications", desc: "Stacked notification cards by type", Component: Concept20 },
];

export default function InstructorNoHeroIOSDemo() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/instructor" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-base font-semibold">iOS No-Hero Designs</h1>
          <span className="text-sm text-gray-500">{selected + 1}/{concepts.length}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {concepts.map((c, i) => (
            <button key={c.id} onClick={() => setSelected(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selected === i ? "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}>
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
            <div className="w-[375px] h-[812px] bg-black rounded-[50px] p-3 shadow-2xl shadow-[#007AFF]/10 border border-white/10">
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

          <div className="w-full mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">All Concepts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {concepts.map((c, i) => (
                <button key={c.id} onClick={() => { setSelected(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`rounded-2xl overflow-hidden border-2 transition-all ${selected === i ? "border-[#007AFF] shadow-lg shadow-[#007AFF]/20" : "border-white/10 hover:border-white/30"}`}>
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
