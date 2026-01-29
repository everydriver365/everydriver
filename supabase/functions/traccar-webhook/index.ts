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

// Simple in-memory cache for speed limits and road names (grid-based)
const speedLimitCache = new Map<string, { limit: number | null; roadName: string | null; timestamp: number }>();
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

// Check adjacent grid cells for cached speed limits (fallback when API fails)
function getNearbyCache(lat: number, lon: number): { limit: number | null; roadName: string | null } | null {
  const offsets = [
    [0, 0.0005], [0, -0.0005], [0.0005, 0], [-0.0005, 0],
    [0.0005, 0.0005], [-0.0005, -0.0005], [0.0005, -0.0005], [-0.0005, 0.0005]
  ];
  
  for (const [dLat, dLon] of offsets) {
    const key = getGridKey(lat + dLat, lon + dLon);
    const cached = speedLimitCache.get(key);
    if (cached && cached.limit !== null) {
      console.log(`[Traccar] Using nearby grid cache: ${cached.limit} km/h, ${cached.roadName}`);
      return { limit: cached.limit, roadName: cached.roadName };
    }
  }
  return null;
}

// Fetch road name from Mapbox Geocoding API (more reliable for single points)
async function getRoadName(lat: number, lon: number, mapboxToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&types=address,poi&limit=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (!response.ok) {
      console.log(`[Traccar] Mapbox Geocoding API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const feature = data.features?.[0];
    
    if (feature) {
      // Extract road name from the place_name or text
      const roadName = feature.text || feature.place_name?.split(',')[0] || null;
      return roadName;
    }
    
    return null;
  } catch (err) {
    console.log(`[Traccar] Mapbox Geocoding error: ${err}`);
    return null;
  }
}

// Fetch speed limit from OSM Overpass API (more reliable for speed limits)
async function getSpeedLimitFromOSM(lat: number, lon: number): Promise<number | null> {
  try {
    const radius = 30; // 30m search radius
    const query = `
      [out:json][timeout:5];
      way(around:${radius},${lat},${lon})["highway"]["maxspeed"];
      out tags;
    `;
    
    const response = await fetch(
      `https://overpass-api.de/api/interpreter`,
      {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!response.ok) {
      console.log(`[Traccar] OSM Overpass API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const way = data.elements?.[0];
    
    if (way?.tags?.maxspeed) {
      const maxspeed = way.tags.maxspeed;
      // Parse speed limit (e.g., "30 mph", "50", "30")
      const match = maxspeed.match(/(\d+)/);
      if (match) {
        let speed = parseInt(match[1], 10);
        // If contains "mph", convert to km/h for storage (we display in mph anyway)
        if (maxspeed.toLowerCase().includes('mph')) {
          speed = Math.round(speed * 1.60934);
        }
        return speed;
      }
    }
    
    return null;
  } catch (err) {
    console.log(`[Traccar] OSM Overpass error: ${err}`);
    return null;
  }
}

// Fetch speed limit AND road name (using Mapbox Geocoding + OSM Overpass)
async function getRoadInfo(lat: number, lon: number): Promise<{ speedLimit: number | null; roadName: string | null }> {
  const gridKey = getGridKey(lat, lon);
  
  // Check cache first
  const cached = speedLimitCache.get(gridKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return { speedLimit: cached.limit, roadName: cached.roadName };
  }
  
  // Try nearby grid cells first (faster than API)
  const nearby = getNearbyCache(lat, lon);
  if (nearby !== null) {
    return { speedLimit: nearby.limit, roadName: nearby.roadName };
  }
  
  const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");
  
  console.log(`[Traccar] Road info lookup at ${lat.toFixed(6)},${lon.toFixed(6)}`);
  
  try {
    // Fetch road name and speed limit in parallel
    const [roadName, speedLimit] = await Promise.all([
      MAPBOX_TOKEN ? getRoadName(lat, lon, MAPBOX_TOKEN) : Promise.resolve(null),
      getSpeedLimitFromOSM(lat, lon)
    ]);
    
    if (speedLimit || roadName) {
      console.log(`[Traccar] Road info: ${roadName || 'unnamed'}, ${speedLimit ? speedLimit + ' km/h' : 'no limit'}`);
    }
    
    // Cache the result
    speedLimitCache.set(gridKey, { limit: speedLimit, roadName, timestamp: Date.now() });
    
    return { speedLimit, roadName };
  } catch (err) {
    console.log(`[Traccar] Mapbox API error:`, err);
    
    // Use stale cache if available
    if (cached) {
      console.log(`[Traccar] Using stale cache: ${cached.limit} km/h`);
      speedLimitCache.set(gridKey, { limit: cached.limit, roadName: cached.roadName, timestamp: Date.now() - CACHE_TTL_MS / 2 });
      return { speedLimit: cached.limit, roadName: cached.roadName };
    }
    
    // Cache null to prevent repeated failed lookups
    speedLimitCache.set(gridKey, { limit: null, roadName: null, timestamp: Date.now() });
    return { speedLimit: null, roadName: null };
  }
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

    // Fetch road info (speed limit + road name) from Mapbox
    let speedLimitKmh: number | null = null;
    let roadName: string | null = null;
    try {
      const roadInfo = await getRoadInfo(lat, lon);
      speedLimitKmh = roadInfo.speedLimit;
      roadName = roadInfo.roadName;
    } catch (err) {
      console.log(`[Traccar] Road info lookup error:`, err);
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

    // Update device record with speed limit and road name (always, even without pupil)
    const { error: updateError } = await supabase
      .from("traccar_devices")
      .update({
        last_speed_kmh: speedKmh,
        last_latitude: lat,
        last_longitude: lon,
        last_heading: bearing,
        last_seen_at: now.toISOString(),
        last_speed_limit_kmh: speedLimitKmh,
        last_road_name: roadName,
      })
      .eq("id", typedDevice.id);

    if (updateError) {
      console.error("[Traccar] Device update error:", updateError);
    }

    // If session is active, record data and create alerts (pupil is optional for Test Routes)
    if (typedDevice.current_session_id) {
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

      // Only update live position if a pupil is assigned (RPC requires pupil_id)
      if (typedDevice.current_pupil_id) {
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

      console.log(`[Traccar] Session data recorded for session ${typedDevice.current_session_id}, pupil: ${typedDevice.current_pupil_id || 'none (test route)'}, distance: ${(distanceMeters / 1000).toFixed(3)}km, speed limit: ${speedLimitKmh || 'unknown'}`);
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
