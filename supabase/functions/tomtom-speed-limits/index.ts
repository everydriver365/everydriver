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
          speedLimit: null,
          roadType: "Unknown"
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

    console.log(`Fetching road info for ${lat}, ${lon}`);

    // Use TomTom Reverse Geocode API with returnSpeedLimit parameter
    // This is the correct endpoint for getting road name and speed limit
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
      console.log("TomTom reverse geocode response:", JSON.stringify(reverseData));
      
      const address = reverseData.addresses?.[0]?.address;
      
      if (address) {
        const roadName = address.streetName || address.street || address.freeformAddress?.split(',')[0] || 'Unknown Road';
        const speedLimit = address.speedLimit;
        
        let speedKmh: number | null = null;
        
        if (speedLimit) {
          // TomTom returns speed in local units (mph for UK)
          // Convert mph to km/h
          speedKmh = Math.round(speedLimit * 1.60934);
          console.log(`Speed limit: ${speedLimit} mph = ${speedKmh} km/h on ${roadName}`);
        } else {
          console.log(`No speed limit data for ${roadName}`);
        }
        
        return new Response(
          JSON.stringify({ 
            speedLimit: speedKmh,
            roadType: roadName,
            confidence: speedLimit ? 'high' : 'low'
          } as SpeedLimitResponse),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.error(`TomTom reverse geocode error: ${reverseResponse.status}`);
    }

    // Fallback: Try Nominatim (OpenStreetMap) for road name only
    try {
      console.log("Falling back to Nominatim for road name");
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
        {
          headers: {
            'User-Agent': 'DrivingLessonTracker/1.0'
          }
        }
      );

      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        const roadName = nominatimData.address?.road || 
                        nominatimData.address?.highway || 
                        nominatimData.display_name?.split(',')[0] || 
                        'Unknown Road';
        
        console.log(`Nominatim road name: ${roadName}`);
        
        return new Response(
          JSON.stringify({ 
            speedLimit: null,
            roadType: roadName,
            confidence: 'low'
          } as SpeedLimitResponse),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (nominatimError) {
      console.error("Nominatim fallback error:", nominatimError);
    }

    return new Response(
      JSON.stringify({ 
        speedLimit: null, 
        roadType: 'Unknown Road',
        error: "Could not determine road info" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching road info:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        speedLimit: null,
        roadType: 'Unknown Road'
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
