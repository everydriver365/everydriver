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
    expiresAt: Date.now() + 20 * 60 * 1000, // 20 min TTL
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

    // Build device ID list
    const geotabDeviceIds = devices.map((d) => d.geotab_device_id);

    // --- Fetch device status (position, speed, ignition) ---
    const statusResults = await geotabCall(session, "Get", {
      typeName: "DeviceStatusInfo",
      search: {
        deviceSearch: {
          id: geotabDeviceIds.length === 1 ? geotabDeviceIds[0] : undefined,
        },
      },
    });

    // Map Geotab device ID -> our device record
    const deviceMap = new Map(devices.map((d) => [d.geotab_device_id, d]));

    // Update positions
    for (const status of statusResults || []) {
      const device = deviceMap.get(status.device?.id);
      if (!device) continue;

      await supabase
        .from("gps_devices")
        .update({
          last_latitude: status.latitude,
          last_longitude: status.longitude,
          last_speed_kmh: status.speed,
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

    // --- Fetch new media files (dashcam clips) ---
    // Get the last media sync token from cron_sync_config
    const { data: syncConfig } = await supabase
      .from("cron_sync_config")
      .select("*")
      .eq("id", "geotab_media_feed")
      .maybeSingle();

    const fromVersion = (syncConfig as any)?.last_error || null; // Reusing last_error to store feed version token

    const mediaParams: Record<string, unknown> = {
      typeName: "MediaFile",
      resultsLimit: 100,
    };

    if (fromVersion) {
      mediaParams.fromVersion = fromVersion;
    }

    let mediaResults: any[] = [];
    let newVersion: string | null = null;

    try {
      const feedResult = await geotabCall(session, "GetFeed", mediaParams);
      mediaResults = feedResult?.data || [];
      newVersion = feedResult?.toVersion || null;
    } catch (e) {
      // GetFeed may not be supported for MediaFile on all databases
      console.log("MediaFile GetFeed not available, trying Get:", e);
      try {
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour
        mediaResults = await geotabCall(session, "Get", {
          typeName: "MediaFile",
          search: {
            fromDate: since,
          },
        }) || [];
      } catch (e2) {
        console.log("MediaFile Get also failed:", e2);
      }
    }

    // Store new media files
    let mediaInserted = 0;
    for (const media of mediaResults) {
      const device = deviceMap.get(media.device?.id);
      if (!device) continue;

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
            is_incident: media.tags?.includes("Incident") || false,
            status: "available",
          },
          { onConflict: "geotab_media_file_id" }
        );

      if (!insertErr) mediaInserted++;
    }

    // Update feed version token
    if (newVersion) {
      await supabase.from("cron_sync_config").upsert({
        id: "geotab_media_feed",
        last_error: newVersion, // Storing feed version in last_error field
        last_run_at: new Date().toISOString(),
        is_enabled: true,
        interval_seconds: 60,
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
