import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRain, Snowflake, Wind, CloudFog, Sun, CloudLightning,
  AlertTriangle, Car, Clock, Construction, Ban, MapPin, MessageSquare,
} from "lucide-react";
import { format, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import type { DrivingAlert } from "@/hooks/useDrivingAlerts";

// WMO Weather interpretation codes mapping
const getWeatherInfo = (code: number) => {
  if (code === 0) return { label: "Clear", icon: Sun, severity: "none" as const };
  if (code <= 3) return { label: "Partly cloudy", icon: Sun, severity: "none" as const };
  if (code <= 49) return { label: "Fog", icon: CloudFog, severity: "warning" as const };
  if (code <= 59) return { label: "Drizzle", icon: CloudRain, severity: "low" as const };
  if (code <= 69) return { label: "Rain", icon: CloudRain, severity: "warning" as const };
  if (code <= 79) return { label: "Snow", icon: Snowflake, severity: "danger" as const };
  if (code <= 84) return { label: "Rain showers", icon: CloudRain, severity: "warning" as const };
  if (code <= 86) return { label: "Snow showers", icon: Snowflake, severity: "danger" as const };
  if (code <= 99) return { label: "Thunderstorm", icon: CloudLightning, severity: "danger" as const };
  return { label: "Unknown", icon: Sun, severity: "none" as const };
};

const severityStyles = {
  none: "",
  low: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300",
};

const trafficIconMap: Record<string, React.ElementType> = {
  Car,
  AlertTriangle,
  Construction,
  Ban,
};

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  isIcy: boolean;
}

interface WeatherAlertBannerProps {
  className?: string;
  trafficAlerts?: DrivingAlert[];
  /**
   * Preferred current weather, sourced from the instructor's saved home location
   * (via useDrivingAlerts). When provided, we skip the in-component geolocation
   * fetch — that fallback geolocates the device or defaults to London which
   * makes the banner irrelevant for instructors outside that area.
   */
  currentWeather?: {
    temperature: number | null;
    weatherCode: number | null;
    windSpeed: number | null;
  } | null;
  onDismissTraffic?: (alertId: string) => void;
  nextLessonMinutesUntil?: number;
  nextLessonEtaMinutes?: number | null;
  nextLessonPupilName?: string;
  nextLessonPupilPhone?: string | null;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
  );
  const data = await res.json();
  return {
    temperature: data.current.temperature_2m,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    isIcy: data.current.temperature_2m <= 3,
  };
}

export function WeatherAlertBanner({
  className = "",
  trafficAlerts = [],
  currentWeather,
  onDismissTraffic,
  nextLessonMinutesUntil,
  nextLessonEtaMinutes,
  nextLessonPupilName,
  nextLessonPupilPhone,
}: WeatherAlertBannerProps) {
  // Only run the geolocation/London fallback if the parent didn't supply
  // location-correct weather from the instructor record.
  const hasParentWeather =
    !!currentWeather &&
    currentWeather.temperature != null &&
    currentWeather.weatherCode != null;

  const { data: fallbackWeather } = useQuery({
    queryKey: ["weather-alert-fallback"],
    enabled: !hasParentWeather,
    queryFn: async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        return fetchWeather(pos.coords.latitude, pos.coords.longitude);
      } catch {
        return fetchWeather(51.5074, -0.1278);
      }
    },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const weather: WeatherData | null = hasParentWeather
    ? {
        temperature: currentWeather!.temperature as number,
        weatherCode: currentWeather!.weatherCode as number,
        windSpeed: currentWeather!.windSpeed ?? 0,
        isIcy: (currentWeather!.temperature as number) <= 3,
      }
    : fallbackWeather ?? null;

  // Weather alert
  let weatherAlert: { message: string; severity: "low" | "warning" | "danger"; Icon: React.ElementType } | null = null;
  if (weather) {
    const info = getWeatherInfo(weather.weatherCode);
    const hasWeatherAlert = info.severity !== "none" || weather.isIcy || weather.windSpeed > 50;
    if (hasWeatherAlert) {
      const Icon = weather.isIcy ? Snowflake : info.icon;
      const severity = weather.isIcy ? "danger" as const : info.severity === "none" ? "warning" as const : info.severity;
      const message = weather.isIcy
        ? `Ice risk — ${weather.temperature}°C. Roads may be slippery.`
        : weather.windSpeed > 50
          ? `High winds — ${Math.round(weather.windSpeed)} km/h. Take extra care.`
          : `${info.label} — ${weather.temperature}°C. Drive carefully.`;
      weatherAlert = { message, severity, Icon };
    }
  }

  // Running late detection
  const isRunningLate = nextLessonEtaMinutes != null
    && nextLessonMinutesUntil != null
    && nextLessonMinutesUntil > 0
    && nextLessonMinutesUntil <= 120
    && nextLessonEtaMinutes > nextLessonMinutesUntil;

  const lateByMinutes = isRunningLate && nextLessonEtaMinutes != null && nextLessonMinutesUntil != null
    ? Math.round(nextLessonEtaMinutes - nextLessonMinutesUntil)
    : 0;

  const hasAnything = weatherAlert || trafficAlerts.length > 0 || isRunningLate;
  if (!hasAnything) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {/* Running Late Alert */}
        {isRunningLate && (
          <motion.div
            key="running-late"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border p-3 flex items-center gap-3 bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
          >
            <div className="h-9 w-9 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">Running Late</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                ~{lateByMinutes} min late for {nextLessonPupilName || "next lesson"}.
                ETA {Math.round(nextLessonEtaMinutes!)} min, lesson in {nextLessonMinutesUntil} min.
              </p>
            </div>
            {nextLessonPupilPhone && (() => {
              const firstName = (nextLessonPupilName || "there").split(" ")[0];
              const arrivalTime = format(addMinutes(new Date(), Math.round(nextLessonEtaMinutes!)), "HH:mm");
              const body = `Hi ${firstName}, I'm running about ${lateByMinutes} mins late. ETA ${arrivalTime}. Sorry!`;
              return (
                <a
                  href={`sms:${nextLessonPupilPhone}?body=${encodeURIComponent(body)}`}
                  className="shrink-0 inline-flex flex-col items-center justify-center gap-0.5 h-11 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, #E15D5A, #C81E14)" }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Notify
                </a>
              );
            })()}
          </motion.div>
        )}

        {/* Weather Alert */}
        {weatherAlert && (
          <motion.div
            key="weather"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-2xl border p-3 flex items-center gap-3 ${severityStyles[weatherAlert.severity]}`}
          >
            <div className="h-9 w-9 rounded-2xl bg-current/10 flex items-center justify-center shrink-0">
              <weatherAlert.Icon className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">Alerts</p>
              <p className="text-[11px] opacity-80 mt-0.5">{weatherAlert.message}</p>
            </div>
          </motion.div>
        )}

        {/* Traffic Alerts */}
        {trafficAlerts.map((alert, i) => {
          const TrafficIcon = trafficIconMap[alert.icon] || AlertTriangle;
          const severity = alert.severity === "severe" ? "danger" as const
            : alert.severity === "moderate" ? "warning" as const
            : "low" as const;
          return (
            <motion.div
              key={`traffic-${i}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border p-3 flex items-center gap-3 ${severityStyles[severity]}`}
            >
              <div className="h-9 w-9 rounded-2xl bg-current/10 flex items-center justify-center shrink-0">
                <TrafficIcon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">{alert.title}</p>
                <p className="text-[11px] opacity-80 mt-0.5">{alert.description}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
