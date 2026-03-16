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
    const { postcode } = await req.json();
    if (!postcode || typeof postcode !== "string") {
      return new Response(
        JSON.stringify({ error: "postcode is required", addresses: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("Google Places API key not configured");
    }

    const clean = postcode.trim();
    console.log(`[postcode-address-lookup] Looking up: "${clean}"`);

    // Step 1: Geocode the postcode using Google Geocoding API
    const geocodeParams = new URLSearchParams({
      address: clean,
      components: "country:GB",
      key: apiKey,
    });

    const geocodeRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${geocodeParams}`
    );
    const geocodeData = await geocodeRes.json();

    if (geocodeData.status !== "OK" || !geocodeData.results?.length) {
      console.log(`[postcode-address-lookup] Geocode failed: ${geocodeData.status}`);
      return new Response(
        JSON.stringify({ addresses: [], debug: { geocodeStatus: geocodeData.status } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const location = geocodeData.results[0].geometry.location;
    console.log(`[postcode-address-lookup] Geocoded to: ${location.lat}, ${location.lng}`);

    // Step 2: Use Google Places Autocomplete with the postcode as input
    // This works better than Nearby Search for getting actual street addresses
    const autocompleteParams = new URLSearchParams({
      input: clean,
      key: apiKey,
      components: "country:gb",
      location: `${location.lat},${location.lng}`,
      radius: "500",
      strictbounds: "true",
    });

    const autocompleteRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${autocompleteParams}`
    );
    const autocompleteData = await autocompleteRes.json();

    console.log(`[postcode-address-lookup] Autocomplete status: ${autocompleteData.status}, results: ${autocompleteData.predictions?.length || 0}`);

    // Step 3: If autocomplete returns results, use them
    let addresses: any[] = [];

    if (autocompleteData.status === "OK" && autocompleteData.predictions?.length > 0) {
      // Filter to only results that look like actual addresses (not just the postcode area)
      const validPredictions = autocompleteData.predictions.filter((p: any) => {
        const types = p.types || [];
        // Keep street_address, premise, subpremise, route results
        // Exclude postal_code-only and locality-only results
        const isJustPostcode = types.includes("postal_code") && !types.includes("route") && !types.includes("street_address");
        const isJustLocality = types.length === 1 && types[0] === "locality";
        return !isJustPostcode && !isJustLocality;
      });

      addresses = validPredictions.map((p: any) => ({
        placeId: p.place_id,
        label: p.description,
        mainText: p.structured_formatting?.main_text || "",
        secondaryText: p.structured_formatting?.secondary_text || "",
      }));
    }

    // Step 4: If we got few/no results from autocomplete, try Nearby Search for street addresses
    if (addresses.length < 3) {
      console.log(`[postcode-address-lookup] Few autocomplete results, trying reverse geocode`);
      
      const reverseParams = new URLSearchParams({
        latlng: `${location.lat},${location.lng}`,
        key: apiKey,
        result_type: "street_address|premise",
      });

      const reverseRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${reverseParams}`
      );
      const reverseData = await reverseRes.json();

      console.log(`[postcode-address-lookup] Reverse geocode status: ${reverseData.status}, results: ${reverseData.results?.length || 0}`);

      if (reverseData.status === "OK" && reverseData.results?.length > 0) {
        // Add unique results from reverse geocoding
        const existingLabels = new Set(addresses.map((a: any) => a.label));
        
        for (const result of reverseData.results) {
          if (existingLabels.has(result.formatted_address)) continue;
          
          // Extract components
          const components = result.address_components || [];
          const getComp = (types: string[]) =>
            components.find((c: any) => types.some((t: string) => c.types.includes(t)))?.long_name || "";
          
          const streetNumber = getComp(["street_number"]);
          const route = getComp(["route"]);
          const mainText = [streetNumber, route].filter(Boolean).join(" ");
          
          if (!mainText) continue; // Skip results without a street

          addresses.push({
            placeId: result.place_id,
            label: result.formatted_address,
            mainText,
            secondaryText: [getComp(["locality", "postal_town"]), getComp(["postal_code"])].filter(Boolean).join(", "),
          });
          existingLabels.add(result.formatted_address);
        }
      }
    }

    // Deduplicate by placeId
    const seen = new Set<string>();
    addresses = addresses.filter((a: any) => {
      if (seen.has(a.placeId)) return false;
      seen.add(a.placeId);
      return true;
    });

    console.log(`[postcode-address-lookup] Returning ${addresses.length} addresses`);

    return new Response(
      JSON.stringify({ addresses }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[postcode-address-lookup] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message, addresses: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

