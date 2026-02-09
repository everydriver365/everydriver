import { motion } from "framer-motion";
import {
  Clock, PoundSterling, CloudSun, TrendingUp, BookOpen,
  Car, MessageCircle, Target, Timer, Flame, Star, ArrowRight,
} from "lucide-react";

interface ReadyToTeachOptionsProps {
  firstName: string;
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  completedLessons: number;
  progressPercent: number;
  hoursThisWeek: number;
  hoursGoal: number;
  temperature: number | null;
  weatherIcon: string;
  weatherDesc: string;
  trafficCondition: string;
  unreadMessages: number;
  nextPupilName?: string;
  nextMinutesUntil?: number;
  nextPostcode?: string;
  isGPSConnected: boolean;
}

const radius = 28;
const circumference = 2 * Math.PI * radius;

export function ReadyToTeachOptions({
  firstName, lessonCount, totalHours, expectedEarnings, completedLessons,
  progressPercent, hoursThisWeek, hoursGoal, temperature, weatherIcon,
  weatherDesc, trafficCondition, unreadMessages, nextPupilName,
  nextMinutesUntil, nextPostcode, isGPSConnected,
}: ReadyToTeachOptionsProps) {
  const clampedProgress = Math.min(progressPercent, 100);
  const strokeOffset = circumference - (clampedProgress / 100) * circumference;
  const streak = 12; // placeholder

  const options = [
    {
      id: "A", title: "Split Stat Bar",
      render: () => (
        <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] overflow-hidden border border-border/40">
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Ready to teach, {firstName}?</h2>
                <div className="flex items-center gap-2 mt-1">
                  <CloudSun className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-muted-foreground">{temperature ?? "--"}°C {weatherDesc}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">{isGPSConnected ? "Live" : "Offline"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30 px-1 py-3">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">{lessonCount}</span>
              <span className="text-[10px] text-muted-foreground font-medium">Lessons</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">{totalHours}h</span>
              <span className="text-[10px] text-muted-foreground font-medium">Hours</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-emerald-600">£{expectedEarnings}</span>
              <span className="text-[10px] text-muted-foreground font-medium">Expected</span>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-border/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Weekly goal</span>
              <span className="text-xs font-semibold text-foreground">{hoursThisWeek}/{hoursGoal}h</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${clampedProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "B", title: "Glass Ticker",
      render: () => (
        <div className="rounded-2xl border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(30,64,175,0.85), rgba(124,58,237,0.85))" }}>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-sm">Ready to teach, {firstName}?</h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <CloudSun className="h-3.5 w-3.5 text-amber-300" />
                    <span className="text-xs text-white/70">{temperature ?? "--"}°C</span>
                  </div>
                  <span className="text-xs text-emerald-300">🟢 {trafficCondition || "Clear"}</span>
                </div>
              </div>
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                  <motion.circle cx="36" cy="36" r={radius} fill="none" strokeWidth="5" strokeLinecap="round"
                    stroke="rgb(52,211,153)" initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: strokeOffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-white leading-none">{clampedProgress}%</span>
                  <span className="text-[9px] text-white/50">weekly</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              {[
                { icon: BookOpen, label: `${lessonCount} lessons`, color: "bg-blue-500/20 text-blue-200" },
                { icon: PoundSterling, label: `£${expectedEarnings}`, color: "bg-emerald-500/20 text-emerald-200" },
                { icon: Clock, label: `${totalHours}h today`, color: "bg-violet-500/20 text-violet-200" },
                { icon: MessageCircle, label: `${unreadMessages} msgs`, color: "bg-pink-500/20 text-pink-200" },
              ].map((chip, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium ${chip.color}`}>
                  <chip.icon className="h-3 w-3" />
                  {chip.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "C", title: "Compact Dashboard",
      render: () => (
        <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {firstName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-foreground">Ready to teach, {firstName}?</h2>
              <div className="flex items-center gap-2">
                <CloudSun className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground">{temperature ?? "--"}°C • {weatherDesc}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: BookOpen, label: "Lessons", value: lessonCount.toString(), iconColor: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: PoundSterling, label: "Expected", value: `£${expectedEarnings}`, iconColor: "text-emerald-500", bg: "bg-emerald-500/10" },
              { icon: Target, label: "Weekly", value: `${clampedProgress}%`, iconColor: "text-violet-500", bg: "bg-violet-500/10" },
              { icon: Timer, label: "Next up", value: nextMinutesUntil ? `${nextMinutesUntil}m` : "--", iconColor: "text-amber-500", bg: "bg-amber-500/10" },
            ].map((stat, i) => (
              <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "D", title: "Minimal Strip",
      render: () => (
        <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 overflow-hidden">
          <div className="p-4">
            <h2 className="text-lg font-bold text-foreground">Ready to teach, {firstName}?</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lessonCount} lessons • {totalHours}h • £{expectedEarnings} expected
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <CloudSun className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground">{temperature ?? "--"}°C</span>
              </div>
              <span className="text-xs text-emerald-600 font-medium">🟢 {trafficCondition || "Clear"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">{clampedProgress}%</span>
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${clampedProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "E", title: "Bold Gradient",
      render: () => (
        <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(59,130,246,0.15)]"
          style={{ background: "linear-gradient(135deg, #1e40af, #7c3aed)" }}>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Good Morning</p>
                <h2 className="text-xl font-bold text-white mt-0.5">Ready to teach, {firstName}?</h2>
                <div className="flex items-center gap-2 mt-2">
                  <CloudSun className="h-4 w-4 text-amber-300" />
                  <span className="text-sm text-blue-100">{temperature ?? "--"}°C</span>
                  <span className="text-sm text-emerald-300 font-medium">• {trafficCondition || "Clear"}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-white">{clampedProgress}%</span>
                <span className="text-[10px] text-blue-200 font-medium">weekly goal</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Lessons", value: lessonCount },
                { label: "Hours", value: `${totalHours}h` },
                { label: "Earnings", value: `£${expectedEarnings}` },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                  <p className="text-base font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-blue-200">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "F", title: "Streak Focus",
      render: () => (
        <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Ready to teach, {firstName}?</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{streak} day streak!</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{clampedProgress}%</span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {[
              { icon: BookOpen, label: `${lessonCount} lessons`, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", iconColor: "text-blue-500" },
              { icon: Clock, label: `${totalHours}h`, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", iconColor: "text-violet-500" },
              { icon: PoundSterling, label: `£${expectedEarnings}`, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", iconColor: "text-emerald-500" },
              { icon: CloudSun, label: `${temperature ?? "--"}°C`, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", iconColor: "text-amber-500" },
            ].map((chip, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap ${chip.bg}`}>
                <chip.icon className={`h-3.5 w-3.5 ${chip.iconColor}`} />
                <span className={`text-xs font-semibold ${chip.text}`}>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "G", title: "Next Lesson Focus",
      render: () => (
        <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 overflow-hidden">
          <div className="p-4 pb-3">
            <h2 className="text-base font-bold text-foreground">Ready to teach, {firstName}?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {temperature ?? "--"}°C {weatherDesc} • {trafficCondition || "Clear"} traffic
            </p>
          </div>
          {nextPupilName && (
            <div className="mx-4 mb-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 border border-blue-200/40 dark:border-blue-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Next: {nextPupilName}</p>
                    <p className="text-[11px] text-muted-foreground">in {nextMinutesUntil ?? "--"} min{nextPostcode ? ` • ${nextPostcode}` : ""}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/20 px-1 py-2.5">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-foreground">{lessonCount}</span>
              <span className="text-[10px] text-muted-foreground">lessons</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-emerald-600">£{expectedEarnings}</span>
              <span className="text-[10px] text-muted-foreground">expected</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-foreground">{clampedProgress}%</span>
              <span className="text-[10px] text-muted-foreground">weekly</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "H", title: "Pill Layout",
      render: () => (
        <div className="space-y-2">
          <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Ready to teach, {firstName}?</h2>
                <div className="flex items-center gap-2 mt-1">
                  <CloudSun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-muted-foreground">{temperature ?? "--"}°C • {weatherDesc}</span>
                </div>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
                  <circle cx="24" cy="24" r="18" fill="none" strokeWidth="4" strokeLinecap="round"
                    className="text-emerald-500" stroke="currentColor"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 - (clampedProgress / 100) * 2 * Math.PI * 18} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-foreground">{clampedProgress}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800/30">
              <p className="text-base font-bold text-blue-700 dark:text-blue-300">{lessonCount}</p>
              <p className="text-[10px] text-blue-500">lessons</p>
            </div>
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">£{expectedEarnings}</p>
              <p className="text-[10px] text-emerald-500">expected</p>
            </div>
            <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-800/30">
              <p className="text-base font-bold text-amber-700 dark:text-amber-300">{totalHours}h</p>
              <p className="text-[10px] text-amber-500">hours</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <h3 className="text-sm font-bold text-foreground">Choose a tile style</h3>
        <p className="text-xs text-muted-foreground">Scroll to see all 8 options</p>
      </div>
      {options.map((opt) => (
        <div key={opt.id} className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{opt.id}</span>
            <span className="text-xs font-semibold text-foreground">{opt.title}</span>
          </div>
          {opt.render()}
        </div>
      ))}
    </div>
  );
}
