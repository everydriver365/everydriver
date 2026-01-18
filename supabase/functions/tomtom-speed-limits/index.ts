import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitRequest {
  lat: number;
  lon: number;
}

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadType?: string;
  confidence?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TOMTOM_API_KEY");
    
    if (!apiKey) {
      console.error("TOMTOM_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "TomTom API key not configured",
          speedLimit: null 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lon }: SpeedLimitRequest = await req.json();

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "lat and lon are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching speed limit for ${lat}, ${lon}`);

    // TomTom Speed Limit API
    // https://developer.tomtom.com/traffic-api/documentation/speed-limit
    const response = await fetch(
      `https://api.tomtom.com/traffic/services/4/speedLimit/${lat},${lon}/4/json?key=${apiKey}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`TomTom API error: ${response.status}`);
      
      // Try alternative approach using Reverse Geocode + Road data
      const reverseResponse = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${apiKey}&returnSpeedLimit=true`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (reverseResponse.ok) {
        const reverseData = await reverseResponse.json();
        const address = reverseData.addresses?.[0]?.address;
        const speedLimit = address?.speedLimit;
        
        if (speedLimit) {
          // TomTom returns speed in the local unit (mph for UK)
          // Convert mph to km/h
          const speedKmh = Math.round(speedLimit * 1.60934);
          console.log(`Speed limit from reverse geocode: ${speedLimit} mph = ${speedKmh} km/h`);
          
          return new Response(
            JSON.stringify({ 
              speedLimit: speedKmh,
              roadType: address?.streetName || 'Unknown',
              confidence: 'medium'
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ speedLimit: null, error: "Could not determine speed limit" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("TomTom response:", JSON.stringify(data));

    // Extract speed limit from response
    // The speed limit API returns speedLimit in the local units
    let speedLimit: number | null = null;
    let roadType: string | undefined;

    if (data.currentSpeed || data.freeFlowSpeed) {
      // If we get speed data, use it to infer the limit
      speedLimit = data.currentSpeed?.speedLimit || data.freeFlowSpeed;
    }

    // Check if we have direct speed limit data
    if (data.speedLimit) {
      speedLimit = data.speedLimit;
    }

    // Convert mph to km/h for UK (TomTom typically returns local units)
    if (speedLimit && speedLimit <= 70) {
      speedLimit = Math.round(speedLimit * 1.60934);
    }

    console.log(`Resolved speed limit: ${speedLimit} km/h`);

    return new Response(
      JSON.stringify({ 
        speedLimit,
        roadType,
        confidence: speedLimit ? 'high' : 'low'
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching speed limit:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        speedLimit: null 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
