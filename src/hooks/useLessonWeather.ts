import { useQuery } from "@tanstack/react-query";

export interface LessonWeather {
  temperature: number;
  weatherCode: number;
  description: string;
  icon: string;
  windSpeedMph: number;
  visibilityMi: number;
  category: "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";
}

const WEATHER_MAP: Record<number, { description: string; icon: string; category: LessonWeather["category"] }> = {
  0: { description: "Clear sky", icon: "Sun", category: "clear" },
  1: { description: "Mainly clear", icon: "Sun", category: "clear" },
  2: { description: "Partly cloudy", icon: "CloudSun", category: "cloudy" },
  3: { description: "Overcast", icon: "Cloud", category: "cloudy" },
  45: { description: "Fog", icon: "CloudFog", category: "fog" },
  48: { description: "Rime fog", icon: "CloudFog", category: "fog" },
  51: { description: "Light drizzle", icon: "CloudDrizzle", category: "rain" },
  53: { description: "Drizzle", icon: "CloudDrizzle", category: "rain" },
  55: { description: "Dense drizzle", icon: "CloudDrizzle", category: "rain" },
  56: { description: "Freezing drizzle", icon: "CloudSnow", category: "snow" },
  57: { description: "Freezing drizzle", icon: "CloudSnow", category: "snow" },
  61: { description: "Light rain", icon: "CloudRain", category: "rain" },
  63: { description: "Rain", icon: "CloudRain", category: "rain" },
  65: { description: "Heavy rain", icon: "CloudRain", category: "rain" },
  66: { description: "Freezing rain", icon: "CloudSnow", category: "snow" },
  67: { description: "Freezing rain", icon: "CloudSnow", category: "snow" },
  71: { description: "Light snow", icon: "Snowflake", category: "snow" },
  73: { description: "Snow", icon: "Snowflake", category: "snow" },
  75: { description: "Heavy snow", icon: "Snowflake", category: "snow" },
  77: { description: "Snow grains", icon: "Snowflake", category: "snow" },
  80: { description: "Light showers", icon: "CloudRain", category: "rain" },
  81: { description: "Showers", icon: "CloudRain", category: "rain" },
  82: { description: "Heavy showers", icon: "CloudRain", category: "rain" },
  85: { description: "Snow showers", icon: "CloudSnow", category: "snow" },
  86: { description: "Heavy snow showers", icon: "CloudSnow", category: "snow" },
  95: { description: "Thunderstorm", icon: "CloudLightning", category: "storm" },
  96: { description: "Thunderstorm with hail", icon: "CloudLightning", category: "storm" },
  99: { description: "Severe thunderstorm", icon: "CloudLightning", category: "storm" },
};

const KM_TO_MI = 0.621371;

export function useLessonWeather(postcode?: string | null) {
  return useQuery({
    queryKey: ["lesson-weather", postcode],
    queryFn: async (): Promise<LessonWeather | null> => {
      if (!postcode) return null;
      const clean = postcode.trim().replace(/\s+/g, "");
      if (!clean) return null;

      // Geocode UK postcode (free, no key)
      const geo = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
      if (!geo.ok) return null;
      const geoJson = await geo.json();
      const lat = geoJson?.result?.latitude;
      const lng = geoJson?.result?.longitude;
      if (typeof lat !== "number" || typeof lng !== "number") return null;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,visibility&wind_speed_unit=mph&timezone=Europe/London`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const cur = data?.current;
      if (!cur) return null;

      const code = cur.weather_code ?? 3;
      const info = WEATHER_MAP[code] || { description: "Unknown", icon: "Cloud", category: "cloudy" as const };
      return {
        temperature: Math.round(cur.temperature_2m ?? 0),
        weatherCode: code,
        description: info.description,
        icon: info.icon,
        windSpeedMph: Math.round(cur.wind_speed_10m ?? 0),
        visibilityMi: Math.round(((cur.visibility ?? 0) as number) / 1000 * KM_TO_MI),
        category: info.category,
      };
    },
    enabled: !!postcode,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
