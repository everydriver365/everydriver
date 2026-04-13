import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

// ─── Key Telematics Fleet API v2 (if KT_API_KEY is a real KT key) ───
async function fetchPositionsKT(ktApiKey: string, customerId: string): Promise<any[]> {
  const url = `https://api.uk1.kt1.io/fleet/v2/entities/assets?owner=${customerId}`;
  console.log("[RadiusPoller] Using Key Telematics v2 API");

  const res = await fetch(url, {
    method: "GET",
    headers: { "x-api-key": ktApiKey, "Accept": "application/json" },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`KT v2 assets API failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const assets: any[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
  console.log("[RadiusPoller] KT v2 returned", assets.length, "assets");

  return assets.map((a: any) => {
    const pos = a.lastPosition || a.position || {};
    return {
      id: String(a.id || a.assetId || ""),
      name: a.name || a.label || null,
      registration: a.registration || a.plateNumber || null,
      latitude: pos.latitude ?? pos.lat ?? null,
      longitude: pos.longitude ?? pos.lng ?? pos.lon ?? null,
      speed_kmh: pos.speed ?? pos.speedKmh ?? null,
      heading: pos.heading ?? pos.bearing ?? pos.course ?? null,
      ignition: pos.ignition ?? null,
      road: pos.road || pos.street || pos.address || null,
      town: pos.town || pos.city || null,
      timestamp: pos.timestamp || pos.dateTime || pos.time || a.lastUpdated || null,
      _source: "kt_v2",
    };
  });
}

// ─── Legacy Velocity Fleet API (fallback) ───
interface RadiusSession {
  accessToken: string;
  expiresAt: number;
}
let cachedSession: RadiusSession | null = null;

// Attempt login with username/password to get fresh tokens
async function authenticateWithCredentials(supabase: any): Promise<RadiusSession | null> {
  const username = Deno.env.get("RADIUS_USERNAME")?.trim();
  const password = Deno.env.get("RADIUS_PASSWORD")?.trim();
  const apiToken = Deno.env.get("RADIUS_API_TOKEN")?.trim();
  if (!username || !password || !apiToken) return null;

  // Try multiple login endpoints
  const loginUrls = [
    "https://www.kinesisfleetpro.com/vapi/v1/accounts/users/login/",
    "https://www.kinesisfleetpro.com/vapi/v1/accounts/users/oauth2/login/",
    "https://www.velocityfleet.com/vapi/v1/accounts/users/login/",
  ];

  for (const loginUrl of loginUrls) {
    try {
      console.log("[RadiusPoller] Trying credential login:", loginUrl);
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "API-Token": apiToken },
        body: JSON.stringify({ username, password }),
      });

      const bodyText = await res.text();

      if (!res.ok) {
        console.log("[RadiusPoller] Login failed at", loginUrl, ":", res.status, bodyText.substring(0, 200));
        continue;
      }

      let data: any;
      try { data = JSON.parse(bodyText); } catch {
        console.log("[RadiusPoller] Non-JSON response from", loginUrl, ":", bodyText.substring(0, 200));
        continue;
      }

      const accessToken = data.access || data.token || data.access_token;
      const newRefresh = data.refresh || data.refresh_token;
      if (!accessToken) {
        console.log("[RadiusPoller] No access token in response from", loginUrl);
        continue;
      }

      console.log("[RadiusPoller] Credential login successful via", loginUrl);

      const expiresAt = Date.now() + 55 * 60 * 1000;
      cachedSession = { accessToken, expiresAt };

      // Cache the session in DB
      try {
        await supabase.from("radius_session_cache").upsert({
          id: "default",
          access_token: accessToken,
          refresh_token: newRefresh || null,
          expires_at: new Date(expiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (_) { /* non-critical */ }

      return cachedSession;
    } catch (e) {
      console.log("[RadiusPoller] Error at", loginUrl, ":", e.message);
      continue;
    }
  }

  console.error("[RadiusPoller] All credential login endpoints failed");
  return null;
}

async function authenticateLegacy(supabase: any): Promise<RadiusSession | null> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) return cachedSession;

  // DB cache
  try {
    const { data: dbSession } = await supabase
      .from("radius_session_cache")
      .select("access_token, expires_at")
      .eq("id", "default")
      .maybeSingle();
    if (dbSession && new Date(dbSession.expires_at).getTime() > Date.now()) {
      cachedSession = { accessToken: dbSession.access_token, expiresAt: new Date(dbSession.expires_at).getTime() };
      return cachedSession;
    }
  } catch (_) { /* non-critical */ }

  // Try refresh token first
  const refreshToken = Deno.env.get("RADIUS_REFRESH_TOKEN")?.trim();
  const apiToken = Deno.env.get("RADIUS_API_TOKEN")?.trim();

  if (refreshToken && apiToken) {
    try {
      const res = await fetch("https://www.velocityfleet.com/vapi/v1/accounts/users/oauth2/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "API-Token": apiToken },
        body: JSON.stringify({ refresh: refreshToken, token: apiToken }),
      });
      if (res.ok) {
        const data = await res.json();
        const accessToken = data.access || data.token || data.access_token;
        if (accessToken) {
          const expiresAt = Date.now() + 55 * 60 * 1000;
          cachedSession = { accessToken, expiresAt };
          try {
            await supabase.from("radius_session_cache").upsert({
              id: "default", access_token: accessToken, expires_at: new Date(expiresAt).toISOString(), updated_at: new Date().toISOString(),
            });
          } catch (_) { /* non-critical */ }
          return cachedSession;
        }
      } else {
        const t = await res.text();
        console.log("[RadiusPoller] Refresh token failed:", res.status, t, "— trying credentials...");
      }
    } catch (e) {
      console.log("[RadiusPoller] Refresh token error:", e.message, "— trying credentials...");
    }
  }

  // Fallback: username/password login
  return await authenticateWithCredentials(supabase);
}

async function fetchPositionsLegacy(token: string, customerId: string): Promise<any[]> {
  console.log("[RadiusPoller] Using legacy Velocity Fleet API");
  const apiToken = Deno.env.get("RADIUS_API_TOKEN")?.trim() || "";
  const res = await fetch(
    `https://www.velocityfleet.com/api/mobile/kinesis/device-live-positions/?customer=${customerId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "API-Token": apiToken },
      body: JSON.stringify({}),
    }
  );
  if (!res.ok) { const t = await res.text(); throw new Error(`Legacy positions API failed (${res.status}): ${t}`); }
  const data = await res.json();
  const raw: any[] = data?.data || data?.results || (Array.isArray(data) ? data : []);

  return raw.map((pos: any) => {
    const speedMph = parseFloat(pos.speed || 0);
    return {
      id: String(pos.id || pos.device_id || ""),
      name: null,
      registration: pos.vehicle_registration || pos.registration || null,
      latitude: parseFloat(pos.lat || pos.latitude || 0) || null,
      longitude: parseFloat(pos.lon || pos.lng || pos.longitude || 0) || null,
      speed_kmh: Math.round(speedMph * 1.60934 * 10) / 10,
      heading: parseFloat(pos.direction || pos.heading || 0) || null,
      ignition: pos.ignition === "Y" || pos.ignition === true || pos.ignition === 1,
      road: pos.street || null,
      town: pos.town || null,
      timestamp: pos.timestamp || pos.datetime || pos.date_time || null,
      _source: "legacy",
    };
  });
}

// ─── Main handler ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ktApiKey = Deno.env.get("KT_API_KEY")?.trim();
    const hasLegacy = !!(Deno.env.get("RADIUS_API_TOKEN") && (Deno.env.get("RADIUS_REFRESH_TOKEN") || (Deno.env.get("RADIUS_USERNAME") && Deno.env.get("RADIUS_PASSWORD"))));

    if (!ktApiKey && !hasLegacy) {
      console.log("[RadiusPoller] Skipping — no KT_API_KEY or legacy credentials configured");
      return new Response(JSON.stringify({ skipped: true, reason: "No Radius/KT credentials configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const customerId = Deno.env.get("RADIUS_CUSTOMER_ID");
    if (!customerId) {
      console.log("[RadiusPoller] Skipping — RADIUS_CUSTOMER_ID not configured");
      return new Response(JSON.stringify({ skipped: true, reason: "RADIUS_CUSTOMER_ID not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Get all Radius devices from DB
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

    const deviceMap = new Map(devices.map((d: any) => [d.device_identifier, d]));

    // ─── Fetch positions: try KT v2 first, fallback to legacy ───
    let positions: any[];
    let apiUsed: string;
    let ktFailed = false;

    if (ktApiKey) {
      try {
        positions = await fetchPositionsKT(ktApiKey, customerId);
        apiUsed = "kt_v2";
      } catch (ktErr) {
        console.log("[RadiusPoller] KT v2 failed, falling back to legacy:", ktErr.message);
        ktFailed = true;
      }
    }

    if (!ktApiKey || ktFailed) {
      if (!hasLegacy) {
        return new Response(JSON.stringify({ skipped: true, reason: ktFailed ? "KT v2 failed and no legacy credentials" : "No credentials configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }
      const session = await authenticateLegacy(supabase);
      if (!session) {
        return new Response(JSON.stringify({ skipped: true, reason: "Legacy auth failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }
      positions = await fetchPositionsLegacy(session.accessToken, customerId);
      apiUsed = "legacy";
    }

    console.log("[RadiusPoller] Got", positions.length, "positions via", apiUsed, ", matching against", devices.length, "tracked devices");

    let updated = 0;

    for (const pos of positions) {
      const device = deviceMap.get(pos.id);
      if (!device) continue;

      const lat = pos.latitude;
      const lon = pos.longitude;
      const speedKmh = pos.speed_kmh ?? 0;
      const heading = pos.heading;
      const ignition = pos.ignition === true || pos.ignition === "on";

      // Build road name
      let roadName: string | null = null;
      if (pos.road) {
        roadName = pos.town ? `${pos.road}, ${pos.town}` : pos.road;
      } else if (lat && lon) {
        roadName = await reverseGeocode(lat, lon);
      }

      // Parse timestamp
      let seenAt: string | null = null;
      if (pos.timestamp) {
        const ts = typeof pos.timestamp === "string" ? pos.timestamp : null;
        if (ts) {
          seenAt = new Date(ts).toISOString();
        } else {
          const num = Number(pos.timestamp);
          seenAt = new Date(num < 1e12 ? num * 1000 : num).toISOString();
        }
      }

      // Update gps_devices
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
          device_name: device.device_name || pos.name || pos.registration || null,
        })
        .eq("id", device.id);

      updated++;

      // Record GPS point if session active
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

        // Speed-based distance estimate
        if (speedKmh > 0) {
          const distKm = (speedKmh * 10) / 3600;
          if (distKm > 0.001) {
            await supabase.rpc("increment_total_distance", {
              p_id: device.current_session_id,
              p_distance: distKm,
            });
          }
        }
      }

      // Update live_pupil_positions
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
      JSON.stringify({ ok: true, api: apiUsed, devices: devices.length, positionsReceived: positions.length, positionsUpdated: updated }),
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
