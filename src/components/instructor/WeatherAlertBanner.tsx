import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CloudRain, Snowflake, Wind, CloudFog, Sun, CloudLightning, Thermometer, AlertTriangle } from "lucide-react";

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

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  isIcy: boolean;
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

export function WeatherAlertBanner({ className = "" }: { className?: string }) {
  const { data: weather } = useQuery({
    queryKey: ["weather-alert"],
    queryFn: async () => {
      // Try browser geolocation, fallback to London
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        return fetchWeather(pos.coords.latitude, pos.coords.longitude);
      } catch {
        return fetchWeather(51.5074, -0.1278); // London fallback
      }
    },
    staleTime: 15 * 60 * 1000, // 15 min
    refetchInterval: 15 * 60 * 1000,
  });

  if (!weather) return null;

  const info = getWeatherInfo(weather.weatherCode);
  const hasAlert = info.severity !== "none" || weather.isIcy || weather.windSpeed > 50;

  if (!hasAlert) return null;

  const Icon = weather.isIcy ? Snowflake : info.icon;
  const severity = weather.isIcy ? "danger" : info.severity === "none" ? "warning" : info.severity;

  const alertMessage = weather.isIcy
    ? `Ice risk — ${weather.temperature}°C. Roads may be slippery.`
    : weather.windSpeed > 50
      ? `High winds — ${Math.round(weather.windSpeed)} km/h. Take extra care.`
      : `${info.label} — ${weather.temperature}°C. Drive carefully.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-3 flex items-center gap-3 ${severityStyles[severity]} ${className}`}
    >
      <div className="h-9 w-9 rounded-2xl bg-current/10 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold">Weather Alert</p>
        <p className="text-[11px] opacity-80 mt-0.5">{alertMessage}</p>
      </div>
    </motion.div>
  );
}
