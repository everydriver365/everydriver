import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GeotabSession {
  sessionId: string;
  serverUrl: string;
}

async function getSession(supabase: any): Promise<GeotabSession> {
  // Try DB cache first
  const { data: dbSession } = await supabase
    .from("geotab_session_cache")
    .select("session_id, server_url, expires_at")
    .eq("id", "default")
    .maybeSingle();

  if (dbSession && new Date(dbSession.expires_at).getTime() > Date.now()) {
    return { sessionId: dbSession.session_id, serverUrl: dbSession.server_url };
  }

  // Fresh auth
  const res = await fetch("https://my.geotab.com/apiv1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "Authenticate",
      params: {
        database: Deno.env.get("GEOTAB_DATABASE"),
        userName: Deno.env.get("GEOTAB_USERNAME"),
        password: Deno.env.get("GEOTAB_PASSWORD"),
      },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Geotab auth: ${data.error.message}`);

  const { credentials, path } = data.result;
  const resolvedPath = (!path || path.toLowerCase() === "thisserver") ? "my.geotab.com" : path;
  const serverUrl = `https://${resolvedPath}/apiv1`;

  await supabase.from("geotab_session_cache").upsert({
    id: "default",
    session_id: credentials.sessionId,
    server_url: serverUrl,
    expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  });

  return { sessionId: credentials.sessionId, serverUrl };
}

async function geotabMultiCall(session: GeotabSession, calls: Array<{ method: string; params: Record<string, unknown> }>): Promise<any[]> {
  const credentials = {
    sessionId: session.sessionId,
    database: Deno.env.get("GEOTAB_DATABASE"),
    userName: Deno.env.get("GEOTAB_USERNAME"),
  };

  const res = await fetch(session.serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "ExecuteMultiCall",
      params: {
        calls: calls.map((c) => ({ method: c.method, params: { ...c.params } })),
        credentials,
      },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab multi: ${data.error.message}`);
  return data.result;
}

// Map Geotab built-in rule names to our event types
function classifyRule(ruleName: string): string | null {
  const n = (ruleName || "").toLowerCase();
  if (n.includes("harsh brake") || n.includes("hard brake") || n.includes("harsh decel")) return "harsh_brake";
  if (n.includes("harsh accel") || n.includes("hard accel") || n.includes("rapid accel")) return "harsh_accel";
  if (n.includes("harsh corner") || n.includes("sharp turn") || n.includes("swerve")) return "harsh_corner";
  if (n.includes("speed") || n.includes("posted road")) return "speeding";
  if (n.includes("impact") || n.includes("collision") || n.includes("accident")) return "impact";
  return null;
}

function severityFromG(gForce: number | null): string {
  if (!gForce) return "low";
  if (gForce > 2.0) return "critical";
  if (gForce > 1.5) return "high";
  if (gForce > 0.8) return "medium";
  return "low";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const hoursBack = body.hoursBack || 24;
    const instructorId = body.instructorId;

    // Get devices
    let devQuery = supabase
      .from("gps_devices")
      .select("id, instructor_id, geotab_device_id")
      .eq("tracking_provider", "geotab")
      .not("geotab_device_id", "is", null);
    if (instructorId) devQuery = devQuery.eq("instructor_id", instructorId);

    const { data: devices, error: devErr } = await devQuery;
    if (devErr) throw devErr;
    if (!devices?.length) {
      return new Response(JSON.stringify({ ok: true, message: "No devices" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await getSession(supabase);

    // Get Geotab internal IDs + Rules
    const [allDevices, allRules] = await geotabMultiCall(session, [
      { method: "Get", params: { typeName: "Device" } },
      { method: "Get", params: { typeName: "Rule" } },
    ]);
    const serialToInternal = new Map<string, string>();
    for (const gd of allDevices || []) {
      if (gd.serialNumber) serialToInternal.set(gd.serialNumber, gd.id);
    }

    // Build rule ID → name map
    const ruleNameMap = new Map<string, string>();
    for (const r of allRules || []) {
      if (r.id && r.name) ruleNameMap.set(r.id, r.name);
    }

    const now = new Date();
    const fromDate = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    const resolvedIds = devices.map((d) => serialToInternal.get(d.geotab_device_id) || d.geotab_device_id);

    // Batch: ExceptionEvent + Trip data
    const calls: Array<{ method: string; params: Record<string, unknown> }> = [
      {
        method: "Get",
        params: {
          typeName: "ExceptionEvent",
          search: { fromDate: fromDate.toISOString(), toDate: now.toISOString() },
          resultsLimit: 500,
        },
      },
      {
        method: "Get",
        params: {
          typeName: "Trip",
          search: { fromDate: fromDate.toISOString(), toDate: now.toISOString() },
          resultsLimit: 200,
        },
      },
    ];

    // 2+: FuelUsed per device
    for (const gid of resolvedIds) {
      calls.push({
        method: "Get",
        params: {
          typeName: "StatusData",
          search: {
            deviceSearch: { id: gid },
            diagnosticSearch: { id: "DiagnosticFuelUsedId" },
            fromDate: fromDate.toISOString(),
            toDate: now.toISOString(),
          },
          resultsLimit: 100,
        },
      });
    }

    console.log("[BehaviourSync] Sending", calls.length, "calls for", devices.length, "devices");
    const results = await geotabMultiCall(session, calls);

    const exceptionEvents: any[] = results[0] || [];
    const trips: any[] = results[1] || [];

    // Build device lookup
    const deviceByGeotab = new Map<string, typeof devices[0]>();
    for (const d of devices) {
      const internal = serialToInternal.get(d.geotab_device_id) || d.geotab_device_id;
      deviceByGeotab.set(internal, d);
      deviceByGeotab.set(d.geotab_device_id, d);
    }

    // Process ExceptionEvents → driver events + impact events
    let driverEventsInserted = 0;
    let impactEventsInserted = 0;

    for (const ev of exceptionEvents) {
      const devId = ev.device?.id;
      const device = deviceByGeotab.get(devId);
      if (!device) continue;

      // Resolve rule name — Geotab often returns rule as {id: "..."} without name
      const ruleId = ev.rule?.id;
      const ruleName = ev.rule?.name || ruleNameMap.get(ruleId) || ev.ruleName || "";
      const eventType = classifyRule(ruleName);
      if (!eventType) {
        // If no name match, try to infer from the rule ID pattern
        const idLower = (ruleId || "").toLowerCase();
        const inferredType = idLower.includes("HarshBrake") ? "harsh_brake"
          : idLower.includes("HarshAccel") ? "harsh_accel"
          : idLower.includes("HarshCorner") ? "harsh_corner"
          : idLower.includes("Speed") ? "speeding"
          : null;
        if (!inferredType) continue;
      }

      const gForce = ev.gForce ?? ev.maximumSpeed ?? null;

      // Insert driver event
      const { error: dErr } = await supabase.from("geotab_driver_events").upsert(
        {
          instructor_id: device.instructor_id,
          device_id: device.id,
          event_type: eventType === "impact" ? "harsh_brake" : eventType,
          rule_name: ruleName,
          severity: gForce != null ? severityFromG(gForce) : (ev.severity || "low"),
          latitude: ev.latitude ?? null,
          longitude: ev.longitude ?? null,
          speed_kmh: ev.speed ?? null,
          duration_seconds: ev.duration ? Math.round(ev.duration) : null,
          started_at: ev.activeFrom || ev.dateTime || null,
          ended_at: ev.activeTo || null,
          geotab_event_id: ev.id,
        },
        { onConflict: "geotab_event_id" }
      );
      if (!dErr) driverEventsInserted++;

      // High G-force → also insert impact event
      if (gForce != null && gForce > 1.5) {
        const { error: iErr } = await supabase.from("geotab_impact_events").upsert(
          {
            instructor_id: device.instructor_id,
            device_id: device.id,
            g_force: gForce,
            latitude: ev.latitude ?? null,
            longitude: ev.longitude ?? null,
            speed_kmh: ev.speed ?? null,
            event_time: ev.activeFrom || ev.dateTime || now.toISOString(),
            severity: severityFromG(gForce),
            geotab_event_id: ev.id,
          },
          { onConflict: "geotab_event_id" }
        );
        if (!iErr) impactEventsInserted++;
      }
    }

    // Process Fuel Data
    let fuelRecordsInserted = 0;

    // Get instructor fuel cost setting
    const instructorIds = [...new Set(devices.map((d) => d.instructor_id))];
    const { data: instructors } = await supabase
      .from("instructors")
      .select("id, fuel_cost_per_litre")
      .in("id", instructorIds);
    const fuelCostMap = new Map<string, number>();
    for (const inst of instructors || []) {
      fuelCostMap.set(inst.id, inst.fuel_cost_per_litre || 1.45);
    }

    // Correlate fuel with trips
    for (let i = 0; i < resolvedIds.length; i++) {
      const fuelData: any[] = results[2 + i] || [];
      const device = devices[i];
      if (!fuelData.length) continue;

      // Match fuel readings to trips
      const deviceTrips = trips.filter((t) => {
        const tripDevId = t.device?.id;
        return tripDevId === resolvedIds[i];
      });

      for (const trip of deviceTrips) {
        const tripStart = new Date(trip.start || trip.dateTime);
        const tripEnd = new Date(trip.stop || trip.nextTripStartTime || trip.dateTime);
        const distKm = (trip.distance || 0) / 1000; // Geotab returns meters
        if (distKm < 0.5) continue; // Skip very short trips

        // Find fuel readings within this trip window
        const tripFuel = fuelData.filter((f) => {
          const t = new Date(f.dateTime);
          return t >= tripStart && t <= tripEnd;
        });

        if (tripFuel.length < 2) continue;
        const fuelUsed = Math.abs(tripFuel[tripFuel.length - 1].data - tripFuel[0].data);
        if (fuelUsed <= 0) continue;

        const litresPer100 = distKm > 0 ? (fuelUsed / distKm) * 100 : 0;
        const costPerLitre = fuelCostMap.get(device.instructor_id) || 1.45;

        const { error: fErr } = await supabase.from("geotab_fuel_usage").insert({
          instructor_id: device.instructor_id,
          device_id: device.id,
          trip_start: tripStart.toISOString(),
          trip_end: tripEnd.toISOString(),
          fuel_used_litres: Math.round(fuelUsed * 1000) / 1000,
          distance_km: Math.round(distKm * 10) / 10,
          litres_per_100km: Math.round(litresPer100 * 10) / 10,
          cost_gbp: Math.round(fuelUsed * costPerLitre * 100) / 100,
        });
        if (!fErr) fuelRecordsInserted++;
      }
    }

    // Geofence checking — compare latest positions against instructor geofences
    let geofenceAlertsInserted = 0;
    for (const device of devices) {
      const { data: devPos } = await supabase
        .from("gps_devices")
        .select("last_latitude, last_longitude")
        .eq("id", device.id)
        .single();

      if (!devPos?.last_latitude || !devPos?.last_longitude) continue;

      const { data: geofences } = await supabase
        .from("geofences")
        .select("id, name, latitude, longitude, radius_meters, alert_on_enter, alert_on_exit")
        .eq("instructor_id", device.instructor_id)
        .eq("is_active", true);

      if (!geofences?.length) continue;

      for (const gf of geofences) {
        // Haversine distance
        const R = 6371000;
        const dLat = ((devPos.last_latitude - gf.latitude) * Math.PI) / 180;
        const dLon = ((devPos.last_longitude - gf.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((gf.latitude * Math.PI) / 180) *
            Math.cos((devPos.last_latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const isInside = dist <= gf.radius_meters;

        // Check last alert to avoid duplicates (cooldown 5 min)
        const { data: lastAlert } = await supabase
          .from("geofence_alerts")
          .select("alert_type, triggered_at")
          .eq("geofence_id", gf.id)
          .eq("device_id", device.id)
          .order("triggered_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastType = lastAlert?.alert_type;
        const lastTime = lastAlert?.triggered_at ? new Date(lastAlert.triggered_at).getTime() : 0;
        const cooldown = Date.now() - lastTime > 5 * 60 * 1000;

        if (isInside && gf.alert_on_enter && lastType !== "enter" && cooldown) {
          await supabase.from("geofence_alerts").insert({
            geofence_id: gf.id,
            instructor_id: device.instructor_id,
            device_id: device.id,
            alert_type: "enter",
            latitude: devPos.last_latitude,
            longitude: devPos.last_longitude,
          });
          geofenceAlertsInserted++;
        } else if (!isInside && gf.alert_on_exit && lastType === "enter" && cooldown) {
          await supabase.from("geofence_alerts").insert({
            geofence_id: gf.id,
            instructor_id: device.instructor_id,
            device_id: device.id,
            alert_type: "exit",
            latitude: devPos.last_latitude,
            longitude: devPos.last_longitude,
          });
          geofenceAlertsInserted++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        driverEventsInserted,
        impactEventsInserted,
        fuelRecordsInserted,
        geofenceAlertsInserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[BehaviourSync] Error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
