import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Weather codes that trigger alerts (WMO codes)
const ADVERSE_WEATHER_CODES: Record<number, { description: string; severity: string }> = {
  // Fog
  45: { description: "Fog", severity: "moderate" },
  48: { description: "Depositing rime fog", severity: "severe" },
  // Drizzle
  51: { description: "Light drizzle", severity: "low" },
  53: { description: "Moderate drizzle", severity: "low" },
  55: { description: "Dense drizzle", severity: "moderate" },
  56: { description: "Light freezing drizzle", severity: "severe" },
  57: { description: "Dense freezing drizzle", severity: "severe" },
  // Rain
  61: { description: "Slight rain", severity: "low" },
  63: { description: "Moderate rain", severity: "moderate" },
  65: { description: "Heavy rain", severity: "severe" },
  66: { description: "Light freezing rain", severity: "severe" },
  67: { description: "Heavy freezing rain", severity: "severe" },
  // Snow
  71: { description: "Slight snow", severity: "moderate" },
  73: { description: "Moderate snow", severity: "severe" },
  75: { description: "Heavy snow", severity: "severe" },
  77: { description: "Snow grains", severity: "moderate" },
  // Showers
  80: { description: "Slight rain showers", severity: "low" },
  81: { description: "Moderate rain showers", severity: "moderate" },
  82: { description: "Violent rain showers", severity: "severe" },
  85: { description: "Slight snow showers", severity: "moderate" },
  86: { description: "Heavy snow showers", severity: "severe" },
  // Thunderstorm
  95: { description: "Thunderstorm", severity: "severe" },
  96: { description: "Thunderstorm with slight hail", severity: "severe" },
  99: { description: "Thunderstorm with heavy hail", severity: "severe" },
};

interface WeatherAlert {
  type: "weather";
  severity: "low" | "moderate" | "severe";
  title: string;
  description: string;
  temperature?: number;
  windSpeed?: number;
  visibility?: number;
  icon: string;
}

interface TrafficAlert {
  type: "traffic";
  severity: "low" | "moderate" | "severe";
  title: string;
  description: string;
  delay?: number;
  roadName?: string;
  icon: string;
}

interface RoadAlert {
  type: "road";
  severity: "low" | "moderate" | "severe";
  title: string;
  description: string;
  roadName?: string;
  icon: string;
}

type DrivingAlert = WeatherAlert | TrafficAlert | RoadAlert;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instructorId } = await req.json();

    if (!instructorId) {
      return new Response(
        JSON.stringify({ error: "instructorId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tomtomApiKey = Deno.env.get("TOMTOM_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get instructor's postcode and cached coordinates
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("home_postcode, lat, lng, location_name")
      .eq("id", instructorId)
      .single();

    if (instructorError || !instructor?.home_postcode) {
      return new Response(
        JSON.stringify({ alerts: [], error: "No postcode configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let lat = instructor.lat;
    let lng = instructor.lng;
    let locationName = instructor.location_name;

    // If no cached coordinates, geocode the postcode
    if (!lat || !lng) {
      const cleanPostcode = instructor.home_postcode.replace(/\s+/g, "").toUpperCase();
      const geocodeResponse = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.result) {
          lat = geocodeData.result.latitude;
          lng = geocodeData.result.longitude;
          // Extract location name from geocode result
          locationName = geocodeData.result.admin_ward || 
                        geocodeData.result.admin_district || 
                        geocodeData.result.parliamentary_constituency ||
                        geocodeData.result.region;
          
          // Cache the coordinates and location name
          await supabase
            .from("instructors")
            .update({ lat, lng, location_name: locationName })
            .eq("id", instructorId);
        }
      }

      if (!lat || !lng) {
        return new Response(
          JSON.stringify({ alerts: [], error: "Could not geocode postcode" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const alerts: DrivingAlert[] = [];
    let currentWeather: {
      temperature: number | null;
      weatherCode: number | null;
      description: string;
      icon: string;
      windSpeed: number | null;
    } | null = null;

    // Fetch weather from Open-Meteo (free, no API key needed)
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,visibility&hourly=precipitation_probability&forecast_days=1&timezone=Europe/London`;
      
      const weatherResponse = await fetch(weatherUrl);
      
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        const current = weatherData.current;
        const hourly = weatherData.hourly;
        
        const temperature = current?.temperature_2m;
        const weatherCode = current?.weather_code;
        const windSpeedKmh = current?.wind_speed_10m;
        const windSpeedMph = windSpeedKmh ? Math.round(windSpeedKmh * 0.621371) : null;
        const visibilityM = current?.visibility;
        const visibilityKm = visibilityM ? visibilityM / 1000 : null;
        
        // Get current hour's precipitation probability
        const currentHour = new Date().getHours();
        const precipProbability = hourly?.precipitation_probability?.[currentHour];

        // Build current weather response
        currentWeather = {
          temperature: temperature !== undefined ? Math.round(temperature) : null,
          weatherCode: weatherCode ?? null,
          description: getWeatherDescription(weatherCode),
          icon: getWeatherIcon(weatherCode ?? 0),
          windSpeed: windSpeedMph,
        };

        // Check for adverse conditions
        let weatherAlert: WeatherAlert | null = null;

        // Ice risk (below 3°C)
        if (temperature !== null && temperature < 3) {
          weatherAlert = {
            type: "weather",
            severity: temperature < 0 ? "severe" : "moderate",
            title: `${Math.round(temperature)}°C - Ice Risk`,
            description: temperature < 0 
              ? "Freezing conditions. Roads may be icy."
              : "Near freezing. Watch for ice on untreated roads.",
            temperature,
            icon: "Snowflake",
          };
        }

        // High wind (> 25 mph / 40 kmh)
        if (windSpeedMph && windSpeedMph > 25 && (!weatherAlert || weatherAlert.severity !== "severe")) {
          const severity = windSpeedMph > 40 ? "severe" : "moderate";
          if (!weatherAlert || (severity === "severe" && weatherAlert.severity !== "severe")) {
            weatherAlert = {
              type: "weather",
              severity,
              title: `Strong Winds - ${windSpeedMph} mph`,
              description: windSpeedMph > 40 
                ? "Very strong winds. Consider postponing lessons."
                : "Strong gusts expected. Take extra care.",
              windSpeed: windSpeedMph,
              icon: "Wind",
            };
          }
        }

        // Low visibility (< 2km)
        if (visibilityKm && visibilityKm < 2 && (!weatherAlert || weatherAlert.severity !== "severe")) {
          const severity = visibilityKm < 0.5 ? "severe" : "moderate";
          weatherAlert = {
            type: "weather",
            severity,
            title: `Low Visibility - ${visibilityKm.toFixed(1)}km`,
            description: visibilityKm < 0.5 
              ? "Very poor visibility. Consider postponing lessons."
              : "Reduced visibility. Use fog lights where appropriate.",
            visibility: visibilityKm,
            icon: "Eye",
          };
        }

        // Adverse weather code
        if (weatherCode && ADVERSE_WEATHER_CODES[weatherCode]) {
          const weatherInfo = ADVERSE_WEATHER_CODES[weatherCode];
          const severity = weatherInfo.severity as "low" | "moderate" | "severe";
          
          if (!weatherAlert || 
              (severity === "severe" && weatherAlert.severity !== "severe") ||
              (severity === "moderate" && weatherAlert.severity === "low")) {
            weatherAlert = {
              type: "weather",
              severity,
              title: weatherInfo.description,
              description: `${Math.round(temperature)}°C • ${weatherInfo.description}`,
              temperature,
              icon: getWeatherIcon(weatherCode),
            };
          }
        }

        // High precipitation probability (> 60%)
        if (precipProbability && precipProbability > 60 && !weatherAlert) {
          weatherAlert = {
            type: "weather",
            severity: precipProbability > 80 ? "moderate" : "low",
            title: `${precipProbability}% Chance of Rain`,
            description: `Rain likely today. ${Math.round(temperature)}°C`,
            temperature,
            icon: "CloudRain",
          };
        }

        if (weatherAlert) {
          alerts.push(weatherAlert);
        }
      }
    } catch (weatherError) {
      console.error("Weather API error:", weatherError);
    }

    // Fetch traffic incidents from TomTom (~25km / 15 mile radius around the
    // instructor's home location — a small 5km box was returning empty for most
    // postcodes, making the alerts strip look broken).
    if (tomtomApiKey) {
      try {
        const radiusDeg = 0.225; // ~25km at UK latitudes
        const trafficUrl = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${tomtomApiKey}&bbox=${lng - radiusDeg},${lat - radiusDeg},${lng + radiusDeg},${lat + radiusDeg}&fields=%7Bincidents%7Btype,geometry%7Bcoordinates%7D,properties%7BiconCategory,magnitudeOfDelay,events%7Bdescription%7D,from,to%7D%7D%7D&language=en-GB`;

        const trafficResponse = await fetch(trafficUrl);

        if (trafficResponse.ok) {
          const trafficData = await trafficResponse.json();
          const incidents = trafficData.incidents || [];

          // Process up to 5 incidents
          for (const incident of incidents.slice(0, 5)) {
            const props = incident.properties;
            if (!props) continue;

            const iconCategory = props.iconCategory ?? 0;
            const delay = props.magnitudeOfDelay ?? 0;
            const events = props.events || [];
            const description = events[0]?.description || "Traffic incident";
            const roadName = props.from || props.to || "";

            // Skip only the most trivial incidents (no delay AND minor category)
            if (delay < 1 && iconCategory < 3) continue;

            let severity: "low" | "moderate" | "severe" = "low";
            if (delay >= 4 || iconCategory >= 8) severity = "severe";
            else if (delay >= 2 || iconCategory >= 6) severity = "moderate";

            const delayMinutes = delay * 10; // TomTom magnitude to approx minutes

            alerts.push({
              type: "traffic",
              severity,
              title: getTrafficTitle(iconCategory),
              description: roadName
                ? `${roadName} • ${delayMinutes > 0 ? `${delayMinutes} min delay` : description}`
                : description,
              delay: delayMinutes,
              roadName,
              icon: getTrafficIcon(iconCategory),
            });
          }
        }
      } catch (trafficError) {
        console.error("Traffic API error:", trafficError);
      }
    }

    // Fetch road closures from National Highways API (free registration required)
    const nhApiKey = Deno.env.get("NATIONAL_HIGHWAYS_API_KEY");
    if (nhApiKey) {
      try {
        // Fetch both planned and unplanned active closures
        const nhUrl = `https://api.data.nationalhighways.co.uk/roads/v2.0/closures?closureType=unplanned`;
        const nhResponse = await fetch(nhUrl, {
          headers: {
            "Ocp-Apim-Subscription-Key": nhApiKey,
            "X-Response-MediaType": "application/json",
          },
        });
        
        if (nhResponse.ok) {
          const nhData = await nhResponse.json();
          const situations = nhData?.D2Payload?.situation || [];
          
          for (const situation of situations.slice(0, 100)) {
            const records = situation?.situationRecord || [];
            
            for (const recordWrapper of records) {
              // The record is wrapped in a type key like sitRoadOrCarriagewayOrLaneManagement
              const record = recordWrapper.sitRoadOrCarriagewayOrLaneManagement || 
                            recordWrapper.sitAbnormalTraffic ||
                            recordWrapper.sitNetworkManagement ||
                            Object.values(recordWrapper)[0];
              if (!record) continue;
              
              // Only show active closures
              const validityStatus = record.validity?.validityStatus;
              if (validityStatus !== "active") continue;
              
              // Extract coordinates from posList (format: "lat lng lat lng ...")
              let eventLat: number | null = null;
              let eventLng: number | null = null;
              
              const locationRef = record.locationReference;
              let posList: string | null = null;
              let roadName = "";
              let locationDesc = "";
              
              // Handle single vs multiple location formats
              const group = locationRef?.locLocationGroupByList?.locationContainedInGroup;
              if (group && Array.isArray(group) && group.length > 0) {
                posList = group[0]?.locLinearLocation?.gmlLineString?.locGmlLineString?.posList;
                locationDesc = group[0]?.locLinearLocation?.supplementaryPositionalDescription?.locationDescription || "";
                roadName = group[0]?.locSingleRoadLinearLocation?.linearWithinLinearElement?.[0]?.linearElement?.locLinearElementByCode?.roadName || "";
              } else if (locationRef?.locLinearLocation) {
                posList = locationRef.locLinearLocation.gmlLineString?.locGmlLineString?.posList;
                locationDesc = locationRef.locLinearLocation.supplementaryPositionalDescription?.locationDescription || "";
                roadName = locationRef.locSingleRoadLinearLocation?.linearWithinLinearElement?.[0]?.linearElement?.locLinearElementByCode?.roadName || "";
              }
              
              if (posList) {
                const coords = posList.split(" ").map(Number);
                if (coords.length >= 2) {
                  eventLat = coords[0];
                  eventLng = coords[1];
                }
              }
              
              if (!eventLat || !eventLng) continue;
              
              // Haversine distance filter (~25km / 15 miles)
              const R = 6371;
              const dLat = (eventLat - lat) * Math.PI / 180;
              const dLng = (eventLng - lng) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(eventLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
              const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              
              if (dist > 25) continue;
              
              // Extract description from comment
              const comment = record.generalPublicComment?.[0]?.comment || locationDesc || "Road closure nearby";
              const causeType = record.cause?.causeType || "";
              const isIncident = causeType === "accident" || causeType === "incident";
              const isClosure = comment.toLowerCase().includes("closed") || comment.toLowerCase().includes("closure");
              
              const severity: "moderate" | "severe" = isIncident || isClosure ? "severe" : "moderate";
              
              alerts.push({
                type: "road",
                severity,
                title: roadName ? `${roadName}: ${isIncident ? "Incident" : isClosure ? "Road Closed" : "Roadworks"}` : (isIncident ? "Incident" : "Roadworks"),
                description: comment.slice(0, 120),
                roadName,
                icon: isClosure || isIncident ? "Ban" : "Construction",
              });
            }
          }
        }
      } catch (nhError) {
        console.error("National Highways API error:", nhError);
      }
    }

    // Sort by severity
    const severityOrder = { severe: 0, moderate: 1, low: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return new Response(
      JSON.stringify({ alerts, lat, lng, location: locationName, currentWeather }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(
      JSON.stringify({ error: message, alerts: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getWeatherIcon(code: number): string {
  if (code === 0) return "Sun";
  if (code === 1 || code === 2) return "CloudSun";
  if (code === 3) return "Cloud";
  if (code >= 95) return "CloudLightning";
  if (code >= 71 && code <= 86) return "Snowflake";
  if (code >= 61 && code <= 67) return "CloudRain";
  if (code >= 51 && code <= 57) return "CloudDrizzle";
  if (code >= 45 && code <= 48) return "CloudFog";
  return "Cloud";
}

function getWeatherDescription(code: number | null | undefined): string {
  if (code === null || code === undefined) return "Unknown";
  if (code === 0) return "Clear";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow Showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

function getTrafficTitle(iconCategory: number): string {
  switch (iconCategory) {
    case 0: return "Unknown Incident";
    case 1: return "Accident";
    case 2: return "Fog";
    case 3: return "Dangerous Conditions";
    case 4: return "Rain";
    case 5: return "Ice";
    case 6: return "Congestion";
    case 7: return "Lane Closed";
    case 8: return "Road Closed";
    case 9: return "Roadworks";
    case 10: return "Wind";
    case 11: return "Flooding";
    case 14: return "Broken Down Vehicle";
    default: return "Traffic Alert";
  }
}

function getTrafficIcon(iconCategory: number): string {
  switch (iconCategory) {
    case 1: return "AlertTriangle";
    case 6: return "Car";
    case 7:
    case 8: return "Ban";
    case 9: return "Construction";
    default: return "AlertCircle";
  }
}
