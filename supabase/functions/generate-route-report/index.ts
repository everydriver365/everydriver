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
  road_name: string | null;
  speed_limit_kmh: number | null;
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

// Reverse geocode using TomTom (with OSM fallback) - only used for events and start/end locations
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

// Haversine distance in metres
function distMetres(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Drop GPS outliers that produce the classic "squiggle / spike" trip map:
 *  - implausible teleports (>55 m/s ≈ 198 km/h between successive fixes)
 *  - sub-3 m jitter while effectively stationary
 *  - leading/trailing isolated points that sit far from the route's median
 */
function cleanGpsPoints(points: GPSPoint[]): GPSPoint[] {
  if (points.length < 3) return points;

  // 1) Teleport / jitter pass — sequential
  const cleaned: GPSPoint[] = [];
  let prev: GPSPoint | null = null;
  let prevT = 0;
  for (const p of points) {
    const t = new Date(p.recorded_at).getTime();
    if (!prev) {
      cleaned.push(p); prev = p; prevT = t; continue;
    }
    const dt = Math.max(0.5, (t - prevT) / 1000); // seconds
    const d = distMetres(prev.latitude, prev.longitude, p.latitude, p.longitude);
    const speedMs = d / dt;
    // Implausible teleport — drop the point entirely.
    if (speedMs > 55) continue;
    // Sub-3 m jitter while effectively stationary — drop.
    if (d < 3 && (p.speed_kmh ?? 0) < 3) continue;
    cleaned.push(p);
    prev = p;
    prevT = t;
  }

  // 2) Median-based outlier trim on the head/tail (the start dot in the
  //    screenshot was south of the actual route — kill those).
  if (cleaned.length > 20) {
    const lats = cleaned.map(p => p.latitude).slice().sort((a, b) => a - b);
    const lons = cleaned.map(p => p.longitude).slice().sort((a, b) => a - b);
    const medLat = lats[Math.floor(lats.length / 2)];
    const medLon = lons[Math.floor(lons.length / 2)];
    const isFar = (p: GPSPoint) =>
      distMetres(medLat, medLon, p.latitude, p.longitude) > 8000; // >8km from median
    while (cleaned.length && isFar(cleaned[0])) cleaned.shift();
    while (cleaned.length && isFar(cleaned[cleaned.length - 1])) cleaned.pop();
  }

  return cleaned;
}

// Group points into road segments using stored road data
function groupIntoSegments(points: GPSPoint[]): RoadSegment[] {
  const segments: RoadSegment[] = [];
  let currentSegment: RoadSegment | null = null;
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const roadName = point.road_name || 'Unknown Road';
    const speedLimit = point.speed_limit_kmh;
    
    if (!currentSegment || currentSegment.name !== roadName) {
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
        name: roadName,
        speedLimit: speedLimit,
        avgSpeed: 0,
        maxSpeed: 0,
        compliance: 'under',
        startPoint: { lat: point.latitude, lon: point.longitude },
        endPoint: { lat: point.latitude, lon: point.longitude },
        points: []
      };
    }
    
    // Update speed limit if this point has one and current segment doesn't
    if (speedLimit && !currentSegment.speedLimit) {
      currentSegment.speedLimit = speedLimit;
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

    console.log(`Generating route report for session ${telematicsId}`);

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

    // Fetch all GPS points including road_name and speed_limit_kmh
    const { data: gpsPoints, error: gpsError } = await supabase
      .from("telematics_gps_points")
      .select("latitude, longitude, speed_kmh, recorded_at, road_name, speed_limit_kmh")
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

    // Filter out GPS spikes / jitter / teleports so the trip map polyline
    // and stats don't show squiggles or random shoot-out lines.
    const rawCount = gpsPoints.length;
    const filtered = cleanGpsPoints(gpsPoints as GPSPoint[]);
    console.log(`Cleaned GPS points: ${rawCount} → ${filtered.length}`);
    // Reassign so the rest of the pipeline (segments / stats / route) uses
    // the cleaned series.
    (gpsPoints as any).length = 0;
    (gpsPoints as any).push(...filtered);

    console.log(`Processing ${gpsPoints.length} GPS points for session ${telematicsId}`);

    // Check if we have stored road data
    const hasStoredRoadData = gpsPoints.some(p => p.road_name || p.speed_limit_kmh);
    console.log(`Has stored road data: ${hasStoredRoadData}`);

    // Group points into segments using stored road data
    const segments = groupIntoSegments(gpsPoints as GPSPoint[]);
    console.log(`Created ${segments.length} road segments`);

    // If no stored road data, we need to fetch it for sampled points (legacy support)
    if (!hasStoredRoadData && segments.length > 0) {
      console.log("No stored road data found, fetching for sampled points...");
      const sampledPoints = samplePoints(gpsPoints as GPSPoint[], 10);
      
      for (const point of sampledPoints) {
        if (!point.road_name) {
          await new Promise(resolve => setTimeout(resolve, 200));
          const roadName = await getRoadName(point.latitude, point.longitude);
          point.road_name = roadName;
        }
      }
      
      // Re-group with fetched road data
      const updatedSegments = groupIntoSegments(sampledPoints);
      segments.length = 0;
      segments.push(...updatedSegments);
    }

    // Fetch driving behavior events
    const { data: drivingEvents, error: eventsError } = await supabase
      .from("driving_behavior_events")
      .select("*")
      .eq("telematics_id", telematicsId)
      .order("recorded_at", { ascending: true });

    if (eventsError) {
      console.error("Error fetching driving events:", eventsError);
    }

    // Enrich events with road names (fetch only for events, not all points)
    const enrichedEvents = [];
    if (drivingEvents && drivingEvents.length > 0) {
      for (const event of drivingEvents) {
        let roadName = 'Unknown location';
        if (event.latitude && event.longitude) {
          // Find nearest GPS point with road name
          const nearestPoint = gpsPoints.find(p => 
            Math.abs(p.latitude - event.latitude) < 0.0005 && 
            Math.abs(p.longitude - event.longitude) < 0.0005 &&
            p.road_name
          );
          
          if (nearestPoint?.road_name) {
            roadName = nearestPoint.road_name;
          } else {
            // Fallback to API call only if no stored data
            roadName = await getRoadName(event.latitude, event.longitude);
          }
        }
        enrichedEvents.push({
          id: event.id,
          type: event.event_type,
          severity: event.severity,
          location: roadName,
          latitude: event.latitude,
          longitude: event.longitude,
          speedAtEvent: event.speed_at_event,
          gForce: event.g_force,
          notes: event.notes,
          recordedAt: event.recorded_at
        });
      }
    }

    // Calculate overall statistics from GPS points (fallback if session values are null)
    const allSpeeds = gpsPoints.map(p => p.speed_kmh || 0).filter(s => s > 0);
    const calculatedAvgSpeed = allSpeeds.length > 0 
      ? allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length 
      : null;
    const calculatedMaxSpeed = allSpeeds.length > 0 
      ? Math.max(...allSpeeds) 
      : null;
    
    const overallStats = {
      totalPoints: gpsPoints.length,
      distance: session.total_distance_km,
      avgSpeed: session.avg_speed_kmh ?? calculatedAvgSpeed,
      maxSpeed: session.max_speed_kmh ?? calculatedMaxSpeed,
      duration: session.ended_at && session.started_at 
        ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
        : null,
      speedingIncidents: segments.filter(s => s.compliance === 'over').length,
      roadsVisited: [...new Set(segments.map(s => s.name))].length,
      eventCount: enrichedEvents.length,
      harshBrakingCount: enrichedEvents.filter(e => e.type === 'harsh_brake').length,
      harshAccelerationCount: enrichedEvents.filter(e => e.type === 'harsh_acceleration').length,
      sharpTurnCount: enrichedEvents.filter(e => e.type === 'sharp_turn').length
    };

    // Get start and end locations from stored data or API
    const startPoint = gpsPoints[0];
    const endPoint = gpsPoints[gpsPoints.length - 1];
    
    let startLocation = startPoint.road_name || await getRoadName(startPoint.latitude, startPoint.longitude);
    let endLocation = endPoint.road_name || await getRoadName(endPoint.latitude, endPoint.longitude);

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
        segments: segments.map(s => ({
          name: s.name,
          speedLimit: s.speedLimit,
          avgSpeed: s.avgSpeed,
          maxSpeed: s.maxSpeed,
          compliance: s.compliance,
          startPoint: s.startPoint,
          endPoint: s.endPoint
        })),
        events: enrichedEvents,
        route: gpsPoints.map(p => ({ 
          lat: p.latitude, 
          lon: p.longitude, 
          speed: p.speed_kmh,
          recordedAt: p.recorded_at,
          speedLimit: p.speed_limit_kmh,
          roadName: p.road_name
        }))
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
