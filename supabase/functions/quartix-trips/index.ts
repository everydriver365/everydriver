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
    throw new Error("Quartix credentials not configured");
  }

  const body = new URLSearchParams({
    CustomerID: customerId,
    UserName: username,
    Password: password,
    Application: application,
  });

  const res = await fetch(`${QUARTIX_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Quartix auth failed [${res.status}]: ${text}`);
  }

  const json = await res.json();
  const token = json?.Data?.AccessToken;
  if (!token) throw new Error("No AccessToken in Quartix auth response");
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

    const { deviceId, fromDate, toDate } = await req.json();

    if (!deviceId || !fromDate || !toDate) {
      return new Response(
        JSON.stringify({ error: "deviceId, fromDate, and toDate are required", trips: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Authenticate with Quartix
    const accessToken = await authenticate();

    // Format dates as YYYY-MM-DD
    const startDay = new Date(fromDate).toISOString().split("T")[0];
    const endDay = new Date(toDate).toISOString().split("T")[0];

    // Fetch trips from Quartix
    const tripsUrl = `${QUARTIX_BASE}/vehicles/trips?VehicleIDList=${device.quartix_vehicle_id}&StartDay=${startDay}&EndDay=${endDay}&Include=drivingStyle`;
    const tripsRes = await fetch(tripsUrl, {
      headers: { AccessToken: accessToken },
    });

    if (!tripsRes.ok) {
      const text = await tripsRes.text();
      console.error(`[QuartixTrips] API error [${tripsRes.status}]:`, text);
      return new Response(
        JSON.stringify({ error: `Quartix API error: ${tripsRes.status}`, trips: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tripsJson = await tripsRes.json();
    const rawTrips = tripsJson?.Data || [];

    // Map trips to our format
    const trips = rawTrips.map((trip: any) => {
      const ds = trip.DrivingStyle;
      const hasOverspeeding = ds?.RelativeSpeed?.Score != null && ds.RelativeSpeed.Score < 80;
      const idleMinutes = trip.IdleTime ?? trip.IdlingTime ?? null;

      return {
        id: `${trip.VehicleID}-${trip.StartTime}`,
        vehicleId: String(trip.VehicleID),
        startTime: trip.StartTime,
        endTime: trip.EndTime,
        startAddress: trip.StartLocation || trip.StartText || "",
        endAddress: trip.EndLocation || trip.EndText || "",
        distanceKm: trip.Distance != null ? trip.Distance * 1.60934 : 0,
        durationMinutes: trip.TravelTime || 0,
        idleMinutes: idleMinutes != null ? idleMinutes : null,
        avgSpeedKmh: trip.AvgSpeed != null ? trip.AvgSpeed * 1.60934 : 0,
        maxSpeedKmh: trip.MaxSpeed != null ? trip.MaxSpeed * 1.60934 : 0,
        startLat: trip.StartLatitude || null,
        startLng: trip.StartLongitude || null,
        endLat: trip.EndLatitude || null,
        endLng: trip.EndLongitude || null,
        drivingStyle: ds || null,
        hasOverspeeding,
        // Driving style sub-scores
        overallScore: ds?.Score ?? null,
        speedScore: ds?.RelativeSpeed?.Score ?? null,
        accelerationScore: ds?.Accel?.Score ?? null,
        brakingScore: ds?.Braking?.Score ?? null,
        corneringScore: ds?.Cornering?.Score ?? null,
      };
    });

    // Calculate meta
    const totalDistanceKm = trips.reduce((sum: number, t: any) => sum + (t.distanceKm || 0), 0);
    const totalDurationMinutes = trips.reduce((sum: number, t: any) => sum + (t.durationMinutes || 0), 0);
    const tripsWithOverspeeding = trips.filter((t: any) => t.hasOverspeeding).length;

    const meta = {
      fromDate: startDay,
      toDate: endDay,
      totalTrips: trips.length,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMinutes: Math.round(totalDurationMinutes),
      tripsWithOverspeeding,
    };

    console.log(`[QuartixTrips] Returning ${trips.length} trips for device ${deviceId}`);

    return new Response(
      JSON.stringify({ success: true, trips, meta }),
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
