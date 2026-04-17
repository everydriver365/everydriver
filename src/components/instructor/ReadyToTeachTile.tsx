import { motion } from "framer-motion";
import {
  BookOpen, PoundSterling, Target, Timer, CloudSun, Cloud,
  CloudRain, CloudDrizzle, CloudFog, CloudLightning, Snowflake,
  Wind, Sun,
} from "lucide-react";

const weatherIconColors: Record<string, string> = {
  Sun: "text-amber-500",
  CloudSun: "text-yellow-500",
  Cloud: "text-slate-400",
  CloudRain: "text-blue-500",
  CloudDrizzle: "text-blue-400",
  CloudFog: "text-slate-500",
  CloudLightning: "text-violet-500",
  Snowflake: "text-sky-400",
  Wind: "text-teal-500",
};

const WeatherIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const map: Record<string, React.ElementType> = {
    Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog, CloudLightning, Snowflake, Wind,
  };
  const C = map[icon] || Cloud;
  const color = weatherIconColors[icon] || "text-slate-400";
  return <C className={`${color} ${className ?? ""}`} />;
};

interface ReadyToTeachTileProps {
  firstName: string;
  profileImageUrl?: string | null;
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  progressPercent: number;
  temperature: number | null;
  weatherIcon: string;
  weatherDesc: string;
  nextMinutesUntil?: number;
  nextPupilFirstName?: string;
  nextLessonTime?: string;
  nextPostcode?: string;
  isOnline: boolean;
}

export function ReadyToTeachTile({
  firstName, profileImageUrl, lessonCount, expectedEarnings, progressPercent,
  temperature, weatherIcon, weatherDesc, nextMinutesUntil, nextPupilFirstName, nextLessonTime, nextPostcode, isOnline,
}: ReadyToTeachTileProps) {
  const clampedProgress = Math.min(progressPercent, 100);

  const stats = [
    { icon: BookOpen, label: "Lessons", value: lessonCount.toString(), iconColor: "text-primary", bg: "bg-primary/10" },
    { icon: PoundSterling, label: "Expected", value: `£${expectedEarnings}`, iconColor: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Target, label: "Weekly", value: `${clampedProgress}%`, iconColor: "text-violet-500", bg: "bg-violet-500/10" },
    { icon: Timer, label: nextPupilFirstName || "Next up", value: nextLessonTime ? `${nextLessonTime}${nextPostcode ? ` • ${nextPostcode}` : ""}` : (nextMinutesUntil != null ? `${nextMinutesUntil}m` : "--"), iconColor: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-lift border border-border/40 p-4"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        {profileImageUrl ? (
          <img src={profileImageUrl} alt={firstName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center text-white font-bold text-sm">
            {firstName[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground truncate">Ready to teach, {firstName}?</h2>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                isOnline
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
                }`}
              />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <WeatherIcon icon={weatherIcon} className="h-3.5 w-3.5" />
            <span className="text-xs text-muted-foreground">
              {temperature ?? "--"}°C{weatherDesc ? ` • ${weatherDesc}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => (
          <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${stat.bg}`}>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            <div>
              <p className="text-sm font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
