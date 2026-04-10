import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RadiusSession {
  accessToken: string;
  expiresAt: number;
}

let cachedSession: RadiusSession | null = null;

async function authenticate(supabaseClient?: any): Promise<RadiusSession> {
  // 1. In-memory cache
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

  // 2. DB cache (survives cold starts)
  if (supabaseClient) {
    try {
      const { data: dbSession } = await supabaseClient
        .from("radius_session_cache")
        .select("access_token, expires_at")
        .eq("id", "default")
        .maybeSingle();

      if (dbSession && new Date(dbSession.expires_at).getTime() > Date.now()) {
        console.log("[RadiusPoller] Reusing DB-cached token");
        cachedSession = {
          accessToken: dbSession.access_token,
          expiresAt: new Date(dbSession.expires_at).getTime(),
        };
        return cachedSession;
      }
    } catch (e) {
      console.log("[RadiusPoller] DB cache lookup failed (non-critical):", e);
    }
  }

  // 3. Refresh with Velocity Fleet API
  const refreshToken = Deno.env.get("RADIUS_REFRESH_TOKEN");
  const apiToken = Deno.env.get("RADIUS_API_TOKEN");
  if (!refreshToken || !apiToken) {
    return null as unknown as RadiusSession; // Signal caller to skip gracefully
    throw new Error("RADIUS_API_TOKEN not configured");
  }

  console.log("[RadiusPoller] Refreshing access token, API-Token length:", apiToken.length, "first 4 chars:", apiToken.substring(0, 4));
  const refreshUrl = "https://www.velocityfleet.com/vapi/v1/accounts/users/oauth2/refresh/";
  const refreshHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Api-Token": apiToken,
  };
  console.log("[RadiusPoller] Refresh headers:", JSON.stringify(Object.keys(refreshHeaders)));
  const res = await fetch(refreshUrl, {
    method: "POST",
    headers: refreshHeaders,
    body: JSON.stringify({ refresh: refreshToken }),
  });
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Radius auth failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  console.log("[RadiusPoller] Refresh response keys:", Object.keys(data));
  const accessToken = data.access || data.token || data.access_token;
  if (!accessToken) {
    throw new Error("No access token in refresh response: " + JSON.stringify(data));
  }

  // Cache for 55 minutes (tokens typically expire in 1h)
  const expiresAt = Date.now() + 55 * 60 * 1000;
  cachedSession = { accessToken, expiresAt };

  // 4. Persist to DB
  if (supabaseClient) {
    try {
      await supabaseClient.from("radius_session_cache").upsert({
        id: "default",
        access_token: accessToken,
        expires_at: new Date(expiresAt).toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.log("[RadiusPoller] Failed to persist token to DB (non-critical):", e);
    }
  }

  return cachedSession;
}

// Reverse geocode to get road name using Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "EveryDriverApp/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.address?.road || data.address?.pedestrian || data.address?.footway || data.display_name?.split(",")[0] || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Radius credentials are configured before doing anything
    if (!Deno.env.get("RADIUS_API_TOKEN") || !Deno.env.get("RADIUS_REFRESH_TOKEN")) {
      console.log("[RadiusPoller] Skipping — RADIUS_API_TOKEN or RADIUS_REFRESH_TOKEN not configured");
      return new Response(JSON.stringify({ skipped: true, reason: "Radius credentials not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const customerId = Deno.env.get("RADIUS_CUSTOMER_ID");
    if (!customerId) {
      console.log("[RadiusPoller] Skipping — RADIUS_CUSTOMER_ID not configured");
      return new Response(JSON.stringify({ skipped: true, reason: "RADIUS_CUSTOMER_ID not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get all Radius devices from our DB
    const { data: devices, error: devErr } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, device_identifier, device_name, current_session_id, session_start_ecu_odometer_km, daily_start_ecu_odometer_km, daily_start_date")
      .eq("tracking_provider", "radius");

    if (devErr) throw devErr;
    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No Radius devices" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let session = await authenticate(supabase);

    // Build device identifier lookup map
    const deviceMap = new Map(devices.map((d) => [d.device_identifier, d]));

    // Poll live positions from Velocity Fleet API (with one retry on auth failure)
    async function fetchPositions(token: string) {
      console.log("[RadiusPoller] Fetching live positions for customer:", customerId);
      const apiToken = Deno.env.get("RADIUS_API_TOKEN") || "";
      return await fetch(
        `https://www.velocityfleet.com/api/mobile/kinesis/device-live-positions/?customer=${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "API-Token": apiToken,
          },
          body: JSON.stringify({}),
        }
      );
    }

    let posRes = await fetchPositions(session.accessToken);

    // On 401/403, clear cache, get a fresh token, and retry once
    if (posRes.status === 401 || posRes.status === 403) {
      console.log("[RadiusPoller] Got", posRes.status, "- clearing cache and retrying with fresh token");
      cachedSession = null;
      try {
        await supabase.from("radius_session_cache").delete().eq("id", "default");
      } catch (_) { /* ignore */ }

      session = await authenticate(supabase);
      posRes = await fetchPositions(session.accessToken);
    }

    if (!posRes.ok) {
      const errText = await posRes.text();
      throw new Error(`Radius positions API failed (${posRes.status}): ${errText}`);
    }

    const posData = await posRes.json();
    const positions: any[] = posData?.data || posData?.results || (Array.isArray(posData) ? posData : []);

    console.log("[RadiusPoller] Got", positions.length, "positions, matching against", devices.length, "tracked devices");

    let updated = 0;

    for (const pos of positions) {
      // Match by device ID (stringified)
      const deviceId = String(pos.id || pos.device_id || "");
      const device = deviceMap.get(deviceId);
      if (!device) continue;

      const lat = parseFloat(pos.lat || pos.latitude || 0);
      const lon = parseFloat(pos.lon || pos.lng || pos.longitude || 0);
      const speedMph = parseFloat(pos.speed || 0);
      const speedKmh = Math.round(speedMph * 1.60934 * 10) / 10;
      const heading = parseFloat(pos.direction || pos.heading || 0);
      const ignition = pos.ignition === "Y" || pos.ignition === true || pos.ignition === 1;

      // Build road name from street + town
      let roadName: string | null = null;
      if (pos.street) {
        roadName = pos.town ? `${pos.street}, ${pos.town}` : pos.street;
      } else if (lat && lon) {
        roadName = await reverseGeocode(lat, lon);
      }

      // Parse timestamp (Unix epoch in seconds or milliseconds)
      let seenAt: string | null = null;
      if (pos.timestamp) {
        const ts = Number(pos.timestamp);
        // If less than 1e12, it's seconds; otherwise milliseconds
        const msTimestamp = ts < 1e12 ? ts * 1000 : ts;
        seenAt = new Date(msTimestamp).toISOString();
      } else if (pos.datetime || pos.date_time) {
        seenAt = new Date(pos.datetime || pos.date_time).toISOString();
      }

      // Update device in gps_devices table
      await supabase
        .from("gps_devices")
        .update({
          last_latitude: lat || null,
          last_longitude: lon || null,
          last_speed_kmh: speedKmh,
          last_heading: heading || null,
          last_ignition_status: ignition,
          last_road_name: roadName,
          last_seen_at: seenAt,
          last_heartbeat_at: new Date().toISOString(),
          // Use vehicle_registration as fallback device name
          device_name: device.device_name || pos.vehicle_registration || pos.registration || null,
        })
        .eq("id", device.id);

      updated++;

      // If device has an active session, record GPS point for route history
      if (device.current_session_id && lat && lon) {
        await supabase
          .from("telematics_gps_points")
          .insert({
            telematics_id: device.current_session_id,
            latitude: lat,
            longitude: lon,
            speed_kmh: speedKmh,
            heading: heading || null,
            road_name: roadName,
            recorded_at: seenAt || new Date().toISOString(),
          });

        // Speed-based distance estimate (no ECU data from Radius)
        if (speedKmh > 0) {
          const distKm = (speedKmh * 10) / 3600; // 10s poll interval estimate
          if (distKm > 0.001) {
            await supabase.rpc("increment_total_distance", {
              p_id: device.current_session_id,
              p_distance: distKm,
            });
          }
        }
      }

      // Update live_pupil_positions if active
      await supabase
        .from("live_pupil_positions")
        .update({
          latitude: lat,
          longitude: lon,
          speed_kmh: speedKmh,
          heading: heading,
          updated_at: new Date().toISOString(),
        })
        .eq("device_id", device.id)
        .eq("is_active", true);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        devices: devices.length,
        positionsReceived: positions.length,
        positionsUpdated: updated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("radius-poller error:", err);
    cachedSession = null;

    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
