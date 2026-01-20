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

// Parse speed limit from TomTom response - handles both string and number formats
function parseSpeedLimit(speedLimitRaw: any): number | null {
  if (!speedLimitRaw) return null;
  
  // TomTom can return speed as a number OR as a string like "30.00MPH" or "50.00KPH"
  if (typeof speedLimitRaw === 'string') {
    const match = speedLimitRaw.match(/^([\d.]+)\s*(MPH|KPH)?$/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2]?.toUpperCase() || 'MPH'; // Default to MPH for UK
      if (unit === 'MPH') {
        return Math.round(value * 1.60934);
      } else {
        return Math.round(value);
      }
    }
    // Try parsing as plain number string
    const numValue = parseFloat(speedLimitRaw);
    if (!isNaN(numValue)) {
      // Assume mph for UK and convert
      return Math.round(numValue * 1.60934);
    }
  } else if (typeof speedLimitRaw === 'number') {
    // Assume mph for UK and convert to km/h
    return Math.round(speedLimitRaw * 1.60934);
  }
  
  return null;
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
        const speedLimitRaw = address.speedLimit;
        
        const speedKmh = parseSpeedLimit(speedLimitRaw);
        
        if (speedKmh) {
          console.log(`Speed limit: ${speedLimitRaw} = ${speedKmh} km/h on ${roadName}`);
        } else {
          console.log(`No speed limit data for ${roadName}`);
        }
        
        return new Response(
          JSON.stringify({ 
            speedLimit: speedKmh,
            roadType: roadName,
            confidence: speedKmh ? 'high' : 'low'
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
        
        // Try to get speed limit from Overpass API (OSM)
        try {
          const overpassQuery = `
            [out:json][timeout:5];
            way(around:30,${lat},${lon})["highway"]["maxspeed"];
            out body 1;
          `;
          
          const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(overpassQuery)}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          
          if (overpassResponse.ok) {
            const overpassData = await overpassResponse.json();
            const maxspeed = overpassData.elements?.[0]?.tags?.maxspeed;
            
            if (maxspeed) {
              const match = maxspeed.match(/(\d+)/);
              if (match) {
                let speed = parseInt(match[1]);
                // Convert mph to km/h if needed (UK uses mph)
                if (maxspeed.includes('mph') || (!maxspeed.includes('km') && speed <= 70)) {
                  speed = Math.round(speed * 1.60934);
                }
                console.log(`OSM speed limit: ${maxspeed} = ${speed} km/h`);
                
                return new Response(
                  JSON.stringify({ 
                    speedLimit: speed,
                    roadType: roadName,
                    confidence: 'medium'
                  } as SpeedLimitResponse),
                  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
          }
        } catch (overpassError) {
          console.log("Overpass query failed:", overpassError);
        }
        
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
