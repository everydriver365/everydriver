import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpeedLimitResponse {
  speedLimit: number | null;
  roadType?: string;
  confidence?: 'high' | 'medium' | 'low';
  source?: string;
}

// UK default speed limits by road type (in km/h)
const UK_SPEED_LIMITS: Record<string, number> = {
  // Motorways - 70 mph = 113 km/h
  'motorway': 113,
  'motorway_link': 113,
  
  // Dual carriageways / A-roads - 70 mph = 113 km/h (60 mph for single carriageway)
  'trunk': 97, // 60 mph default for trunk roads
  'trunk_link': 64, // 40 mph for slip roads
  'primary': 97, // 60 mph for A-roads
  'primary_link': 64,
  
  // B-roads and other major roads - 60 mph = 97 km/h (outside built-up areas)
  'secondary': 97,
  'secondary_link': 64,
  'tertiary': 97,
  'tertiary_link': 64,
  
  // Unclassified roads - 60 mph = 97 km/h (national limit)
  'unclassified': 97,
  
  // Residential/urban - 30 mph = 48 km/h
  'residential': 48,
  'living_street': 32, // 20 mph
  'service': 32, // 20 mph
  
  // Default for unknown - 30 mph (safe assumption for built-up areas)
  'default': 48
};

// Parse speed limit from TomTom response
function parseSpeedLimit(speedLimitRaw: any): number | null {
  if (!speedLimitRaw) return null;
  
  if (typeof speedLimitRaw === 'string') {
    const match = speedLimitRaw.match(/^([\d.]+)\s*(MPH|KPH)?$/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2]?.toUpperCase() || 'MPH';
      return unit === 'MPH' ? Math.round(value * 1.60934) : Math.round(value);
    }
    const numValue = parseFloat(speedLimitRaw);
    if (!isNaN(numValue)) {
      return Math.round(numValue * 1.60934);
    }
  } else if (typeof speedLimitRaw === 'number') {
    return Math.round(speedLimitRaw * 1.60934);
  }
  
  return null;
}

// Parse OSM maxspeed tag
function parseOSMMaxspeed(maxspeed: string | undefined): number | null {
  if (!maxspeed) return null;
  
  // Handle "national" speed limit
  if (maxspeed === 'national' || maxspeed === 'GB:national') {
    return 97; // 60 mph - national speed limit for single carriageways
  }
  
  // Handle "GB:nsl_single" and "GB:nsl_dual"
  if (maxspeed === 'GB:nsl_single') return 97; // 60 mph
  if (maxspeed === 'GB:nsl_dual') return 113; // 70 mph
  
  // Handle "GB:motorway"
  if (maxspeed === 'GB:motorway') return 113; // 70 mph
  
  // Parse numeric values
  const match = maxspeed.match(/(\d+)\s*(mph|km\/h|kmh)?/i);
  if (match) {
    let speed = parseInt(match[1]);
    const unit = match[2]?.toLowerCase();
    
    // Convert mph to km/h (UK uses mph by default)
    if (!unit || unit === 'mph') {
      speed = Math.round(speed * 1.60934);
    }
    
    return speed;
  }
  
  return null;
}

// Infer speed limit from road type
function inferSpeedLimitFromRoadType(highwayType: string | undefined, inBuiltUpArea: boolean): number {
  if (!highwayType) return UK_SPEED_LIMITS.default;
  
  const type = highwayType.toLowerCase();
  
  // Check if in built-up area (reduces limit for non-residential roads)
  if (inBuiltUpArea && !['motorway', 'motorway_link', 'trunk', 'trunk_link'].includes(type)) {
    return 48; // 30 mph in built-up areas
  }
  
  return UK_SPEED_LIMITS[type] || UK_SPEED_LIMITS.default;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TOMTOM_API_KEY");
    const { lat, lon } = await req.json();

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "lat and lon are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching road info for ${lat}, ${lon}`);

    let roadName = 'Unknown Road';
    let speedLimit: number | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let source = 'inference';

    // Try TomTom first if API key is available
    if (apiKey) {
      try {
        const reverseResponse = await fetch(
          `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${apiKey}&returnSpeedLimit=true`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (reverseResponse.ok) {
          const reverseData = await reverseResponse.json();
          const address = reverseData.addresses?.[0]?.address;
          
          if (address) {
            roadName = address.streetName || address.street || address.freeformAddress?.split(',')[0] || roadName;
            const tomtomSpeed = parseSpeedLimit(address.speedLimit);
            
            if (tomtomSpeed) {
              speedLimit = tomtomSpeed;
              confidence = 'high';
              source = 'tomtom';
              console.log(`TomTom speed limit: ${speedLimit} km/h on ${roadName}`);
            }
          }
        }
      } catch (error) {
        console.error('TomTom error:', error);
      }
    }

    // If no speed limit from TomTom, try Overpass API (OSM)
    if (!speedLimit) {
      try {
        const overpassQuery = `
          [out:json][timeout:5];
          (
            way(around:30,${lat},${lon})["highway"];
          );
          out body 1;
        `;
        
        const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json();
          const way = overpassData.elements?.[0];
          
          if (way?.tags) {
            const tags = way.tags;
            
            // Get road name from OSM if we don't have it
            if (roadName === 'Unknown Road') {
              roadName = tags.name || tags.ref || 'Unknown Road';
            }
            
            // Try explicit maxspeed first
            const osmSpeed = parseOSMMaxspeed(tags.maxspeed);
            if (osmSpeed) {
              speedLimit = osmSpeed;
              confidence = 'high';
              source = 'osm';
              console.log(`OSM explicit speed limit: ${speedLimit} km/h`);
            } else {
              // Infer from road type
              const highwayType = tags.highway;
              const hasStreetLighting = tags.lit === 'yes';
              const hasSidewalk = tags.sidewalk === 'both' || tags.sidewalk === 'yes';
              const hasStreetInName = Boolean(roadName && roadName.toLowerCase().includes('street'));
              const inBuiltUpArea = hasStreetLighting || hasSidewalk || hasStreetInName;
              
              speedLimit = inferSpeedLimitFromRoadType(highwayType, inBuiltUpArea);
              confidence = inBuiltUpArea ? 'medium' : 'low';
              source = 'inference';
              
              console.log(`Inferred speed limit: ${speedLimit} km/h for ${highwayType} (built-up: ${inBuiltUpArea})`);
            }
          }
        }
      } catch (overpassError) {
        console.log("Overpass query failed:", overpassError);
      }
    }

    // Fallback to Nominatim for road name if still unknown
    if (roadName === 'Unknown Road') {
      try {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
          { headers: { 'User-Agent': 'DrivingLessonTracker/1.0' } }
        );

        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          roadName = nominatimData.address?.road || 
                    nominatimData.address?.highway || 
                    nominatimData.display_name?.split(',')[0] || 
                    'Unknown Road';
          
          // Check if address indicates built-up area and use 30mph default
          if (!speedLimit) {
            const isUrban = nominatimData.address?.city || 
                           nominatimData.address?.town || 
                           nominatimData.address?.village;
            speedLimit = isUrban ? 48 : 97; // 30 mph urban, 60 mph rural
            source = 'nominatim-inference';
          }
        }
      } catch (nominatimError) {
        console.error("Nominatim error:", nominatimError);
      }
    }

    // Final fallback - assume 30 mph if still no data
    if (!speedLimit) {
      speedLimit = 48; // 30 mph - safe default
      confidence = 'low';
      source = 'default';
    }

    console.log(`Final result: ${speedLimit} km/h on ${roadName} (${source}, ${confidence})`);

    return new Response(
      JSON.stringify({ 
        speedLimit,
        roadType: roadName,
        confidence,
        source
      } as SpeedLimitResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching road info:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        speedLimit: 48, // Default to 30 mph
        roadType: 'Unknown Road',
        confidence: 'low',
        source: 'error-default'
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
