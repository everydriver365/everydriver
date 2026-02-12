import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GeotabSession {
  sessionId: string;
  serverUrl: string;
  expiresAt: number;
}

let cachedSession: GeotabSession | null = null;

async function authenticate(): Promise<GeotabSession> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

  const database = Deno.env.get("GEOTAB_DATABASE");
  const username = Deno.env.get("GEOTAB_USERNAME");
  const password = Deno.env.get("GEOTAB_PASSWORD");

  if (!database || !username || !password) {
    throw new Error("Geotab credentials not configured");
  }

  const res = await fetch("https://my.geotab.com/apiv1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "Authenticate",
      params: { database, userName: username, password },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab auth failed: ${data.error.message}`);

  const { credentials, path } = data.result;
  cachedSession = {
    sessionId: credentials.sessionId,
    serverUrl: `https://${path}/apiv1`,
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

  return cachedSession;
}

async function geotabCall(session: GeotabSession, method: string, params: Record<string, unknown>) {
  const res = await fetch(session.serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method,
      params: {
        ...params,
        credentials: {
          sessionId: session.sessionId,
          database: Deno.env.get("GEOTAB_DATABASE"),
          userName: Deno.env.get("GEOTAB_USERNAME"),
        },
      },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab ${method} failed: ${data.error.message}`);
  return data.result;
}

// Fetch driver names in bulk
async function fetchDriverMap(session: GeotabSession): Promise<Map<string, string>> {
  const driverMap = new Map<string, string>();
  try {
    const drivers = await geotabCall(session, "Get", { typeName: "Driver" });
    for (const d of drivers || []) {
      if (d.id && d.name) driverMap.set(d.id, d.name);
    }
  } catch (e) {
    console.log("Driver fetch failed (non-critical):", e);
  }
  return driverMap;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active Geotab devices
    const { data: devices, error: devErr } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, geotab_device_id, device_name")
      .eq("tracking_provider", "geotab")
      .eq("is_active", true)
      .not("geotab_device_id", "is", null);

    if (devErr) throw devErr;
    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No Geotab devices" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await authenticate();
    const deviceMap = new Map(devices.map((d) => [d.geotab_device_id, d]));
    const geotabDeviceIds = devices.map((d) => d.geotab_device_id);

    // --- Fetch device status (position, speed, heading, ignition) ---
    const statusResults = await geotabCall(session, "Get", {
      typeName: "DeviceStatusInfo",
      search: {
        deviceSearch: {
          id: geotabDeviceIds.length === 1 ? geotabDeviceIds[0] : undefined,
        },
      },
    });

    // Update positions with heading and ignition
    for (const status of statusResults || []) {
      const device = deviceMap.get(status.device?.id);
      if (!device) continue;

      await supabase
        .from("gps_devices")
        .update({
          last_latitude: status.latitude,
          last_longitude: status.longitude,
          last_speed_kmh: status.speed,
          last_heading: status.bearing ?? null,
          last_ignition_status: status.isDeviceCommunicating ?? null,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", device.id);

      // Update live_pupil_positions if there's an active session
      await supabase
        .from("live_pupil_positions")
        .update({
          latitude: status.latitude,
          longitude: status.longitude,
          speed_kmh: status.speed,
          heading: status.bearing,
          updated_at: new Date().toISOString(),
        })
        .eq("device_id", device.id)
        .eq("is_active", true);
    }

    // --- Fetch driver map for media enrichment ---
    const driverMap = await fetchDriverMap(session);

    // --- Fetch new media files (dashcam clips) ---
    const { data: syncConfig } = await supabase
      .from("cron_sync_config")
      .select("*")
      .eq("id", "geotab_media_feed")
      .maybeSingle();

    const fromVersion = (syncConfig as any)?.last_error || null;

    const mediaParams: Record<string, unknown> = {
      typeName: "MediaFile",
      resultsLimit: 100,
    };
    if (fromVersion) mediaParams.fromVersion = fromVersion;

    let mediaResults: any[] = [];
    let newVersion: string | null = null;

    try {
      const feedResult = await geotabCall(session, "GetFeed", mediaParams);
      mediaResults = feedResult?.data || [];
      newVersion = feedResult?.toVersion || null;
    } catch (e) {
      console.log("MediaFile GetFeed not available, trying Get:", e);
      try {
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        mediaResults = await geotabCall(session, "Get", {
          typeName: "MediaFile",
          search: { fromDate: since },
        }) || [];
      } catch (e2) {
        console.log("MediaFile Get also failed:", e2);
      }
    }

    // Store new media files with enriched metadata
    let mediaInserted = 0;
    for (const media of mediaResults) {
      const device = deviceMap.get(media.device?.id);
      if (!device) continue;

      const driverName = media.driver?.id ? driverMap.get(media.driver.id) : null;
      const eventTags = Array.isArray(media.tags) ? media.tags : null;

      const { error: insertErr } = await supabase
        .from("dashcam_media")
        .upsert(
          {
            geotab_media_file_id: media.id,
            instructor_id: device.instructor_id,
            device_id: device.id,
            media_type: media.mediaType === "Image" ? "image" : "video",
            file_name: media.name || null,
            duration_seconds: media.duration || null,
            latitude: media.latitude || null,
            longitude: media.longitude || null,
            recorded_at: media.dateTime || new Date().toISOString(),
            is_incident: eventTags?.includes("Incident") || false,
            status: "available",
            // Enriched fields
            driver_id: media.driver?.id || null,
            driver_name: driverName || null,
            event_tags: eventTags,
            g_force: media.gForce ?? null,
            camera_angle: media.cameraAngle || media.channel || null,
            resolution: media.resolution || null,
            file_size_bytes: media.fileSize || null,
            processing_status: media.processingStatus || media.status || null,
            speed_at_event_kmh: media.speed ?? null,
            road_name: media.roadName || null,
          },
          { onConflict: "geotab_media_file_id" }
        );

      if (!insertErr) mediaInserted++;
    }

    // Update feed version token
    if (newVersion) {
      await supabase.from("cron_sync_config").upsert({
        id: "geotab_media_feed",
        last_error: newVersion,
        last_run_at: new Date().toISOString(),
        is_enabled: true,
        interval_seconds: 10,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        devices: devices.length,
        positionsUpdated: statusResults?.length || 0,
        mediaInserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("geotab-poller error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
