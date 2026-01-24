import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadName: string | null;
  source: 'here' | 'tomtom' | 'osm' | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hereApiKey = Deno.env.get("HERE_API_KEY");
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
    let source: 'here' | 'tomtom' | 'osm' | null = null;

    // Method 1: HERE Route Matching API v8 (primary - accurate speed limits)
    if (hereApiKey && speedLimit === null) {
      try {
        // Create small offset for second waypoint (~10m)
        const offset = 0.0001;
        const lat2 = lat + offset;
        const lon2 = lon + offset;
        
        // Use proper URL encoding
        const hereUrl = `https://routematching.hereapi.com/v8/match/routelinks?apikey=${encodeURIComponent(hereApiKey)}&waypoint0=${lat},${lon}&waypoint1=${lat2},${lon2}&mode=fastest;car&routeMatch=1&attributes=SPEED_LIMITS_FCn(*)`;
        console.log(`Trying HERE Route Matching API v8...`);
        
        const hereResponse = await fetch(hereUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });
        const responseText = await hereResponse.text();
        
        if (hereResponse.ok) {
          const hereData = JSON.parse(responseText);
          console.log(`HERE Route Matching: received response`);
          
          // Parse route links for speed limit data
          const route = hereData.response?.route?.[0];
          if (route?.leg?.[0]?.link) {
            const links = route.leg[0].link;
            
            for (const link of links) {
              // Get road name
              if (!roadName && link.roadName) {
                roadName = link.roadName;
                console.log(`HERE road name: ${roadName}`);
              }
              
              // Get speed limit from SPEED_LIMITS_FCn attributes
              if (speedLimit === null && link.attributes?.SPEED_LIMITS_FCn) {
                const speedLimits = link.attributes.SPEED_LIMITS_FCn;
                for (const sl of speedLimits) {
                  // Check FROM_REF_SPEED_LIMIT first, then TO_REF_SPEED_LIMIT
                  let limit = parseInt(sl.FROM_REF_SPEED_LIMIT, 10) || parseInt(sl.TO_REF_SPEED_LIMIT, 10);
                  if (limit && limit > 0) {
                    // Check unit - M = metric (km/h), I = imperial (mph)
                    if (sl.SPEED_LIMIT_UNIT === 'I') {
                      limit = Math.round(limit * 1.60934); // Convert mph to km/h
                    }
                    speedLimit = limit;
                    source = 'here';
                    console.log(`HERE speed limit: ${speedLimit} km/h`);
                    break;
                  }
                }
              }
              
              if (speedLimit !== null && roadName) break;
            }
          }
        } else {
          console.log(`HERE Route Matching error: ${hereResponse.status} - ${responseText.substring(0, 300)}`);
        }
      } catch (hereError) {
        console.error('HERE Route Matching error:', hereError);
      }
    }

    // Method 2: HERE Reverse Geocode (fallback for road name + check for speed limit)
    if (hereApiKey && (!roadName || speedLimit === null)) {
      try {
        const hereUrl = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=en-US&apiKey=${encodeURIComponent(hereApiKey)}`;
        console.log(`Trying HERE Reverse Geocode...`);
        
        const hereResponse = await fetch(hereUrl);
        
        if (hereResponse.ok) {
          const hereData = await hereResponse.json();
          
          if (hereData.items?.[0]) {
            const item = hereData.items[0];
            
            if (!roadName && item.address?.street) {
              roadName = item.address.street;
              console.log(`HERE Reverse road name: ${roadName}`);
            }
          }
        } else {
          const errorText = await hereResponse.text();
          console.log(`HERE Reverse Geocode error: ${hereResponse.status} - ${errorText.substring(0, 200)}`);
        }
      } catch (hereError) {
        console.error('HERE Reverse Geocode error:', hereError);
      }
    }

    // Method 3: TomTom Reverse Geocode (fallback for road name)
    if (!roadName && tomtomApiKey) {
      try {
        const reverseUrl = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${tomtomApiKey}&radius=50`;
        console.log(`Trying TomTom Reverse Geocode...`);
        
        const reverseResponse = await fetch(reverseUrl);
        
        if (reverseResponse.ok) {
          const reverseData = await reverseResponse.json();
          
          if (reverseData.addresses?.[0]?.address) {
            const addr = reverseData.addresses[0].address;
            roadName = addr.streetName || addr.street || addr.freeformAddress || null;
            console.log(`TomTom road name: ${roadName}`);
          }
        } else {
          const errorText = await reverseResponse.text();
          console.log(`TomTom Reverse error: ${reverseResponse.status}`);
        }
      } catch (tomtomError) {
        console.error('TomTom Reverse error:', tomtomError);
      }
    }

    // Method 4: OSM Overpass - explicit maxspeed tags only (real sign data)
    if (speedLimit === null) {
      try {
        const overpassQuery = `[out:json][timeout:5];way(around:30,${lat},${lon})["highway"]["maxspeed"];out body;`;
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        console.log(`Trying OSM Overpass (maxspeed only)...`);
        
        const overpassResponse = await fetch(overpassUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json();
          console.log(`Overpass returned ${overpassData.elements?.length || 0} roads with maxspeed`);
          
          if (overpassData.elements?.[0]) {
            const road = overpassData.elements[0];
            const tags = road.tags || {};
            
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
                speedLimit = maxspeed.toLowerCase().includes('km') ? value : Math.round(value * 1.60934);
                source = 'osm';
                console.log(`OSM speed limit: ${speedLimit} km/h`);
              }
              
              // Handle "national" speed limit signs
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
        }
      } catch (osmError) {
        console.error('OSM Overpass error:', osmError);
      }
    }

    // Method 5: OSM road name fallback
    if (!roadName) {
      try {
        const overpassQuery = `[out:json][timeout:5];way(around:30,${lat},${lon})["highway"]["name"];out body 1;`;
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        console.log(`Trying OSM for road name...`);
        
        const overpassResponse = await fetch(overpassUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json();
          if (overpassData.elements?.[0]?.tags) {
            const tags = overpassData.elements[0].tags;
            roadName = tags.name || tags.ref || null;
            console.log(`OSM road name: ${roadName}`);
          }
        }
      } catch (osmError) {
        console.error('OSM road name error:', osmError);
      }
    }

    // UK Default Speed Limits: If no speed limit found but we have a road name, apply UK defaults
    if (speedLimit === null && roadName) {
      // Check for road type indicators in the name
      const lowerRoad = roadName.toLowerCase();
      const isMotorway = lowerRoad.includes('motorway') || /^m\d+/.test(lowerRoad);
      const isDualCarriageway = lowerRoad.includes('dual') || lowerRoad.includes('a road') || /^a\d+/.test(lowerRoad);
      
      if (isMotorway) {
        speedLimit = 113; // 70 mph
        source = 'osm'; // Mark as default
        console.log(`[SpeedLimit] Using UK motorway default: 70 mph (113 km/h)`);
      } else if (isDualCarriageway) {
        speedLimit = 113; // 70 mph for dual carriageways
        source = 'osm';
        console.log(`[SpeedLimit] Using UK dual carriageway default: 70 mph (113 km/h)`);
      } else {
        // Default to 30 mph for residential/urban roads with names
        speedLimit = 48; // 30 mph
        source = 'osm';
        console.log(`[SpeedLimit] Using UK residential default: 30 mph (48 km/h)`);
      }
    }

    console.log(`[SpeedLimit] LIVE Result: limit=${speedLimit} km/h, road="${roadName}", source=${source}`);

    return new Response(
      JSON.stringify({ speedLimit, roadName, source } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching speed limit:", error);
    return new Response(
      JSON.stringify({ speedLimit: null, roadName: null, source: null } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
