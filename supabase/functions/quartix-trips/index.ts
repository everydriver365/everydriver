import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const QUARTIX_API_KEY = Deno.env.get("QUARTIX_API_KEY");
    const QUARTIX_ACCOUNT_ID = Deno.env.get("QUARTIX_ACCOUNT_ID");
    const QUARTIX_API_URL = Deno.env.get("QUARTIX_API_URL");

    if (!QUARTIX_API_KEY || !QUARTIX_ACCOUNT_ID || !QUARTIX_API_URL) {
      return new Response(
        JSON.stringify({ error: "Quartix API credentials not configured", trips: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { deviceId, fromDate, toDate } = await req.json();

    if (!deviceId || !fromDate || !toDate) {
      return new Response(
        JSON.stringify({ error: "deviceId, fromDate, and toDate are required", trips: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the device to find quartix_vehicle_id
    const { data: device, error: deviceError } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, quartix_vehicle_id, quartix_driver_id")
      .eq("id", deviceId)
      .eq("tracking_provider", "quartix")
      .single();

    if (deviceError || !device) {
      return new Response(
        JSON.stringify({ error: "Device not found or not a Quartix device", trips: [] }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!device.quartix_vehicle_id) {
      return new Response(
        JSON.stringify({ error: "No Quartix vehicle ID linked to this device", trips: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // QUARTIX TRIP HISTORY API INTEGRATION POINT
    // ========================================
    // Replace with actual Quartix API call when credentials are available:
    //
    // const headers = {
    //   "Authorization": `Bearer ${QUARTIX_API_KEY}`,
    //   "X-Account-Id": QUARTIX_ACCOUNT_ID,
    //   "Content-Type": "application/json",
    // };
    //
    // const response = await fetch(
    //   `${QUARTIX_API_URL}/vehicles/${device.quartix_vehicle_id}/trips?from=${fromDate}&to=${toDate}`,
    //   { headers }
    // );
    // const rawTrips = await response.json();
    //
    // const trips = rawTrips.map(trip => ({
    //   id: trip.id,
    //   startTime: trip.start_time,
    //   endTime: trip.end_time,
    //   startAddress: trip.start_address,
    //   endAddress: trip.end_address,
    //   distanceKm: trip.distance_km,
    //   maxSpeedKmh: trip.max_speed_kmh,
    //   avgSpeedKmh: trip.avg_speed_kmh,
    //   waypoints: trip.waypoints || [],
    // }));
    // ========================================

    const trips: any[] = []; // Placeholder until API is connected

    console.log(`[QuartixTrips] Returning ${trips.length} trips for device ${deviceId}`);

    return new Response(
      JSON.stringify({ success: true, trips }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[QuartixTrips] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error), trips: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
