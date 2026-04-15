import { supabase } from "@/integrations/supabase/client";

/**
 * Auto-captures GPS points from a completed telematics session and saves them
 * as a lesson_route. Called when a telematics session stops.
 */
export async function autoCaptureLessonRoute({
  telematicsId,
  instructorId,
  pupilId,
  lessonId,
}: {
  telematicsId: string;
  instructorId: string;
  pupilId?: string | null;
  lessonId?: string | null;
}): Promise<boolean> {
  try {
    // Fetch all GPS points from the telematics session
    const { data: gpsPoints, error: fetchErr } = await supabase
      .from("telematics_gps_points")
      .select("latitude, longitude, speed_kmh, speed_limit_kmh, road_name, recorded_at")
      .eq("telematics_id", telematicsId)
      .order("recorded_at", { ascending: true });

    if (fetchErr || !gpsPoints || gpsPoints.length < 2) {
      console.log("[AutoCapture] Not enough GPS points for route:", gpsPoints?.length || 0);
      return false;
    }

    // Convert to coordinate format with speed data
    const coordinates = gpsPoints.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
      speed_kmh: p.speed_kmh,
      speed_limit_kmh: p.speed_limit_kmh,
      road_name: p.road_name,
      timestamp: p.recorded_at,
    }));

    // Sample down to max 200 points for storage
    let sampled = coordinates;
    if (coordinates.length > 200) {
      const step = Math.floor(coordinates.length / 200);
      sampled = coordinates.filter((_, i) => i % step === 0 || i === coordinates.length - 1);
    }

    // Get session metadata
    const { data: session } = await supabase
      .from("lesson_telematics")
      .select("total_distance_km, started_at, ended_at")
      .eq("id", telematicsId)
      .single();

    const startedAt = session?.started_at || sampled[0].timestamp;
    const endedAt = session?.ended_at || sampled[sampled.length - 1].timestamp;
    const durationMinutes = startedAt && endedAt
      ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
      : null;

    // Check if already captured for this telematics session
    const { data: existing } = await (supabase.from("lesson_routes") as any)
      .select("id")
      .eq("telematics_id", telematicsId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("[AutoCapture] Route already exists for session:", telematicsId);
      return false;
    }

    // Save to lesson_routes
    const { error: insertErr } = await supabase.from("lesson_routes").insert({
      instructor_id: instructorId,
      pupil_id: pupilId || null,
      lesson_id: lessonId || null,
      telematics_id: telematicsId,
      coordinates: sampled,
      distance_km: session?.total_distance_km || null,
      duration_minutes: durationMinutes,
      started_at: startedAt,
      ended_at: endedAt,
    });

    if (insertErr) {
      console.error("[AutoCapture] Insert error:", insertErr);
      return false;
    }

    console.log("[AutoCapture] Lesson route saved:", sampled.length, "points");
    return true;
  } catch (err) {
    console.error("[AutoCapture] Error:", err);
    return false;
  }
}
