import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GPSGateTripInfo {
  Id?: number;
  id?: number;
  Name?: string;
  name?: string;
  StartUtc?: string;
  startUtc?: string;
  EndUtc?: string;
  endUtc?: string;
  Distance?: number;  // Distance in meters
  distance?: number;
  MaxSpeed?: number;  // Speed in km/h
  maxSpeed?: number;
  AverageSpeed?: number;
  averageSpeed?: number;
  Duration?: number;  // Duration in seconds
  duration?: number;
  StartPosition?: { Lat: number; Lng: number };
  startPosition?: { latitude: number; longitude: number };
  EndPosition?: { Lat: number; Lng: number };
  endPosition?: { latitude: number; longitude: number };
  SpeedingDistance?: number;
  speedingDistance?: number;
  SpeedingTime?: number;
  speedingTime?: number;
  SpeedingMaxExcess?: number;
  speedingMaxExcess?: number;
}

interface TripSummary {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  speedingDistanceKm: number;
  speedingTimeMinutes: number;
  speedingMaxExcessKmh: number;
  hasOverspeeding: boolean;
}

function normalizeTripInfo(raw: any): TripSummary | null {
  const id = raw?.Id ?? raw?.id;
  const name = raw?.Name ?? raw?.name ?? "Trip";
  const startUtc = raw?.StartUtc ?? raw?.startUtc;
  const endUtc = raw?.EndUtc ?? raw?.endUtc;
  const distance = raw?.Distance ?? raw?.distance ?? 0;
  const duration = raw?.Duration ?? raw?.duration ?? 0;
  const maxSpeed = raw?.MaxSpeed ?? raw?.maxSpeed ?? 0;
  const avgSpeed = raw?.AverageSpeed ?? raw?.averageSpeed ?? 0;
  
  // Handle different position formats
  let startLat: number | null = null;
  let startLng: number | null = null;
  let endLat: number | null = null;
  let endLng: number | null = null;
  
  if (raw?.StartPosition) {
    startLat = raw.StartPosition.Lat ?? raw.StartPosition.latitude ?? null;
    startLng = raw.StartPosition.Lng ?? raw.StartPosition.longitude ?? null;
  } else if (raw?.startPosition) {
    startLat = raw.startPosition.Lat ?? raw.startPosition.latitude ?? null;
    startLng = raw.startPosition.Lng ?? raw.startPosition.longitude ?? null;
  }
  
  if (raw?.EndPosition) {
    endLat = raw.EndPosition.Lat ?? raw.EndPosition.latitude ?? null;
    endLng = raw.EndPosition.Lng ?? raw.EndPosition.longitude ?? null;
  } else if (raw?.endPosition) {
    endLat = raw.endPosition.Lat ?? raw.endPosition.latitude ?? null;
    endLng = raw.endPosition.Lng ?? raw.endPosition.longitude ?? null;
  }
  
  // Speeding data
  const speedingDistance = raw?.SpeedingDistance ?? raw?.speedingDistance ?? 0;
  const speedingTime = raw?.SpeedingTime ?? raw?.speedingTime ?? 0;
  const speedingMaxExcess = raw?.SpeedingMaxExcess ?? raw?.speedingMaxExcess ?? 0;
  
  if (!startUtc || !endUtc) return null;
  
  return {
    id: String(id ?? Date.now()),
    name,
    startTime: startUtc,
    endTime: endUtc,
    distanceKm: distance / 1000,  // Convert meters to km
    durationMinutes: duration / 60,  // Convert seconds to minutes
    avgSpeedKmh: avgSpeed,
    maxSpeedKmh: maxSpeed,
    startLat,
    startLng,
    endLat,
    endLng,
    speedingDistanceKm: speedingDistance / 1000,
    speedingTimeMinutes: speedingTime / 60,
    speedingMaxExcessKmh: speedingMaxExcess,
    hasOverspeeding: speedingTime > 0 || speedingDistance > 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GPSGATE_URL_RAW = Deno.env.get("GPSGATE_SERVER_URL");
    const GPSGATE_APP_ID = Deno.env.get("GPSGATE_APP_ID");
    const GPSGATE_TOKEN = Deno.env.get("GPSGATE_API_TOKEN");

    if (!GPSGATE_URL_RAW || !GPSGATE_APP_ID || !GPSGATE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "GPSgate configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse base URL
    let GPSGATE_URL = GPSGATE_URL_RAW.trim();
    if (GPSGATE_URL.endsWith("/")) {
      GPSGATE_URL = GPSGATE_URL.slice(0, -1);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get instructor ID from request or JWT
    const authHeader = req.headers.get("Authorization");
    let instructorId: string | null = null;

    // Try to get instructor from body
    let body: any = {};
    try {
      body = await req.json();
      instructorId = body.instructorId;
    } catch {
      // No body
    }

    // If no instructor in body, get from JWT
    if (!instructorId && authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        const { data: instructor } = await supabase
          .from("instructors")
          .select("id")
          .eq("user_id", user.id)
          .single();
        instructorId = instructor?.id;
      }
    }

    if (!instructorId) {
      return new Response(
        JSON.stringify({ error: "Instructor not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get GPSgate user ID from instructor's gps_devices
    const { data: device, error: deviceError } = await supabase
      .from("gps_devices")
      .select("gpsgate_user_id")
      .eq("instructor_id", instructorId)
      .not("gpsgate_user_id", "is", null)
      .limit(1)
      .single();

    if (deviceError || !device?.gpsgate_user_id) {
      return new Response(
        JSON.stringify({ error: "GPSgate user not configured. Please link your GPSgate User ID in GPS Setup.", trips: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gpsGateUserId = device.gpsgate_user_id;

    // Parse date range from body (default: last 7 days)
    const fromDate = body.fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = body.toDate || new Date().toISOString();
    const syncToMileage = body.syncToMileage === true;
    const pupilId = body.pupilId || null;

    // Fetch trip infos from GPSgate
    const tripInfosUrl = `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserId}/tripinfos?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
    
    console.log(`[GPSgate-Trips] Fetching trips for user ${gpsGateUserId}: ${tripInfosUrl}`);

    const response = await fetch(tripInfosUrl, {
      method: "GET",
      headers: {
        "Authorization": GPSGATE_TOKEN,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPSgate-Trips] API error ${response.status}: ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch trips from GPSgate", details: errorText, trips: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawTrips = await response.json();
    console.log(`[GPSgate-Trips] Raw response:`, JSON.stringify(rawTrips).slice(0, 500));

    // Handle array or single trip response
    const tripsArray = Array.isArray(rawTrips) ? rawTrips : [rawTrips];
    
    // Normalize and filter valid trips
    const trips: TripSummary[] = tripsArray
      .map(normalizeTripInfo)
      .filter((t): t is TripSummary => t !== null)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    console.log(`[GPSgate-Trips] Returning ${trips.length} trips`);

    // Optionally sync trips to mileage_logs
    let syncedCount = 0;
    if (syncToMileage && trips.length > 0) {
      for (const trip of trips) {
        // Check if already synced (by checking for similar date/distance)
        const tripDate = new Date(trip.startTime).toISOString().split('T')[0];
        
        const { data: existing } = await supabase
          .from("mileage_logs")
          .select("id")
          .eq("instructor_id", instructorId)
          .eq("log_date", tripDate)
          .gte("distance_km", trip.distanceKm - 0.1)
          .lte("distance_km", trip.distanceKm + 0.1)
          .limit(1);

        if (!existing || existing.length === 0) {
          // Insert new mileage log
          const { error: insertError } = await supabase
            .from("mileage_logs")
            .insert({
              instructor_id: instructorId,
              pupil_id: pupilId,
              log_date: tripDate,
              distance_km: trip.distanceKm,
              trip_type: pupilId ? "business" : "personal",
              purpose: trip.name || "GPSgate tracked trip",
              is_auto_logged: true,
            });

          if (!insertError) {
            syncedCount++;
          } else {
            console.error(`[GPSgate-Trips] Failed to insert trip ${trip.id}:`, insertError);
          }
        }
      }
      console.log(`[GPSgate-Trips] Synced ${syncedCount} trips to mileage_logs`);
    }

    return new Response(
      JSON.stringify({ 
        trips,
        meta: {
          fromDate,
          toDate,
          totalTrips: trips.length,
          totalDistanceKm: trips.reduce((sum, t) => sum + t.distanceKm, 0),
          totalDurationMinutes: trips.reduce((sum, t) => sum + t.durationMinutes, 0),
          tripsWithOverspeeding: trips.filter(t => t.hasOverspeeding).length,
          syncedCount,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[GPSgate-Trips] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error), trips: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
