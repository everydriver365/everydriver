import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Find abandoned checkouts older than 1 hour without reminder or conversion
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: abandonedCheckouts, error } = await supabase
      .from("abandoned_checkouts")
      .select("*, instructors!inner(name, phone)")
      .is("converted_at", null)
      .is("reminder_sent_at", null)
      .lt("created_at", oneHourAgo);

    if (error) throw error;
    if (!abandonedCheckouts?.length) {
      return new Response(JSON.stringify({ message: "No abandoned checkouts to process", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    for (const checkout of abandonedCheckouts) {
      try {
        // Send SMS reminder if phone available and Twilio configured
        if (checkout.pupil_phone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
          const instructorName = checkout.instructors?.name || "your instructor";
          const message = `Hi ${checkout.pupil_name || "there"}! You started booking lessons with ${instructorName} but didn't finish. Complete your booking now to secure your spot!`;

          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: checkout.pupil_phone,
              From: TWILIO_PHONE_NUMBER,
              Body: message,
            }),
          });
        }

        // Send email reminder if email available and Resend configured
        if (checkout.pupil_email && RESEND_API_KEY) {
          const instructorName = checkout.instructors?.name || "your instructor";
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "noreply@everydriver.lovable.app",
              to: checkout.pupil_email,
              subject: "Complete Your Driving Lesson Booking",
              html: `<p>Hi ${checkout.pupil_name || "there"},</p><p>You started booking lessons with ${instructorName} but didn't complete your booking.</p><p>Don't miss out — secure your spot today!</p>`,
            }),
          });
        }

        // Mark reminder sent
        await supabase
          .from("abandoned_checkouts")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", checkout.id);

        sentCount++;
      } catch (e) {
        console.error(`Failed to process checkout ${checkout.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: sentCount, total: abandonedCheckouts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Abandoned checkout processing error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
