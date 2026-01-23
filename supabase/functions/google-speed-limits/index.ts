import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadName: string | null;
  roadType: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  source: 'google' | 'inferred' | null;
}

// UK road type to speed limit mapping (mph converted to km/h)
const UK_SPEED_LIMITS: Record<string, number> = {
  'motorway': 113, // 70 mph
  'trunk': 97, // 60 mph (single carriageway) or 113 (dual)
  'primary': 97, // 60 mph
  'secondary': 97, // 60 mph
  'tertiary': 48, // 30 mph (usually built-up)
  'residential': 48, // 30 mph
  'living_street': 32, // 20 mph
  'unclassified': 97, // 60 mph (rural) or 48 (urban)
  'service': 24, // 15 mph
  'default': 48, // 30 mph as safe default
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    
    let lat: number, lon: number;
    try {
      const body = await req.json();
      lat = body.lat || body.latitude;
      lon = body.lon || body.longitude;
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lat || !lon || typeof lat !== 'number' || typeof lon !== 'number') {
      console.error("Invalid coordinates:", { lat, lon });
      return new Response(
        JSON.stringify({ error: "lat and lon must be valid numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Google] Fetching road info for ${lat.toFixed(6)}, ${lon.toFixed(6)}`);

    if (!apiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          speedLimit: UK_SPEED_LIMITS.default,
          roadName: null,
          roadType: null,
          confidence: 'low',
          source: 'inferred',
          error: "API key not configured, using default"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let speedLimit: number | null = null;
    let roadName: string | null = null;
    let roadType: string | null = null;
    let confidence: 'high' | 'medium' | 'low' | null = null;
    let source: 'google' | 'inferred' | null = null;

    // Method 1: Try Google Roads API Speed Limits (requires Roads API enabled)
    try {
      const roadsUrl = `https://roads.googleapis.com/v1/speedLimits?path=${lat},${lon}&key=${apiKey}`;
      console.log(`Trying Roads API...`);
      
      const roadsResponse = await fetch(roadsUrl);
      
      if (roadsResponse.ok) {
        const roadsData = await roadsResponse.json();
        console.log(`Roads API response:`, JSON.stringify(roadsData));
        
        if (roadsData.speedLimits && roadsData.speedLimits.length > 0) {
          const limitData = roadsData.speedLimits[0];
          // Google returns speed in km/h
          speedLimit = limitData.speedLimit;
          confidence = 'high';
          source = 'google';
          console.log(`Roads API: speed limit = ${speedLimit} km/h`);
        }
      } else {
        const errorText = await roadsResponse.text();
        console.log(`Roads API not available: ${roadsResponse.status} - ${errorText}`);
      }
    } catch (roadsError) {
      console.log('Roads API error:', roadsError);
    }

    // Method 2: Use Reverse Geocoding to get road name and infer speed limit
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}&result_type=route`;
      console.log(`Trying Geocoding API...`);
      
      const geocodeResponse = await fetch(geocodeUrl);
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        console.log(`Geocode response status:`, geocodeData.status);
        
        if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
          const result = geocodeData.results[0];
          
          // Get road name from address components
          for (const component of result.address_components || []) {
            if (component.types.includes('route')) {
              roadName = component.long_name;
              break;
            }
          }
          
          // If no road name from components, use formatted address
          if (!roadName) {
            roadName = result.formatted_address?.split(',')[0] || null;
          }
          
          // Infer road type from the name
          const nameLower = (roadName || '').toLowerCase();
          
          if (nameLower.includes('motorway') || nameLower.match(/^m\d+/)) {
            roadType = 'motorway';
          } else if (nameLower.match(/^a\d+/) || nameLower.includes('dual carriageway')) {
            roadType = 'trunk';
          } else if (nameLower.match(/^b\d+/)) {
            roadType = 'primary';
          } else if (nameLower.includes('lane') || nameLower.includes('close') || nameLower.includes('avenue') || nameLower.includes('road') || nameLower.includes('street') || nameLower.includes('drive') || nameLower.includes('way') || nameLower.includes('crescent')) {
            roadType = 'residential';
          }
          
          // If we don't have a speed limit from Roads API, infer from road type
          if (speedLimit === null && roadType) {
            speedLimit = UK_SPEED_LIMITS[roadType] || UK_SPEED_LIMITS.default;
            confidence = 'medium';
            source = 'inferred';
            console.log(`Inferred speed limit from road type '${roadType}': ${speedLimit} km/h`);
          } else if (speedLimit === null) {
            // Default to 30mph (48 km/h) for unknown roads - safe assumption for UK
            speedLimit = UK_SPEED_LIMITS.default;
            confidence = 'low';
            source = 'inferred';
            console.log(`Using default speed limit: ${speedLimit} km/h`);
          }
        }
      }
    } catch (geocodeError) {
      console.error('Geocoding error:', geocodeError);
    }

    // Final fallback
    if (speedLimit === null) {
      speedLimit = UK_SPEED_LIMITS.default;
      confidence = 'low';
      source = 'inferred';
    }

    console.log(`[Google] Final result: speedLimit=${speedLimit} km/h, roadName="${roadName}", roadType="${roadType}"`);

    return new Response(
      JSON.stringify({ 
        speedLimit,
        roadName,
        roadType,
        confidence,
        source
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching road info:", error);
    return new Response(
      JSON.stringify({ 
        speedLimit: 48, // Default 30mph
        roadName: null,
        roadType: null,
        confidence: 'low',
        source: 'inferred'
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
