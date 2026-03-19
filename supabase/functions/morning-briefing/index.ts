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

    // Get all instructors
    const { data: instructors } = await supabase
      .from("instructors")
      .select("id, name, phone, morning_briefing_enabled")
      .eq("morning_briefing_enabled", true);

    if (!instructors?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    let sent = 0;

    for (const instructor of instructors) {
      if (!instructor.phone) continue;

      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("start_time, duration_minutes, pupils(name)")
        .eq("instructor_id", instructor.id)
        .eq("lesson_date", today)
        .eq("status", "scheduled")
        .order("start_time", { ascending: true });

      if (!lessons?.length) continue;

      const lines = lessons.map((l: any) => {
        const time = l.start_time?.slice(0, 5) || "TBC";
        const pupilName = l.pupils?.name || "Unknown";
        const dur = l.duration_minutes || 60;
        return `${time} - ${pupilName} (${dur}min)`;
      });

      const message = `☀️ Good morning ${instructor.name}! Today you have ${lessons.length} lesson${lessons.length > 1 ? "s" : ""}:\n\n${lines.join("\n")}\n\nHave a great day!`;

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: instructor.phone,
            From: TWILIO_PHONE_NUMBER!,
            Body: message,
          }),
        });
        sent++;
      } catch (err) {
        console.error(`Morning briefing to ${instructor.id} failed:`, err);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Morning briefing error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
