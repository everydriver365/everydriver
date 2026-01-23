import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadName: string | null;
  source: 'osm' | 'google' | null;
}

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
    let source: 'osm' | 'google' | null = null;

    // Method 1: OpenStreetMap Overpass API - get actual posted speed limits
    try {
      // Query for roads within 20m of the point with maxspeed tag
      const overpassQuery = `
        [out:json][timeout:5];
        way(around:20,${lat},${lon})["highway"]["maxspeed"];
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
          // Get the first road with a speed limit
          const road = overpassData.elements[0];
          const tags = road.tags || {};
          
          roadName = tags.name || tags.ref || null;
          
          // Parse maxspeed - can be "30", "30 mph", "50 km/h", "national", etc.
          const maxspeed = tags.maxspeed;
          if (maxspeed) {
            console.log(`OSM maxspeed tag: "${maxspeed}"`);
            
            // Handle numeric values
            const numMatch = maxspeed.match(/^(\d+)/);
            if (numMatch) {
              let value = parseInt(numMatch[1], 10);
              
              // Check if it's mph (UK uses mph)
              if (maxspeed.toLowerCase().includes('mph') || !maxspeed.includes('km')) {
                // UK roads - value is in mph, convert to km/h
                speedLimit = Math.round(value * 1.60934);
              } else {
                speedLimit = value;
              }
              source = 'osm';
              console.log(`OSM speed limit: ${speedLimit} km/h (from ${maxspeed})`);
            }
            
            // Handle "national" speed limit (UK: 60mph single, 70mph dual/motorway)
            if (maxspeed === 'national' || maxspeed === 'GB:national') {
              const highway = tags.highway;
              if (highway === 'motorway' || tags.dual_carriageway === 'yes') {
                speedLimit = 113; // 70 mph
              } else {
                speedLimit = 97; // 60 mph
              }
              source = 'osm';
              console.log(`OSM national limit: ${speedLimit} km/h`);
            }
          }
        }
      } else {
        console.log(`Overpass API error: ${overpassResponse.status}`);
      }
    } catch (osmError) {
      console.error('OSM Overpass error:', osmError);
    }

    // Method 2: Google Geocoding for road name only (if OSM didn't find it)
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
          }
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }
    }

    // Method 3: If still no speed limit, try a wider OSM search
    if (speedLimit === null) {
      try {
        const widerQuery = `
          [out:json][timeout:5];
          way(around:50,${lat},${lon})["highway"];
          out body;
        `;
        
        const widerUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(widerQuery)}`;
        const widerResponse = await fetch(widerUrl);
        
        if (widerResponse.ok) {
          const widerData = await widerResponse.json();
          
          if (widerData.elements && widerData.elements.length > 0) {
            const road = widerData.elements[0];
            const tags = road.tags || {};
            
            if (!roadName) {
              roadName = tags.name || tags.ref || null;
            }
            
            // Check maxspeed again in wider results
            if (tags.maxspeed) {
              const numMatch = tags.maxspeed.match(/^(\d+)/);
              if (numMatch) {
                let value = parseInt(numMatch[1], 10);
                if (tags.maxspeed.toLowerCase().includes('mph') || !tags.maxspeed.includes('km')) {
                  speedLimit = Math.round(value * 1.60934);
                } else {
                  speedLimit = value;
                }
                source = 'osm';
              }
            }
          }
        }
      } catch (widerError) {
        console.error('Wider OSM search error:', widerError);
      }
    }

    console.log(`[SpeedLimit] Result: limit=${speedLimit} km/h, road="${roadName}", source=${source}`);

    return new Response(
      JSON.stringify({ 
        speedLimit,
        roadName,
        source
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching speed limit:", error);
    return new Response(
      JSON.stringify({ 
        speedLimit: null,
        roadName: null,
        source: null
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
