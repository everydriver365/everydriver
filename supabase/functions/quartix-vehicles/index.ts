import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const accessToken = await authenticate();

    // Fetch all vehicles from Quartix
    const res = await fetch(`${QUARTIX_BASE}/vehicles`, {
      headers: { AccessToken: accessToken },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[QuartixVehicles] API error [${res.status}]:`, text);
      return new Response(
        JSON.stringify({ error: `Quartix API error: ${res.status}`, vehicles: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await res.json();
    const rawVehicles = json?.Data || [];

    const vehicles = rawVehicles.map((v: any) => ({
      vehicleId: String(v.VehicleID),
      registration: v.Registration || v.VehicleName || "",
      vehicleName: v.VehicleName || "",
      groupName: v.GroupName || "",
    }));

    console.log(`[QuartixVehicles] Returning ${vehicles.length} vehicles from Quartix`);

    return new Response(
      JSON.stringify({ success: true, vehicles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[QuartixVehicles] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error), vehicles: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
