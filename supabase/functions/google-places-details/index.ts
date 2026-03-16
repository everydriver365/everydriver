import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId, sessionToken } = await req.json();

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "Place ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("Google Places API key not configured");
    }

    // Use the Places Details API
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      fields: "formatted_address,address_components,geometry",
    });

    if (sessionToken) {
      params.append("sessiontoken", sessionToken);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places Details API error:", data);
      throw new Error(data.error_message || `API returned status: ${data.status}`);
    }

    const result = data.result;
    const addressComponents = result.address_components || [];

    // Extract address parts
    const getComponent = (types: string[]) => {
      const component = addressComponents.find((c: any) =>
        types.some((t) => c.types.includes(t))
      );
      return component?.long_name || "";
    };

    const getShortComponent = (types: string[]) => {
      const component = addressComponents.find((c: any) =>
        types.some((t) => c.types.includes(t))
      );
      return component?.short_name || "";
    };

    const streetNumber = getComponent(["street_number"]);
    const route = getComponent(["route"]);
    const locality = getComponent(["locality", "postal_town"]);
    const postalCode = getComponent(["postal_code"]);
    const country = getComponent(["country"]);

    // Build the street address
    const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

    return new Response(
      JSON.stringify({
        formattedAddress: result.formatted_address,
        streetAddress,
        locality,
        postalCode,
        country,
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in google-places-details:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
