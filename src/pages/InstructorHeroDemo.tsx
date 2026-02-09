import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  CloudSun,
  Sun,
  Clock,
  TrendingUp,
  PoundSterling,
  BookOpen,
  MapPin,
  Car,
  Calendar,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

// ── Mock data ────────────────────────────────────────────────────
const MOCK = {
  firstName: "Sarah",
  weather: { temperature: 18, icon: "CloudSun", description: "Partly Cloudy" },
  traffic: { condition: "Light" as const, delay: 0 },
  weekly: { hoursThisWeek: 24, hoursGoal: 42, progressPercent: 57 },
  today: { lessonCount: 6, totalHours: 8, expectedEarnings: 280, completedLessons: 2 },
  tomorrow: { lessonCount: 5, firstLessonTime: "08:30" },
  location: "Coventry",
  unreadMessages: 3,
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
};

const greetingText: Record<string, string> = {
  morning: `Ready to teach, ${MOCK.firstName}?`,
  afternoon: `Keep going, ${MOCK.firstName}!`,
  evening: `Great work, ${MOCK.firstName}!`,
  night: `Ready to teach, ${MOCK.firstName}?`,
};

const period = getGreeting();

// ── Shared components ────────────────────────────────────────────
const WeatherPill = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
    <CloudSun className="h-3.5 w-3.5" />
    {MOCK.weather.temperature}°C · {MOCK.weather.description}
  </span>
);

const TrafficPill = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
    🟢 {MOCK.traffic.condition} traffic
  </span>
);

const CircularRing = ({
  size = 72,
  strokeWidth = 5,
  className = "",
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (MOCK.weekly.progressPercent / 100) * circ;
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
          className="text-emerald-500"
          stroke="currentColor"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circ }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground leading-none">
          {MOCK.weekly.hoursThisWeek}<span className="text-sm">h</span>
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">{MOCK.weekly.progressPercent}%</span>
      </div>
    </div>
  );
};

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-sm font-bold tracking-widest uppercase text-primary">{label}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

// ── Option A: Glassmorphism Card ─────────────────────────────────
function OptionA() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-2xl">
      {/* Full-bleed hero */}
      <div className="relative h-[260px]">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Floating pills */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <WeatherPill className="bg-white/20 backdrop-blur-md text-white border border-white/10" />
          <TrafficPill className="bg-white/20 backdrop-blur-md text-white border border-white/10" />
        </div>

        {/* Greeting over image */}
        <div className="absolute bottom-16 left-4 right-4">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">{greetingText[period]}</h2>
        </div>
      </div>

      {/* Frosted glass stats card — overlapping */}
      <div className="relative -mt-10 mx-3">
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/30 dark:border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Weekly Progress</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {MOCK.weekly.hoursThisWeek}<span className="text-lg text-muted-foreground font-normal">/{MOCK.weekly.hoursGoal}h</span>
              </p>
              {/* Thin progress bar */}
              <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${MOCK.weekly.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="ml-4 text-right">
              <p className="text-2xl font-bold text-emerald-600">{MOCK.weekly.progressPercent}%</p>
              <p className="text-[10px] text-muted-foreground">of goal</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30">
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{MOCK.today.lessonCount}</p>
              <p className="text-[10px] text-muted-foreground">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{MOCK.today.totalHours}h</p>
              <p className="text-[10px] text-muted-foreground">Hours</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">£{MOCK.today.expectedEarnings}</p>
              <p className="text-[10px] text-muted-foreground">Expected</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Option B: Gradient Dashboard ─────────────────────────────────
function OptionB() {
  const gradientMap: Record<string, string> = {
    morning: "from-amber-200 via-orange-100 to-yellow-50 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-background",
    afternoon: "from-sky-200 via-blue-100 to-cyan-50 dark:from-sky-900/40 dark:via-blue-900/30 dark:to-background",
    evening: "from-violet-200 via-purple-100 to-pink-50 dark:from-violet-900/40 dark:via-purple-900/30 dark:to-background",
    night: "from-slate-800 via-indigo-900 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-black",
  };
  const isNight = period === "night";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className={`rounded-2xl bg-gradient-to-br ${gradientMap[period]} p-5 pb-4`}>
      {/* Greeting */}
      <h2 className={`text-xl font-bold ${isNight ? "text-white" : "text-foreground"}`}>{greetingText[period]}</h2>
      <p className={`text-sm mt-1 ${isNight ? "text-white/70" : "text-muted-foreground"}`}>
        <CloudSun className="inline h-3.5 w-3.5 mr-1" />
        {MOCK.weather.temperature}°C, {MOCK.weather.description} · 🟢 {MOCK.traffic.condition} traffic
      </p>

      {/* Centered ring */}
      <div className="flex justify-center my-5">
        <CircularRing size={120} strokeWidth={8} />
      </div>

      {/* Scrollable stat cards */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {[
          { icon: BookOpen, label: "Lessons", value: `${MOCK.today.lessonCount}`, color: "text-primary", bg: "bg-primary/10" },
          { icon: Clock, label: "Hours", value: `${MOCK.today.totalHours}h`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
          { icon: PoundSterling, label: "Earnings", value: `£${MOCK.today.expectedEarnings}`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
          { icon: TrendingUp, label: "Weekly", value: `${MOCK.weekly.progressPercent}%`, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
        ].map((s) => (
          <div key={s.label} className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/60 dark:bg-card/60 backdrop-blur-sm border border-white/30 dark:border-border/30 min-w-[110px]">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <p className="text-sm font-semibold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Option C: Split Hero ─────────────────────────────────────────
function OptionC() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
      <div className="flex rounded-2xl overflow-hidden shadow-lg">
        {/* Left panel */}
        <div className="w-[40%] bg-slate-900 dark:bg-slate-950 p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{greetingText[period]}</h2>
            <p className="text-sm text-slate-300 mt-2">
              {MOCK.weekly.hoursThisWeek}h / {MOCK.weekly.hoursGoal}h
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">weekly goal</p>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-1.5">
              <CloudSun className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-slate-300">{MOCK.weather.temperature}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-emerald-400">🟢 {MOCK.traffic.condition}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-400">{MOCK.location}</span>
            </div>
          </div>
        </div>

        {/* Right image */}
        <div className="w-[60%] h-[220px]">
          <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Full-width progress bar */}
      <div className="mt-2 mx-1">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{MOCK.weekly.hoursThisWeek}h completed</span>
          <span>{MOCK.weekly.hoursGoal}h goal</span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${MOCK.weekly.progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Option D: Compact Status Bar ─────────────────────────────────
function OptionD() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
      {/* Top row */}
      <div className="p-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{greetingText[period]}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {MOCK.weekly.hoursGoal - MOCK.weekly.hoursThisWeek}h remaining this week
          </p>
        </div>
        <CircularRing size={48} strokeWidth={4} />
      </div>

      {/* Pills row */}
      <div className="px-4 pb-3 flex gap-2 flex-wrap">
        <WeatherPill className="bg-muted/50 text-foreground" />
        <TrafficPill className="bg-muted/50 text-foreground" />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-foreground">
          <Clock className="h-3.5 w-3.5" /> {MOCK.weekly.hoursThisWeek}h / {MOCK.weekly.hoursGoal}h
        </span>
        {MOCK.unreadMessages > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <MessageCircle className="h-3.5 w-3.5" /> {MOCK.unreadMessages}
          </span>
        )}
      </div>

      {/* Expandable drawer */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-center py-1.5 border-t border-border/50 hover:bg-muted/30 transition-colors"
      >
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {[
                { icon: BookOpen, label: "Lessons", value: `${MOCK.today.lessonCount}`, bg: "bg-primary/5" },
                { icon: Clock, label: "Teaching", value: `${MOCK.today.totalHours}h`, bg: "bg-blue-500/5" },
                { icon: PoundSterling, label: "Expected", value: `£${MOCK.today.expectedEarnings}`, bg: "bg-emerald-500/5" },
                { icon: Calendar, label: "Tomorrow", value: `${MOCK.tomorrow.lessonCount} lessons`, bg: "bg-violet-500/5" },
              ].map((s) => (
                <div key={s.label} className={`flex items-center gap-2 p-2.5 rounded-lg ${s.bg}`}>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Demo Page ────────────────────────────────────────────────────
export default function InstructorHeroDemo() {
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-[430px] mx-auto space-y-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Hero Tile Redesign</h1>
          <p className="text-sm text-muted-foreground mt-1">4 options · mobile preview (390px)</p>
        </div>

        {/* Option A */}
        <div>
          <SectionLabel label="Option A — Glassmorphism Card" />
          <OptionA />
        </div>

        {/* Option B */}
        <div>
          <SectionLabel label="Option B — Gradient Dashboard" />
          <OptionB />
        </div>

        {/* Option C */}
        <div>
          <SectionLabel label="Option C — Split Hero" />
          <OptionC />
        </div>

        {/* Option D */}
        <div>
          <SectionLabel label="Option D — Compact Status Bar" />
          <OptionD />
        </div>
      </div>
    </div>
  );
}
