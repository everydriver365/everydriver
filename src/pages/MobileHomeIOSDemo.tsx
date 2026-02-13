import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, MapPin, Clock, Calendar,
  ChevronRight, ChevronDown, MessageSquare, Briefcase, Heart, Car, Navigation,
  CheckCircle, CloudSun, ListTodo, Users, ArrowLeft, ArrowRight, Phone,
  Award, Receipt, Settings, CreditCard, Mail, Send, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

// Real icon assets
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

// Mock data matching real InstructorMobileHome content
const mock = {
  name: "Sarah", firstName: "Sarah", initials: "S", isOnline: true,
  profileImage: null as string | null,
  weather: { temp: 14, desc: "Partly cloudy", icon: "CloudSun" },
  lessons: 5, earnings: 175, weeklyProgress: 72, streak: 12,
  unread: 3, pendingJobs: 2,
  nextLesson: {
    pupil: "James W.", time: "10:30", postcode: "LS1 4AP",
    minutesUntil: 25, duration: "1hr", durationMins: 60,
    phone: "07700 900123", balance: 80, location: "12 Park Lane, Leeds",
    profileImage: null as string | null,
  },
  timeline: [
    { time: "09:00", pupil: "Alice B.", done: true, isNext: false, postcode: "LS2 7HY" },
    { time: "10:30", pupil: "James W.", done: false, isNext: true, postcode: "LS1 4AP" },
    { time: "12:00", pupil: "Maria G.", done: false, isNext: false, postcode: "LS6 3AA" },
    { time: "14:00", pupil: "Tom S.", done: false, isNext: false, postcode: "LS8 1NE" },
    { time: "16:00", pupil: "Emma L.", done: false, isNext: false, postcode: "LS11 5QJ" },
  ],
  tomorrow: { lessons: 4, hours: 6, earnings: 210, firstTime: "09:00" },
  // All quick actions matching real QuickActionTiles
  quickActions: [
    { id: "schedule", title: "Schedule", icon: "Calendar", route: "/instructor/schedule" },
    { id: "pupils", title: "Pupils", icon: "Users", route: "/instructor/pupils" },
    { id: "take-payment", title: "Take Payment", icon: "CreditCard", route: "/instructor/take-payment" },
    { id: "track-lesson", title: "Track Lesson", icon: "Navigation", route: "/instructor/tracking" },
    { id: "jobs", title: "Job Offers", icon: "Briefcase", route: "/instructor/jobs" },
    { id: "satnav", title: "Sat Nav", icon: "Navigation", route: "/instructor/satnav" },
    { id: "payments", title: "Payments", icon: "CreditCard", route: "/instructor/payments" },
    { id: "messages", title: "Messages", icon: "MessageSquare", route: "/instructor/messages" },
    { id: "fill-gaps", title: "Fill Gaps", icon: "Calendar", route: "/instructor/gaps" },
    { id: "todos", title: "To Do", icon: "ListTodo", route: "/instructor/todos" },
    { id: "vehicle-health", title: "Vehicle", icon: "Car", route: "/instructor/vehicle-health" },
    { id: "find-fuel", title: "Find Fuel", icon: "Car", route: "/instructor/fuel" },
    { id: "find-my-car", title: "Find Car", icon: "Car", route: "/instructor/find-my-car" },
    { id: "health-hub", title: "Health Hub", icon: "Heart", route: "/instructor/health" },
    { id: "availability", title: "Availability", icon: "Clock", route: "/instructor/availability" },
    { id: "expenses", title: "Expenses", icon: "Receipt", route: "/instructor/expenses" },
    { id: "settings", title: "Settings", icon: "Settings", route: "/instructor/settings" },
    { id: "test-results", title: "Test Results", icon: "Award", route: "/instructor/test-results" },
    { id: "cpd-log", title: "CPD Log", icon: "Award", route: "/instructor/cpd" },
    { id: "referrals", title: "Referrals", icon: "Users", route: "/instructor/referrals" },
    { id: "locations", title: "Locations", icon: "MapPin", route: "/instructor/locations" },
  ],
};

const greeting = (() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good morning, ${mock.firstName}!`;
  if (h >= 12 && h < 17) return `Good afternoon, ${mock.firstName}!`;
  if (h >= 17 && h < 21) return `Good evening, ${mock.firstName}!`;
  return `Ready to teach, ${mock.firstName}?`;
})();

const IOS_BG = "#f2f2f7";

// ── Shared reusable sections ──

const Hero = ({ h = "h-[200px]", overlay = "from-black/20 to-transparent", rounded = "" }: { h?: string; overlay?: string; rounded?: string }) => (
  <div className={`w-full ${h} overflow-hidden relative ${rounded}`}>
    <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
    <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${overlay}`} />
  </div>
);

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

const StatsGrid = ({ roundedBottom = false }: { roundedBottom?: boolean }) => (
  <div className={`p-3 bg-white ${roundedBottom ? "rounded-b-2xl" : ""}`}>
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
            <p className="text-[15px] font-semibold text-gray-900 leading-none">{s.v}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.l}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Banners = () => (
  <div className="space-y-2">
    {mock.pendingJobs > 0 && (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
          <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={jobOffersIcon} alt="" className="h-10 w-10 object-cover" />
              <div><span className="font-semibold text-[15px]">Job Offers</span><p className="text-white/70 text-[11px]">{mock.pendingJobs} pending</p></div>
            </div>
            <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-white/90 text-[#0075c9] text-xs font-bold flex items-center justify-center">{mock.pendingJobs}</span>
          </div>
        </div>
      </div>
    )}
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /><div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" /></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={messagesIcon} alt="" className="h-10 w-10 object-cover" />
            <div><span className="font-semibold text-[15px]">Messages</span><p className="text-white/70 text-[11px]">{mock.unread} unread</p></div>
          </div>
          <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center">{mock.unread}</span>
        </div>
      </div>
    </div>
  </div>
);

// NextUpTile-style next lesson card (matching real NextUpTile functionality)
const NextLessonCard = ({ style = "card" }: { style?: "card" | "inline" }) => {
  const nl = mock.nextLesson;
  const isUrgent = nl.minutesUntil <= 30;
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" /></div>
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-[#0075c9] text-xs font-extrabold tracking-wide shadow-sm">
            <Clock className="h-3 w-3" /> NEXT UP
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${isUrgent ? "bg-amber-400/30 text-white animate-pulse" : "bg-white/20 text-white"}`}>
            <Timer className="h-3 w-3" /> in {nl.minutesUntil} min
          </span>
        </div>
      </div>
      {/* Map placeholder */}
      <div className="h-[100px] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <MapPin className="h-6 w-6 text-[#0075c9]/40" />
        <span className="ml-2 text-xs text-[#0075c9]/60">{nl.postcode}</span>
      </div>
      {/* Pupil info */}
      <div className="px-4 pt-3">
        <div className="-mt-8 mb-2">
          <div className="ring-4 ring-white rounded-full inline-block">
            <div className="h-12 w-12 rounded-full bg-[#0075c9] flex items-center justify-center text-white font-bold text-sm">
              {nl.pupil.split(" ").map(n => n[0]).join("")}
            </div>
          </div>
        </div>
        <p className="font-bold text-gray-900 text-base">{nl.pupil}</p>
        <p className="text-xs text-gray-500">{nl.location}, {nl.postcode}</p>
      </div>
      <div className="px-4 pb-4 pt-2">
        {/* Info badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0075c9]/5 border border-[#0075c9]/10 text-xs font-medium text-gray-900">
            <Clock className="h-3.5 w-3.5 text-[#0075c9]" /> Today · {nl.time}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-700">
            {nl.duration} lesson
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#0075c9]/5 border border-[#0075c9]/20 text-[11px] font-semibold text-[#0075c9]">
            £{nl.balance}
          </span>
        </div>
        {/* Unread messages */}
        <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 border bg-muted/30 border-gray-100">
          <Mail className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">No unread messages from {nl.pupil.split(" ")[0]}</span>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button className="flex-1 rounded-xl gap-1 h-8 text-xs bg-[#0075c9] text-white flex items-center justify-center font-medium">
            <Navigation className="h-3.5 w-3.5" /> Navigate
          </button>
          <button className="rounded-xl gap-1 h-8 px-3 text-xs border border-gray-200 flex items-center font-medium text-gray-700">
            <Check className="h-3.5 w-3.5 text-emerald-600" /> On Way
          </button>
          <button className="rounded-full h-8 w-8 border border-gray-200 flex items-center justify-center">
            <Phone className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <button className="rounded-full h-8 w-8 border border-gray-200 flex items-center justify-center">
            <MessageSquare className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Collapsible schedule/timeline
const CollapsibleSchedule = ({ defaultOpen = false }: { defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#0075c9]" />
          <span className="text-[15px] font-semibold text-gray-900">Today's Schedule</span>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{mock.timeline.length}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">
              {mock.timeline.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < mock.timeline.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.done ? "bg-emerald-400" : item.isNext ? "bg-[#0075c9] ring-2 ring-[#0075c9]/20" : "bg-gray-200"}`} />
                  <span className={`text-[13px] w-12 ${item.done ? "text-gray-400" : "text-gray-500"}`}>{item.time}</span>
                  <span className={`text-[15px] font-medium flex-1 ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.pupil}</span>
                  <span className="text-[11px] text-gray-400">{item.postcode}</span>
                  {item.isNext && <span className="text-[11px] font-medium text-[#0075c9] bg-[#0075c9]/10 px-2 py-0.5 rounded-full">Next</span>}
                  {item.done && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
                  {!item.done && !item.isNext && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quick Actions with REAL icons (all tiles)
const QuickActionsGrid = ({ cols = 4, maxTiles = 20 }: { cols?: number; maxTiles?: number }) => {
  const tiles = mock.quickActions.slice(0, maxTiles);
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Quick Actions</p>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className={`grid grid-cols-${cols} gap-y-4 gap-x-2`}>
          {tiles.map(q => {
            const hasCustomIcon = !!customIconImages[q.id];
            const FallbackIcon = iconMap[q.icon] || Calendar;
            const badgeCount = q.id === "jobs" ? mock.pendingJobs : q.id === "messages" ? mock.unread : 0;
            return (
              <div key={q.id} className="flex flex-col items-center gap-1.5 relative">
                <div className="relative w-[52px] h-[52px] rounded-[14px] flex items-center justify-center overflow-hidden bg-gray-50">
                  {hasCustomIcon ? (
                    <img src={customIconImages[q.id]} alt={q.title} className="w-full h-full object-cover rounded-[14px]" />
                  ) : (
                    <FallbackIcon className="h-5 w-5 text-[#0075c9]" />
                  )}
                  {badgeCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500 font-medium text-center line-clamp-1 max-w-[60px]">{q.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Agenda/Weekly progress
const Agenda = () => (
  <div className="bg-white rounded-2xl shadow-sm p-4">
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[15px] font-semibold text-gray-900">This Week</span>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </div>
    <div className="h-2 bg-gray-100 rounded-full">
      <div className="h-full bg-[#0075c9] rounded-full" style={{ width: `${mock.weeklyProgress}%` }} />
    </div>
    <p className="text-[13px] text-gray-500 mt-1.5">{mock.weeklyProgress}% of weekly goal</p>
  </div>
);

const PlanAhead = () => (
  <div>
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
);

// ══════════════════════════════════════════════════
// CONCEPT A: Classic iOS Grouped
// ══════════════════════════════════════════════════
function ConceptA() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[200px]" />
      <div className="relative -mt-10 mx-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <GradientHeader rounded />
          <StatsGrid roundedBottom />
        </div>
      </div>
      <div className="px-4 mt-3"><Banners /></div>
      <div className="px-4 mt-5 space-y-4 pb-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
          <NextLessonCard />
        </div>
        <CollapsibleSchedule defaultOpen />
        <QuickActionsGrid />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CONCEPT B: iOS Settings / Profile Style
// ══════════════════════════════════════════════════
function ConceptB() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[180px]" overlay="from-black/40 via-black/20 to-transparent" />
      <div className="-mt-14 flex flex-col items-center relative z-10 mb-4">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#0075c9] to-[#005a9e] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
          {mock.initials}
        </div>
        <h2 className="text-[17px] font-bold text-gray-900 mt-2">{greeting}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
          </span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <CloudSun className="h-3 w-3" /> {mock.weather.temp}°C
          </span>
        </div>
      </div>
      {/* Stats as iOS list */}
      <div className="mx-4">
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {[
            { Icon: BookOpen, v: `${mock.lessons} lessons today`, l: "Schedule", ic: "text-[#0075c9]", ibg: "bg-[#0075c9]/10" },
            { Icon: PoundSterling, v: `£${mock.earnings} expected`, l: "Earnings", ic: "text-emerald-600", ibg: "bg-emerald-500/10" },
            { Icon: Target, v: `${mock.weeklyProgress}% of goal`, l: "Weekly Progress", ic: "text-violet-600", ibg: "bg-violet-500/10" },
            { Icon: Timer, v: `${mock.nextLesson.time} — ${mock.nextLesson.pupil}`, l: "Next Lesson", ic: "text-amber-600", ibg: "bg-amber-500/10" },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-3 px-4 py-3">
              <div className={`h-8 w-8 rounded-lg ${s.ibg} flex items-center justify-center`}>
                <s.Icon className={`h-4 w-4 ${s.ic}`} />
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
      <div className="px-4 mt-5 space-y-4 pb-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
          <NextLessonCard />
        </div>
        <CollapsibleSchedule />
        <QuickActionsGrid />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CONCEPT C: iOS Widget Board
// ══════════════════════════════════════════════════
function ConceptC() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[200px]" />
      <div className="-mt-14 px-5 relative z-10 mb-3">
        <p className="text-white text-[22px] font-bold drop-shadow-lg">{greeting}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-white/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online</span>
          <span className="text-[11px] text-white/60"><CloudSun className="h-3 w-3 inline" /> {mock.weather.temp}°C</span>
        </div>
      </div>
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
      <div className="px-4 mt-5 space-y-4 pb-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
          <NextLessonCard />
        </div>
        <CollapsibleSchedule defaultOpen />
        <QuickActionsGrid />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CONCEPT D: iOS Maps / Weather — Glass header
// ══════════════════════════════════════════════════
function ConceptD() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[160px]" overlay="from-[#f2f2f7] via-transparent to-transparent" />
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
      <div className="px-4 mt-5 space-y-4 pb-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
          <NextLessonCard />
        </div>
        <CollapsibleSchedule />
        <QuickActionsGrid />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CONCEPT E: iOS Health / Fitness — Activity Ring
// ══════════════════════════════════════════════════
function ConceptE() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[180px]" overlay="from-black/50 to-transparent" />
      <div className="-mt-12 mx-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <GradientHeader rounded />
          <div className="p-4 flex items-center gap-4">
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
      <div className="px-4 mt-5 space-y-4 pb-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
          <NextLessonCard />
        </div>
        <CollapsibleSchedule defaultOpen />
        <QuickActionsGrid />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CONCEPT F: iOS Wallet Style — Stacked cards
// ══════════════════════════════════════════════════
function ConceptF() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[180px]" overlay="from-black/30 to-transparent" />
      <div className="-mt-10 mx-4 relative z-10 space-y-2">
        <div className="bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">{mock.initials}</div>
            <div>
              <h2 className="text-[15px] font-semibold">{mock.firstName}'s Dashboard</h2>
              <div className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                <span><CloudSun className="h-3 w-3 inline" /> {mock.weather.temp}°C</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { v: mock.lessons, l: "Lessons" },
              { v: `£${mock.earnings}`, l: "Earned" },
              { v: `${mock.weeklyProgress}%`, l: "Goal" },
              { v: `${mock.streak}🔥`, l: "Streak" },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-[17px] font-bold">{s.v}</p>
                <p className="text-[10px] text-white/60 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 mt-3"><Banners /></div>
      <div className="px-4 mt-5 space-y-4 pb-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
          <NextLessonCard />
        </div>
        <CollapsibleSchedule />
        <QuickActionsGrid />

        {/* Vehicle Health */}
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Vehicle Health</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
              <div className="h-10 w-10 rounded-[12px] overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                <img src={vehicleHealthIcon} alt="Vehicle" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-gray-900">Ford Fiesta</p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                  </span>
                  <span className="text-[11px] text-gray-400">• Battery 87%</span>
                </div>
              </div>
              <div className="bg-[#003a70] rounded-lg px-2.5 py-1">
                <span className="text-white text-[11px] font-bold tracking-wider">AB12 CDE</span>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {[
                { v: "24,350", l: "km total", ic: "text-[#0075c9]" },
                { v: "0 km/h", l: "speed", ic: "text-emerald-500" },
                { v: "MOT OK", l: "expires Dec", ic: "text-amber-500" },
              ].map(s => (
                <div key={s.l} className="py-3 text-center">
                  <p className={`text-[14px] font-bold ${s.ic}`}>{s.v}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[12px] text-gray-500">Service in 1,650 km</span>
              <div className="flex-1 mx-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: "82%" }} />
              </div>
              <span className="text-[11px] font-medium text-amber-600">Due Soon</span>
            </div>
          </div>
        </div>

        {/* Agenda */}
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Agenda</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative">
              <div className="absolute left-[27px] top-3 bottom-3 w-[2px] bg-gray-100" />
              {[
                { time: "08:30", title: "Check car & mirrors", type: "reminder", done: true },
                ...mock.timeline.map(t => ({ time: t.time, title: `Lesson — ${t.pupil}`, type: "lesson", done: t.done, isNext: t.isNext, postcode: t.postcode })),
                { time: "18:00", title: "Log mileage & expenses", type: "reminder", done: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-2.5 relative ${i === 0 ? "pt-3" : ""}`}>
                  <div className={`relative z-10 mt-0.5 h-3 w-3 rounded-full shrink-0 border-2 ${
                    item.done ? "bg-emerald-400 border-emerald-400" :
                    (item as any).isNext ? "bg-[#0075c9] border-[#0075c9] ring-2 ring-[#0075c9]/20" :
                    item.type === "reminder" ? "bg-amber-400 border-amber-400" :
                    "bg-white border-gray-300"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] ${item.done ? "text-gray-400" : "text-gray-500"}`}>{item.time}</span>
                      {item.type === "reminder" && <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Reminder</span>}
                      {(item as any).isNext && <span className="text-[9px] font-semibold uppercase tracking-wider text-[#0075c9] bg-[#0075c9]/10 px-1.5 py-0.5 rounded">Next</span>}
                    </div>
                    <p className={`text-[14px] font-medium mt-0.5 ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.title}</p>
                    {(item as any).postcode && <p className="text-[11px] text-gray-400 mt-0.5">{(item as any).postcode}</p>}
                  </div>
                  {item.done && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CONCEPT G: iOS Music / Podcast — Large art, minimal
// ══════════════════════════════════════════════════
function ConceptG() {
  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full">
      <Hero h="h-[240px]" overlay="from-black/60 via-black/30 to-transparent" />
      <div className="-mt-24 px-5 relative z-10 mb-4">
        <p className="text-white/70 text-[13px] font-medium">Today</p>
        <h2 className="text-white text-[28px] font-bold leading-tight mt-1">{greeting}</h2>
        <div className="flex items-center gap-3 mt-3">
          {[
            { v: mock.lessons, l: "lessons" },
            { v: `£${mock.earnings}`, l: "earnings" },
            { v: `${mock.weeklyProgress}%`, l: "goal" },
          ].map(s => (
            <div key={s.l} className="bg-white/15 backdrop-blur-md rounded-xl px-3 py-1.5">
              <span className="text-white text-[13px] font-bold">{s.v}</span>
              <span className="text-white/60 text-[11px] ml-1">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4"><Banners /></div>
      <div className="px-4 mt-5 space-y-4 pb-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Your Day</p>
          <NextLessonCard />
        </div>
        <CollapsibleSchedule defaultOpen />
        <QuickActionsGrid />
        <Agenda />
        <PlanAhead />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CONCEPT H: iOS Wallet v2 — Tabbed with Vehicle Health under Messages
// ══════════════════════════════════════════════════
function ConceptH() {
  const [activeTab, setActiveTab] = useState<"home" | "schedule" | "messages" | "agenda">("home");
  const tabs = [
    { id: "home" as const, label: "Home", Icon: Heart },
    { id: "schedule" as const, label: "Schedule", Icon: Calendar },
    { id: "messages" as const, label: "Messages", Icon: MessageSquare },
    { id: "agenda" as const, label: "Agenda", Icon: ListTodo },
  ];

  return (
    <div style={{ backgroundColor: IOS_BG }} className="min-h-full flex flex-col">
      {/* Wallet-style stacked header */}
      <Hero h="h-[170px]" overlay="from-black/40 to-transparent" />
      <div className="-mt-12 mx-4 relative z-10 space-y-2">
        {/* Main wallet card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl p-4 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-sm border border-white/10">{mock.initials}</div>
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold">{mock.firstName}'s Dashboard</h2>
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                <span><CloudSun className="h-3 w-3 inline" /> {mock.weather.temp}°C</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: mock.lessons, l: "Lessons", accent: "text-sky-300" },
              { v: `£${mock.earnings}`, l: "Earned", accent: "text-emerald-300" },
              { v: `${mock.weeklyProgress}%`, l: "Goal", accent: "text-violet-300" },
              { v: `${mock.streak}🔥`, l: "Streak", accent: "text-amber-300" },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className={`text-[17px] font-bold ${s.accent}`}>{s.v}</p>
                <p className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-1 flex">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all ${
              activeTab === t.id ? "bg-[#0075c9] text-white shadow-sm" : "text-gray-400"
            }`}
          >
            <t.Icon className="h-3.5 w-3.5" />
            {t.label}
            {t.id === "messages" && mock.unread > 0 && (
              <span className={`min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                activeTab === "messages" ? "bg-white/30 text-white" : "bg-red-500 text-white"
              }`}>{mock.unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 mt-3 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              <Banners />
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Next Up</p>
                <NextLessonCard />
              </div>
              <QuickActionsGrid />
              <PlanAhead />
            </motion.div>
          )}

          {activeTab === "schedule" && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              <CollapsibleSchedule defaultOpen />
              <PlanAhead />
            </motion.div>
          )}

          {activeTab === "messages" && (
            <motion.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              {/* Messages section */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                  <span className="text-[15px] font-semibold text-gray-900">Messages</span>
                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{mock.unread}</span>
                </div>
                {[
                  { name: "James W.", msg: "Can we move to 11am?", time: "2m ago", unread: true },
                  { name: "Alice B.", msg: "Thanks for today!", time: "1h ago", unread: true },
                  { name: "Maria G.", msg: "See you tomorrow", time: "3h ago", unread: true },
                  { name: "Tom S.", msg: "Running 5 mins late", time: "Yesterday", unread: false },
                ].map((m, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? "border-b border-gray-50" : ""}`}>
                    <div className="h-9 w-9 rounded-full bg-[#0075c9]/10 flex items-center justify-center text-[#0075c9] font-bold text-xs shrink-0">
                      {m.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-[14px] ${m.unread ? "font-semibold text-gray-900" : "font-medium text-gray-600"}`}>{m.name}</p>
                        <span className="text-[11px] text-gray-400">{m.time}</span>
                      </div>
                      <p className={`text-[13px] truncate ${m.unread ? "text-gray-700" : "text-gray-400"}`}>{m.msg}</p>
                    </div>
                    {m.unread && <span className="w-2 h-2 rounded-full bg-[#0075c9] shrink-0" />}
                  </div>
                ))}
              </div>

              {/* Vehicle Health — under messages tab */}
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400 px-1 mb-2">Vehicle Health</p>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                    <div className="h-10 w-10 rounded-[12px] overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                      <img src={vehicleHealthIcon} alt="Vehicle" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-gray-900">Ford Fiesta</p>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                        </span>
                        <span className="text-[11px] text-gray-400">• Battery 87%</span>
                      </div>
                    </div>
                    <div className="bg-[#003a70] rounded-lg px-2.5 py-1">
                      <span className="text-white text-[11px] font-bold tracking-wider">AB12 CDE</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-100">
                    {[
                      { v: "24,350", l: "km total", ic: "text-[#0075c9]" },
                      { v: "0 km/h", l: "speed", ic: "text-emerald-500" },
                      { v: "MOT OK", l: "expires Dec", ic: "text-amber-500" },
                    ].map(s => (
                      <div key={s.l} className="py-3 text-center">
                        <p className={`text-[14px] font-bold ${s.ic}`}>{s.v}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">Service in 1,650 km</span>
                    <div className="flex-1 mx-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: "82%" }} />
                    </div>
                    <span className="text-[11px] font-medium text-amber-600">Due Soon</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "agenda" && (
            <motion.div key="agenda" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              {/* Agenda timeline */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-[#0075c9]" />
                    <span className="text-[15px] font-semibold text-gray-900">Today's Agenda</span>
                  </div>
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{mock.timeline.length + 2} items</span>
                </div>
                {/* Combined lessons + reminders */}
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[27px] top-3 bottom-3 w-[2px] bg-gray-100" />
                  {[
                    { time: "08:30", title: "Check car & mirrors", type: "reminder", done: true },
                    ...mock.timeline.map(t => ({ time: t.time, title: `Lesson — ${t.pupil}`, type: "lesson", done: t.done, isNext: t.isNext, postcode: t.postcode })),
                    { time: "18:00", title: "Log mileage & expenses", type: "reminder", done: false },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 px-4 py-2.5 relative ${i === 0 ? "pt-3" : ""}`}>
                      <div className={`relative z-10 mt-0.5 h-3 w-3 rounded-full shrink-0 border-2 ${
                        item.done ? "bg-emerald-400 border-emerald-400" :
                        (item as any).isNext ? "bg-[#0075c9] border-[#0075c9] ring-2 ring-[#0075c9]/20" :
                        item.type === "reminder" ? "bg-amber-400 border-amber-400" :
                        "bg-white border-gray-300"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[13px] ${item.done ? "text-gray-400" : "text-gray-500"}`}>{item.time}</span>
                          {item.type === "reminder" && <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Reminder</span>}
                          {(item as any).isNext && <span className="text-[9px] font-semibold uppercase tracking-wider text-[#0075c9] bg-[#0075c9]/10 px-1.5 py-0.5 rounded">Next</span>}
                        </div>
                        <p className={`text-[14px] font-medium mt-0.5 ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>{item.title}</p>
                        {(item as any).postcode && <p className="text-[11px] text-gray-400 mt-0.5">{(item as any).postcode}</p>}
                      </div>
                      {item.done && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />}
                    </div>
                  ))}
                </div>
              </div>

              <Agenda />
              <PlanAhead />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// Demo shell
// ══════════════════════════════════════════════════
const concepts = [
  { id: "A", name: "Classic iOS Grouped", desc: "System bg, grouped inset cards, clear separators", Component: ConceptA },
  { id: "B", name: "iOS Settings Style", desc: "Centred profile, list-row stats, disclosure arrows", Component: ConceptB },
  { id: "C", name: "iOS Widget Board", desc: "Floating greeting on hero, large widget stat cards", Component: ConceptC },
  { id: "D", name: "iOS Maps / Weather", desc: "Blurred glass header, horizontal stat pills", Component: ConceptD },
  { id: "E", name: "iOS Health / Fitness", desc: "Activity ring progress, gradient header, clean cards", Component: ConceptE },
  { id: "F", name: "iOS Wallet Style", desc: "Stacked gradient card, compact stats, wallet feel", Component: ConceptF },
  { id: "G", name: "iOS Music / Podcast", desc: "Large hero art, overlay text, frosted stat pills", Component: ConceptG },
  { id: "H", name: "iOS Wallet v2 — Tabbed", desc: "Dark wallet card, tabbed nav, vehicle health under messages, agenda tab", Component: ConceptH },
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
          <h1 className="text-base font-semibold">iOS Redesign Preview</h1>
          <span className="text-sm text-gray-500">{selected + 1}/{concepts.length}</span>
        </div>
      </div>

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

          <div className="w-full mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">All Concepts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
