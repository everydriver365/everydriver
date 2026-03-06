import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RouteRequest {
  from_postcode: string;
  to_postcode?: string;
  instructor_home_postcode?: string;
}

interface GeocodeResult {
  lat: number;
  lng: number;
}

async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  try {
    // Use postcodes.io for UK postcodes (free API)
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
    
    if (!response.ok) {
      console.error(`Failed to geocode postcode: ${postcode}`);
      return null;
    }
    
    const data = await response.json();
    if (data.status === 200 && data.result) {
      return {
        lat: data.result.latitude,
        lng: data.result.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding postcode:", error);
    return null;
  }
}

async function calculateDistance(
  from: GeocodeResult,
  to: GeocodeResult,
  apiKey: string
): Promise<{ distanceMeters: number; distanceMiles: number; durationMinutes: number } | null> {
  try {
    // Use TomTom Routing API
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json?key=${apiKey}&traffic=false`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("TomTom API error:", await response.text());
      return null;
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceMeters = route.summary.lengthInMeters;
      const durationSeconds = route.summary.travelTimeInSeconds;
      
      return {
        distanceMeters,
        distanceMiles: distanceMeters * 0.000621371,
        durationMinutes: Math.round(durationSeconds / 60),
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from_postcode, to_postcode, instructor_home_postcode } = await req.json() as RouteRequest;
    
    if (!from_postcode) {
      return new Response(
        JSON.stringify({ error: "from_postcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UK postcode format
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(from_postcode)) {
      return new Response(
        JSON.stringify({ error: "Invalid from_postcode format", from_postcode }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tomtomApiKey = Deno.env.get("TOMTOM_API_KEY");
    if (!tomtomApiKey) {
      return new Response(
        JSON.stringify({ error: "TOMTOM_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geocode the from postcode
    const fromCoords = await geocodePostcode(from_postcode);
    if (!fromCoords) {
      return new Response(
        JSON.stringify({ error: "Could not geocode from_postcode", from_postcode }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the destination
    const destinationPostcode = to_postcode || instructor_home_postcode;
    
    if (!destinationPostcode) {
      // If no destination, estimate based on typical lesson (round trip from pickup)
      // Assume average lesson covers about 12 miles per hour
      return new Response(
        JSON.stringify({ 
          success: true,
          estimated: true,
          message: "No destination provided, returning typical estimate",
          distance_miles: 15, // Typical 1-hour lesson distance
          from_postcode,
          from_coords: fromCoords,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Geocode the destination
    const toCoords = await geocodePostcode(destinationPostcode);
    if (!toCoords) {
      return new Response(
        JSON.stringify({ error: "Could not geocode destination postcode", to_postcode: destinationPostcode }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate the route distance
    const routeResult = await calculateDistance(fromCoords, toCoords, tomtomApiKey);
    
    if (!routeResult) {
      return new Response(
        JSON.stringify({ error: "Could not calculate route" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For a driving lesson, we typically go from pickup -> lesson route -> back to pickup (or to instructor home)
    // If returning to pickup, double the distance. If to instructor home, add that distance.
    const returnDistance = instructor_home_postcode && to_postcode !== instructor_home_postcode
      ? routeResult.distanceMiles // One way to student, one way back different
      : routeResult.distanceMiles * 2; // Round trip

    return new Response(
      JSON.stringify({
        success: true,
        from_postcode,
        to_postcode: destinationPostcode,
        one_way_miles: Number(routeResult.distanceMiles.toFixed(1)),
        estimated_lesson_miles: Number(returnDistance.toFixed(1)),
        duration_minutes: routeResult.durationMinutes,
        from_coords: fromCoords,
        to_coords: toCoords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
