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

    const { deviceId, date } = await req.json();

    if (!deviceId || !date) {
      return new Response(
        JSON.stringify({ error: "deviceId and date are required", route: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get device
    const { data: device, error: deviceError } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, quartix_vehicle_id")
      .eq("id", deviceId)
      .eq("tracking_provider", "quartix")
      .single();

    if (deviceError || !device?.quartix_vehicle_id) {
      return new Response(
        JSON.stringify({ error: "Device not found or missing Quartix vehicle ID", route: [] }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await authenticate();
    const day = new Date(date).toISOString().split("T")[0];

    const routeRes = await fetch(
      `${QUARTIX_BASE}/vehicles/route?VehicleID=${device.quartix_vehicle_id}&StartDay=${day}`,
      { headers: { AccessToken: accessToken } }
    );

    if (!routeRes.ok) {
      const text = await routeRes.text();
      console.error(`[QuartixRoute] API error [${routeRes.status}]:`, text);
      return new Response(
        JSON.stringify({ error: `Quartix API error: ${routeRes.status}`, route: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const routeJson = await routeRes.json();
    const rawHops = routeJson?.Data || [];

    const route = rawHops.map((hop: any) => ({
      latitude: hop.Latitude,
      longitude: hop.Longitude,
      heading: hop.Heading,
      speed: hop.Speed != null ? hop.Speed * 1.60934 : null, // mph to kmh
      speedLimit: hop.SpeedLimit != null ? hop.SpeedLimit * 1.60934 : null,
      timestamp: hop.Time || hop.DateTime,
      location: hop.Location || hop.LocationText || null,
      eventType: hop.EventType || null,
      drivingStyle: hop.DrivingStyle || null,
    }));

    console.log(`[QuartixRoute] Returning ${route.length} hops for device ${deviceId} on ${day}`);

    return new Response(
      JSON.stringify({ success: true, route }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[QuartixRoute] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error), route: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
