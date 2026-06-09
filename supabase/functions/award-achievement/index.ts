import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Achievement definitions
const ACHIEVEMENTS = {
  first_trip: { name: '🎉 First Trip', description: 'Completed your first tracked drive', coins: 50, icon: 'Car' },
  perfect_score: { name: '⭐ Perfect Score', description: 'Achieved a 100% driving score', coins: 100, icon: 'Star' },
  streak_7: { name: '🔥 Week Warrior', description: '7-day driving streak', coins: 75, icon: 'Flame' },
  streak_30: { name: '🏆 Monthly Master', description: '30-day driving streak', coins: 200, icon: 'Trophy' },
  smooth_operator: { name: '🎯 Smooth Operator', description: '5 trips with no harsh braking', coins: 60, icon: 'Target' },
  speed_saint: { name: '😇 Speed Saint', description: '5 trips with no speeding events', coins: 60, icon: 'Shield' },
  distance_10: { name: '🛣️ Road Explorer', description: 'Drove 10+ km in total', coins: 30, icon: 'Map' },
  distance_50: { name: '🌍 Long Hauler', description: 'Drove 50+ km in total', coins: 75, icon: 'Globe' },
  distance_100: { name: '🚀 Century Club', description: 'Drove 100+ km in total', coins: 150, icon: 'Rocket' },
  improving: { name: '📈 Getting Better', description: 'Improved score by 10+ points', coins: 40, icon: 'TrendingUp' },
  coin_collector: { name: '💰 Coin Collector', description: 'Earned 500+ DriveCoins', coins: 25, icon: 'Coins' },
  early_bird: { name: '🌅 Early Bird', description: 'Completed a drive before 8am', coins: 30, icon: 'Sunrise' },
  night_owl: { name: '🌙 Night Owl', description: 'Completed a drive after 8pm', coins: 30, icon: 'Moon' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pupilId, achievementType, checkAll = false } = await req.json();

    if (!pupilId) {
      throw new Error('pupilId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const awardedAchievements: any[] = [];

    // Get existing achievements
    const { data: existingAchievements } = await supabase
      .from('pupil_achievements')
      .select('achievement_type')
      .eq('pupil_id', pupilId);

    const earnedTypes = existingAchievements?.map(a => a.achievement_type) || [];

    // If checking a specific achievement
    if (achievementType && !checkAll) {
      if (!earnedTypes.includes(achievementType) && ACHIEVEMENTS[achievementType as keyof typeof ACHIEVEMENTS]) {
        const achievement = ACHIEVEMENTS[achievementType as keyof typeof ACHIEVEMENTS];
        const { data, error } = await supabase
          .from('pupil_achievements')
          .insert({
            pupil_id: pupilId,
            achievement_type: achievementType,
            achievement_name: achievement.name,
            description: achievement.description,
            coins_awarded: achievement.coins,
            icon_name: achievement.icon
          })
          .select()
          .single();

        if (!error && data) {
          awardedAchievements.push(data);

          // Atomically increment coins to avoid lost updates
          await supabase.rpc('increment_drive_coins', {
            p_pupil_id: pupilId,
            p_amount: achievement.coins,
          });
        }
      }
    }

    // If checking all achievements
    if (checkAll) {
      // Get pupil stats
      const { data: pupil } = await supabase
        .from('pupils')
        .select('total_trips, current_streak, drive_coins, total_distance_km')
        .eq('id', pupilId)
        .single();

      // Get trip stats
      const { data: trips } = await supabase
        .from('lesson_telematics')
        .select('local_score, harsh_brake_count, speeding_events_count, started_at')
        .eq('pupil_id', pupilId)
        .not('ended_at', 'is', null);

      const checkAndAward = async (type: string, condition: boolean) => {
        if (!earnedTypes.includes(type) && condition && ACHIEVEMENTS[type as keyof typeof ACHIEVEMENTS]) {
          const achievement = ACHIEVEMENTS[type as keyof typeof ACHIEVEMENTS];
          const { data, error } = await supabase
            .from('pupil_achievements')
            .insert({
              pupil_id: pupilId,
              achievement_type: type,
              achievement_name: achievement.name,
              description: achievement.description,
              coins_awarded: achievement.coins,
              icon_name: achievement.icon
            })
            .select()
            .single();

          if (!error && data) {
            awardedAchievements.push(data);
            // Atomically increment coins to avoid lost updates across multiple awards
            await supabase.rpc('increment_drive_coins', {
              p_pupil_id: pupilId,
              p_amount: achievement.coins,
            });
          }
        }
      };

      // Check all conditions
      await checkAndAward('first_trip', (pupil?.total_trips || 0) >= 1);
      await checkAndAward('streak_7', (pupil?.current_streak || 0) >= 7);
      await checkAndAward('streak_30', (pupil?.current_streak || 0) >= 30);
      await checkAndAward('distance_10', (pupil?.total_distance_km || 0) >= 10);
      await checkAndAward('distance_50', (pupil?.total_distance_km || 0) >= 50);
      await checkAndAward('distance_100', (pupil?.total_distance_km || 0) >= 100);
      await checkAndAward('coin_collector', (pupil?.drive_coins || 0) >= 500);

      if (trips && trips.length > 0) {
        const hasPerfectScore = trips.some(t => (t.local_score || 0) >= 100);
        await checkAndAward('perfect_score', hasPerfectScore);

        const recentTrips = trips.slice(-5);
        const noHarshBrakes = recentTrips.length >= 5 && recentTrips.every(t => (t.harsh_brake_count || 0) === 0);
        await checkAndAward('smooth_operator', noHarshBrakes);

        const noSpeeding = recentTrips.length >= 5 && recentTrips.every(t => (t.speeding_events_count || 0) === 0);
        await checkAndAward('speed_saint', noSpeeding);

        // Check early/late drives
        const hasEarlyDrive = trips.some(t => {
          const hour = new Date(t.started_at).getHours();
          return hour < 8;
        });
        await checkAndAward('early_bird', hasEarlyDrive);

        const hasLateDrive = trips.some(t => {
          const hour = new Date(t.started_at).getHours();
          return hour >= 20;
        });
        await checkAndAward('night_owl', hasLateDrive);

        // Check improvement
        if (trips.length >= 3) {
          const firstScore = trips[trips.length - 1].local_score || 0;
          const recentScore = trips[0].local_score || 0;
          await checkAndAward('improving', recentScore - firstScore >= 10);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      awarded: awardedAchievements,
      count: awardedAchievements.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error awarding achievement:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
