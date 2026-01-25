import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thresholds for calculated braking detection
const BRAKING_THRESHOLDS = {
  LOW: 3.5,    // m/s² - gentle braking
  MEDIUM: 5.0, // m/s² - firm braking
  HIGH: 7.0,   // m/s² - harsh braking
};

// Speed limit tolerance before alert (km/h)
const SPEED_TOLERANCE = 5;

// Minimum time between speed limit lookups (ms)
const SPEED_LIMIT_THROTTLE_MS = 5000;

// Minimum distance between speed limit lookups (meters)
const SPEED_LIMIT_THROTTLE_DISTANCE = 100;

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

    // Calculate braking if we have previous data
    let brakingAlert: { severity: string; deceleration: number } | null = null;
    if (
      typedDevice.last_speed_kmh !== null &&
      timeDiffSeconds !== null &&
      timeDiffSeconds > 0 &&
      timeDiffSeconds < 30 // Only consider if within 30 seconds
    ) {
      const speedDiffKmh = typedDevice.last_speed_kmh - speedKmh;
      if (speedDiffKmh > 0) {
        // Converting to m/s for deceleration calculation
        const speedDiffMs = speedDiffKmh / 3.6;
        const deceleration = speedDiffMs / timeDiffSeconds;

        if (deceleration >= BRAKING_THRESHOLDS.HIGH) {
          brakingAlert = { severity: "high", deceleration };
        } else if (deceleration >= BRAKING_THRESHOLDS.MEDIUM) {
          brakingAlert = { severity: "medium", deceleration };
        } else if (deceleration >= BRAKING_THRESHOLDS.LOW) {
          brakingAlert = { severity: "low", deceleration };
        }

        if (brakingAlert) {
          console.log(`[Traccar] Braking detected: ${brakingAlert.severity} (${deceleration.toFixed(2)} m/s²)`);
        }
      }
    }

    // Check if we should look up speed limit (throttle by time and distance)
    let shouldLookupSpeedLimit = true;
    if (typedDevice.last_latitude !== null && typedDevice.last_longitude !== null && lastSeenAt) {
      const distance = calculateDistance(
        typedDevice.last_latitude,
        typedDevice.last_longitude,
        lat,
        lon
      );
      const timeSinceLastLookup = now.getTime() - lastSeenAt.getTime();

      if (timeSinceLastLookup < SPEED_LIMIT_THROTTLE_MS && distance < SPEED_LIMIT_THROTTLE_DISTANCE) {
        shouldLookupSpeedLimit = false;
      }
    }

    // Fetch speed limit if needed and session is active
    let speedLimit: number | null = null;
    let roadName: string | null = null;
    let speedingAlert: { severity: string; overSpeed: number } | null = null;

    if (typedDevice.current_session_id && shouldLookupSpeedLimit) {
      try {
        const speedLimitResponse = await fetch(
          `${supabaseUrl}/functions/v1/google-speed-limits`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ lat, lon }),
          }
        );

        if (speedLimitResponse.ok) {
          const speedLimitData = await speedLimitResponse.json();
          speedLimit = speedLimitData.speedLimit;
          roadName = speedLimitData.roadName;
          console.log(`[Traccar] Speed limit: ${speedLimit} km/h on ${roadName}`);

          // Check for speeding
          if (speedLimit !== null && speedKmh > speedLimit + SPEED_TOLERANCE) {
            const overSpeed = speedKmh - speedLimit;
            if (overSpeed > 20) {
              speedingAlert = { severity: "high", overSpeed };
            } else if (overSpeed > 10) {
              speedingAlert = { severity: "medium", overSpeed };
            } else {
              speedingAlert = { severity: "low", overSpeed };
            }
            console.log(`[Traccar] Speeding detected: ${overSpeed.toFixed(1)} km/h over (${speedingAlert.severity})`);
          }
        }
      } catch (err) {
        console.error("[Traccar] Speed limit lookup error:", err);
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
      })
      .eq("id", typedDevice.id);

    if (updateError) {
      console.error("[Traccar] Device update error:", updateError);
    }

    // If session is active, record data and create alerts
    if (typedDevice.current_session_id && typedDevice.current_pupil_id) {
      // Insert GPS point
      const { error: gpsError } = await supabase
        .from("telematics_gps_points")
        .insert({
          telematics_id: typedDevice.current_session_id,
          latitude: lat,
          longitude: lon,
          speed_kmh: speedKmh,
          heading: bearing,
          altitude,
          accuracy,
          speed_limit: speedLimit,
          road_name: roadName,
          recorded_at: now.toISOString(),
        });

      if (gpsError) {
        console.error("[Traccar] GPS point insert error:", gpsError);
      }

      // Update live position using RPC
      try {
        const { error: liveError } = await supabase.rpc("update_live_position", {
          p_pupil_id: typedDevice.current_pupil_id,
          p_instructor_id: typedDevice.instructor_id,
          p_latitude: lat,
          p_longitude: lon,
          p_speed_kmh: speedKmh,
          p_heading: bearing,
          p_accuracy: accuracy,
          p_trip_status: speedKmh > 5 ? "driving" : "stopped",
          p_telematics_session_id: typedDevice.current_session_id,
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
            speed_limit_kmh: speedLimit,
            latitude: lat,
            longitude: lon,
            road_name: roadName,
            is_acknowledged: false,
          });

        if (brakeAlertError) {
          console.error("[Traccar] Braking alert insert error:", brakeAlertError);
        }
      }

      // Create speeding alert if detected
      if (speedingAlert) {
        const { error: speedAlertError } = await supabase
          .from("telematics_realtime_alerts")
          .insert({
            telematics_id: typedDevice.current_session_id,
            alert_type: "speeding",
            severity: speedingAlert.severity,
            speed_kmh: speedKmh,
            speed_limit_kmh: speedLimit,
            latitude: lat,
            longitude: lon,
            road_name: roadName,
            is_acknowledged: false,
          });

        if (speedAlertError) {
          console.error("[Traccar] Speeding alert insert error:", speedAlertError);
        }
      }

      console.log(`[Traccar] Session data recorded for pupil ${typedDevice.current_pupil_id}`);
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
