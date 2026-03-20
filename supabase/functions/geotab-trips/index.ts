import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GeotabSession {
  sessionId: string;
  serverUrl: string;
  expiresAt: number;
}

let cachedSession: GeotabSession | null = null;

async function authenticate(): Promise<GeotabSession> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

  const database = Deno.env.get("GEOTAB_DATABASE");
  const username = Deno.env.get("GEOTAB_USERNAME");
  const password = Deno.env.get("GEOTAB_PASSWORD");

  if (!database || !username || !password) {
    throw new Error("Geotab credentials not configured");
  }

  const res = await fetch("https://my.geotab.com/apiv1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "Authenticate",
      params: { database, userName: username, password },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab auth failed: ${data.error.message}`);

  const { credentials, path } = data.result;
  const resolvedPath =
    !path || path.toLowerCase() === "thisserver" ? "my.geotab.com" : path;

  cachedSession = {
    sessionId: credentials.sessionId,
    serverUrl: `https://${resolvedPath}/apiv1`,
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

  return cachedSession;
}

async function geotabCall(
  session: GeotabSession,
  method: string,
  params: Record<string, unknown>
) {
  const res = await fetch(session.serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method,
      params: {
        ...params,
        credentials: {
          sessionId: session.sessionId,
          database: Deno.env.get("GEOTAB_DATABASE"),
          userName: Deno.env.get("GEOTAB_USERNAME"),
        },
      },
    }),
  });

  const data = await res.json();
  if (data.error)
    throw new Error(`Geotab ${method} failed: ${data.error.message}`);
  return data.result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { instructorId, fromDate, toDate } = await req.json();

    // If instructorId provided, verify ownership or admin
    let targetInstructorId = instructorId;
    if (!targetInstructorId) {
      // Resolve from auth user
      const { data: inst } = await supabase
        .from("instructors")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();
      if (inst) targetInstructorId = inst.id;
    }

    if (!targetInstructorId) {
      return new Response(
        JSON.stringify({ error: "No instructor found for user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Geotab devices for this instructor
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: devices, error: devErr } = await adminClient
      .from("gps_devices")
      .select("id, geotab_device_id, device_name")
      .eq("instructor_id", targetInstructorId)
      .eq("tracking_provider", "geotab")
      .not("geotab_device_id", "is", null);

    if (devErr) throw devErr;
    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ trips: [], meta: null, message: "No Geotab devices" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await authenticate();

    // Resolve serial numbers to internal IDs
    const geotabDevices = await geotabCall(session, "Get", {
      typeName: "Device",
    });
    const serialToInternal = new Map<string, string>();
    for (const gd of geotabDevices || []) {
      if (gd.serialNumber) {
        serialToInternal.set(gd.serialNumber, gd.id);
      }
    }

    const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const to = toDate || new Date().toISOString();

    // Fetch trips for each device
    const allTrips: any[] = [];
    for (const device of devices) {
      const internalId =
        serialToInternal.get(device.geotab_device_id) ||
        device.geotab_device_id;

      const trips = await geotabCall(session, "Get", {
        typeName: "Trip",
        search: {
          deviceSearch: { id: internalId },
          fromDate: from,
          toDate: to,
        },
      });

      for (const trip of trips || []) {
        // Geotab Trip API: distance is already in km
        const distanceKm = trip.distance || 0;
        const drivingSeconds = trip.drivingDuration
          ? parseDuration(trip.drivingDuration)
          : 0;
        const idleSeconds = trip.idlingDuration
          ? parseDuration(trip.idlingDuration)
          : 0;
        const stopSeconds = trip.stopDuration
          ? parseDuration(trip.stopDuration)
          : 0;

        // Geotab uses "start" for trip start time, "stop" for drive-end,
        // "nextTripStart" for session end
        allTrips.push({
          id: trip.id,
          deviceName: device.device_name || device.geotab_device_id,
          startTime: trip.start || trip.dateTime || null,
          endTime: trip.nextTripStart || trip.stop || null,
          distanceKm: Math.round(distanceKm * 100) / 100,
          durationMinutes: Math.round(drivingSeconds / 60),
          idleMinutes: Math.round(idleSeconds / 60),
          stopMinutes: Math.round(stopSeconds / 60),
          maxSpeedKmh: trip.maximumSpeed || 0,
          avgSpeedKmh: trip.averageSpeed || 0,
          startLat: trip.startPoint?.y || null,
          startLng: trip.startPoint?.x || null,
          endLat: trip.stopPoint?.y || null,
          endLng: trip.stopPoint?.x || null,
        });
      }
    }

    // Sort by start time descending
    allTrips.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // ---- AUTO-LINK TRIPS TO SCHEDULED LESSONS ----
    let tripsLinked = 0;
    try {
      // Get all lessons for this instructor in the date range that aren't already linked
      const fromDateOnly = from.split("T")[0];
      const toDateOnly = to.split("T")[0];

      const { data: unlinkedLessons } = await adminClient
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, instructor_id")
        .eq("instructor_id", targetInstructorId)
        .gte("lesson_date", fromDateOnly)
        .lte("lesson_date", toDateOnly)
        .is("geotab_trip_id", null)
        .in("status", ["completed", "in_progress"]);

      if (unlinkedLessons && unlinkedLessons.length > 0) {
        for (const lesson of unlinkedLessons) {
          // Build lesson start/end timestamps
          const lessonStart = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
          const lessonEnd = new Date(lessonStart.getTime() + (lesson.duration_minutes || 60) * 60 * 1000);

          // Find best matching trip: trip start within ±15 min of lesson start
          const TOLERANCE_MS = 15 * 60 * 1000;
          let bestTrip: any = null;
          let bestDiff = Infinity;

          for (const trip of allTrips) {
            if (!trip.startTime) continue;
            const tripStart = new Date(trip.startTime);
            const diff = Math.abs(tripStart.getTime() - lessonStart.getTime());

            if (diff < TOLERANCE_MS && diff < bestDiff) {
              bestDiff = diff;
              bestTrip = trip;
            }
          }

          if (bestTrip) {
            const distanceMiles = Math.round(bestTrip.distanceKm * 0.621371 * 10) / 10;
            const { error: linkErr } = await adminClient
              .from("scheduled_lessons")
              .update({
                geotab_trip_id: bestTrip.id,
                trip_auto_linked_at: new Date().toISOString(),
                lesson_miles: distanceMiles,
              })
              .eq("id", lesson.id)
              .is("geotab_trip_id", null); // Prevent race conditions

            if (!linkErr) {
              tripsLinked++;
              console.log(`[geotab-trips] Linked trip ${bestTrip.id} (${distanceMiles} mi) to lesson ${lesson.id}`);
            }
          }
        }
      }
    } catch (linkErr) {
      console.error("[geotab-trips] Trip linking error (non-critical):", linkErr);
    }

    const totalDistanceKm = allTrips.reduce((s, t) => s + t.distanceKm, 0);
    const totalDurationMin = allTrips.reduce(
      (s, t) => s + t.durationMinutes,
      0
    );

    const meta = {
      fromDate: from,
      toDate: to,
      totalTrips: allTrips.length,
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      totalDurationMinutes: totalDurationMin,
      tripsLinked,
    };

    return new Response(JSON.stringify({ trips: allTrips, meta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[geotab-trips] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Parse Geotab duration strings like "00:12:34" or ISO 8601 durations
function parseDuration(dur: any): number {
  if (typeof dur === "number") return dur;
  if (typeof dur !== "string") return 0;

  // Try HH:MM:SS format
  const hms = dur.match(/^(\d+):(\d+):(\d+)$/);
  if (hms) {
    return parseInt(hms[1]) * 3600 + parseInt(hms[2]) * 60 + parseInt(hms[3]);
  }

  // Try ISO 8601 PT format
  const iso = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (iso) {
    return (
      (parseInt(iso[1] || "0") * 3600) +
      (parseInt(iso[2] || "0") * 60) +
      parseFloat(iso[3] || "0")
    );
  }

  return 0;
}
