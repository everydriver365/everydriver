import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";

interface TomorrowWeather {
  temperature: number;
  weatherCode: number;
  description: string;
  icon: string;
}

// WMO Weather interpretation codes
const WEATHER_DESCRIPTIONS: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "Sun" },
  1: { description: "Mainly clear", icon: "Sun" },
  2: { description: "Partly cloudy", icon: "CloudSun" },
  3: { description: "Overcast", icon: "Cloud" },
  45: { description: "Fog", icon: "CloudFog" },
  48: { description: "Rime fog", icon: "CloudFog" },
  51: { description: "Light drizzle", icon: "CloudDrizzle" },
  53: { description: "Drizzle", icon: "CloudDrizzle" },
  55: { description: "Dense drizzle", icon: "CloudDrizzle" },
  56: { description: "Freezing drizzle", icon: "CloudSnow" },
  57: { description: "Freezing drizzle", icon: "CloudSnow" },
  61: { description: "Light rain", icon: "CloudRain" },
  63: { description: "Rain", icon: "CloudRain" },
  65: { description: "Heavy rain", icon: "CloudRain" },
  66: { description: "Freezing rain", icon: "CloudSnow" },
  67: { description: "Freezing rain", icon: "CloudSnow" },
  71: { description: "Light snow", icon: "Snowflake" },
  73: { description: "Snow", icon: "Snowflake" },
  75: { description: "Heavy snow", icon: "Snowflake" },
  77: { description: "Snow grains", icon: "Snowflake" },
  80: { description: "Light showers", icon: "CloudRain" },
  81: { description: "Showers", icon: "CloudRain" },
  82: { description: "Heavy showers", icon: "CloudRain" },
  85: { description: "Snow showers", icon: "CloudSnow" },
  86: { description: "Heavy snow showers", icon: "CloudSnow" },
  95: { description: "Thunderstorm", icon: "CloudLightning" },
  96: { description: "Thunderstorm with hail", icon: "CloudLightning" },
  99: { description: "Severe thunderstorm", icon: "CloudLightning" },
};

export function useTomorrowWeather(lat?: number | null, lng?: number | null) {
  return useQuery({
    queryKey: ["tomorrow-weather", lat, lng],
    queryFn: async (): Promise<TomorrowWeather | null> => {
      if (!lat || !lng) return null;

      const tomorrow = addDays(new Date(), 1);
      const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max&timezone=Europe/London&start_date=${tomorrowStr}&end_date=${tomorrowStr}`;

      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const daily = data.daily;

      if (!daily?.weather_code?.[0] && daily?.weather_code?.[0] !== 0) return null;

      const weatherCode = daily.weather_code[0];
      const temperature = Math.round(daily.temperature_2m_max[0]);
      const weatherInfo = WEATHER_DESCRIPTIONS[weatherCode] || { description: "Unknown", icon: "Cloud" };

      return {
        temperature,
        weatherCode,
        description: weatherInfo.description,
        icon: weatherInfo.icon,
      };
    },
    enabled: !!lat && !!lng,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
