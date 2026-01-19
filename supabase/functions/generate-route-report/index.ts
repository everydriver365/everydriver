import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GPSPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  recorded_at: string;
}

interface RoadSegment {
  name: string;
  speedLimit: number | null;
  avgSpeed: number;
  maxSpeed: number;
  compliance: 'under' | 'at' | 'over';
  startPoint: { lat: number; lon: number };
  endPoint: { lat: number; lon: number };
  points: GPSPoint[];
}

// Get TomTom API key
const TOMTOM_API_KEY = Deno.env.get("TOMTOM_API_KEY");

// Reverse geocode using TomTom (with OSM fallback)
async function getRoadName(lat: number, lon: number): Promise<string> {
  // Try TomTom first if API key is available
  if (TOMTOM_API_KEY) {
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}`,
        {
          headers: { 'Accept': 'application/json' }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.addresses?.[0]?.address;
        if (address) {
          return address.streetName || address.street || address.freeformAddress?.split(',')[0] || 'Unknown Road';
        }
      }
    } catch (error) {
      console.error('TomTom reverse geocode error:', error);
    }
  }

  // Fallback to Nominatim (OSM)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
      {
        headers: {
          'User-Agent': 'DrivingLessonTracker/1.0'
        }
      }
    );
    
    if (!response.ok) return 'Unknown Road';
    
    const data = await response.json();
    return data.address?.road || data.address?.highway || data.display_name?.split(',')[0] || 'Unknown Road';
  } catch (error) {
    console.error('Nominatim error:', error);
    return 'Unknown Road';
  }
}

// Get speed limit using TomTom API (with Overpass fallback)
async function getSpeedLimit(lat: number, lon: number): Promise<number | null> {
  // Try TomTom first if API key is available
  if (TOMTOM_API_KEY) {
    try {
      // TomTom Reverse Geocode with speed limit
      const response = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}&returnSpeedLimit=true`,
        {
          headers: { 'Accept': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.addresses?.[0]?.address;
        const speedLimit = address?.speedLimit;
        
        if (speedLimit) {
          // TomTom returns speed in local units (mph for UK)
          // Convert mph to km/h
          const speedKmh = Math.round(speedLimit * 1.60934);
          console.log(`TomTom speed limit: ${speedLimit} mph = ${speedKmh} km/h`);
          return speedKmh;
        }
      }
    } catch (error) {
      console.error('TomTom speed limit error:', error);
    }
  }

  // Fallback to Overpass API
  try {
    const query = `
      [out:json][timeout:10];
      way(around:30,${lat},${lon})["highway"]["maxspeed"];
      out body;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.elements && data.elements.length > 0) {
      const maxspeed = data.elements[0].tags?.maxspeed;
      if (maxspeed) {
        // Parse speed limit (can be "30", "30 mph", "national", etc.)
        const match = maxspeed.match(/(\d+)/);
        if (match) {
          let speed = parseInt(match[1]);
          // Convert mph to km/h if needed (UK uses mph)
          if (maxspeed.includes('mph') || (!maxspeed.includes('km') && speed <= 70)) {
            speed = Math.round(speed * 1.60934);
          }
          return speed;
        }
        // Handle "national" speed limit (UK national limit)
        if (maxspeed === 'national') {
          return 97; // 60 mph in km/h (single carriageway default)
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Overpass error:', error);
    return null;
  }
}

// Sample points evenly along the route
function samplePoints(points: GPSPoint[], maxSamples: number): GPSPoint[] {
  if (points.length <= maxSamples) return points;
  
  const step = Math.floor(points.length / maxSamples);
  const sampled: GPSPoint[] = [];
  
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  
  // Always include the last point
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }
  
  return sampled;
}

// Group points into road segments
function groupIntoSegments(points: GPSPoint[], roadData: { name: string; speedLimit: number | null }[]): RoadSegment[] {
  const segments: RoadSegment[] = [];
  let currentSegment: RoadSegment | null = null;
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const roadInfo = roadData[i] || { name: 'Unknown Road', speedLimit: null };
    
    if (!currentSegment || currentSegment.name !== roadInfo.name) {
      // Start new segment
      if (currentSegment && currentSegment.points.length > 0) {
        // Calculate stats for completed segment
        const speeds = currentSegment.points.map(p => p.speed_kmh || 0).filter(s => s > 0);
        currentSegment.avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
        currentSegment.maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
        currentSegment.endPoint = {
          lat: currentSegment.points[currentSegment.points.length - 1].latitude,
          lon: currentSegment.points[currentSegment.points.length - 1].longitude
        };
        
        // Determine compliance
        if (currentSegment.speedLimit) {
          if (currentSegment.maxSpeed > currentSegment.speedLimit + 5) {
            currentSegment.compliance = 'over';
          } else if (currentSegment.maxSpeed >= currentSegment.speedLimit - 5) {
            currentSegment.compliance = 'at';
          } else {
            currentSegment.compliance = 'under';
          }
        } else {
          currentSegment.compliance = 'under'; // Default to under if no limit known
        }
        
        segments.push(currentSegment);
      }
      
      currentSegment = {
        name: roadInfo.name,
        speedLimit: roadInfo.speedLimit,
        avgSpeed: 0,
        maxSpeed: 0,
        compliance: 'under',
        startPoint: { lat: point.latitude, lon: point.longitude },
        endPoint: { lat: point.latitude, lon: point.longitude },
        points: []
      };
    }
    
    currentSegment.points.push(point);
  }
  
  // Don't forget the last segment
  if (currentSegment && currentSegment.points.length > 0) {
    const speeds = currentSegment.points.map(p => p.speed_kmh || 0).filter(s => s > 0);
    currentSegment.avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    currentSegment.maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    currentSegment.endPoint = {
      lat: currentSegment.points[currentSegment.points.length - 1].latitude,
      lon: currentSegment.points[currentSegment.points.length - 1].longitude
    };
    
    if (currentSegment.speedLimit) {
      if (currentSegment.maxSpeed > currentSegment.speedLimit + 5) {
        currentSegment.compliance = 'over';
      } else if (currentSegment.maxSpeed >= currentSegment.speedLimit - 5) {
        currentSegment.compliance = 'at';
      } else {
        currentSegment.compliance = 'under';
      }
    }
    
    segments.push(currentSegment);
  }
  
  return segments;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telematicsId } = await req.json();

    if (!telematicsId) {
      return new Response(
        JSON.stringify({ error: "telematicsId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log which API is being used
    console.log(`Using ${TOMTOM_API_KEY ? 'TomTom' : 'Overpass/Nominatim'} for road data`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch session details with retry for transient schema cache errors
    let session = null;
    let sessionError = null;
    const maxRetries = 5;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await supabase
        .from("lesson_telematics")
        .select("*")
        .eq("id", telematicsId)
        .maybeSingle();
      
      if (!result.error) {
        session = result.data;
        break;
      }
      
      // If it's a schema cache error, retry after a brief delay
      if (result.error.message.includes("schema cache")) {
        console.log(`Schema cache error, retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        continue;
      }
      
      sessionError = result.error;
      break;
    }

    if (sessionError) {
      console.error("Session query error:", sessionError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "database_error", 
          message: "The database is temporarily unavailable. Please try again in a moment.",
          details: sessionError.message 
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch pupil name separately if pupil_id exists
    let pupilName = 'Unknown';
    if (session.pupil_id) {
      const { data: pupil } = await supabase
        .from("pupils")
        .select("name")
        .eq("id", session.pupil_id)
        .maybeSingle();
      
      if (pupil) {
        pupilName = pupil.name;
      }
    }

    // Fetch all GPS points
    const { data: gpsPoints, error: gpsError } = await supabase
      .from("telematics_gps_points")
      .select("latitude, longitude, speed_kmh, recorded_at")
      .eq("telematics_id", telematicsId)
      .order("recorded_at", { ascending: true });

    if (gpsError || !gpsPoints || gpsPoints.length === 0) {
      console.log(`No GPS points found for session ${telematicsId}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "insufficient_gps_data",
          message: "No GPS data was recorded for this session. This can happen if location permission was denied, GPS signal was poor, or the tracking session was too short.",
          pointsRecorded: gpsPoints?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Need minimum points for meaningful route analysis
    if (gpsPoints.length < 5) {
      console.log(`Insufficient GPS points (${gpsPoints.length}) for session ${telematicsId}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "insufficient_gps_data",
          message: `Only ${gpsPoints.length} GPS points were recorded. At least 5 points are needed for route analysis. Try tracking for longer with a good GPS signal.`,
          pointsRecorded: gpsPoints.length
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${gpsPoints.length} GPS points for session ${telematicsId}`);

    // Sample points for API calls (max 20 to avoid rate limiting)
    const sampledPoints = samplePoints(gpsPoints, 20);
    console.log(`Sampled ${sampledPoints.length} points for road data lookup`);

    // Fetch road names and speed limits for sampled points
    const roadData: { name: string; speedLimit: number | null }[] = [];
    
    for (const point of sampledPoints) {
      // Add small delay to avoid rate limiting (TomTom has higher limits than OSM)
      await new Promise(resolve => setTimeout(resolve, TOMTOM_API_KEY ? 100 : 200));
      
      const [name, speedLimit] = await Promise.all([
        getRoadName(point.latitude, point.longitude),
        getSpeedLimit(point.latitude, point.longitude)
      ]);
      
      roadData.push({ name, speedLimit });
      console.log(`Road: ${name}, Speed limit: ${speedLimit} km/h`);
    }

    // Group sampled points into segments
    const segments = groupIntoSegments(sampledPoints, roadData);
    console.log(`Created ${segments.length} road segments`);

    // Calculate overall statistics
    const allSpeeds = gpsPoints.map(p => p.speed_kmh || 0).filter(s => s > 0);
    const overallStats = {
      totalPoints: gpsPoints.length,
      distance: session.total_distance_km,
      avgSpeed: session.avg_speed_kmh,
      maxSpeed: session.max_speed_kmh,
      duration: session.ended_at && session.started_at 
        ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
        : null,
      speedingIncidents: segments.filter(s => s.compliance === 'over').length,
      roadsVisited: [...new Set(segments.map(s => s.name))].length
    };

    // Get start and end locations
    const startPoint = gpsPoints[0];
    const endPoint = gpsPoints[gpsPoints.length - 1];
    const [startLocation, endLocation] = await Promise.all([
      getRoadName(startPoint.latitude, startPoint.longitude),
      getRoadName(endPoint.latitude, endPoint.longitude)
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          id: session.id,
          pupilName,
          startedAt: session.started_at,
          endedAt: session.ended_at,
          startLocation,
          endLocation
        },
        stats: overallStats,
        segments,
        route: gpsPoints.map(p => ({ lat: p.latitude, lon: p.longitude, speed: p.speed_kmh }))
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating route report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
