/**
 * slot-offer-expire
 * --------------------------------------------------------------
 * Cron-triggered. Finds open slot_offers past expires_at and:
 *   - marks them status='expired'
 *   - marks unclaimed recipients declined_at = now()
 *   - notifies the instructor that their offer expired unfilled
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const nowIso = new Date().toISOString();

    const { data: expiringOffers, error: fetchErr } = await admin
      .from("slot_offers")
      .select("id, instructor_id, lesson_date, start_time")
      .eq("status", "open")
      .not("expires_at", "is", null)
      .lte("expires_at", nowIso);

    if (fetchErr) throw fetchErr;
    const offers = expiringOffers ?? [];

    let expired = 0;
    const perInstructor = new Map<string, number>();

    for (const o of offers) {
      // mark recipients declined
      await admin
        .from("slot_offer_recipients")
        .update({ declined_at: nowIso })
        .eq("slot_offer_id", o.id)
        .is("claimed_at", null)
        .is("declined_at", null);

      const { error: updErr } = await admin
        .from("slot_offers")
        .update({ status: "expired" })
        .eq("id", o.id)
        .eq("status", "open");

      if (!updErr) {
        expired++;
        perInstructor.set(o.instructor_id, (perInstructor.get(o.instructor_id) ?? 0) + 1);
      }
    }

    // Notify each instructor with a summary
    await Promise.all(Array.from(perInstructor.entries()).map(async ([instructorId, count]) => {
      try {
        await admin.functions.invoke("notify-instructor", {
          body: {
            instructorId,
            type: "system",
            title: "Grab a Gap offer expired",
            body: count === 1
              ? "Your Grab a Gap offer expired unfilled."
              : `${count} Grab a Gap offers expired unfilled.`,
            data: { category: "slot_offer_expired", count },
          },
        });
      } catch (e) {
        console.error("[slot-offer-expire] notify-instructor failed", instructorId, e);
      }
    }));

    return new Response(
      JSON.stringify({ checked: offers.length, expired }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[slot-offer-expire]", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
