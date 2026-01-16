import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bonus coins for top performers
const TOP_1_BONUS = 100;
const TOP_2_BONUS = 50;
const TOP_3_BONUS = 25;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instructorId, action = 'get' } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    if (action === 'calculate') {
      // Calculate/update leaderboard for all instructors or specific one
      console.log('Calculating leaderboard for week:', weekStartStr);

      // Get all instructors (or specific one)
      let instructorsQuery = supabase.from('instructors').select('id');
      if (instructorId) {
        instructorsQuery = instructorsQuery.eq('id', instructorId);
      }
      
      const { data: instructors, error: instructorsError } = await instructorsQuery;
      
      if (instructorsError) {
        throw new Error(`Failed to fetch instructors: ${instructorsError.message}`);
      }

      for (const instructor of instructors || []) {
        // Get all pupils for this instructor
        const { data: pupils } = await supabase
          .from('pupils')
          .select('id, name, drive_coins')
          .eq('instructor_id', instructor.id);

        if (!pupils || pupils.length === 0) continue;

        // Calculate weekly scores for each pupil
        const pupilScores = [];

        interface PupilScore {
          pupil_id: string;
          instructor_id: string;
          week_start: string;
          weekly_score: number;
          weekly_coins_earned: number;
          rank?: number;
        }

        for (const pupil of pupils) {
          // Get telematics sessions for this week
          const { data: sessions } = await supabase
            .from('lesson_telematics')
            .select('damoov_overall_score')
            .eq('pupil_id', pupil.id)
            .gte('started_at', weekStartStr)
            .not('damoov_overall_score', 'is', null);

          if (!sessions || sessions.length === 0) continue;

          const avgScore = sessions.reduce((sum, s: { damoov_overall_score: number | null }) => sum + (s.damoov_overall_score || 0), 0) / sessions.length;
          
          pupilScores.push({
            pupil_id: pupil.id,
            instructor_id: instructor.id,
            week_start: weekStartStr,
            weekly_score: Math.round(avgScore * 10) / 10,
            weekly_coins_earned: 0,
            rank: 0,
          } as PupilScore);
        }

        // Sort by score and assign ranks
        pupilScores.sort((a, b) => b.weekly_score - a.weekly_score);
        
        for (let i = 0; i < pupilScores.length; i++) {
          pupilScores[i].rank = i + 1;
          
          // Award bonus coins to top 3
          if (i === 0) pupilScores[i].weekly_coins_earned = TOP_1_BONUS;
          else if (i === 1) pupilScores[i].weekly_coins_earned = TOP_2_BONUS;
          else if (i === 2) pupilScores[i].weekly_coins_earned = TOP_3_BONUS;
        }

        // Upsert leaderboard entries
        for (const entry of pupilScores) {
          await supabase
            .from('pupil_leaderboard')
            .upsert(entry, { onConflict: 'pupil_id,week_start' });
        }

        console.log(`Updated leaderboard for instructor ${instructor.id}: ${pupilScores.length} pupils`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Leaderboard calculated',
          weekStart: weekStartStr,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default action: get leaderboard
    if (!instructorId) {
      throw new Error('instructorId is required for getting leaderboard');
    }

    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('pupil_leaderboard')
      .select(`
        *,
        pupils!inner (
          id,
          name,
          drive_coins,
          current_streak
        )
      `)
      .eq('instructor_id', instructorId)
      .eq('week_start', weekStartStr)
      .order('rank', { ascending: true })
      .limit(10);

    if (leaderboardError) {
      throw new Error(`Failed to fetch leaderboard: ${leaderboardError.message}`);
    }

    // Format response
    const formattedLeaderboard = (leaderboard || []).map((entry: any) => ({
      rank: entry.rank,
      pupilId: entry.pupil_id,
      pupilName: entry.pupils?.name || 'Unknown',
      weeklyScore: entry.weekly_score,
      weeklyCoins: entry.weekly_coins_earned,
      totalCoins: entry.pupils?.drive_coins || 0,
      currentStreak: entry.pupils?.current_streak || 0,
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        weekStart: weekStartStr,
        leaderboard: formattedLeaderboard,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in damoov-leaderboard:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
