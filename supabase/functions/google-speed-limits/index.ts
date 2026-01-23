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

    // Method 1: HERE Route Matching API (primary - accurate speed limits)
    if (hereApiKey && speedLimit === null) {
      try {
        // Create a small offset for second waypoint (about 10 meters)
        const offset = 0.0001;
        const lat2 = lat + offset;
        const lon2 = lon + offset;
        
        const hereUrl = `https://routematching.hereapi.com/v8/match/routelinks?apikey=${hereApiKey}&waypoint0=${lat},${lon}&waypoint1=${lat2},${lon2}&mode=fastest;car&routeMatch=1&attributes=SPEED_LIMITS_FCn(*)`;
        console.log(`Trying HERE Route Matching API...`);
        
        const hereResponse = await fetch(hereUrl);
        const responseText = await hereResponse.text();
        
        if (hereResponse.ok) {
          const hereData = JSON.parse(responseText);
          console.log(`HERE Route Matching response received`);
          
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
                  const limit = sl.FROM_REF_SPEED_LIMIT || sl.TO_REF_SPEED_LIMIT;
                  if (limit && limit > 0) {
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
          console.log(`HERE Route Matching error: ${hereResponse.status} - ${responseText.substring(0, 200)}`);
        }
      } catch (hereError) {
        console.error('HERE Route Matching error:', hereError);
      }
    }

    // Method 2: HERE Reverse Geocode (fallback for road name)
    if (!roadName && hereApiKey) {
      try {
        const hereUrl = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=en-US&apiKey=${hereApiKey}`;
        console.log(`Trying HERE Reverse Geocode for road name...`);
        
        const hereResponse = await fetch(hereUrl);
        
        if (hereResponse.ok) {
          const hereData = await hereResponse.json();
          
          if (hereData.items?.[0]?.address?.street) {
            roadName = hereData.items[0].address.street;
            console.log(`HERE Reverse road name: ${roadName}`);
          }
        }
      } catch (hereError) {
        console.error('HERE Reverse Geocode error:', hereError);
      }
    }

    // Method 3: TomTom Snap to Roads API (fallback)
    if (speedLimit === null && tomtomApiKey) {
      try {
        const snapUrl = `https://api.tomtom.com/snap/1/synchronous?key=${tomtomApiKey}`;
        console.log(`Trying TomTom Snap to Roads API...`);
        
        const snapBody = {
          points: [{ latitude: lat, longitude: lon }],
          fields: {
            snappedPoints: ["speedLimit", "road"]
          }
        };
        
        const snapResponse = await fetch(snapUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapBody)
        });
        
        if (snapResponse.ok) {
          const snapData = await snapResponse.json();
          
          if (snapData.snappedPoints?.[0]) {
            const point = snapData.snappedPoints[0];
            
            if (point.speedLimit !== undefined && point.speedLimit !== null) {
              speedLimit = point.speedLimit;
              source = 'tomtom';
              console.log(`TomTom speed limit: ${speedLimit} km/h`);
            }
            
            if (!roadName && point.road?.name) {
              roadName = point.road.name;
              console.log(`TomTom road name: ${roadName}`);
            }
          }
        } else {
          const errorText = await snapResponse.text();
          console.log(`TomTom Snap error: ${snapResponse.status} - ${errorText.substring(0, 200)}`);
        }
      } catch (tomtomError) {
        console.error('TomTom Snap error:', tomtomError);
      }
    }

    // Method 4: TomTom Reverse Geocode (fallback for road name)
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
            console.log(`TomTom Reverse road name: ${roadName}`);
          }
        }
      } catch (reverseError) {
        console.error('TomTom Reverse error:', reverseError);
      }
    }

    // Method 5: OSM Overpass - explicit maxspeed tags only
    if (speedLimit === null) {
      try {
        const overpassQuery = `[out:json][timeout:5];way(around:25,${lat},${lon})["highway"]["maxspeed"];out body;`;
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

    // Method 6: OSM road name fallback
    if (!roadName) {
      try {
        const overpassQuery = `[out:json][timeout:5];way(around:25,${lat},${lon})["highway"]["name"];out body 1;`;
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
