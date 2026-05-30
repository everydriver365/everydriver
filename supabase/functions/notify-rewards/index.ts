import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotifyType =
  | 'TIER_UPGRADE' | 'TIER_DOWNGRADE' | 'BADGE_EARNED'
  | 'POINTS_DEDUCTED' | 'NEAR_NEXT_TIER' | 'SEASON_ENDING' | 'SEASON_WINNER';

const TEMPLATES: Record<NotifyType, { title: string; body: string; route: string }> = {
  TIER_UPGRADE:     { title: "🎉 You've reached {tier} tier!", body: "Your {tier} rewards are now active. Tap to see what you've unlocked.", route: "/rewards" },
  TIER_DOWNGRADE:   { title: "Your DSM tier has changed",       body: "You're now on {tier} tier. Earn {points} more points to return to {previous_tier}.", route: "/rewards" },
  BADGE_EARNED:     { title: "{emoji} New badge earned!",        body: "You've earned the {badge_label} badge. Tap to see your collection.", route: "/rewards" },
  POINTS_DEDUCTED:  { title: "DSM points updated",               body: "A {reason} has affected your points. Tap to view details.", route: "/rewards" },
  NEAR_NEXT_TIER:   { title: "You're close to {next_tier}!",     body: "Just {points} more points to unlock {next_tier} rewards.", route: "/rewards" },
  SEASON_ENDING:    { title: "⏰ DSM season ends in 30 days",     body: "You're currently ranked {rank}. Keep earning to climb the leaderboard!", route: "/rewards" },
  SEASON_WINNER:    { title: "🏆 You've won DSM Pro Rewards {year}!", body: "£1,000 will be transferred to your account within 7 days. Congratulations!", route: "/rewards" },
};

function fill(tpl: string, ctx: Record<string, any>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ?? `{${k}}`));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { instructor_id, type, context = {} } = await req.json() as {
      instructor_id: string; type: NotifyType; context?: Record<string, any>;
    };

    if (!instructor_id || !type || !TEMPLATES[type]) {
      return new Response(JSON.stringify({ error: "instructor_id and valid type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tpl = TEMPLATES[type];
    const title = fill(tpl.title, context);
    const body = fill(tpl.body, context);

    // Push via existing function
    const pushRes = await supabase.functions.invoke('send-push-notification', {
      body: {
        instructorId: instructor_id,
        notification: { title, body, data: { route: tpl.route, type } },
        bypassGate: false,
        category: 'rewards',
        importance: 'normal',
      },
    });

    return new Response(JSON.stringify({ success: true, push: pushRes?.data ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error('notify-rewards error', err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
