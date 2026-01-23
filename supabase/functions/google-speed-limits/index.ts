import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadName: string | null;
  source: 'google_roads' | 'osm' | null;
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

    console.log(`[SpeedLimit] Fetching LIVE data for ${lat.toFixed(6)}, ${lon.toFixed(6)}`);

    let speedLimit: number | null = null;
    let roadName: string | null = null;
    let source: 'google_roads' | 'osm' | null = null;

    // Method 1: Google Roads API - provides real speed limit data
    if (googleApiKey) {
      try {
        const roadsUrl = `https://roads.googleapis.com/v1/speedLimits?path=${lat},${lon}&key=${googleApiKey}`;
        console.log(`Trying Google Roads API...`);
        
        const roadsResponse = await fetch(roadsUrl);
        const responseText = await roadsResponse.text();
        
        if (roadsResponse.ok) {
          const roadsData = JSON.parse(responseText);
          console.log(`Google Roads response:`, JSON.stringify(roadsData));
          
          if (roadsData.speedLimits && roadsData.speedLimits.length > 0) {
            const limitData = roadsData.speedLimits[0];
            // Google returns speed in km/h
            speedLimit = limitData.speedLimit;
            source = 'google_roads';
            console.log(`Google Roads: speed limit = ${speedLimit} km/h`);
          }
          
          // Get snapped road info if available
          if (roadsData.snappedPoints && roadsData.snappedPoints.length > 0) {
            const placeId = roadsData.snappedPoints[0].placeId;
            if (placeId) {
              // Get road name from Places API
              try {
                const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name&key=${googleApiKey}`;
                const placeResponse = await fetch(placeUrl);
                if (placeResponse.ok) {
                  const placeData = await placeResponse.json();
                  if (placeData.result?.name) {
                    roadName = placeData.result.name;
                  }
                }
              } catch (placeErr) {
                console.log('Place details error:', placeErr);
              }
            }
          }
        } else {
          console.log(`Google Roads API error: ${roadsResponse.status} - ${responseText}`);
          // Check if it's a permissions/billing issue
          if (roadsResponse.status === 403 || roadsResponse.status === 400) {
            console.log('Note: Roads API may need to be enabled in Google Cloud Console');
          }
        }
      } catch (roadsError) {
        console.error('Google Roads API error:', roadsError);
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
            
            roadName = tags.name || tags.ref || roadName;
            
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
                // National limit depends on road type - but this is REAL, the sign is there
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

    // Get road name from Google if we don't have it yet
    if (!roadName && googleApiKey) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}&result_type=route`;
        const geocodeResponse = await fetch(geocodeUrl);
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.status === 'OK' && geocodeData.results?.length > 0) {
            for (const component of geocodeData.results[0].address_components || []) {
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

    // NO FALLBACK - return null if we don't have real data
    console.log(`[SpeedLimit] LIVE Result: limit=${speedLimit} km/h, road="${roadName}", source=${source}`);

    return new Response(
      JSON.stringify({ 
        speedLimit,  // Will be null if no real data
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
