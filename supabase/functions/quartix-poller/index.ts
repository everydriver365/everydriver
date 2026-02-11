import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUARTIX_BASE = "https://qws.quartix.net/v2/api";

// ========== Utilities ==========

function parseLocationText(text: string | null | undefined): string | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim().replace(/\.+$/, "").trim();

  const travelGmtMatch = trimmed.match(/Travelling\s.+?\sGMT[\.\s]+(.+)/i);
  if (travelGmtMatch?.[1]) return travelGmtMatch[1].trim().replace(/\.+$/, "").trim();

  const travelNearMatch = trimmed.match(/Travelling\s.+?\snear\s+(.+)/i);
  if (travelNearMatch?.[1]) return travelNearMatch[1].trim().replace(/\.+$/, "").replace(/\s+since\s.*/i, "").trim();

  const travelOnMatch = trimmed.match(/Travelling\s.+?\son\s+(?!\d{1,2}\s+\w+\s+\d{4})(.+)/i);
  if (travelOnMatch?.[1]) return travelOnMatch[1].trim().replace(/\.+$/, "").trim();

  const travelAtMatch = trimmed.match(/Travelling\s.+?\bat\s+(?:\d[\d.]*\s*mph\s+)?(?:at\s+|on\s+|near\s+)?(.+)/i);
  if (travelAtMatch?.[1] && !/^\d/.test(travelAtMatch[1].trim())) {
    return travelAtMatch[1].trim().replace(/\.+$/, "").replace(/\s+since\s.*/i, "").trim();
  }

  const stationaryAtMatch = trimmed.match(/(?:Stationary|Stopped)\s.*?\bat\s+(.+?)\s+since\s/i);
  if (stationaryAtMatch?.[1]) return stationaryAtMatch[1].trim();

  const simpleAtMatch = trimmed.match(/\bat\s+(.+?)\s+since\s/i);
  if (simpleAtMatch?.[1]) return simpleAtMatch[1].trim();

  const nearMatch = trimmed.match(/near\s+(.+?)(?:\s+since\s|$)/i);
  if (nearMatch?.[1]) return nearMatch[1].trim().replace(/\.+$/, "").trim();

  const afterDateMatch = trimmed.match(/\d{1,2}\s+\w+\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT[\.\s]*(.+)/i);
  if (afterDateMatch?.[1]) return afterDateMatch[1].trim().replace(/\.+$/, "").trim();

  if (trimmed.length <= 60 && !trimmed.toLowerCase().startsWith("travelling")) return trimmed;
  return null;
}

function parseIgnitionStatus(text: string | null | undefined, speedKmh: number | null): boolean | null {
  if (speedKmh && speedKmh > 2) return true;
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase();
  if (lower.includes("ignition off") || lower.includes("stationary")) return false;
  if (lower.includes("ignition on") || lower.includes("travelling")) return true;
  return null;
}

function looksLikeBusinessName(name: string): boolean {
  const businessPatterns = /\b(ltd|llc|inc|plc|limited|corp|group|solutions|services|consulting|holdings)\b/i;
  return businessPatterns.test(name) || /\(\d+\)/.test(name);
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function authenticate(): Promise<string> {
  const customerId = Deno.env.get("QUARTIX_CUSTOMER_ID");
  const username = Deno.env.get("QUARTIX_USERNAME");
  const password = Deno.env.get("QUARTIX_PASSWORD");
  const application = Deno.env.get("QUARTIX_APPLICATION");

  if (!customerId || !username || !password || !application) {
    throw new Error("Quartix credentials not configured.");
  }

  const jsonBody = JSON.stringify({
    CustomerID: customerId, UserName: username, Password: password, Application: application,
  });

  let res = await fetch(`${QUARTIX_BASE}/auth`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: jsonBody,
  });
  let text = await res.text();

  if (!res.ok) {
    const formBody = new URLSearchParams({ CustomerID: customerId, UserName: username, Password: password, Application: application });
    res = await fetch(`${QUARTIX_BASE}/auth`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody,
    });
    text = await res.text();
  }

  if (!res.ok) throw new Error(`Quartix auth failed [${res.status}]: ${text}`);

  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`Quartix auth returned non-JSON: ${text}`); }
  const token = json?.Data?.AccessToken;
  if (!token) throw new Error(`No AccessToken in Quartix auth response: ${text}`);
  return token;
}

// ========== Deferred / Background Operations ==========

async function reverseGeocodeRoadName(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "EveryDriver/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;
    const road = addr.road || addr.pedestrian || addr.neighbourhood;
    if (!road) return null;
    const town = addr.village || addr.town || addr.city || addr.suburb;
    return town ? `${road}, ${town}` : road;
  } catch { return null; }
}

async function fetchSpeedLimit(lat: number, lng: number): Promise<number | null> {
  try {
    const radius = 30;
    const query = `[out:json][timeout:5];way(around:${radius},${lat},${lng})["highway"]["maxspeed"];out tags 1;`;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const way = data?.elements?.[0];
    if (!way?.tags?.maxspeed) return null;
    const raw = way.tags.maxspeed;
    const match = raw.match(/(\d+)/);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    if (raw.toLowerCase().includes("mph")) return value * 1.60934;
    return value;
  } catch { return null; }
}

async function checkGeofences(
  supabase: any, instructorId: string, deviceId: string, lat: number, lng: number
) {
  try {
    const { data: fences } = await supabase
      .from("geofences")
      .select("id, latitude, longitude, radius_m, alert_on_enter, alert_on_exit, active_hours_start, active_hours_end")
      .eq("instructor_id", instructorId)
      .eq("is_active", true);
    if (!fences || fences.length === 0) return;

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentAlerts } = await supabase
      .from("geofence_alerts")
      .select("geofence_id, alert_type")
      .eq("device_id", deviceId)
      .gte("triggered_at", tenMinAgo);
    const recentSet = new Set((recentAlerts || []).map((a: any) => `${a.geofence_id}:${a.alert_type}`));

    for (const fence of fences) {
      const dist = haversineM(lat, lng, fence.latitude, fence.longitude);
      const inside = dist <= fence.radius_m;
      if (fence.active_hours_start && fence.active_hours_end) {
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        if (hhmm < fence.active_hours_start || hhmm > fence.active_hours_end) continue;
      }
      if (inside && fence.alert_on_enter && !recentSet.has(`${fence.id}:enter`)) {
        await supabase.from("geofence_alerts").insert({
          geofence_id: fence.id, device_id: deviceId, instructor_id: instructorId,
          alert_type: "enter", latitude: lat, longitude: lng,
        });
      } else if (!inside && fence.alert_on_exit && !recentSet.has(`${fence.id}:exit`)) {
        const { data: lastAlert } = await supabase
          .from("geofence_alerts").select("alert_type")
          .eq("geofence_id", fence.id).eq("device_id", deviceId)
          .order("triggered_at", { ascending: false }).limit(1);
        if (lastAlert?.[0]?.alert_type === "enter") {
          await supabase.from("geofence_alerts").insert({
            geofence_id: fence.id, device_id: deviceId, instructor_id: instructorId,
            alert_type: "exit", latitude: lat, longitude: lng,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[QuartixPoller] Geofence check error:", err);
  }
}

async function checkUnauthorisedMovement(
  supabase: any, instructorId: string, deviceId: string,
  lat: number, lng: number, speedKmh: number, roadName: string | null, ignition: boolean | null
) {
  try {
    if (!ignition && (!speedKmh || speedKmh < 2)) return;
    const { data: config } = await supabase
      .from("instructor_tracking_config")
      .select("working_hours_start, working_hours_end, working_days")
      .eq("instructor_id", instructorId).maybeSingle();
    if (!config) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
    const workingDays: number[] = config.working_days || [1, 2, 3, 4, 5, 6];
    const start = config.working_hours_start || "07:00:00";
    const end = config.working_hours_end || "20:00:00";
    if (workingDays.includes(dayOfWeek) && hhmm >= start && hhmm <= end) return;

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("movement_alerts").select("id")
      .eq("device_id", deviceId).gte("detected_at", thirtyMinAgo).limit(1);
    if (recent && recent.length > 0) return;

    await supabase.from("movement_alerts").insert({
      device_id: deviceId, instructor_id: instructorId,
      latitude: lat, longitude: lng, speed_kmh: speedKmh, road_name: roadName,
    });
  } catch (err) {
    console.warn("[QuartixPoller] Movement check error:", err);
  }
}

// ========== Main Handler ==========

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let accessToken: string;
    try {
      accessToken = await authenticate();
    } catch (authErr) {
      console.error("[QuartixPoller] Auth error:", authErr);
      return new Response(
        JSON.stringify({ success: false, message: String(authErr), processed: 0, skipped: 0, registered_devices: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qHeaders = { AccessToken: accessToken };

    // ===== Step 1: Auto-sync vehicles =====
    const vehiclesRes = await fetch(`${QUARTIX_BASE}/vehicles`, { headers: qHeaders });
    let quartixVehicles: any[] = [];
    if (vehiclesRes.ok) {
      const vehiclesJson = await vehiclesRes.json();
      quartixVehicles = vehiclesJson?.Data || [];
    }

    const { data: existingDevices } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, quartix_vehicle_id")
      .eq("tracking_provider", "quartix");

    const { data: configs } = await supabase
      .from("instructor_tracking_config")
      .select("instructor_id")
      .eq("provider", "quartix");

    const configuredInstructorIds = configs?.map((c: any) => c.instructor_id) || [];
    const existingVehicleIds = new Set((existingDevices || []).map((d: any) => d.quartix_vehicle_id));
    let newDevicesRegistered = 0;

    for (const vehicle of quartixVehicles) {
      const vehicleId = String(vehicle.VehicleId || vehicle.VehicleID);
      if (existingVehicleIds.has(vehicleId)) continue;
      if (configuredInstructorIds.length === 0) continue;

      const { error: insertErr } = await supabase.from("gps_devices").insert({
        instructor_id: configuredInstructorIds[0],
        device_identifier: `quartix-${vehicleId}`,
        device_name: vehicle.RegistrationNumber || vehicle.Description || `Vehicle ${vehicleId}`,
        tracking_provider: "quartix",
        quartix_vehicle_id: vehicleId,
        is_active: true,
      });
      if (!insertErr) { newDevicesRegistered++; existingVehicleIds.add(vehicleId); }
    }

    // ===== Step 2: Fetch live positions & CORE UPDATE =====
    const liveRes = await fetch(`${QUARTIX_BASE}/vehicles/live`, { headers: qHeaders });
    let processed = 0;
    let skipped = 0;

    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      const positions = liveJson?.Data || [];

      for (const pos of positions) {
        const vehicleId = String(pos.VehicleId || pos.VehicleID);

        // CRITICAL: Fetch device fresh for EACH vehicle to get latest current_session_id
        const { data: device } = await supabase
          .from("gps_devices")
          .select("id, instructor_id, quartix_vehicle_id, quartix_driver_id, current_session_id, last_latitude, last_longitude")
          .eq("quartix_vehicle_id", vehicleId)
          .eq("tracking_provider", "quartix")
          .maybeSingle();

        if (!device) { skipped++; continue; }

        if (!pos.Latitude || !pos.Longitude) { skipped++; continue; }

        // --- Parse speed (Quartix Speed is mph -> km/h) ---
        let speedKmh = pos.Speed != null ? pos.Speed * 1.60934 : 0;
        const parsedIgnition = pos.Ignition ?? parseIgnitionStatus(pos.LocationText, speedKmh);

        // Force speed to 0 when ignition is off or text says stationary
        if (parsedIgnition === false) {
          speedKmh = 0;
        }

        // --- Parse road name (fast, string-only) ---
        let parsedRoadName = parseLocationText(pos.LocationText);

        console.log(`[QuartixPoller] Vehicle=${vehicleId} | speed=${speedKmh.toFixed(1)}kmh | ignition=${parsedIgnition} | session=${device.current_session_id || 'none'} | pos=${pos.Latitude},${pos.Longitude}`);

        // ===== CORE UPDATE: Update gps_devices immediately =====
        const { error: updateErr } = await supabase.from("gps_devices").update({
          last_latitude: pos.Latitude,
          last_longitude: pos.Longitude,
          last_speed_kmh: speedKmh,
          last_heading: pos.Heading,
          last_seen_at: new Date().toISOString(),
          last_ignition_status: parsedIgnition,
          last_road_name: parsedRoadName || null,
        }).eq("id", device.id);

        if (updateErr) {
          console.error(`[QuartixPoller] Device update FAILED for ${device.id}:`, JSON.stringify(updateErr));
          skipped++;
          continue;
        }
        processed++;

        // ===== GPS POINT RECORDING (if session active) =====
        if (device.current_session_id && pos.Latitude && pos.Longitude) {
          const { error: gpsInsertErr } = await supabase.from("telematics_gps_points").insert({
            telematics_id: device.current_session_id,
            latitude: pos.Latitude,
            longitude: pos.Longitude,
            speed_kmh: speedKmh,
            heading: pos.Heading || 0,
            road_name: parsedRoadName || null,
            recorded_at: new Date().toISOString(),
          });

          if (gpsInsertErr) {
            console.error("[QuartixPoller] GPS point insert FAILED:", JSON.stringify(gpsInsertErr));
          }

          // Distance accumulation (3m minimum, 2km max per segment)
          if (device.last_latitude && device.last_longitude) {
            const segmentM = haversineM(device.last_latitude, device.last_longitude, pos.Latitude, pos.Longitude);
            if (segmentM > 3 && segmentM < 2000) {
              const segmentKm = segmentM / 1000;
              const { error: rpcErr } = await supabase.rpc("increment_total_distance", {
                p_id: device.current_session_id,
                p_distance: segmentKm,
              });
              if (rpcErr) {
                console.error("[QuartixPoller] Distance increment error:", JSON.stringify(rpcErr));
              }
            }
          }
        }

        // ===== DEFERRED OPS: Run AFTER core update, non-blocking =====
        // These run in the background and don't block the next vehicle
        try {
          // Reverse geocode if road name looks like a business or is missing
          if (!parsedRoadName || looksLikeBusinessName(parsedRoadName)) {
            const geoRoadName = await reverseGeocodeRoadName(pos.Latitude, pos.Longitude);
            if (geoRoadName) {
              await supabase.from("gps_devices").update({ last_road_name: geoRoadName }).eq("id", device.id);
            }
          }

          // Geofence + unauthorised movement checks
          await checkGeofences(supabase, device.instructor_id, device.id, pos.Latitude, pos.Longitude);
          await checkUnauthorisedMovement(
            supabase, device.instructor_id, device.id,
            pos.Latitude, pos.Longitude, speedKmh, parsedRoadName, parsedIgnition
          );

          // Speed limit (only update DB, don't block core update)
          const speedLimitKmh = await fetchSpeedLimit(pos.Latitude, pos.Longitude);
          if (speedLimitKmh !== null) {
            await supabase.from("gps_devices").update({ last_speed_limit_kmh: speedLimitKmh }).eq("id", device.id);
          }
        } catch (deferredErr) {
          console.warn("[QuartixPoller] Deferred ops error (non-critical):", deferredErr);
        }
      }
    }

    // ===== Step 3: Driving style scores + timesheets =====
    const today = new Date().toISOString().split("T")[0];
    const scoresRes = await fetch(
      `${QUARTIX_BASE}/vehicles/tripsummary?StartDay=${today}&EndDay=${today}&Include=drivingStyle&GroupBy=vehicle`,
      { headers: qHeaders }
    );

    if (scoresRes.ok) {
      const scoresJson = await scoresRes.json();
      const summaries = scoresJson?.Data || [];

      // Fetch devices once for score matching
      const { data: allDevices } = await supabase
        .from("gps_devices")
        .select("id, instructor_id, quartix_vehicle_id, quartix_driver_id")
        .eq("tracking_provider", "quartix");

      const timesheetMap = new Map<string, {
        instructor_id: string; quartix_vehicle_id: string;
        first_start: string | null; last_end: string | null;
        total_driving: number; total_idle: number; total_distance: number; trip_count: number;
      }>();

      for (const summary of summaries) {
        const vehicleId = String(summary.VehicleId || summary.VehicleID);
        const device = (allDevices || []).find((d: any) => d.quartix_vehicle_id === vehicleId);
        if (!device) continue;

        const ds = summary.DrivingStyle;
        if (ds) {
          await supabase.from("quartix_driver_scores").upsert({
            instructor_id: device.instructor_id,
            quartix_driver_id: device.quartix_driver_id || vehicleId,
            score_date: today,
            overall_score: ds.Score ?? null,
            speed_score: ds.RelativeSpeed?.Score ?? null,
            acceleration_score: ds.Accel?.Score ?? null,
            braking_score: ds.Braking?.Score ?? null,
            cornering_score: ds.Cornering?.Score ?? null,
            raw_data: ds,
          }, { onConflict: "instructor_id,quartix_driver_id,score_date" });
        }

        const key = `${device.instructor_id}|${vehicleId}`;
        const existing = timesheetMap.get(key);
        const travelTime = summary.TravelTime || 0;
        const idleTime = summary.IdleTime ?? summary.IdlingTime ?? 0;
        const distance = summary.Distance != null ? summary.Distance * 1.60934 : 0;
        const startTime = summary.StartTime || null;
        const endTime = summary.EndTime || null;

        if (existing) {
          existing.total_driving += travelTime;
          existing.total_idle += idleTime;
          existing.total_distance += distance;
          existing.trip_count += 1;
          if (startTime && (!existing.first_start || startTime < existing.first_start)) existing.first_start = startTime;
          if (endTime && (!existing.last_end || endTime > existing.last_end)) existing.last_end = endTime;
        } else {
          timesheetMap.set(key, {
            instructor_id: device.instructor_id, quartix_vehicle_id: vehicleId,
            first_start: startTime, last_end: endTime,
            total_driving: travelTime, total_idle: idleTime,
            total_distance: distance, trip_count: 1,
          });
        }
      }

      for (const [, ts] of timesheetMap) {
        await supabase.from("driver_timesheets").upsert({
          instructor_id: ts.instructor_id, sheet_date: today,
          quartix_vehicle_id: ts.quartix_vehicle_id,
          first_trip_start: ts.first_start, last_trip_end: ts.last_end,
          total_driving_minutes: ts.total_driving, total_idle_minutes: ts.total_idle,
          total_distance_km: ts.total_distance, trip_count: ts.trip_count,
        }, { onConflict: "instructor_id,sheet_date,quartix_vehicle_id" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, skipped, registered_devices: newDevicesRegistered }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[QuartixPoller] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error), processed: 0, skipped: 0, registered_devices: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
