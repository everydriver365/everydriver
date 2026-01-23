import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadName: string | null;
  source: 'osm' | 'uk_default' | null;
  roadType: string | null;
}

// UK National Speed Limits in km/h
// These are the legal defaults when no sign is posted
const UK_DEFAULTS = {
  motorway: 113,        // 70 mph
  trunk: 97,            // 60 mph (single) - could be 70 on dual
  primary: 97,          // 60 mph (single)
  secondary: 97,        // 60 mph
  tertiary: 48,         // 30 mph (usually built-up)
  unclassified: 97,     // 60 mph (rural)
  residential: 48,      // 30 mph
  living_street: 32,    // 20 mph
  service: 16,          // 10 mph
  track: 16,            // 10 mph
  default_urban: 48,    // 30 mph for urban roads
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    
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
      return new Response(
        JSON.stringify({ error: "lat and lon must be valid numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SpeedLimit] Fetching for ${lat.toFixed(6)}, ${lon.toFixed(6)}`);

    let speedLimit: number | null = null;
    let roadName: string | null = null;
    let roadType: string | null = null;
    let source: 'osm' | 'uk_default' | null = null;

    // Query OSM for road info - get maxspeed OR highway type
    try {
      const overpassQuery = `
        [out:json][timeout:5];
        way(around:30,${lat},${lon})["highway"];
        out body;
      `;
      
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      console.log(`Querying Overpass API...`);
      
      const overpassResponse = await fetch(overpassUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (overpassResponse.ok) {
        const overpassData = await overpassResponse.json();
        console.log(`Overpass returned ${overpassData.elements?.length || 0} roads`);
        
        if (overpassData.elements && overpassData.elements.length > 0) {
          // Find the most relevant road (prefer named roads with highway tags)
          const roads = overpassData.elements;
          let bestRoad = roads[0];
          
          // Prefer roads with maxspeed or names
          for (const road of roads) {
            if (road.tags?.maxspeed) {
              bestRoad = road;
              break;
            }
            if (road.tags?.name && !bestRoad.tags?.name) {
              bestRoad = road;
            }
          }
          
          const tags = bestRoad.tags || {};
          roadName = tags.name || tags.ref || null;
          roadType = tags.highway || null;
          
          console.log(`Found road: "${roadName}", type: ${roadType}, maxspeed tag: ${tags.maxspeed || 'none'}`);
          
          // First try: explicit maxspeed tag
          if (tags.maxspeed) {
            const maxspeed = tags.maxspeed;
            console.log(`OSM maxspeed tag: "${maxspeed}"`);
            
            // Parse numeric value
            const numMatch = maxspeed.match(/^(\d+)/);
            if (numMatch) {
              let value = parseInt(numMatch[1], 10);
              
              // UK uses mph - check if explicitly km/h
              if (maxspeed.toLowerCase().includes('km')) {
                speedLimit = value;
              } else {
                // Assume mph for UK, convert to km/h
                speedLimit = Math.round(value * 1.60934);
              }
              source = 'osm';
              console.log(`OSM explicit limit: ${speedLimit} km/h`);
            }
            
            // Handle "national" speed limit
            if (maxspeed === 'national' || maxspeed === 'GB:national') {
              if (roadType === 'motorway') {
                speedLimit = 113; // 70 mph
              } else if (tags.dual_carriageway === 'yes' || tags.lanes === '4' || roadType === 'trunk') {
                speedLimit = 113; // 70 mph dual
              } else {
                speedLimit = 97; // 60 mph single carriageway
              }
              source = 'osm';
              console.log(`OSM national limit: ${speedLimit} km/h`);
            }
          }
          
          // Second try: infer from road type (UK national limits)
          if (speedLimit === null && roadType) {
            const ukDefault = UK_DEFAULTS[roadType as keyof typeof UK_DEFAULTS];
            if (ukDefault) {
              speedLimit = ukDefault;
              source = 'uk_default';
              console.log(`UK default for ${roadType}: ${speedLimit} km/h`);
            } else {
              // Default to 30mph for unknown urban roads
              speedLimit = UK_DEFAULTS.default_urban;
              source = 'uk_default';
              console.log(`UK default (urban): ${speedLimit} km/h`);
            }
          }
        }
      } else {
        const errorText = await overpassResponse.text();
        console.error(`Overpass API error: ${overpassResponse.status} - ${errorText}`);
      }
    } catch (osmError) {
      console.error('OSM Overpass error:', osmError);
    }

    // Fallback: Use Google Geocoding for road name if still missing
    if (!roadName && googleApiKey) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}&result_type=route`;
        const geocodeResponse = await fetch(geocodeUrl);
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.status === 'OK' && geocodeData.results?.length > 0) {
            const result = geocodeData.results[0];
            for (const component of result.address_components || []) {
              if (component.types.includes('route')) {
                roadName = component.long_name;
                break;
              }
            }
            
            // If we got a road name but no speed limit, default to 30mph urban
            if (roadName && speedLimit === null) {
              speedLimit = UK_DEFAULTS.default_urban;
              source = 'uk_default';
              console.log(`Google road, UK default: ${speedLimit} km/h`);
            }
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }
    }

    // Final fallback: 30mph if we have no data
    if (speedLimit === null) {
      speedLimit = UK_DEFAULTS.default_urban;
      source = 'uk_default';
      console.log(`Final fallback: ${speedLimit} km/h`);
    }

    console.log(`[SpeedLimit] Result: limit=${speedLimit} km/h, road="${roadName}", type=${roadType}, source=${source}`);

    return new Response(
      JSON.stringify({ 
        speedLimit,
        roadName,
        roadType,
        source
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching speed limit:", error);
    // Return 30mph default on error
    return new Response(
      JSON.stringify({ 
        speedLimit: 48,
        roadName: null,
        roadType: null,
        source: 'uk_default'
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
