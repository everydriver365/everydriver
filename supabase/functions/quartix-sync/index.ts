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

// ========== Token Caching ==========

async function getAccessToken(supabase: any): Promise<string> {
  // Check cache first
  const { data: cached } = await supabase
    .from("quartix_auth_cache")
    .select("access_token, expires_at")
    .eq("id", "default")
    .maybeSingle();

  if (cached?.access_token && cached?.expires_at) {
    const expiresAt = new Date(cached.expires_at);
    // Use token if it's valid for at least 2 more minutes
    if (expiresAt.getTime() > Date.now() + 2 * 60 * 1000) {
      console.log("[QuartixSync] Using cached token (expires", cached.expires_at, ")");
      return cached.access_token;
    }
  }

  // Authenticate fresh
  console.log("[QuartixSync] Authenticating with Quartix...");
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

  // Cache the token (Quartix tokens last ~30 minutes)
  const expiresAt = new Date(Date.now() + 25 * 60 * 1000).toISOString();
  await supabase.from("quartix_auth_cache").upsert({
    id: "default",
    access_token: token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  console.log("[QuartixSync] Token cached until", expiresAt);
  return token;
}

// ========== Deferred Operations ==========

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
    console.warn("[QuartixSync] Geofence check error:", err);
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
    console.warn("[QuartixSync] Movement check error:", err);
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

    // Check if sync is enabled
    const { data: syncConfig } = await supabase
      .from("cron_sync_config")
      .select("is_enabled")
      .eq("id", "quartix-position-sync")
      .maybeSingle();

    if (syncConfig && !syncConfig.is_enabled) {
      return new Response(
        JSON.stringify({ success: true, message: "Sync disabled", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there are any active devices to sync
    const { data: activeDevices } = await supabase
      .from("gps_devices")
      .select("id")
      .eq("tracking_provider", "quartix")
      .eq("is_active", true)
      .limit(1);

    if (!activeDevices || activeDevices.length === 0) {
      // Update last_run_at even when no devices
      await supabase.from("cron_sync_config").update({ last_run_at: new Date().toISOString() }).eq("id", "quartix-position-sync");
      return new Response(
        JSON.stringify({ success: true, message: "No active devices", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get cached or fresh access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken(supabase);
    } catch (authErr) {
      console.error("[QuartixSync] Auth error:", authErr);
      await supabase.from("cron_sync_config").update({ 
        last_run_at: new Date().toISOString(),
        last_error: String(authErr),
      }).eq("id", "quartix-position-sync");
      return new Response(
        JSON.stringify({ success: false, message: String(authErr), processed: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qHeaders = { AccessToken: accessToken };

    // ===== Fetch live positions =====
    const liveRes = await fetch(`${QUARTIX_BASE}/vehicles/live`, { headers: qHeaders });
    let processed = 0;
    let skipped = 0;

    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      const positions = liveJson?.Data || [];

      for (const pos of positions) {
        const vehicleId = String(pos.VehicleId || pos.VehicleID);

        // Fetch device fresh for EACH vehicle to get latest current_session_id
        const { data: device } = await supabase
          .from("gps_devices")
          .select("id, instructor_id, quartix_vehicle_id, quartix_driver_id, current_session_id, last_latitude, last_longitude")
          .eq("quartix_vehicle_id", vehicleId)
          .eq("tracking_provider", "quartix")
          .maybeSingle();

        if (!device) { skipped++; continue; }
        if (!pos.Latitude || !pos.Longitude) { skipped++; continue; }

        // Parse speed (Quartix Speed is mph -> km/h)
        const rawSpeedKmh = pos.Speed != null ? pos.Speed * 1.60934 : 0;
        const parsedIgnition = pos.Ignition ?? parseIgnitionStatus(pos.LocationText, rawSpeedKmh);
        
        // Only zero speed if ignition is definitely off AND raw speed is near zero
        // This prevents zeroing valid speed readings when ignition status is ambiguous
        const speedKmh = (parsedIgnition === false && rawSpeedKmh < 3) ? 0 : rawSpeedKmh;

        // Parse road name (fast, string-only)
        const parsedRoadName = parseLocationText(pos.LocationText);

        console.log(`[QuartixSync] Vehicle=${vehicleId} | speed=${speedKmh.toFixed(1)}kmh | ignition=${parsedIgnition} | session=${device.current_session_id || 'none'}`);

        // ===== CORE: Update gps_devices =====
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
          console.error(`[QuartixSync] Device update FAILED for ${device.id}:`, JSON.stringify(updateErr));
          skipped++;
          continue;
        }
        processed++;

        // ===== GPS POINT RECORDING (if session active) =====
        if (device.current_session_id && pos.Latitude && pos.Longitude) {
          // Fetch speed limit inline so it's stored with the GPS point
          let pointSpeedLimit: number | null = null;
          try {
            pointSpeedLimit = await fetchSpeedLimit(pos.Latitude, pos.Longitude);
          } catch { /* non-critical */ }

          await supabase.from("telematics_gps_points").insert({
            telematics_id: device.current_session_id,
            latitude: pos.Latitude,
            longitude: pos.Longitude,
            speed_kmh: speedKmh,
            heading: pos.Heading || 0,
            road_name: parsedRoadName || null,
            speed_limit_kmh: pointSpeedLimit,
            recorded_at: new Date().toISOString(),
          });

          // Update device speed limit too
          if (pointSpeedLimit !== null) {
            await supabase.from("gps_devices").update({ last_speed_limit_kmh: pointSpeedLimit }).eq("id", device.id);
          }

          // Distance accumulation (3m minimum, 2km max per segment)
          if (device.last_latitude && device.last_longitude) {
            const segmentM = haversineM(device.last_latitude, device.last_longitude, pos.Latitude, pos.Longitude);
            if (segmentM > 3 && segmentM < 2000) {
              const segmentKm = segmentM / 1000;
              await supabase.rpc("increment_total_distance", {
                p_id: device.current_session_id,
                p_distance: segmentKm,
              });
            }
          }
        }

        // ===== DEFERRED OPS (non-blocking) =====
        try {
          if (!parsedRoadName || looksLikeBusinessName(parsedRoadName)) {
            const geoRoadName = await reverseGeocodeRoadName(pos.Latitude, pos.Longitude);
            if (geoRoadName) {
              await supabase.from("gps_devices").update({ last_road_name: geoRoadName }).eq("id", device.id);
            }
          }

          await checkGeofences(supabase, device.instructor_id, device.id, pos.Latitude, pos.Longitude);
          await checkUnauthorisedMovement(
            supabase, device.instructor_id, device.id,
            pos.Latitude, pos.Longitude, speedKmh, parsedRoadName, parsedIgnition
          );

          // Speed limit fetch moved to GPS point recording above (only when session active)
          // For non-session devices, fetch speed limit for display only
          if (!device.current_session_id) {
            const speedLimitKmh = await fetchSpeedLimit(pos.Latitude, pos.Longitude);
            if (speedLimitKmh !== null) {
              await supabase.from("gps_devices").update({ last_speed_limit_kmh: speedLimitKmh }).eq("id", device.id);
            }
          }
        } catch (deferredErr) {
          console.warn("[QuartixSync] Deferred ops error (non-critical):", deferredErr);
        }
      }
    } else {
      const errorText = await liveRes.text();
      console.error("[QuartixSync] Live positions fetch failed:", liveRes.status, errorText);
      
      // If auth expired (401/403), clear the cached token
      if (liveRes.status === 401 || liveRes.status === 403) {
        await supabase.from("quartix_auth_cache").delete().eq("id", "default");
        console.log("[QuartixSync] Cleared cached token due to auth failure");
      }
    }

    // ===== Auto-cleanup stale sessions =====
    try {
      await supabase.rpc("auto_cleanup_stale_sessions");
    } catch (cleanupErr) {
      console.warn("[QuartixSync] Cleanup error:", cleanupErr);
    }

    // Update sync config
    await supabase.from("cron_sync_config").update({ 
      last_run_at: new Date().toISOString(),
      last_error: null,
    }).eq("id", "quartix-position-sync");

    return new Response(
      JSON.stringify({ success: true, processed, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[QuartixSync] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error), processed: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
