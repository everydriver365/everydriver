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
    const { pupilId, tripId, messageType = 'tip' } = await req.json();

    if (!pupilId) {
      throw new Error('pupilId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pupil data
    const { data: pupil } = await supabase
      .from('pupils')
      .select('name, drive_coins, current_streak, total_trips')
      .eq('id', pupilId)
      .single();

    // Get recent trips and scores
    const { data: recentTrips } = await supabase
      .from('lesson_telematics')
      .select(`
        local_score,
        harsh_brake_count, speeding_events_count, total_distance_km, started_at
      `)
      .eq('pupil_id', pupilId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(5);

    // Get specific trip if provided
    let tripData = null;
    if (tripId) {
      const { data } = await supabase
        .from('lesson_telematics')
        .select('*')
        .eq('id', tripId)
        .single();
      tripData = data;
    }

    // Generate coaching message based on data
    let title = '';
    let content = '';
    const firstName = pupil?.name?.split(' ')[0] || 'Driver';

    if (messageType === 'summary' && tripData) {
      // Post-trip summary
      const score = tripData.local_score || 0;
      const distance = tripData.total_distance_km?.toFixed(1) || '0';
      const harshBrakes = tripData.harsh_brake_count || 0;
      const speedingEvents = tripData.speeding_events_count || 0;

      if (score >= 90) {
        title = '🌟 Excellent Drive!';
        content = `Great job, ${firstName}! You scored ${score} on this ${distance}km trip. Your smooth driving really shows - keep up the fantastic work!`;
      } else if (score >= 75) {
        title = '👍 Good Progress';
        content = `Nice drive, ${firstName}! You scored ${score} points. ${harshBrakes > 0 ? `Try to anticipate stops earlier to reduce the ${harshBrakes} harsh brake${harshBrakes > 1 ? 's' : ''}.` : 'Your braking was smooth!'} Keep practicing!`;
      } else {
        title = '💪 Room to Improve';
        content = `Thanks for driving, ${firstName}. You scored ${score} this trip. ${speedingEvents > 0 ? `Watch your speed - you had ${speedingEvents} speeding moment${speedingEvents > 1 ? 's' : ''}.` : ''} ${harshBrakes > 0 ? `Work on smoother braking.` : ''} Every trip is a chance to improve!`;
      }
    } else if (messageType === 'motivation') {
      // Streak and motivation messages
      const streak = pupil?.current_streak || 0;
      const coins = pupil?.drive_coins || 0;

      if (streak >= 7) {
        title = '🔥 You\'re on Fire!';
        content = `${firstName}, your ${streak}-day streak is incredible! You've earned ${coins} DriveCoins. Keep that momentum going - safe driving becomes second nature with practice!`;
      } else if (streak >= 3) {
        title = '⭐ Streak Building!';
        content = `${streak} days in a row, ${firstName}! You're building great habits. Just ${7 - streak} more days to hit your weekly streak bonus!`;
      } else {
        title = '🚗 Ready to Drive?';
        content = `Hey ${firstName}! It's a great day for a practice drive. Even a short trip helps build your skills and confidence. Let's go!`;
      }
    } else {
      // General driving tips based on performance
      const avgScore = recentTrips?.length 
        ? recentTrips.reduce((sum, t) => sum + (t.local_score || 0), 0) / recentTrips.length 
        : 0;
      
      const totalHarshBrakes = recentTrips?.reduce((sum, t) => sum + (t.harsh_brake_count || 0), 0) || 0;
      const totalSpeedingEvents = recentTrips?.reduce((sum, t) => sum + (t.speeding_events_count || 0), 0) || 0;

      if (totalSpeedingEvents > totalHarshBrakes && totalSpeedingEvents > 3) {
        title = '🎯 Speed Awareness Tip';
        content = `${firstName}, here's a helpful tip: Try watching for speed limit signs earlier and adjust your speed gradually. Using cruise control when appropriate can help maintain consistent speeds. You've got this!`;
      } else if (totalHarshBrakes > 3) {
        title = '🛑 Smooth Braking Tip';
        content = `${firstName}, pro tip: Look further ahead on the road to anticipate stops. This gives you more time to brake smoothly. Progressive braking is not only safer but also more comfortable for everyone in the car!`;
      } else if (avgScore >= 85) {
        title = '🏆 Keep Up the Great Work!';
        content = `Your average score of ${Math.round(avgScore)} is excellent, ${firstName}! You're developing safe driving habits that will last a lifetime. Share your success - maybe you can inspire others!`;
      } else {
        title = '💡 Quick Driving Tip';
        content = `${firstName}, remember: Smooth is fast, and fast is smooth! Focus on one thing each drive - whether it's mirror checks, speed consistency, or smooth braking. Small improvements add up!`;
      }
    }

    // Save the coaching message
    const { data: message, error } = await supabase
      .from('pupil_coaching_messages')
      .insert({
        pupil_id: pupilId,
        message_type: messageType,
        title,
        content,
        trip_reference: tripId || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating coaching message:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
