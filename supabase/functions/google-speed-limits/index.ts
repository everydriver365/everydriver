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

    // Method 1: HERE Route Matching API (primary - most accurate speed limits)
    if (hereApiKey) {
      try {
        // Use same point twice for single-point matching
        const hereUrl = `https://routematching.hereapi.com/v8/match/routelinks?apikey=${hereApiKey}&waypoint0=${lat},${lon}&waypoint1=${lat},${lon}&mode=fastest;car&routeMatch=1&attributes=SPEED_LIMITS_FCn(*)`;
        console.log(`Trying HERE Route Matching API...`);
        
        const hereResponse = await fetch(hereUrl);
        const responseText = await hereResponse.text();
        
        if (hereResponse.ok) {
          const hereData = JSON.parse(responseText);
          console.log(`HERE response status: ${hereResponse.status}`);
          
          // Parse route links for speed limit data
          if (hereData.response?.route?.[0]?.leg?.[0]?.link) {
            const links = hereData.response.route[0].leg[0].link;
            
            for (const link of links) {
              // Get road name
              if (!roadName && link.roadName) {
                roadName = link.roadName;
                console.log(`HERE road name: ${roadName}`);
              }
              
              // Get speed limit from SPEED_LIMITS_FCn attributes
              if (speedLimit === null && link.attributes?.SPEED_LIMITS_FCn) {
                const speedLimits = link.attributes.SPEED_LIMITS_FCn;
                // Speed limits are in km/h, find the first valid one
                for (const sl of speedLimits) {
                  if (sl.FROM_REF_SPEED_LIMIT) {
                    speedLimit = sl.FROM_REF_SPEED_LIMIT;
                    source = 'here';
                    console.log(`HERE speed limit: ${speedLimit} km/h`);
                    break;
                  }
                  if (sl.TO_REF_SPEED_LIMIT) {
                    speedLimit = sl.TO_REF_SPEED_LIMIT;
                    source = 'here';
                    console.log(`HERE speed limit: ${speedLimit} km/h`);
                    break;
                  }
                }
              }
              
              // Stop if we have both
              if (speedLimit !== null && roadName) break;
            }
          }
        } else {
          console.log(`HERE API error: ${hereResponse.status} - ${responseText}`);
        }
      } catch (hereError) {
        console.error('HERE API error:', hereError);
      }
    }

    // Method 1: TomTom Snap to Roads API (map-matching with speed limits)
    if (tomtomApiKey) {
      try {
        // Use POST for Snap to Roads with fields parameter
        const snapUrl = `https://api.tomtom.com/snap/1/synchronous?key=${tomtomApiKey}`;
        console.log(`Trying TomTom Snap to Roads API...`);
        
        const snapBody = {
          points: [
            {
              latitude: lat,
              longitude: lon
            }
          ],
          fields: {
            snappedPoints: [
              "speedLimit",
              "road"
            ]
          }
        };
        
        const snapResponse = await fetch(snapUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(snapBody)
        });
        
        const responseText = await snapResponse.text();
        
        if (snapResponse.ok) {
          const snapData = JSON.parse(responseText);
          console.log(`TomTom Snap response:`, JSON.stringify(snapData));
          
          if (snapData.snappedPoints && snapData.snappedPoints.length > 0) {
            const point = snapData.snappedPoints[0];
            
            // Get speed limit (TomTom returns in km/h)
            if (point.speedLimit !== undefined && point.speedLimit !== null) {
              speedLimit = point.speedLimit;
              source = 'tomtom';
              console.log(`TomTom: speed limit = ${speedLimit} km/h`);
            }
            
            // Get road name from road object
            if (point.road) {
              roadName = point.road.name || point.road.shieldInfo?.label || null;
              console.log(`TomTom road name: ${roadName}`);
            }
          }
        } else {
          console.log(`TomTom Snap API error: ${snapResponse.status} - ${responseText}`);
        }
      } catch (tomtomError) {
        console.error('TomTom Snap API error:', tomtomError);
      }
    }

    // Method 2: TomTom Reverse Geocode fallback for road name
    if (!roadName && tomtomApiKey) {
      try {
        const reverseUrl = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${tomtomApiKey}&radius=50`;
        console.log(`Trying TomTom Reverse Geocode for road name...`);
        
        const reverseResponse = await fetch(reverseUrl);
        
        if (reverseResponse.ok) {
          const reverseData = await reverseResponse.json();
          
          if (reverseData.addresses && reverseData.addresses.length > 0) {
            const addr = reverseData.addresses[0].address;
            roadName = addr.streetName || addr.street || addr.freeformAddress || null;
            console.log(`TomTom Reverse road name: ${roadName}`);
          }
        }
      } catch (reverseError) {
        console.error('TomTom Reverse Geocode error:', reverseError);
      }
    }

    // Method 3: OSM Overpass - only for EXPLICIT maxspeed tags (real sign data)
    if (speedLimit === null) {
      try {
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

    // Method 4: Get road name from OSM if still missing
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
