import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thresholds for calculated braking detection (m/s²)
const BRAKING_THRESHOLDS = {
  LOW: 3.5,    // gentle braking
  MEDIUM: 5.0, // firm braking
  HIGH: 7.0,   // harsh braking
};

// Thresholds for acceleration detection (m/s²)
const ACCELERATION_THRESHOLDS = {
  LOW: 2.5,    // normal acceleration
  MEDIUM: 4.0, // firm acceleration
  HIGH: 6.0,   // harsh acceleration
};

// Simple in-memory cache for speed limits (grid-based)
const speedLimitCache = new Map<string, { limit: number | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

interface TraccarDevice {
  id: string;
  instructor_id: string;
  current_pupil_id: string | null;
  current_session_id: string | null;
  last_speed_kmh: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_seen_at: string | null;
}

// Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate grid key for caching (approximately 50m grid)
function getGridKey(lat: number, lon: number): string {
  // ~50m resolution at UK latitudes
  const latGrid = Math.round(lat * 2000) / 2000;
  const lonGrid = Math.round(lon * 3000) / 3000;
  return `${latGrid},${lonGrid}`;
}

// Parse maxspeed value from OSM (handles "30 mph", "50", "national", etc.)
function parseMaxSpeed(maxspeed: string): number | null {
  if (!maxspeed) return null;
  
  // Handle "national" speed limit (UK: 60 mph single carriageway, 70 mph dual/motorway)
  if (maxspeed.toLowerCase() === "national") {
    return 97; // Default to 60 mph = 97 km/h for single carriageway
  }
  
  // Check for mph suffix (common in UK)
  const mphMatch = maxspeed.match(/^(\d+)\s*mph$/i);
  if (mphMatch) {
    return Math.round(parseInt(mphMatch[1]) * 1.60934);
  }
  
  // Plain number (assumed km/h in OSM standard)
  const numMatch = maxspeed.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }
  
  return null;
}

// Check adjacent grid cells for cached speed limits (fallback when API fails)
function getNearbySpeedLimit(lat: number, lon: number): number | null {
  const offsets = [
    [0, 0.0005], [0, -0.0005], [0.0005, 0], [-0.0005, 0],
    [0.0005, 0.0005], [-0.0005, -0.0005], [0.0005, -0.0005], [-0.0005, 0.0005]
  ];
  
  for (const [dLat, dLon] of offsets) {
    const key = getGridKey(lat + dLat, lon + dLon);
    const cached = speedLimitCache.get(key);
    if (cached && cached.limit !== null) {
      console.log(`[Traccar] Using nearby grid cache: ${cached.limit} km/h`);
      return cached.limit;
    }
  }
  return null;
}

// Overpass API endpoints with fallbacks
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Fetch speed limit from OpenStreetMap Overpass API with fallback endpoints
async function getSpeedLimit(lat: number, lon: number): Promise<number | null> {
  const gridKey = getGridKey(lat, lon);
  
  // Check cache first (extend TTL to reduce API calls)
  const cached = speedLimitCache.get(gridKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    // Don't log cache hits to reduce noise
    return cached.limit;
  }
  
  // Try nearby grid cells first (faster than API)
  const nearby = getNearbySpeedLimit(lat, lon);
  if (nearby !== null) {
    return nearby;
  }
  
  console.log(`[Traccar] Speed limit lookup at ${lat.toFixed(6)},${lon.toFixed(6)}`);
  
  // Query Overpass API for roads with maxspeed within 50m radius
  const query = `[out:json][timeout:3];way(around:50,${lat},${lon})[highway][maxspeed];out tags;`;
  
  // Try each endpoint until one succeeds
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(
        `${endpoint}?data=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(2500) } // Reduced timeout for faster fallback
      );
      
      if (!response.ok) {
        console.log(`[Traccar] ${endpoint} returned ${response.status}, trying next...`);
        continue;
      }
      
      const data = await response.json();
      
      let speedLimit: number | null = null;
      
      if (data.elements && data.elements.length > 0) {
        const road = data.elements[0];
        if (road.tags?.maxspeed) {
          speedLimit = parseMaxSpeed(road.tags.maxspeed);
          console.log(`[Traccar] Speed limit found: ${road.tags.maxspeed} → ${speedLimit} km/h`);
        }
      }
      
      // Cache the result (even null to avoid repeated lookups)
      speedLimitCache.set(gridKey, { limit: speedLimit, timestamp: Date.now() });
      
      return speedLimit;
    } catch (err) {
      console.log(`[Traccar] ${endpoint} failed, trying next...`);
      continue;
    }
  }
  
  // All endpoints failed - use stale cache if available
  if (cached) {
    console.log(`[Traccar] All endpoints failed, using stale cache: ${cached.limit} km/h`);
    // Refresh stale cache timestamp to avoid hammering failed APIs
    speedLimitCache.set(gridKey, { limit: cached.limit, timestamp: Date.now() - CACHE_TTL_MS / 2 });
    return cached.limit;
  }
  
  // Last resort: cache null to prevent repeated failed lookups
  speedLimitCache.set(gridKey, { limit: null, timestamp: Date.now() });
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    let deviceId: string | null = null;
    let lat: number = NaN;
    let lon: number = NaN;
    let speedMs: number = 0;
    let bearing: number = 0;
    let altitude: number = 0;
    let accuracy: number = 0;
    let timestamp: string = new Date().toISOString();
    let battery: number = 0;

    // Check if this is a JSON POST request (modern iOS/Android clients)
    const contentType = req.headers.get("content-type") || "";
    
    if (req.method === "POST" && contentType.includes("application/json")) {
      // Parse JSON body format (iOS Traccar Client v9.0+)
      const body = await req.json();
      console.log(`[Traccar] Received JSON body:`, JSON.stringify(body));
      
      // Handle the nested structure from iOS client
      if (body.location && body.location.coords) {
        deviceId = body.device_id || body.deviceId || body.id;
        lat = body.location.coords.latitude;
        lon = body.location.coords.longitude;
        speedMs = body.location.coords.speed || 0;
        bearing = body.location.coords.heading || 0;
        altitude = body.location.coords.altitude || 0;
        accuracy = body.location.coords.accuracy || 0;
        timestamp = body.location.timestamp || new Date().toISOString();
        battery = (body.location.battery?.level || 0) * 100;
      } else {
        // Flat JSON structure
        deviceId = body.id || body.device_id || body.deviceId;
        lat = body.lat || body.latitude;
        lon = body.lon || body.longitude;
        speedMs = body.speed || 0;
        bearing = body.bearing || body.heading || 0;
        altitude = body.altitude || body.alt || 0;
        accuracy = body.accuracy || body.acc || 0;
        timestamp = body.timestamp || new Date().toISOString();
        battery = body.batt || body.battery || 0;
      }
    } else {
      // Parse OsmAnd protocol query parameters (legacy format)
      deviceId = params.get("id");
      lat = parseFloat(params.get("lat") || "");
      lon = parseFloat(params.get("lon") || "");
      speedMs = parseFloat(params.get("speed") || "0");
      bearing = parseFloat(params.get("bearing") || params.get("hdg") || "0");
      altitude = parseFloat(params.get("altitude") || params.get("alt") || "0");
      accuracy = parseFloat(params.get("accuracy") || params.get("acc") || "0");
      timestamp = params.get("timestamp") || new Date().toISOString();
      battery = parseFloat(params.get("batt") || "0");
    }

    // Handle negative speed (Traccar sends -1 when stationary/unknown)
    if (speedMs < 0) speedMs = 0;
    
    // Speed comes in m/s, convert to km/h
    const speedKmh = speedMs * 3.6;

    console.log(`[Traccar] Parsed: device=${deviceId}, lat=${lat}, lon=${lon}, speed=${speedKmh.toFixed(1)}km/h, bearing=${bearing}`);

    // Validate required parameters
    if (!deviceId) {
      return new Response("Missing device ID", { status: 400, headers: corsHeaders });
    }

    if (isNaN(lat) || isNaN(lon)) {
      return new Response("Invalid coordinates", { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase client with service role for webhook access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up device
    const { data: device, error: deviceError } = await supabase
      .from("traccar_devices")
      .select("*")
      .eq("device_identifier", deviceId)
      .single();

    if (deviceError || !device) {
      console.log(`[Traccar] Device not found: ${deviceId}`);
      return new Response("Device not registered", { status: 404, headers: corsHeaders });
    }

    const typedDevice = device as TraccarDevice;
    const now = new Date();
    const lastSeenAt = typedDevice.last_seen_at ? new Date(typedDevice.last_seen_at) : null;
    const timeDiffSeconds = lastSeenAt ? (now.getTime() - lastSeenAt.getTime()) / 1000 : null;

    // Calculate distance from last point
    let distanceMeters = 0;
    if (typedDevice.last_latitude !== null && typedDevice.last_longitude !== null) {
      distanceMeters = calculateDistance(
        typedDevice.last_latitude,
        typedDevice.last_longitude,
        lat,
        lon
      );
    }

    // Fetch speed limit asynchronously (don't block GPS processing)
    let speedLimitKmh: number | null = null;
    try {
      speedLimitKmh = await getSpeedLimit(lat, lon);
    } catch (err) {
      console.log(`[Traccar] Speed limit lookup error:`, err);
    }

    // Calculate braking and acceleration if we have previous data
    let brakingAlert: { severity: string; deceleration: number } | null = null;
    let accelerationAlert: { severity: string; acceleration: number } | null = null;

    if (
      typedDevice.last_speed_kmh !== null &&
      timeDiffSeconds !== null &&
      timeDiffSeconds > 0 &&
      timeDiffSeconds < 30 // Only consider if within 30 seconds
    ) {
      const speedDiffKmh = typedDevice.last_speed_kmh - speedKmh;
      const speedDiffMs = speedDiffKmh / 3.6;
      const rateOfChange = Math.abs(speedDiffMs) / timeDiffSeconds;

      if (speedDiffKmh > 0) {
        // Speed decreased = braking
        if (rateOfChange >= BRAKING_THRESHOLDS.HIGH) {
          brakingAlert = { severity: "high", deceleration: rateOfChange };
        } else if (rateOfChange >= BRAKING_THRESHOLDS.MEDIUM) {
          brakingAlert = { severity: "medium", deceleration: rateOfChange };
        } else if (rateOfChange >= BRAKING_THRESHOLDS.LOW) {
          brakingAlert = { severity: "low", deceleration: rateOfChange };
        }

        if (brakingAlert) {
          console.log(`[Traccar] Braking detected: ${brakingAlert.severity} (${rateOfChange.toFixed(2)} m/s²)`);
        }
      } else if (speedDiffKmh < 0) {
        // Speed increased = acceleration
        if (rateOfChange >= ACCELERATION_THRESHOLDS.HIGH) {
          accelerationAlert = { severity: "high", acceleration: rateOfChange };
        } else if (rateOfChange >= ACCELERATION_THRESHOLDS.MEDIUM) {
          accelerationAlert = { severity: "medium", acceleration: rateOfChange };
        } else if (rateOfChange >= ACCELERATION_THRESHOLDS.LOW) {
          accelerationAlert = { severity: "low", acceleration: rateOfChange };
        }

        if (accelerationAlert) {
          console.log(`[Traccar] Acceleration detected: ${accelerationAlert.severity} (${rateOfChange.toFixed(2)} m/s²)`);
        }
      }
    }

    // Update device record with speed limit (always, even without pupil)
    const { error: updateError } = await supabase
      .from("traccar_devices")
      .update({
        last_speed_kmh: speedKmh,
        last_latitude: lat,
        last_longitude: lon,
        last_heading: bearing,
        last_seen_at: now.toISOString(),
        last_speed_limit_kmh: speedLimitKmh, // Always store speed limit
      })
      .eq("id", typedDevice.id);

    if (updateError) {
      console.error("[Traccar] Device update error:", updateError);
    }

    // If session is active, record data and create alerts
    if (typedDevice.current_session_id && typedDevice.current_pupil_id) {
      // Insert GPS point with speed limit
      const { error: gpsError } = await supabase
        .from("telematics_gps_points")
        .insert({
          telematics_id: typedDevice.current_session_id,
          latitude: lat,
          longitude: lon,
          speed_kmh: speedKmh,
          heading: bearing,
          altitude_m: altitude,
          accuracy_m: accuracy,
          speed_limit_kmh: speedLimitKmh,
          recorded_at: now.toISOString(),
        });

      if (gpsError) {
        console.error("[Traccar] GPS point insert error:", gpsError);
      }

      // Update total distance in lesson_telematics
      if (distanceMeters > 0 && distanceMeters < 5000) { // Ignore jumps > 5km (GPS errors)
        const distanceKm = distanceMeters / 1000;
        
        // Get current distance and add to it
        const { data: sessionData } = await supabase
          .from("lesson_telematics")
          .select("total_distance_km")
          .eq("id", typedDevice.current_session_id)
          .single();
        
        const currentDistance = sessionData?.total_distance_km || 0;
        
        await supabase
          .from("lesson_telematics")
          .update({ total_distance_km: currentDistance + distanceKm })
          .eq("id", typedDevice.current_session_id);
      }

      // Update live position using RPC with speed limit
      try {
        const { error: liveError } = await supabase.rpc("update_live_position", {
          p_pupil_id: typedDevice.current_pupil_id,
          p_latitude: lat,
          p_longitude: lon,
          p_speed_kmh: speedKmh,
          p_heading: bearing,
          p_accuracy: accuracy,
          p_trip_status: speedKmh > 5 ? "driving" : "stopped",
          p_session_id: typedDevice.current_session_id,
          p_speed_limit_kmh: speedLimitKmh,
        });

        if (liveError) {
          console.error("[Traccar] Live position update error:", liveError);
        }
      } catch (rpcErr) {
        console.error("[Traccar] RPC error:", rpcErr);
      }

      // Create braking alert if detected
      if (brakingAlert) {
        const { error: brakeAlertError } = await supabase
          .from("telematics_realtime_alerts")
          .insert({
            telematics_id: typedDevice.current_session_id,
            alert_type: "harsh_braking",
            severity: brakingAlert.severity,
            speed_kmh: speedKmh,
            latitude: lat,
            longitude: lon,
            is_acknowledged: false,
          });

        if (brakeAlertError) {
          console.error("[Traccar] Braking alert insert error:", brakeAlertError);
        }
      }

      // Create acceleration alert if detected
      if (accelerationAlert) {
        const { error: accelAlertError } = await supabase
          .from("telematics_realtime_alerts")
          .insert({
            telematics_id: typedDevice.current_session_id,
            alert_type: "harsh_acceleration",
            severity: accelerationAlert.severity,
            speed_kmh: speedKmh,
            latitude: lat,
            longitude: lon,
            is_acknowledged: false,
          });

        if (accelAlertError) {
          console.error("[Traccar] Acceleration alert insert error:", accelAlertError);
        }
      }

      // Create speeding alert if detected
      if (speedLimitKmh && speedKmh > speedLimitKmh + 5) { // 5 km/h buffer
        const overSpeed = speedKmh - speedLimitKmh;
        const severity = overSpeed > 20 ? "high" : overSpeed > 10 ? "medium" : "low";
        
        const { error: speedAlertError } = await supabase
          .from("telematics_realtime_alerts")
          .insert({
            telematics_id: typedDevice.current_session_id,
            alert_type: "speeding",
            severity,
            speed_kmh: speedKmh,
            latitude: lat,
            longitude: lon,
            is_acknowledged: false,
          });

        if (speedAlertError) {
          console.error("[Traccar] Speeding alert insert error:", speedAlertError);
        } else {
          console.log(`[Traccar] Speeding alert: ${speedKmh.toFixed(1)} km/h in ${speedLimitKmh} km/h zone (${severity})`);
        }
      }

      console.log(`[Traccar] Session data recorded for pupil ${typedDevice.current_pupil_id}, distance: ${(distanceMeters / 1000).toFixed(3)}km, speed limit: ${speedLimitKmh || 'unknown'}`);
    }

    // Return success (Traccar expects 200 OK)
    return new Response("OK", { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "text/plain" } 
    });

  } catch (error) {
    console.error("[Traccar] Webhook error:", error);
    return new Response("Internal server error", { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
