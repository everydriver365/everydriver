import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUARTIX_BASE = "https://qws.quartix.net/v2/api";

async function authenticate(): Promise<string> {
  const customerId = Deno.env.get("QUARTIX_CUSTOMER_ID");
  const username = Deno.env.get("QUARTIX_USERNAME");
  const password = Deno.env.get("QUARTIX_PASSWORD");
  const application = Deno.env.get("QUARTIX_APPLICATION");

  if (!customerId || !username || !password || !application) {
    throw new Error("Quartix credentials not configured. Add QUARTIX_CUSTOMER_ID, QUARTIX_USERNAME, QUARTIX_PASSWORD, QUARTIX_APPLICATION secrets.");
  }

  console.log(`[QuartixAuth] Attempting auth with CustomerID=${customerId}, UserName=${username}, Application=${application}`);

  // Try JSON body format first
  const jsonBody = JSON.stringify({
    CustomerID: customerId,
    UserName: username,
    Password: password,
    Application: application,
  });

  let res = await fetch(`${QUARTIX_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonBody,
  });

  let text = await res.text();
  console.log(`[QuartixAuth] JSON attempt: status=${res.status}, body=${text}`);

  if (!res.ok) {
    // Fallback: try form-encoded
    const formBody = new URLSearchParams({
      CustomerID: customerId,
      UserName: username,
      Password: password,
      Application: application,
    });

    res = await fetch(`${QUARTIX_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    text = await res.text();
    console.log(`[QuartixAuth] Form attempt: status=${res.status}, body=${text}`);
  }

  if (!res.ok) {
    throw new Error(`Quartix auth failed [${res.status}]: ${text}`);
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Quartix auth returned non-JSON: ${text}`);
  }
  
  const token = json?.Data?.AccessToken;
  if (!token) throw new Error(`No AccessToken in Quartix auth response: ${text}`);
  return token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authenticate with Quartix
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

    // Step 1: Auto-sync vehicles — fetch all vehicles from Quartix
    const vehiclesRes = await fetch(`${QUARTIX_BASE}/vehicles`, { headers: qHeaders });
    let quartixVehicles: any[] = [];
    if (vehiclesRes.ok) {
      const vehiclesJson = await vehiclesRes.json();
      quartixVehicles = vehiclesJson?.Data || [];
      console.log(`[QuartixPoller] Found ${quartixVehicles.length} Quartix vehicles (raw):`, JSON.stringify(quartixVehicles[0]));
    } else {
      console.warn(`[QuartixPoller] Failed to fetch vehicles list: ${vehiclesRes.status}`);
    }

    // Get all existing Quartix devices
    const { data: existingDevices } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, quartix_vehicle_id")
      .eq("tracking_provider", "quartix");

    // Get instructor tracking configs for Quartix
    const { data: configs } = await supabase
      .from("instructor_tracking_config")
      .select("instructor_id")
      .eq("provider", "quartix");

    const configuredInstructorIds = configs?.map((c: any) => c.instructor_id) || [];

    // Auto-register new vehicles for configured instructors
    const existingVehicleIds = new Set((existingDevices || []).map((d: any) => d.quartix_vehicle_id));
    let newDevicesRegistered = 0;

    for (const vehicle of quartixVehicles) {
      const vehicleId = String(vehicle.VehicleId || vehicle.VehicleID);
      if (existingVehicleIds.has(vehicleId)) continue;

      // Register for the first configured instructor (or skip if none)
      if (configuredInstructorIds.length === 0) continue;

      const { error: insertErr } = await supabase.from("gps_devices").insert({
        instructor_id: configuredInstructorIds[0],
        device_identifier: `quartix-${vehicleId}`,
        device_name: vehicle.RegistrationNumber || vehicle.Description || `Vehicle ${vehicleId}`,
        tracking_provider: "quartix",
        quartix_vehicle_id: vehicleId,
        is_active: true,
      });

      if (!insertErr) {
        newDevicesRegistered++;
        existingVehicleIds.add(vehicleId);
      } else {
        console.warn(`[QuartixPoller] Failed to register vehicle ${vehicleId}:`, insertErr);
      }
    }

    if (newDevicesRegistered > 0) {
      console.log(`[QuartixPoller] Auto-registered ${newDevicesRegistered} new vehicles`);
    }

    // Refresh devices list after potential inserts
    const { data: devices } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, quartix_vehicle_id, quartix_driver_id")
      .eq("tracking_provider", "quartix");

    // Step 2: Fetch live positions
    const liveRes = await fetch(`${QUARTIX_BASE}/vehicles/live`, { headers: qHeaders });
    let processed = 0;
    let skipped = 0;

    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      const positions = liveJson?.Data || [];
      console.log(`[QuartixPoller] Live positions: ${positions.length}`, positions.length > 0 ? JSON.stringify(Object.keys(positions[0])) : 'none');

      for (const pos of positions) {
        const vehicleId = String(pos.VehicleId || pos.VehicleID);
        const device = (devices || []).find((d: any) => d.quartix_vehicle_id === vehicleId);
        if (!device) {
          skipped++;
          continue;
        }

        const { error: updateErr } = await supabase.from("gps_devices").update({
          last_latitude: pos.Latitude,
          last_longitude: pos.Longitude,
          last_speed_kmh: pos.Speed != null ? pos.Speed * 1.60934 : null, // mph to kmh
          last_heading: pos.Heading,
          last_seen_at: new Date().toISOString(),
          last_ignition_status: pos.Ignition ?? null,
          last_road_name: pos.LocationText || null,
        }).eq("id", device.id);

        if (!updateErr) {
          processed++;
        } else {
          console.warn(`[QuartixPoller] Update failed for device ${device.id}:`, updateErr);
          skipped++;
        }
      }
    } else {
      console.warn(`[QuartixPoller] Failed to fetch live positions: ${liveRes.status}`);
    }

    // Step 3: Fetch driving style scores (today's summary)
    const today = new Date().toISOString().split("T")[0];
    const scoresRes = await fetch(
      `${QUARTIX_BASE}/vehicles/tripsummary?StartDay=${today}&EndDay=${today}&Include=drivingStyle&GroupBy=vehicle`,
      { headers: qHeaders }
    );

    if (scoresRes.ok) {
      const scoresJson = await scoresRes.json();
      const summaries = scoresJson?.Data || [];

      for (const summary of summaries) {
        const vehicleId = String(summary.VehicleId || summary.VehicleID);
        const device = (devices || []).find((d: any) => d.quartix_vehicle_id === vehicleId);
        if (!device) continue;

        const ds = summary.DrivingStyle;
        if (!ds) continue;

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
    } else {
      console.warn(`[QuartixPoller] Failed to fetch driving scores: ${scoresRes.status}`);
    }

    console.log(`[QuartixPoller] Complete. Processed: ${processed}, Skipped: ${skipped}, Devices: ${devices?.length || 0}, New: ${newDevicesRegistered}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        skipped,
        registered_devices: devices?.length || 0,
        new_devices: newDevicesRegistered,
        total_quartix_instructors: configuredInstructorIds.length,
      }),
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
