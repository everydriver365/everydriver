import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thresholds for calculated braking detection (m/s²)
const BRAKING_THRESHOLDS = {
  LOW: 3.5,
  MEDIUM: 5.0,
  HIGH: 7.0,
};

// Thresholds for acceleration detection (m/s²)
const ACCELERATION_THRESHOLDS = {
  LOW: 2.5,
  MEDIUM: 4.0,
  HIGH: 6.0,
};

// Simple in-memory cache for speed limits and road names (grid-based)
const speedLimitCache = new Map<string, { limit: number | null; roadName: string | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

interface TraccarDevice {
  id: string;
  instructor_id: string;
  device_identifier: string;
  current_pupil_id: string | null;
  current_session_id: string | null;
  last_speed_kmh: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_seen_at: string | null;
  last_traccar_position_id: number | null;
  last_traccar_fix_time: string | null;
}

interface TraccarPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number; // in knots
  course: number;
  altitude: number;
  accuracy: number;
  fixTime: string;
  deviceTime: string;
  serverTime: string;
  attributes: {
    ignition?: boolean;
    motion?: boolean;
    battery?: number;
    distance?: number;
  };
}

interface TraccarDeviceInfo {
  id: number;
  uniqueId: string;
  name: string;
}

// Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
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
  const latGrid = Math.round(lat * 2000) / 2000;
  const lonGrid = Math.round(lon * 3000) / 3000;
  return `${latGrid},${lonGrid}`;
}

// Fetch road name from Mapbox Geocoding API
async function getRoadName(lat: number, lon: number, mapboxToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&types=address,poi&limit=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const feature = data.features?.[0];
    
    if (feature) {
      return feature.text || feature.place_name?.split(',')[0] || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Fetch speed limit from OSM Overpass API
async function getSpeedLimitFromOSM(lat: number, lon: number): Promise<number | null> {
  try {
    const radius = 30;
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
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const way = data.elements?.[0];
    
    if (way?.tags?.maxspeed) {
      const maxspeed = way.tags.maxspeed;
      const match = maxspeed.match(/(\d+)/);
      if (match) {
        let speed = parseInt(match[1], 10);
        if (maxspeed.toLowerCase().includes('mph')) {
          speed = Math.round(speed * 1.60934);
        }
        return speed;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// Fetch speed limit AND road name
async function getRoadInfo(lat: number, lon: number): Promise<{ speedLimit: number | null; roadName: string | null }> {
  const gridKey = getGridKey(lat, lon);
  
  const cached = speedLimitCache.get(gridKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return { speedLimit: cached.limit, roadName: cached.roadName };
  }
  
  const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");
  
  try {
    const [roadName, speedLimit] = await Promise.all([
      MAPBOX_TOKEN ? getRoadName(lat, lon, MAPBOX_TOKEN) : Promise.resolve(null),
      getSpeedLimitFromOSM(lat, lon)
    ]);
    
    speedLimitCache.set(gridKey, { limit: speedLimit, roadName, timestamp: Date.now() });
    
    return { speedLimit, roadName };
  } catch {
    if (cached) {
      return { speedLimit: cached.limit, roadName: cached.roadName };
    }
    speedLimitCache.set(gridKey, { limit: null, roadName: null, timestamp: Date.now() });
    return { speedLimit: null, roadName: null };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TRACCAR_URL = Deno.env.get("TRACCAR_SERVER_URL");
    const email = Deno.env.get("TRACCAR_EMAIL");
    const password = Deno.env.get("TRACCAR_PASSWORD");

    if (!TRACCAR_URL || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing Traccar credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = btoa(`${email}:${password}`);
    const authHeaders = {
      "Authorization": `Basic ${auth}`,
      "Accept": "application/json"
    };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch devices from Traccar to build uniqueId mapping
    const devicesRes = await fetch(`${TRACCAR_URL}/api/devices`, { headers: authHeaders });
    if (!devicesRes.ok) {
      const text = await devicesRes.text();
      console.error(`[Traccar-Poller] Failed to fetch devices: ${devicesRes.status}`, text);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Traccar devices", details: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const traccarDevices: TraccarDeviceInfo[] = await devicesRes.json();
    const deviceIdToUniqueId = new Map<number, string>();
    for (const d of traccarDevices) {
      deviceIdToUniqueId.set(d.id, d.uniqueId);
    }

    console.log(`[Traccar-Poller] Found ${traccarDevices.length} devices on Traccar server`);

    // 2. Fetch latest positions from Traccar
    const positionsRes = await fetch(`${TRACCAR_URL}/api/positions`, { headers: authHeaders });
    if (!positionsRes.ok) {
      const text = await positionsRes.text();
      console.error(`[Traccar-Poller] Failed to fetch positions: ${positionsRes.status}`, text);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Traccar positions", details: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const positions: TraccarPosition[] = await positionsRes.json();
    console.log(`[Traccar-Poller] Received ${positions.length} positions`);

    // 3. Get registered devices from our database
    const { data: registeredDevices, error: devicesError } = await supabase
      .from("traccar_devices")
      .select("*");

    if (devicesError) {
      console.error(`[Traccar-Poller] Database error:`, devicesError);
      return new Response(
        JSON.stringify({ error: "Database error", details: devicesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build lookup by device_identifier
    const devicesByIdentifier = new Map<string, TraccarDevice>();
    for (const d of registeredDevices || []) {
      devicesByIdentifier.set(d.device_identifier, d as TraccarDevice);
    }

    console.log(`[Traccar-Poller] ${devicesByIdentifier.size} devices registered in database`);

    let processed = 0;
    let skipped = 0;

    // 4. Process each position
    for (const pos of positions) {
      const uniqueId = deviceIdToUniqueId.get(pos.deviceId);
      if (!uniqueId) {
        console.log(`[Traccar-Poller] No uniqueId mapping for Traccar deviceId ${pos.deviceId}`);
        skipped++;
        continue;
      }

      const device = devicesByIdentifier.get(uniqueId);
      if (!device) {
        console.log(`[Traccar-Poller] Device ${uniqueId} not registered in database`);
        skipped++;
        continue;
      }

      // Check if we've already processed this position
      if (device.last_traccar_position_id && pos.id <= device.last_traccar_position_id) {
        console.log(`[Traccar-Poller] Position ${pos.id} already processed for device ${uniqueId}`);
        
        // Still update last_seen_at to indicate device is communicating
        await supabase
          .from("traccar_devices")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", device.id);
        
        skipped++;
        continue;
      }

      // Alternative: check by fixTime
      if (device.last_traccar_fix_time) {
        const lastFixTime = new Date(device.last_traccar_fix_time).getTime();
        const currentFixTime = new Date(pos.fixTime).getTime();
        if (currentFixTime <= lastFixTime) {
          // Still update last_seen_at to indicate device is communicating
          await supabase
            .from("traccar_devices")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", device.id);
          
          skipped++;
          continue;
        }
      }

      // Speed comes in knots from Traccar, convert to km/h
      const speedKmh = pos.speed * 1.852;
      const lat = pos.latitude;
      const lon = pos.longitude;
      const bearing = pos.course || 0;
      const altitude = pos.altitude || 0;
      const accuracy = pos.accuracy || 0;
      const now = new Date();

      console.log(`[Traccar-Poller] Processing: device=${uniqueId}, pos=${pos.id}, speed=${speedKmh.toFixed(1)}km/h`);

      // Calculate time diff for acceleration detection
      const lastSeenAt = device.last_seen_at ? new Date(device.last_seen_at) : null;
      const timeDiffSeconds = lastSeenAt ? (now.getTime() - lastSeenAt.getTime()) / 1000 : null;

      // Calculate distance from last point
      let distanceMeters = 0;
      if (device.last_latitude !== null && device.last_longitude !== null) {
        distanceMeters = calculateDistance(device.last_latitude, device.last_longitude, lat, lon);
      }

      // Fetch road info
      let speedLimitKmh: number | null = null;
      let roadName: string | null = null;
      try {
        const roadInfo = await getRoadInfo(lat, lon);
        speedLimitKmh = roadInfo.speedLimit;
        roadName = roadInfo.roadName;
      } catch (err) {
        console.log(`[Traccar-Poller] Road info lookup error:`, err);
      }

      // Calculate braking and acceleration
      let brakingAlert: { severity: string; deceleration: number } | null = null;
      let accelerationAlert: { severity: string; acceleration: number } | null = null;

      if (
        device.last_speed_kmh !== null &&
        timeDiffSeconds !== null &&
        timeDiffSeconds > 0 &&
        timeDiffSeconds < 30
      ) {
        const speedDiffKmh = device.last_speed_kmh - speedKmh;
        const speedDiffMs = speedDiffKmh / 3.6;
        const rateOfChange = Math.abs(speedDiffMs) / timeDiffSeconds;

        if (speedDiffKmh > 0) {
          if (rateOfChange >= BRAKING_THRESHOLDS.HIGH) {
            brakingAlert = { severity: "high", deceleration: rateOfChange };
          } else if (rateOfChange >= BRAKING_THRESHOLDS.MEDIUM) {
            brakingAlert = { severity: "medium", deceleration: rateOfChange };
          } else if (rateOfChange >= BRAKING_THRESHOLDS.LOW) {
            brakingAlert = { severity: "low", deceleration: rateOfChange };
          }
        } else if (speedDiffKmh < 0) {
          if (rateOfChange >= ACCELERATION_THRESHOLDS.HIGH) {
            accelerationAlert = { severity: "high", acceleration: rateOfChange };
          } else if (rateOfChange >= ACCELERATION_THRESHOLDS.MEDIUM) {
            accelerationAlert = { severity: "medium", acceleration: rateOfChange };
          } else if (rateOfChange >= ACCELERATION_THRESHOLDS.LOW) {
            accelerationAlert = { severity: "low", acceleration: rateOfChange };
          }
        }
      }

      // Update device record
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
          last_traccar_position_id: pos.id,
          last_traccar_fix_time: pos.fixTime,
        })
        .eq("id", device.id);

      if (updateError) {
        console.error(`[Traccar-Poller] Device update error:`, updateError);
      }

      // If session is active, record data
      if (device.current_session_id) {
        // Insert GPS point
        const { error: gpsError } = await supabase
          .from("telematics_gps_points")
          .insert({
            telematics_id: device.current_session_id,
            latitude: lat,
            longitude: lon,
            speed_kmh: speedKmh,
            heading: bearing,
            altitude_m: altitude,
            accuracy_m: accuracy,
            speed_limit_kmh: speedLimitKmh,
            recorded_at: pos.fixTime,
          });

        if (gpsError) {
          console.error(`[Traccar-Poller] GPS point insert error:`, gpsError);
        }

        // Update total distance atomically
        if (distanceMeters > 0 && distanceMeters < 5000) {
          const distanceKm = distanceMeters / 1000;
          
          await supabase.rpc("increment_total_distance", {
            p_id: device.current_session_id,
            p_distance: distanceKm
          });
        }

        // Update live position if pupil is assigned
        if (device.current_pupil_id) {
          try {
            await supabase.rpc("update_live_position", {
              p_pupil_id: device.current_pupil_id,
              p_latitude: lat,
              p_longitude: lon,
              p_speed_kmh: speedKmh,
              p_heading: bearing,
              p_accuracy: accuracy,
              p_trip_status: speedKmh > 5 ? "driving" : "stopped",
              p_session_id: device.current_session_id,
              p_speed_limit_kmh: speedLimitKmh,
            });
          } catch (rpcErr) {
            console.error(`[Traccar-Poller] RPC error:`, rpcErr);
          }
        }

        // Create alerts if detected
        if (brakingAlert) {
          await supabase
            .from("telematics_realtime_alerts")
            .insert({
              telematics_id: device.current_session_id,
              alert_type: "harsh_braking",
              severity: brakingAlert.severity,
              speed_kmh: speedKmh,
              latitude: lat,
              longitude: lon,
              is_acknowledged: false,
            });
        }

        if (accelerationAlert) {
          await supabase
            .from("telematics_realtime_alerts")
            .insert({
              telematics_id: device.current_session_id,
              alert_type: "harsh_acceleration",
              severity: accelerationAlert.severity,
              speed_kmh: speedKmh,
              latitude: lat,
              longitude: lon,
              is_acknowledged: false,
            });
        }

        // Create speeding alert if over limit
        if (speedLimitKmh && speedKmh > speedLimitKmh + 5) {
          const overspeed = speedKmh - speedLimitKmh;
          let severity = "low";
          if (overspeed > 20) severity = "high";
          else if (overspeed > 10) severity = "medium";

          await supabase
            .from("telematics_realtime_alerts")
            .insert({
              telematics_id: device.current_session_id,
              alert_type: "speeding",
              severity,
              speed_kmh: speedKmh,
              latitude: lat,
              longitude: lon,
              is_acknowledged: false,
            });
        }
      }

      processed++;
    }

    console.log(`[Traccar-Poller] Complete: ${processed} processed, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        skipped,
        total_positions: positions.length,
        registered_devices: devicesByIdentifier.size
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(`[Traccar-Poller] Error:`, err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
