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

// ─── Normalised position type ───
interface NormalisedPosition {
  id: string;
  name: string | null;
  registration: string | null;
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number | null;
  heading: number | null;
  ignition: boolean | null;
  road: string | null;
  town: string | null;
  timestamp: string | null;
  speed_limit_kmh: number | null;
  odometer: number | null;
  _source: string;
}

// ─── KT Export Stream API (Priority – push-based queue) ───
async function fetchFromExportStream(exportEndpoint: string, exportApiKey: string): Promise<{ positions: NormalisedPosition[]; batchId: string | null }> {
  console.log("[RadiusPoller] Using KT Export Stream API");
  console.log(`[RadiusPoller] Export endpoint: ${exportEndpoint}`);
  console.log(`[RadiusPoller] Export API key length: ${exportApiKey.length}, starts: ${exportApiKey.substring(0, 8)}...`);

  const url = `${exportEndpoint}?token=${exportApiKey}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-access-token": exportApiKey,
      "Accept": "application/json",
      "accept-encoding": "gzip",
      "connection": "keep-alive",
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Export Stream API failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  console.log("[RadiusPoller] Export response keys:", Object.keys(data || {}), "items count:", (data?.items || []).length);
  const items: any[] = data?.items || [];
  const batchId: string | null = data?.id || null;

  if (items.length === 0) {
    console.log("[RadiusPoller] Export stream queue empty");
    return { positions: [], batchId: null };
  }

  console.log("[RadiusPoller] Export stream returned", items.length, "telemetry records, batchId:", batchId);
  if (items.length > 0) {
    console.log("[RadiusPoller] First item keys:", Object.keys(items[0]).join(", "));
    console.log("[RadiusPoller] First item sample:", JSON.stringify(items[0]).substring(0, 500));
  }

  const positions: NormalisedPosition[] = items
    .filter((item: any) => item.type === "telemetry" || !item.type)
    .map((item: any) => {
      const loc = item.location || {};

      // V2 uses nested objects: item.origin.id, item.asset.id/name
      const origin = item.origin || {};
      const asset = item.asset || {};

      // V1 format: lon/lat in milliarcseconds → convert to decimal degrees
      let lat: number | null = null;
      let lon: number | null = null;
      if (loc.lat != null && loc.lon != null) {
        if (Math.abs(loc.lat) > 1000 || Math.abs(loc.lon) > 1000) {
          lat = loc.lat / 3600000;
          lon = loc.lon / 3600000;
        } else {
          lat = loc.lat;
          lon = loc.lon;
        }
      }

      const spd = item.spd || {};
      const gc = loc.gc || {};
      const telemetry = item.telemetry || {};

      // Build road name from geocode data
      let road: string | null = null;
      if (gc.rd) {
        road = gc.rd;
        if (gc.nm) road = `${gc.nm} ${road}`;
      } else if (loc.address) {
        road = String(loc.address).split(",")[0];
      }

      const town = gc.tw || gc.sb || null;

      // Speed limit
      let speedLimitKmh: number | null = null;
      if (spd.rd != null) {
        speedLimitKmh = spd.un === 1 ? Math.round(spd.rd * 1.60934) : spd.rd;
      }

      // Parse date — handle multiple formats safely
      let timestamp: string | null = null;
      if (item.date) {
        try {
          const d = String(item.date).replace(/\//g, "-").replace(" ", "T");
          const parsed = new Date(d.endsWith("Z") ? d : d + "Z");
          if (!isNaN(parsed.getTime())) {
            timestamp = parsed.toISOString();
          } else {
            console.warn("[RadiusPoller] Unparseable date:", item.date);
          }
        } catch {
          console.warn("[RadiusPoller] Date parse error:", item.date);
        }
      }

      // V2: origin.name is the IMEI; origin.id is KT device UUID
      const posId = String(origin.name || origin.id || item.originId || item.imei || asset.id || item.assetId || "");
      const assetName = asset.name || item.assetName || null;

      return {
        id: posId,
        name: assetName,
        registration: null,
        latitude: lat,
        longitude: lon,
        speed_kmh: loc.speed ?? null,
        heading: loc.heading ?? null,
        ignition: item.active ?? (telemetry.ignition === 1 || telemetry.ignition === true),
        road,
        town,
        timestamp,
        speed_limit_kmh: speedLimitKmh,
        odometer: telemetry.odometer ?? telemetry.odo_counter ?? null,
        _source: "export_stream",
      };
    });

  return { positions, batchId };
}

async function deleteExportBatch(exportEndpoint: string, exportApiKey: string, batchId: string): Promise<void> {
  try {
    const url = `${exportEndpoint}/${batchId}?token=${exportApiKey}`;
    console.log("[RadiusPoller] Deleting export batch:", batchId);
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "x-access-token": exportApiKey },
    });
    const body = await res.text().catch(() => "");
    if (!res.ok) {
      console.warn("[RadiusPoller] Export DELETE failed:", res.status, body);
    } else {
      console.log("[RadiusPoller] Export batch deleted successfully");
    }
  } catch (e) {
    console.warn("[RadiusPoller] Export DELETE error:", e.message);
  }
}

// ─── Key Telematics Fleet API v2 (polling fallback) ───
async function fetchPositionsKT(ktApiKey: string, customerId: string): Promise<NormalisedPosition[]> {
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
      speed_limit_kmh: null,
      odometer: null,
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

async function authenticateWithCredentials(supabase: any): Promise<RadiusSession | null> {
  const username = Deno.env.get("RADIUS_USERNAME")?.trim();
  const password = Deno.env.get("RADIUS_PASSWORD")?.trim();
  const apiToken = Deno.env.get("RADIUS_API_TOKEN")?.trim();
  if (!username || !password || !apiToken) return null;

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

      try {
        await supabase.from("radius_session_cache").upsert({
          id: "default", access_token: accessToken, refresh_token: newRefresh || null,
          expires_at: new Date(expiresAt).toISOString(), updated_at: new Date().toISOString(),
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

  return await authenticateWithCredentials(supabase);
}

async function fetchPositionsLegacy(token: string, customerId: string): Promise<NormalisedPosition[]> {
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
      speed_limit_kmh: null,
      odometer: null,
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
    const exportEndpoint = Deno.env.get("RADIUS_EXPORT_ENDPOINT")?.trim();
    const exportApiKey = Deno.env.get("RADIUS_EXPORT_API_KEY")?.trim();
    const ktApiKey = Deno.env.get("KT_API_KEY")?.trim();
    const hasLegacy = !!(Deno.env.get("RADIUS_API_TOKEN") && (Deno.env.get("RADIUS_REFRESH_TOKEN") || (Deno.env.get("RADIUS_USERNAME") && Deno.env.get("RADIUS_PASSWORD"))));
    const hasExport = !!(exportEndpoint && exportApiKey);

    if (!hasExport && !ktApiKey && !hasLegacy) {
      console.log("[RadiusPoller] Skipping — no credentials configured");
      return new Response(JSON.stringify({ skipped: true, reason: "No Radius/KT credentials configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const customerId = Deno.env.get("RADIUS_CUSTOMER_ID");
    if (!customerId && !hasExport) {
      console.log("[RadiusPoller] Skipping — RADIUS_CUSTOMER_ID not configured and no export stream");
      return new Response(JSON.stringify({ skipped: true, reason: "RADIUS_CUSTOMER_ID not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Get all Radius devices from DB
    const { data: devices, error: devErr } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, device_identifier, device_name, current_session_id, current_pupil_id, session_start_ecu_odometer_km, daily_start_ecu_odometer_km, daily_start_date")
      .eq("tracking_provider", "radius");

    if (devErr) throw devErr;
    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No Radius devices" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deviceMap = new Map(devices.map((d: any) => [d.device_identifier, d]));
    // Also build a name-based map for fallback matching
    const deviceNameMap = new Map(devices.filter((d: any) => d.device_name).map((d: any) => [d.device_name.toLowerCase(), d]));
    console.log("[RadiusPoller] Device map keys:", [...deviceMap.keys()]);

    // ─── Data source priority: Export Stream → KT v2 → Legacy ───
    let positions: NormalisedPosition[] = [];
    let apiUsed = "none";
    let exportBatchId: string | null = null;

    // 1) Try Export Stream API (push-based queue – best data)
    if (hasExport) {
      try {
        const result = await fetchFromExportStream(exportEndpoint!, exportApiKey!);
        positions = result.positions;
        exportBatchId = result.batchId;
        apiUsed = "export_stream";
      } catch (exportErr: any) {
        console.warn("[RadiusPoller] Export stream failed:", exportErr.message, "— falling back");
      }
    }

    // 2) Fallback to KT v2 polling API
    if (positions.length === 0 && ktApiKey && customerId) {
      try {
        positions = await fetchPositionsKT(ktApiKey, customerId);
        apiUsed = "kt_v2";
      } catch (ktErr: any) {
        console.warn("[RadiusPoller] KT v2 failed:", ktErr.message, "— falling back to legacy");
      }
    }

    // 3) Fallback to legacy Velocity API
    if (positions.length === 0 && hasLegacy && customerId) {
      const session = await authenticateLegacy(supabase);
      if (session) {
        positions = await fetchPositionsLegacy(session.accessToken, customerId);
        apiUsed = "legacy";
      } else {
        console.warn("[RadiusPoller] Legacy auth also failed");
      }
    }

    if (positions.length === 0) {
      return new Response(JSON.stringify({ ok: true, api: apiUsed, message: "No positions available", exportBatchId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[RadiusPoller] Got", positions.length, "positions via", apiUsed, ", matching against", devices.length, "tracked devices");

    let updated = 0;

    for (const pos of positions) {
      // Try matching by device_identifier first, then by name
      let device = deviceMap.get(pos.id);
      if (!device && pos.name) {
        device = deviceNameMap.get(pos.name.toLowerCase());
      }
      if (!device) {
        console.log("[RadiusPoller] No device match for pos.id:", pos.id, "name:", pos.name);
        continue;
      }

      const lat = pos.latitude;
      const lon = pos.longitude;
      const speedKmh = pos.speed_kmh ?? 0;
      const heading = pos.heading;
      const ignition = pos.ignition === true;

      // Build road name – export stream already has geocoded data
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

      // ─── Auto-create session if ignition ON and no active session ───
      if (ignition && !device.current_session_id && lat && lon) {
        console.log("[RadiusPoller] Auto-creating session for device:", device.device_name);
        const { data: newSession, error: sessErr } = await supabase
          .from("lesson_telematics")
          .insert({
            instructor_id: device.instructor_id,
            pupil_id: device.current_pupil_id || null,
            started_at: seenAt || new Date().toISOString(),
          })
          .select("id")
          .single();

        if (newSession && !sessErr) {
          device.current_session_id = newSession.id;
          await supabase
            .from("gps_devices")
            .update({ current_session_id: newSession.id, is_active: true })
            .eq("id", device.id);
          console.log("[RadiusPoller] Session created:", newSession.id);
        } else {
          console.error("[RadiusPoller] Session create error:", sessErr?.message);
        }
      }

      // ─── Auto-end session if ignition OFF and session active ───
      if (!ignition && device.current_session_id) {
        console.log("[RadiusPoller] Auto-ending session:", device.current_session_id);
        await supabase
          .from("lesson_telematics")
          .update({ ended_at: seenAt || new Date().toISOString() })
          .eq("id", device.current_session_id)
          .is("ended_at", null);

        await supabase
          .from("gps_devices")
          .update({
            current_session_id: null,
            current_pupil_id: null,
            session_start_ecu_odometer_km: null,
            is_active: false,
          })
          .eq("id", device.id);

        device.current_session_id = null;
        console.log("[RadiusPoller] Session ended");
      }

      // Record GPS point if session active
      if (device.current_session_id && lat && lon) {
        await supabase
          .from("telematics_gps_points")
          .insert({
            telematics_id: device.current_session_id,
            latitude: lat,
            longitude: lon,
            speed_kmh: speedKmh,
            speed_limit_kmh: pos.speed_limit_kmh,
            heading: heading || null,
            road_name: roadName,
            recorded_at: seenAt || new Date().toISOString(),
          });

        // Distance estimate using actual time delta between points
        if (speedKmh > 0 && seenAt) {
          // Fetch previous point timestamp to calculate real interval
          const { data: prevPoint } = await supabase
            .from("telematics_gps_points")
            .select("recorded_at")
            .eq("telematics_id", device.current_session_id)
            .lt("recorded_at", seenAt)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          let timeDeltaHours = 10 / 3600; // default 10s fallback
          if (prevPoint?.recorded_at) {
            const deltaMs = new Date(seenAt).getTime() - new Date(prevPoint.recorded_at).getTime();
            if (deltaMs > 0 && deltaMs < 600000) { // cap at 10 minutes
              timeDeltaHours = deltaMs / 3600000;
            }
          }

          const distKm = speedKmh * timeDeltaHours;
          if (distKm > 0.001 && distKm < 5) { // sanity: max 5km per interval
            await supabase.rpc("increment_total_distance", {
              p_id: device.current_session_id,
              p_distance: distKm,
            });
          }
        }
      }

      // Update live_pupil_positions
      if (device.current_pupil_id && lat && lon) {
        await supabase.rpc("update_live_position", {
          p_pupil_id: device.current_pupil_id,
          p_latitude: lat,
          p_longitude: lon,
          p_speed_kmh: speedKmh,
          p_heading: heading,
          p_trip_status: ignition ? "driving" : "stopped",
          p_session_id: device.current_session_id,
          p_speed_limit_kmh: pos.speed_limit_kmh,
        });
      }
    }

    // ACK the export batch (DELETE removes it from the queue)
    if (exportBatchId && apiUsed === "export_stream") {
      await deleteExportBatch(exportEndpoint!, exportApiKey!, exportBatchId);
    }

    return new Response(
      JSON.stringify({ ok: true, api: apiUsed, devices: devices.length, positionsReceived: positions.length, positionsUpdated: updated, exportBatchId }),
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
