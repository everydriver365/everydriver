import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, addDays } from "https://esm.sh/date-fns@3";
import { initVapidKeys, sendPush } from "../_shared/webpush.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await initVapidKeys(vapidPublicKey, vapidPrivateKey);

    // Get all instructors who have push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("instructor_id, endpoint, p256dh, auth");

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by instructor
    const instructorSubs = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = instructorSubs.get(sub.instructor_id) || [];
      existing.push(sub);
      instructorSubs.set(sub.instructor_id, existing);
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    let totalSent = 0;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    for (const [instructorId, subs] of instructorSubs) {
      // Fetch today's data
      const [lessonsRes, instructorRes, mileageRes, tomorrowRes] = await Promise.all([
        supabase.from("scheduled_lessons")
          .select("id, start_time, duration_minutes, status, pupils!inner(name)")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", today)
          .neq("status", "cancelled"),
        supabase.from("instructors")
          .select("hourly_rate, name")
          .eq("id", instructorId)
          .maybeSingle(),
        supabase.from("mileage_logs")
          .select("distance_km")
          .eq("instructor_id", instructorId)
          .eq("log_date", today),
        supabase.from("scheduled_lessons")
          .select("id")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", tomorrow)
          .neq("status", "cancelled"),
      ]);

      const lessons = lessonsRes.data || [];
      const rate = instructorRes.data?.hourly_rate || 35;
      const completed = lessons.filter(l => l.status === "completed").length;
      const totalMinutes = lessons.reduce((s, l) => s + (l.duration_minutes || 60), 0);
      const earnings = Math.round((totalMinutes / 60) * rate);
      const totalMiles = Math.round(((mileageRes.data || []).reduce((s, m) => s + (m.distance_km || 0), 0)) * 0.621371);
      const tomorrowCount = tomorrowRes.data?.length || 0;
      const firstName = instructorRes.data?.name?.split(" ")[0] || "there";

      // Generate summary text
      let summaryText = `Hey ${firstName}! Today: ${completed}/${lessons.length} lessons, £${earnings} earned.`;
      if (totalMiles > 0) summaryText += ` ${totalMiles} miles driven.`;
      if (tomorrowCount > 0) summaryText += ` Tomorrow: ${tomorrowCount} lesson${tomorrowCount > 1 ? 's' : ''} lined up.`;

      // Try AI summary if available
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "You are ED, a friendly driving instructor assistant. Write a brief end-of-day summary (2-3 sentences). Be warm and encouraging. Keep it under 50 words. No markdown." },
                { role: "user", content: JSON.stringify({ firstName, completed, total: lessons.length, earnings, totalMiles, tomorrowCount }) },
              ],
            }),
          });
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiText = aiData.choices?.[0]?.message?.content;
            if (aiText) summaryText = aiText;
          }
        } catch (e) {
          console.error("AI summary failed, using fallback:", e);
        }
      }

      // Send push to all subscriptions for this instructor
      for (const sub of subs) {
        const result = await sendPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title: "📊 End of Day Summary", body: summaryText, tag: "eod-summary" }
        );
        if (result.success) totalSent++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent: totalSent, instructors: instructorSubs.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("EOD notification error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
