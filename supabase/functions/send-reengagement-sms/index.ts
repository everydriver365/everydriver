import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(JSON.stringify({ error: "Twilio not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get instructors with auto re-engagement enabled
    const { data: instructors } = await supabase
      .from("instructors")
      .select("id, name, phone")
      .eq("auto_reengagement_enabled", true);

    if (!instructors?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;
    const now = new Date();
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    for (const instructor of instructors) {
      // Get active pupils with no lessons in 21+ days
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id, name, phone")
        .eq("instructor_id", instructor.id)
        .in("status", ["active"]);

      if (!pupils?.length) continue;

      for (const pupil of pupils) {
        if (!pupil.phone) continue;

        // Check last lesson
        const { data: lastLesson } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date")
          .eq("pupil_id", pupil.id)
          .neq("status", "cancelled")
          .order("lesson_date", { ascending: false })
          .limit(1)
          .single();

        if (!lastLesson) continue;

        const lastDate = new Date(lastLesson.lesson_date);
        if (lastDate > twentyOneDaysAgo) continue;

        // Check if we already sent a re-engagement recently (within 14 days)
        const { data: existing } = await supabase
          .from("churn_events")
          .select("id")
          .eq("pupil_id", pupil.id)
          .eq("event_type", "reengagement_sent")
          .gte("created_at", new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Send re-engagement SMS
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        const message = `Hi ${pupil.name}, we haven't seen you in a while! It's been ${daysSince} days since your last lesson with ${instructor.name}. Ready to get back on the road? Reply YES to book your next lesson. 🚗`;

        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
          await fetch(twilioUrl, {
            method: "POST",
            headers: {
              Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: pupil.phone,
              From: TWILIO_PHONE_NUMBER!,
              Body: message,
            }),
          });

          // Log churn event
          await supabase.from("churn_events").insert({
            instructor_id: instructor.id,
            pupil_id: pupil.id,
            event_type: "reengagement_sent",
            risk_score: Math.min(daysSince * 2, 100),
            reason: `${daysSince} days since last lesson`,
          });

          totalSent++;
        } catch (err) {
          console.error(`Re-engagement SMS to ${pupil.id} failed:`, err);
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Re-engagement error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
