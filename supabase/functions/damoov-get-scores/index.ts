import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DriveCoins earning rules
const COINS_BASE_TRIP = 10;
const COINS_SCORE_80 = 25;
const COINS_SCORE_90 = 50;
const COINS_STREAK_7 = 100;
const COINS_NO_PHONE = 15;
const COINS_NO_HARSH = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telematicsId, deviceToken, pupilId } = await req.json();
    
    if (!telematicsId || !deviceToken) {
      throw new Error('telematicsId and deviceToken are required');
    }

    const instanceId = Deno.env.get('DAMOOV_INSTANCE_ID');
    const instanceKey = Deno.env.get('DAMOOV_INSTANCE_KEY');
    
    if (!instanceId || !instanceKey) {
      throw new Error('Damoov credentials not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate with Damoov
    console.log('Authenticating with Damoov...');
    
    const authResponse = await fetch('https://api.telematicssdk.com/v1/Auth/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'InstanceId': instanceId,
        'InstanceKey': instanceKey,
      },
      body: JSON.stringify({
        DeviceToken: deviceToken,
        Password: instanceKey,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Damoov authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.AccessToken || authData.accessToken;

    // Get the telematics session to find trip token
    const { data: session, error: sessionError } = await supabase
      .from('lesson_telematics')
      .select('*')
      .eq('id', telematicsId)
      .single();

    if (sessionError) {
      throw new Error(`Failed to fetch session: ${sessionError.message}`);
    }

    // Fetch latest trip scores from Damoov
    console.log('Fetching scores from Damoov...');
    
    const scoresResponse = await fetch('https://api.telematicssdk.com/v1/Scores/safety', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let scores = {
      overallScore: null,
      accelerationScore: null,
      brakingScore: null,
      corneringScore: null,
      speedingScore: null,
      phoneScore: null,
    };

    if (scoresResponse.ok) {
      const scoresData = await scoresResponse.json();
      console.log('Damoov scores received:', JSON.stringify(scoresData));
      
      // Map Damoov response to our fields
      scores = {
        overallScore: scoresData.SafetyScore || scoresData.safetyScore || scoresData.overall || null,
        accelerationScore: scoresData.AccelerationScore || scoresData.acceleration || null,
        brakingScore: scoresData.BrakingScore || scoresData.braking || null,
        corneringScore: scoresData.CorneringScore || scoresData.cornering || null,
        speedingScore: scoresData.SpeedingScore || scoresData.speeding || null,
        phoneScore: scoresData.PhoneUsageScore || scoresData.phoneUsage || scoresData.distraction || null,
      };
    } else {
      console.log('Could not fetch scores, may still be processing');
    }

    // Update telematics record with Damoov scores
    const { error: updateError } = await supabase
      .from('lesson_telematics')
      .update({
        damoov_overall_score: scores.overallScore,
        damoov_acceleration_score: scores.accelerationScore,
        damoov_braking_score: scores.brakingScore,
        damoov_cornering_score: scores.corneringScore,
        damoov_speeding_score: scores.speedingScore,
        damoov_phone_score: scores.phoneScore,
      })
      .eq('id', telematicsId);

    if (updateError) {
      console.error('Failed to update scores:', updateError);
    }

    // Calculate DriveCoins earned
    let coinsEarned = COINS_BASE_TRIP; // Base coins for completing trip
    
    if (scores.overallScore !== null) {
      if (scores.overallScore >= 90) {
        coinsEarned += COINS_SCORE_90;
      } else if (scores.overallScore >= 80) {
        coinsEarned += COINS_SCORE_80;
      }
    }

    if (scores.phoneScore !== null && scores.phoneScore >= 95) {
      coinsEarned += COINS_NO_PHONE;
    }

    // Check for harsh events in this session
    const { data: harshEvents } = await supabase
      .from('driving_behavior_events')
      .select('id')
      .eq('telematics_id', telematicsId)
      .in('event_type', ['hard_brake', 'harsh_acceleration', 'sharp_turn'])
      .limit(1);

    if (!harshEvents || harshEvents.length === 0) {
      coinsEarned += COINS_NO_HARSH;
    }

    // Update pupil's gamification stats if pupilId provided
    if (pupilId) {
      const { data: pupil, error: pupilError } = await supabase
        .from('pupils')
        .select('drive_coins, current_streak, longest_streak, total_trips')
        .eq('id', pupilId)
        .single();

      if (!pupilError && pupil) {
        let newStreak = pupil.current_streak || 0;
        
        // Increase streak if score is good (70+)
        if (scores.overallScore !== null && scores.overallScore >= 70) {
          newStreak += 1;
          
          // Check for 7-day streak bonus
          if (newStreak === 7) {
            coinsEarned += COINS_STREAK_7;
          }
        } else if (scores.overallScore !== null && scores.overallScore < 60) {
          // Reset streak if score is poor
          newStreak = 0;
        }

        const newLongestStreak = Math.max(pupil.longest_streak || 0, newStreak);
        const newTotalCoins = (pupil.drive_coins || 0) + coinsEarned;
        const newTotalTrips = (pupil.total_trips || 0) + 1;

        await supabase
          .from('pupils')
          .update({
            drive_coins: newTotalCoins,
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            total_trips: newTotalTrips,
          })
          .eq('id', pupilId);

        console.log(`Updated pupil ${pupilId}: +${coinsEarned} coins, streak: ${newStreak}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        scores,
        coinsEarned,
        message: 'Scores retrieved and gamification updated' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in damoov-get-scores:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
