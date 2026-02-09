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
  Zap,
  Target,
  Flame,
  ArrowRight,
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

// ── Option E: Full Image Overlay ─────────────────────────────────
function OptionE() {
  const hoursRemaining = MOCK.weekly.hoursGoal - MOCK.weekly.hoursThisWeek;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="relative rounded-2xl overflow-hidden h-[200px]">
      <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{greetingText[period]}</h2>
          <div className="flex items-center gap-3 mt-2">
            <WeatherPill className="bg-white/15 backdrop-blur-sm text-white/90 border border-white/10 text-[11px]" />
            <TrafficPill className="bg-white/15 backdrop-blur-sm text-white/90 border border-white/10 text-[11px]" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-black text-white leading-none">{MOCK.weekly.hoursThisWeek}<span className="text-lg font-normal text-white/60">h</span></p>
            <p className="text-xs text-white/60 mt-1">{hoursRemaining}h to go · {MOCK.weekly.progressPercent}%</p>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 rounded-full ${i < Math.round(MOCK.weekly.progressPercent / 100 * 7) ? "bg-emerald-400 h-6" : "bg-white/20 h-4"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Option F: Metric Dashboard (No Image) ────────────────────────
function OptionF() {
  const hoursRemaining = MOCK.weekly.hoursGoal - MOCK.weekly.hoursThisWeek;
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header with greeting */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{greetingText[period]}</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {MOCK.location}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <CloudSun className="h-3.5 w-3.5 text-amber-500" />
          <span>{MOCK.weather.temperature}°C {MOCK.weather.description}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>🟢 {MOCK.traffic.condition}</span>
        </div>
      </div>

      {/* Large metric row */}
      <div className="px-4 pb-3 flex items-baseline gap-2">
        <span className="text-5xl font-black text-foreground tracking-tight">{MOCK.weekly.hoursThisWeek}</span>
        <span className="text-lg text-muted-foreground font-medium">/ {MOCK.weekly.hoursGoal}h</span>
        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <TrendingUp className="h-3 w-3" />
          {MOCK.weekly.progressPercent}%
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="px-4 pb-3 flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 h-2 rounded-full overflow-hidden bg-muted/30">
            {i < Math.round(MOCK.weekly.progressPercent / 100 * 7) && (
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom stat strip */}
      <div className="border-t border-border/50 grid grid-cols-4 divide-x divide-border/50">
        {[
          { label: "Lessons", value: MOCK.today.lessonCount },
          { label: "Hours", value: `${MOCK.today.totalHours}h` },
          { label: "Earned", value: `£${MOCK.today.expectedEarnings}` },
          { label: "Messages", value: MOCK.unreadMessages },
        ].map((s) => (
          <div key={s.label} className="py-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Option G: Stacked Banner ─────────────────────────────────────
function OptionG() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="space-y-2">
      {/* Image banner with greeting */}
      <div className="relative rounded-2xl overflow-hidden h-[140px]">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{greetingText[period]}</h2>
            <p className="text-xs text-white/70 mt-0.5">
              {MOCK.weather.temperature}°C · {MOCK.weather.description}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            🟢 {MOCK.traffic.condition}
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
        <CircularRing size={56} strokeWidth={4} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">{MOCK.weekly.hoursThisWeek}h</span>
            <span className="text-xs text-muted-foreground">/ {MOCK.weekly.hoursGoal}h weekly</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${MOCK.weekly.progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{MOCK.weekly.progressPercent}%</span>
          <span className="text-[10px] text-muted-foreground">goal</span>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: BookOpen, label: "Today", value: `${MOCK.today.lessonCount} lessons`, bg: "bg-primary/5", iconColor: "text-primary" },
          { icon: PoundSterling, label: "Expected", value: `£${MOCK.today.expectedEarnings}`, bg: "bg-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400" },
          { icon: MessageCircle, label: "Unread", value: `${MOCK.unreadMessages}`, bg: "bg-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl ${s.bg} border border-border/50 p-2.5 text-center`}>
            <s.icon className={`h-4 w-4 mx-auto ${s.iconColor}`} />
            <p className="text-sm font-semibold text-foreground mt-1">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Option H: Streak Card ────────────────────────────────────────
function OptionH() {
  const daysActive = 4; // mock: 4 out of 7 days active this week
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="rounded-2xl overflow-hidden">
      {/* Top gradient banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-700 dark:to-teal-600 p-4 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{greetingText[period]}</h2>
            <p className="text-sm text-white/80 mt-0.5">
              <Flame className="inline h-3.5 w-3.5 mr-1" />
              {daysActive}-day streak this week
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-white">{MOCK.weekly.progressPercent}%</p>
            <p className="text-[10px] text-white/70">weekly goal</p>
          </div>
        </div>

        {/* Day streak dots */}
        <div className="flex justify-between mt-4 px-2">
          {dayLabels.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < daysActive
                  ? "bg-white text-emerald-700"
                  : "bg-white/20 text-white/50"
              }`}>
                {i < daysActive ? "✓" : day}
              </div>
              <span className="text-[9px] text-white/60">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats body */}
      <div className="bg-card border-x border-b border-border rounded-b-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{MOCK.weekly.hoursThisWeek}h</span>
              <span className="text-sm text-muted-foreground">/ {MOCK.weekly.hoursGoal}h</span>
            </div>
            <div className="mt-1.5 h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${MOCK.weekly.progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CloudSun className="h-3.5 w-3.5 text-amber-500" />
            {MOCK.weather.temperature}°C
          </span>
          <span>·</span>
          <span>🟢 {MOCK.traffic.condition}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {MOCK.today.lessonCount} today
          </span>
          <span>·</span>
          <span>£{MOCK.today.expectedEarnings}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Option I: Glass Ticker (A variant) ───────────────────────────
function OptionI() {
  const hoursRemaining = MOCK.weekly.hoursGoal - MOCK.weekly.hoursThisWeek;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-2xl overflow-hidden">
      <div className="relative h-[200px]">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        
        {/* Top-left glass greeting */}
        <div className="absolute top-3 left-3 right-3">
          <div className="bg-white/15 backdrop-blur-lg rounded-xl px-3.5 py-2.5 border border-white/10">
            <h2 className="text-base font-bold text-white">{greetingText[period]}</h2>
            <p className="text-[11px] text-white/70 mt-0.5">{hoursRemaining}h remaining of {MOCK.weekly.hoursGoal}h weekly goal</p>
          </div>
        </div>

        {/* Bottom ticker strip */}
        <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur-md px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-bold">{MOCK.weekly.hoursThisWeek}h</span>
            <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${MOCK.weekly.progressPercent}%` }} transition={{ duration: 0.8 }} />
            </div>
            <span className="text-white/60 text-xs">{MOCK.weekly.progressPercent}%</span>
          </div>
          <div className="flex gap-2">
            <span className="text-white/80 text-[11px]"><CloudSun className="inline h-3 w-3 mr-0.5" />{MOCK.weather.temperature}°C</span>
            <span className="text-emerald-400 text-[11px]">🟢</span>
          </div>
        </div>
      </div>

      {/* Below-image stats */}
      <div className="bg-card border border-t-0 border-border rounded-b-2xl grid grid-cols-4 divide-x divide-border/50">
        {[
          { v: MOCK.today.lessonCount, l: "Lessons" },
          { v: `${MOCK.today.totalHours}h`, l: "Hours" },
          { v: `£${MOCK.today.expectedEarnings}`, l: "Expected" },
          { v: MOCK.unreadMessages, l: "Messages" },
        ].map((s) => (
          <div key={s.l} className="py-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{s.v}</p>
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Option J: Cinematic Overlay (E variant) ──────────────────────
function OptionJ() {
  const hoursRemaining = MOCK.weekly.hoursGoal - MOCK.weekly.hoursThisWeek;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-2xl overflow-hidden h-[240px]">
      <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {/* Top: weather & traffic as minimal text */}
      <div className="absolute top-3 left-4 right-4 flex justify-between items-center">
        <span className="text-[11px] text-white/70"><CloudSun className="inline h-3 w-3 mr-1 text-amber-400" />{MOCK.weather.temperature}°C {MOCK.weather.description}</span>
        <span className="text-[11px] text-emerald-400 font-medium">🟢 {MOCK.traffic.condition}</span>
      </div>

      {/* Bottom: all content */}
      <div className="absolute bottom-0 inset-x-0 p-4">
        <h2 className="text-xl font-bold text-white">{greetingText[period]}</h2>
        
        {/* Progress row */}
        <div className="mt-3 flex items-center gap-3">
          <CircularRing size={52} strokeWidth={4} />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">{MOCK.weekly.hoursThisWeek}h</span>
              <span className="text-xs text-white/50">/ {MOCK.weekly.hoursGoal}h</span>
            </div>
            <div className="mt-1 h-1 bg-white/15 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${MOCK.weekly.progressPercent}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        </div>

        {/* Bottom stat pills */}
        <div className="mt-3 flex gap-2">
          {[
            `${MOCK.today.lessonCount} lessons`,
            `£${MOCK.today.expectedEarnings}`,
            `${MOCK.unreadMessages} msgs`,
          ].map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-white/80 font-medium">{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Option K: Minimal Glass Band (A variant) ─────────────────────
function OptionK() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-2xl overflow-hidden">
      <div className="relative h-[280px]">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Centered glass band */}
        <div className="absolute inset-x-4 bottom-4">
          <div className="bg-white/20 backdrop-blur-2xl rounded-2xl p-4 border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">{greetingText[period]}</h2>
              <CircularRing size={44} strokeWidth={3} />
            </div>
            
            {/* Inline weather + traffic */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] text-white/80"><CloudSun className="inline h-3 w-3 mr-1" />{MOCK.weather.temperature}°C</span>
              <span className="text-white/30">·</span>
              <span className="text-[11px] text-emerald-400">🟢 {MOCK.traffic.condition}</span>
              <span className="text-white/30">·</span>
              <span className="text-[11px] text-white/70"><MapPin className="inline h-3 w-3 mr-0.5" />{MOCK.location}</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { v: MOCK.today.lessonCount, l: "Lessons" },
                { v: `${MOCK.today.totalHours}h`, l: "Hours" },
                { v: `£${MOCK.today.expectedEarnings}`, l: "Earned" },
                { v: `${MOCK.weekly.progressPercent}%`, l: "Goal" },
              ].map((s) => (
                <div key={s.l} className="text-center bg-white/10 rounded-lg py-1.5">
                  <p className="text-sm font-bold text-white">{s.v}</p>
                  <p className="text-[9px] text-white/60">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Option L: Bold Image + Detached Card (E variant) ─────────────
function OptionL() {
  const [expanded, setExpanded] = useState(false);
  const hoursRemaining = MOCK.weekly.hoursGoal - MOCK.weekly.hoursThisWeek;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-2">
      {/* Image with bold overlay text only */}
      <div className="relative rounded-2xl overflow-hidden h-[160px]">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent" />
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <h2 className="text-2xl font-black text-white leading-tight">{greetingText[period]}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-white/70"><CloudSun className="inline h-3 w-3 mr-0.5 text-amber-400" />{MOCK.weather.temperature}°C</span>
            <span className="text-[11px] text-emerald-400">🟢 {MOCK.traffic.condition}</span>
          </div>
        </div>
      </div>

      {/* Detached progress card */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-3.5 flex items-center gap-3">
          <CircularRing size={56} strokeWidth={4} />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{MOCK.weekly.hoursThisWeek}h</span>
              <span className="text-xs text-muted-foreground">/ {MOCK.weekly.hoursGoal}h</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{hoursRemaining}h remaining this week</p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-3.5 pb-3.5 grid grid-cols-4 gap-1.5">
                {[
                  { v: MOCK.today.lessonCount, l: "Lessons", bg: "bg-primary/5" },
                  { v: `${MOCK.today.totalHours}h`, l: "Hours", bg: "bg-blue-500/5" },
                  { v: `£${MOCK.today.expectedEarnings}`, l: "Earned", bg: "bg-emerald-500/5" },
                  { v: MOCK.unreadMessages, l: "Msgs", bg: "bg-violet-500/5" },
                ].map((s) => (
                  <div key={s.l} className={`${s.bg} rounded-lg py-2 text-center`}>
                    <p className="text-sm font-bold text-foreground">{s.v}</p>
                    <p className="text-[9px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Option M: Glass Ticker + Ring (I variant) ────────────────────
function OptionM() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-2xl overflow-hidden">
      <div className="relative h-[220px]">
        <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

        {/* Top glass bar: greeting + ring */}
        <div className="absolute top-3 left-3 right-3">
          <div className="bg-white/15 backdrop-blur-lg rounded-xl px-3.5 py-2 border border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">{greetingText[period]}</h2>
              <p className="text-[10px] text-white/60 mt-0.5">{MOCK.weekly.hoursGoal - MOCK.weekly.hoursThisWeek}h to weekly goal</p>
            </div>
            <CircularRing size={40} strokeWidth={3} />
          </div>
        </div>

        {/* Bottom glass ticker with more detail */}
        <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur-md px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-white/80">{MOCK.weather.temperature}°C</span>
            <span className="text-white/30">·</span>
            <span className="text-[11px] text-emerald-400">🟢 {MOCK.traffic.condition}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3 text-blue-400" />
            <span className="text-[11px] text-white/80">{MOCK.unreadMessages}</span>
          </div>
        </div>
      </div>

      {/* Stat strip below */}
      <div className="bg-card border border-t-0 border-border rounded-b-2xl grid grid-cols-3 divide-x divide-border/50">
        {[
          { v: `${MOCK.today.lessonCount} lessons`, l: "Today" },
          { v: `${MOCK.today.totalHours}h`, l: "Teaching" },
          { v: `£${MOCK.today.expectedEarnings}`, l: "Expected" },
        ].map((s) => (
          <div key={s.l} className="py-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{s.v}</p>
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Option N: Dual Glass Bars (I variant) ────────────────────────
function OptionN() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-2xl overflow-hidden h-[240px]">
      <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

      {/* Top glass bar: greeting */}
      <div className="absolute top-3 left-3 right-3">
        <div className="bg-white/15 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10">
          <h2 className="text-lg font-bold text-white">{greetingText[period]}</h2>
          <div className="flex items-center gap-2 mt-1">
            <CloudSun className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-white/70">{MOCK.weather.temperature}°C, {MOCK.weather.description}</span>
            <span className="text-white/30">·</span>
            <span className="text-[11px] text-emerald-400">🟢 {MOCK.traffic.condition}</span>
          </div>
        </div>
      </div>

      {/* Bottom glass bar: progress + stats */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="bg-white/15 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">{MOCK.weekly.hoursThisWeek}h / {MOCK.weekly.hoursGoal}h</span>
            <span className="text-xs text-emerald-400 font-semibold">{MOCK.weekly.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
            <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${MOCK.weekly.progressPercent}%` }} transition={{ duration: 0.8 }} />
          </div>
          <div className="flex justify-between mt-2">
            {[
              { v: MOCK.today.lessonCount, l: "Lessons" },
              { v: `${MOCK.today.totalHours}h`, l: "Hours" },
              { v: `£${MOCK.today.expectedEarnings}`, l: "Earned" },
              { v: MOCK.unreadMessages, l: "Msgs" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-xs font-bold text-white">{s.v}</p>
                <p className="text-[9px] text-white/50">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Option O: Glass Side Panel (I variant) ───────────────────────
function OptionO() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-2xl overflow-hidden h-[220px]">
      <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      {/* Left glass panel */}
      <div className="absolute top-3 bottom-3 left-3 w-[55%]">
        <div className="h-full bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 p-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{greetingText[period]}</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <CloudSun className="h-3 w-3 text-amber-400" />
              <span className="text-[11px] text-white/70">{MOCK.weather.temperature}°C</span>
              <span className="text-white/30">·</span>
              <span className="text-[11px] text-emerald-400">🟢</span>
            </div>
          </div>

          {/* Mini progress */}
          <div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-lg font-bold text-white">{MOCK.weekly.hoursThisWeek}h</span>
              <span className="text-[10px] text-white/50">/ {MOCK.weekly.hoursGoal}h</span>
            </div>
            <div className="h-1 bg-white/15 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${MOCK.weekly.progressPercent}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>

          {/* Compact stats */}
          <div className="grid grid-cols-2 gap-1">
            {[
              { v: MOCK.today.lessonCount, l: "Lessons" },
              { v: `£${MOCK.today.expectedEarnings}`, l: "Earned" },
            ].map((s) => (
              <div key={s.l} className="bg-white/10 rounded-md py-1 text-center">
                <p className="text-xs font-bold text-white">{s.v}</p>
                <p className="text-[8px] text-white/50">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Option P: Floating Glass Cards (I variant) ──────────────────
function OptionP() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative rounded-2xl overflow-hidden h-[260px]">
      <img src={instructorHeroImg} alt="Hero" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />

      {/* Floating greeting chip */}
      <div className="absolute top-3 left-3">
        <div className="bg-white/15 backdrop-blur-lg rounded-full px-4 py-1.5 border border-white/10">
          <span className="text-sm font-semibold text-white">{greetingText[period]}</span>
        </div>
      </div>

      {/* Floating context chips - top right */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <div className="bg-white/15 backdrop-blur-lg rounded-full px-2.5 py-1 border border-white/10 flex items-center gap-1.5">
          <CloudSun className="h-3 w-3 text-amber-400" />
          <span className="text-[11px] text-white/80">{MOCK.weather.temperature}°C</span>
        </div>
        <div className="bg-white/15 backdrop-blur-lg rounded-full px-2.5 py-1 border border-white/10">
          <span className="text-[11px] text-emerald-400">🟢 {MOCK.traffic.condition}</span>
        </div>
      </div>

      {/* Bottom floating progress card */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="bg-white/15 backdrop-blur-xl rounded-xl border border-white/10 p-3 flex items-center gap-3">
          <CircularRing size={48} strokeWidth={3} />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-white">{MOCK.weekly.hoursThisWeek}h</span>
              <span className="text-[10px] text-white/50">/ {MOCK.weekly.hoursGoal}h</span>
            </div>
            <div className="mt-1 h-1 bg-white/15 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${MOCK.weekly.progressPercent}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            {[
              { v: MOCK.today.lessonCount, l: "lessons" },
              { v: `£${MOCK.today.expectedEarnings}`, l: "today" },
            ].map((s) => (
              <p key={s.l} className="text-[10px] text-white/80"><span className="font-bold">{s.v}</span> {s.l}</p>
            ))}
          </div>
        </div>
      </div>
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
          <p className="text-sm text-muted-foreground mt-1">16 options · mobile preview</p>
        </div>

        <div>
          <SectionLabel label="Option A — Glassmorphism Card" />
          <OptionA />
        </div>

        <div>
          <SectionLabel label="Option B — Gradient Dashboard" />
          <OptionB />
        </div>

        <div>
          <SectionLabel label="Option C — Split Hero" />
          <OptionC />
        </div>

        <div>
          <SectionLabel label="Option D — Compact Status Bar" />
          <OptionD />
        </div>

        <div>
          <SectionLabel label="Option E — Full Image Overlay" />
          <OptionE />
        </div>

        <div>
          <SectionLabel label="Option F — Metric Dashboard" />
          <OptionF />
        </div>

        <div>
          <SectionLabel label="Option G — Stacked Banner" />
          <OptionG />
        </div>

        <div>
          <SectionLabel label="Option H — Streak Card" />
          <OptionH />
        </div>

        <div>
          <SectionLabel label="Option I — Glass Ticker" />
          <OptionI />
        </div>

        <div>
          <SectionLabel label="Option J — Cinematic Overlay" />
          <OptionJ />
        </div>

        <div>
          <SectionLabel label="Option K — Minimal Glass Band" />
          <OptionK />
        </div>

        <div>
          <SectionLabel label="Option L — Bold Image + Detached Card" />
          <OptionL />
        </div>

        <div>
          <SectionLabel label="Option M — Glass Ticker + Ring" />
          <OptionM />
        </div>

        <div>
          <SectionLabel label="Option N — Dual Glass Bars" />
          <OptionN />
        </div>

        <div>
          <SectionLabel label="Option O — Glass Side Panel" />
          <OptionO />
        </div>

        <div>
          <SectionLabel label="Option P — Floating Glass Cards" />
          <OptionP />
        </div>
      </div>
    </div>
  );
}
