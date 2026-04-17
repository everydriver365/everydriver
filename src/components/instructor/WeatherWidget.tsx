import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog,
  CloudLightning, Snowflake, Wind,
} from "lucide-react";
import { CurrentWeather } from "@/hooks/useDrivingAlerts";
import { cn } from "@/lib/utils";

interface WeatherWidgetProps {
  weather: CurrentWeather | null;
  loading?: boolean;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog,
  CloudLightning, Snowflake, Wind,
};

function getDrivingSafety(weather: CurrentWeather): { tip: string; color: string; bg: string } | null {
  const temp = weather.temperature;
  const code = weather.weatherCode;
  const wind = weather.windSpeed;

  if (temp != null && temp <= 2) {
    return { tip: "Watch for ice on roads", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" };
  }
  if (code != null && (code >= 95 || (code >= 61 && code <= 67))) {
    return { tip: "Heavy rain — reduced grip", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" };
  }
  if (code != null && (code === 45 || code === 48)) {
    return { tip: "Fog — reduced visibility", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10" };
  }
  if (code != null && code >= 71 && code <= 77) {
    return { tip: "Snow — drive with caution", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" };
  }
  if (wind != null && wind > 50) {
    return { tip: "Strong winds — be careful", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10" };
  }
  if (code != null && code >= 51 && code <= 57) {
    return { tip: "Light rain — roads may be slippery", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10" };
  }
  return null;
}

export function WeatherWidget({ weather, loading, className }: WeatherWidgetProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || loading || !weather || weather.temperature == null) return null;

  const IconComp = iconMap[weather.icon] || Cloud;
  const safety = getDrivingSafety(weather);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={cn("bg-card rounded-2xl shadow-lift shadow-sm border border-border overflow-hidden relative", className)}
      >
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="px-4 py-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <IconComp className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{weather.temperature}°C</span>
              {weather.description && (
                <span className="text-sm text-muted-foreground truncate">{weather.description}</span>
              )}
            </div>
            {weather.windSpeed != null && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.windSpeed} km/h wind
              </p>
            )}
          </div>
        </div>
        {safety && (
          <div className={cn("px-4 py-2 border-t border-border", safety.bg)}>
            <p className={cn("text-xs font-medium", safety.color)}>⚠ {safety.tip}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
