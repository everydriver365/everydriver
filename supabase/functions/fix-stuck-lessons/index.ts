// One-time fix: find all lessons stuck with awaiting_initial_payment = true
// where the pupil's account_balance > 0 (payment was received) and
// the lesson is scheduled in the future. Clear the flag and trigger
// confirm-booking for each one.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().slice(0, 10);

  // Find stuck lessons where pupil has a positive balance (paid)
  const { data: stuck, error } = await supabase
    .from("scheduled_lessons")
    .select("id, pupil_id, instructor_id, pupils(account_balance)")
    .eq("awaiting_initial_payment", true)
    .eq("status", "scheduled")
    .gte("lesson_date", today)
    .is("deleted_at", null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  const paid = (stuck || []).filter((l: any) => (l.pupils?.account_balance ?? 0) > 0);

  let fixed = 0;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  for (const lesson of paid) {
    // Clear the flag
    await supabase
      .from("scheduled_lessons")
      .update({ awaiting_initial_payment: false })
      .eq("id", lesson.id);

    // Trigger confirm-booking
    fetch(`${supabaseUrl}/functions/v1/confirm-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ pupilId: lesson.pupil_id, instructorId: lesson.instructor_id }),
    }).catch((e) => console.error("confirm-booking trigger failed:", e));

    fixed++;
  }

  return new Response(
    JSON.stringify({ scanned: stuck?.length ?? 0, fixed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
