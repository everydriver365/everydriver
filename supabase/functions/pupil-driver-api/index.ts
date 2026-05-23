import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';
    const params = Object.fromEntries(url.searchParams);

    // Route handling
    switch (path) {
      case 'summary':
        return await getDriverSummary(supabase, params);
      case 'trips':
        return await getDriverTrips(supabase, params);
      case 'score':
        return await getDriverScore(supabase, params);
      case 'events':
        return await getDriverEvents(supabase, params);
      case 'live-trips':
        return await getLiveTrips(supabase, params);
      case 'update-position':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const body = await req.json();
        return await updatePosition(supabase, body);
      case 'coaching':
        return await getCoachingMessages(supabase, params);
      case 'achievements':
        return await getAchievements(supabase, params);
      default:
        return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in pupil-driver-api:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// GET /driver/summary - Get pupil driving summary
async function getDriverSummary(supabase: any, params: any) {
  const { pupilId } = params;
  if (!pupilId) {
    return new Response(JSON.stringify({ error: 'pupilId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get pupil data with gamification stats
  const { data: pupil, error: pupilError } = await supabase
    .from('pupils')
    .select(`
      id, name, drive_coins, current_streak, longest_streak, total_trips,
      weekly_driving_score, monthly_driving_score, best_driving_score,
      total_distance_km, total_driving_minutes, speeding_events_total,
      harsh_brake_events_total, last_trip_at
    `)
    .eq('id', pupilId)
    .single();

  if (pupilError) {
    return new Response(JSON.stringify({ error: pupilError.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get average score from recent trips
  const { data: recentTrips } = await supabase
    .from('lesson_telematics')
    .select('local_score')
    .eq('pupil_id', pupilId)
    .not('local_score', 'is', null)
    .order('started_at', { ascending: false })
    .limit(10);

  const averageScores = recentTrips && recentTrips.length > 0 ? {
    overall: Math.round(recentTrips.reduce((sum: number, t: any) => sum + (t.local_score || 0), 0) / recentTrips.length),
  } : null;

  // Get achievements count
  const { count: achievementsCount } = await supabase
    .from('pupil_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('pupil_id', pupilId);

  return new Response(JSON.stringify({
    success: true,
    data: {
      ...pupil,
      averageScores,
      achievementsCount: achievementsCount || 0,
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// GET /driver/trips - Get pupil trip history
async function getDriverTrips(supabase: any, params: any) {
  const { pupilId, limit = '20', offset = '0' } = params;
  if (!pupilId) {
    return new Response(JSON.stringify({ error: 'pupilId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: trips, error, count } = await supabase
    .from('lesson_telematics')
    .select(`
      id, started_at, ended_at, total_distance_km, avg_speed_kmh, max_speed_kmh,
      harsh_brake_count, speeding_events_count, local_score
    `, { count: 'exact' })
    .eq('pupil_id', pupilId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Calculate duration for each trip
  const tripsWithDuration = trips?.map((trip: any) => ({
    ...trip,
    durationMinutes: trip.ended_at && trip.started_at
      ? Math.round((new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime()) / 60000)
      : null
  }));

  return new Response(JSON.stringify({
    success: true,
    data: tripsWithDuration,
    total: count,
    limit: parseInt(limit),
    offset: parseInt(offset)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// GET /driver/score - Get detailed driving score
async function getDriverScore(supabase: any, params: any) {
  const { pupilId } = params;
  if (!pupilId) {
    return new Response(JSON.stringify({ error: 'pupilId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get last 30 days of trips for trend analysis
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: trips } = await supabase
    .from('lesson_telematics')
    .select(`
      started_at, local_score,
      harsh_brake_count, speeding_events_count, total_distance_km
    `)
    .eq('pupil_id', pupilId)
    .gte('started_at', thirtyDaysAgo.toISOString())
    .not('local_score', 'is', null)
    .order('started_at', { ascending: true });

  if (!trips || trips.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        currentScore: null,
        trend: 'stable',
        weeklyScores: [],
        categoryBreakdown: null,
        totalTrips: 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Calculate weekly averages
  const weeklyScores: { week: string; score: number }[] = [];
  const weeks: Record<string, number[]> = {};
  
  trips.forEach((trip: any) => {
    const weekStart = new Date(trip.started_at);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weeks[weekKey]) weeks[weekKey] = [];
    weeks[weekKey].push(trip.local_score);
  });

  Object.entries(weeks).forEach(([week, scores]) => {
    weeklyScores.push({
      week,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    });
  });

  // Calculate trend
  const recentTrips = trips.slice(-5);
  const olderTrips = trips.slice(0, Math.max(trips.length - 5, 0));
  const recentAvg = recentTrips.length > 0
    ? recentTrips.reduce((sum: number, t: any) => sum + t.local_score, 0) / recentTrips.length
    : 0;
  const olderAvg = olderTrips.length > 0
    ? olderTrips.reduce((sum: number, t: any) => sum + t.local_score, 0) / olderTrips.length
    : recentAvg;
  
  const trend = recentAvg > olderAvg + 5 ? 'improving' : recentAvg < olderAvg - 5 ? 'declining' : 'stable';

  // Latest trip score
  const latestTrip = trips[trips.length - 1];

  return new Response(JSON.stringify({
    success: true,
    data: {
      currentScore: latestTrip.local_score,
      trend,
      weeklyScores,
      categoryBreakdown: null,
      totalTrips: trips.length,
      totalDistance: trips.reduce((sum: number, t: any) => sum + (t.total_distance_km || 0), 0).toFixed(1),
      totalHarshBrakes: trips.reduce((sum: number, t: any) => sum + (t.harsh_brake_count || 0), 0),
      totalSpeedingEvents: trips.reduce((sum: number, t: any) => sum + (t.speeding_events_count || 0), 0),
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// GET /driver/events - Get driving events
async function getDriverEvents(supabase: any, params: any) {
  const { pupilId, tripId, limit = '50' } = params;
  
  if (!pupilId && !tripId) {
    return new Response(JSON.stringify({ error: 'pupilId or tripId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let query = supabase
    .from('driving_behavior_events')
    .select(`
      id, event_type, severity, latitude, longitude, speed_at_event,
      recorded_at, notes, g_force, sensor_source, is_dismissed
    `)
    .order('recorded_at', { ascending: false })
    .limit(parseInt(limit));

  if (tripId) {
    query = query.eq('telematics_id', tripId);
  } else {
    // Get events from pupil's trips
    const { data: tripIds } = await supabase
      .from('lesson_telematics')
      .select('id')
      .eq('pupil_id', pupilId)
      .order('started_at', { ascending: false })
      .limit(10);

    if (tripIds && tripIds.length > 0) {
      query = query.in('telematics_id', tripIds.map((t: any) => t.id));
    }
  }

  const { data: events, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Categorize events
  const categorized = {
    speeding: events?.filter((e: any) => e.event_type === 'speeding') || [],
    harshBraking: events?.filter((e: any) => e.event_type.includes('brake') || e.event_type.includes('harsh_brake')) || [],
    harshAcceleration: events?.filter((e: any) => e.event_type.includes('accel')) || [],
    sharpTurns: events?.filter((e: any) => e.event_type.includes('turn') || e.event_type.includes('corner')) || [],
    distraction: events?.filter((e: any) => e.event_type.includes('phone') || e.event_type.includes('distract')) || [],
    other: events?.filter((e: any) => 
      !['speeding', 'harsh_brake', 'harsh_accel', 'sharp_turn'].some(t => e.event_type.includes(t))
    ) || [],
  };

  return new Response(JSON.stringify({
    success: true,
    data: events,
    categorized,
    total: events?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// GET /live-trips - Get all active trips for instructor
async function getLiveTrips(supabase: any, params: any) {
  const { instructorId } = params;
  if (!instructorId) {
    return new Response(JSON.stringify({ error: 'instructorId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: livePositions, error } = await supabase
    .from('live_pupil_positions')
    .select(`
      id, pupil_id, latitude, longitude, speed_kmh, heading, accuracy,
      trip_status, updated_at, telematics_session_id,
      pupils!inner(id, name)
    `)
    .eq('instructor_id', instructorId)
    .eq('is_active', true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Filter out stale positions (older than 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activePositions = livePositions?.filter((pos: any) => 
    new Date(pos.updated_at) > fiveMinutesAgo
  ).map((pos: any) => ({
    ...pos,
    pupilName: pos.pupils?.name || 'Unknown',
    isStale: false
  })) || [];

  return new Response(JSON.stringify({
    success: true,
    data: activePositions,
    count: activePositions.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// POST /update-position - Update pupil live position
async function updatePosition(supabase: any, body: any) {
  const { pupilId, latitude, longitude, speedKmh, heading, accuracy, tripStatus, sessionId } = body;

  if (!pupilId || latitude === undefined || longitude === undefined) {
    return new Response(JSON.stringify({ error: 'pupilId, latitude, longitude required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Use the database function to upsert
  const { data, error } = await supabase.rpc('update_live_position', {
    p_pupil_id: pupilId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_speed_kmh: speedKmh || 0,
    p_heading: heading,
    p_accuracy: accuracy,
    p_trip_status: tripStatus || 'driving',
    p_session_id: sessionId
  });

  if (error) {
    console.error('Error updating position:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    positionId: data
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// GET /coaching - Get AI coaching messages
async function getCoachingMessages(supabase: any, params: any) {
  const { pupilId, unreadOnly = 'false' } = params;
  if (!pupilId) {
    return new Response(JSON.stringify({ error: 'pupilId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let query = supabase
    .from('pupil_coaching_messages')
    .select('*')
    .eq('pupil_id', pupilId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (unreadOnly === 'true') {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data,
    unreadCount: data?.filter((m: any) => !m.is_read).length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// GET /achievements - Get pupil achievements
async function getAchievements(supabase: any, params: any) {
  const { pupilId } = params;
  if (!pupilId) {
    return new Response(JSON.stringify({ error: 'pupilId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data, error } = await supabase
    .from('pupil_achievements')
    .select('*')
    .eq('pupil_id', pupilId)
    .order('earned_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Calculate total coins from achievements
  const totalCoins = data?.reduce((sum: number, a: any) => sum + (a.coins_awarded || 0), 0) || 0;

  return new Response(JSON.stringify({
    success: true,
    data,
    totalCoins,
    count: data?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
