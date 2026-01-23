import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadName: string | null;
  source: 'tomtom' | 'osm' | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tomtomApiKey = Deno.env.get("TOMTOM_API_KEY");
    
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

    console.log(`[SpeedLimit] Fetching LIVE data for ${lat.toFixed(6)}, ${lon.toFixed(6)}`);

    let speedLimit: number | null = null;
    let roadName: string | null = null;
    let source: 'tomtom' | 'osm' | null = null;

    // Method 1: TomTom Reverse Geocode with speed limit
    if (tomtomApiKey) {
      try {
        const reverseUrl = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${tomtomApiKey}&returnSpeedLimit=true&radius=50`;
        console.log(`Trying TomTom Reverse Geocode...`);
        
        const reverseResponse = await fetch(reverseUrl);
        const responseText = await reverseResponse.text();
        
        if (reverseResponse.ok) {
          const reverseData = JSON.parse(responseText);
          console.log(`TomTom Reverse response:`, JSON.stringify(reverseData));
          
          if (reverseData.addresses && reverseData.addresses.length > 0) {
            const addr = reverseData.addresses[0].address;
            roadName = addr.streetName || addr.street || addr.freeformAddress || null;
            console.log(`TomTom road name: ${roadName}`);
            
            // Check for speed limit in response
            if (reverseData.addresses[0].speedLimit) {
              speedLimit = reverseData.addresses[0].speedLimit;
              source = 'tomtom';
              console.log(`TomTom speed limit: ${speedLimit} km/h`);
            }
          }
        } else {
          console.log(`TomTom Reverse API error: ${reverseResponse.status} - ${responseText}`);
        }
      } catch (tomtomError) {
        console.error('TomTom API error:', tomtomError);
      }
    }

    // Method 2: OSM Overpass - only for EXPLICIT maxspeed tags (real sign data)
    if (speedLimit === null) {
      try {
        // Only query for roads WITH maxspeed tag - real data only
        const overpassQuery = `
          [out:json][timeout:5];
          way(around:25,${lat},${lon})["highway"]["maxspeed"];
          out body;
        `;
        
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        console.log(`Trying OSM Overpass (maxspeed only)...`);
        
        const overpassResponse = await fetch(overpassUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json();
          console.log(`Overpass returned ${overpassData.elements?.length || 0} roads with maxspeed`);
          
          if (overpassData.elements && overpassData.elements.length > 0) {
            const road = overpassData.elements[0];
            const tags = road.tags || {};
            
            // Only update road name if we don't have one
            if (!roadName) {
              roadName = tags.name || tags.ref || null;
            }
            
            const maxspeed = tags.maxspeed;
            if (maxspeed) {
              console.log(`OSM maxspeed tag: "${maxspeed}"`);
              
              // Parse numeric value
              const numMatch = maxspeed.match(/^(\d+)/);
              if (numMatch) {
                let value = parseInt(numMatch[1], 10);
                
                // UK uses mph unless explicitly km/h
                if (maxspeed.toLowerCase().includes('km')) {
                  speedLimit = value;
                } else {
                  speedLimit = Math.round(value * 1.60934);
                }
                source = 'osm';
                console.log(`OSM real limit: ${speedLimit} km/h`);
              }
              
              // Handle "national" - this IS real data (the sign exists)
              if (maxspeed === 'national' || maxspeed === 'GB:national') {
                const highway = tags.highway;
                if (highway === 'motorway') {
                  speedLimit = 113; // 70 mph
                } else if (tags.dual_carriageway === 'yes') {
                  speedLimit = 113; // 70 mph
                } else {
                  speedLimit = 97; // 60 mph
                }
                source = 'osm';
                console.log(`OSM national limit sign: ${speedLimit} km/h`);
              }
            }
          }
        }
      } catch (osmError) {
        console.error('OSM Overpass error:', osmError);
      }
    }

    // Method 3: Get road name from OSM if still missing
    if (!roadName) {
      try {
        const overpassQuery = `
          [out:json][timeout:5];
          way(around:25,${lat},${lon})["highway"]["name"];
          out body 1;
        `;
        
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        console.log(`Trying OSM for road name...`);
        
        const overpassResponse = await fetch(overpassUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json();
          if (overpassData.elements && overpassData.elements.length > 0) {
            const tags = overpassData.elements[0].tags || {};
            roadName = tags.name || tags.ref || null;
            console.log(`OSM road name: ${roadName}`);
          }
        }
      } catch (osmError) {
        console.error('OSM road name error:', osmError);
      }
    }

    console.log(`[SpeedLimit] LIVE Result: limit=${speedLimit} km/h, road="${roadName}", source=${source}`);

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
