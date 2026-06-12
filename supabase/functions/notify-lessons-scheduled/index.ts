import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LessonInfo {
  date: string;
  time: string;
  duration: number;
}

interface NotifyRequest {
  pupilId: string;
  instructorId: string;
  lessons: LessonInfo[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pupilId, instructorId, lessons }: NotifyRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pupil and instructor details
    const [pupilResult, instructorResult] = await Promise.all([
      supabase.from("pupils").select("name, email, phone").eq("id", pupilId).single(),
      supabase.from("instructors").select("name, phone, email").eq("id", instructorId).single(),
    ]);

    if (pupilResult.error || !pupilResult.data) {
      console.error("Pupil not found:", pupilResult.error);
      return new Response(
        JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pupil = pupilResult.data;
    const instructor = instructorResult.data;

    // Format lessons for the email/SMS
    const lessonList = lessons
      .map((l) => {
        const date = new Date(l.date);
        const formattedDate = date.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        return `• ${formattedDate} at ${l.time} (${l.duration}h)`;
      })
      .join("\n");

    // Send email notification
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && pupil.email) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Your Lessons Have Been Scheduled! 🚗</h2>
            <p>Hi ${pupil.name},</p>
            <p>Great news! Your driving lessons with ${instructor?.name || 'your instructor'} have been scheduled:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <pre style="margin: 0; white-space: pre-wrap; font-family: inherit;">${lessonList}</pre>
            </div>
            <p>Please make sure to:</p>
            <ul>
              <li>Be ready at your pickup location 5 minutes early</li>
              <li>Bring your provisional driving licence</li>
              <li>Wear comfortable shoes suitable for driving</li>
            </ul>
            <p>If you need to reschedule any lessons, please contact your instructor as soon as possible.</p>
            <p style="margin-top: 24px;">See you soon!<br><strong>${instructor?.name || 'Your Instructor'}</strong></p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "EveryDriver <noreply@everydriver.co.uk>",
            reply_to: "hello@everydriver.co.uk",
            to: pupil.email,
            subject: "Your Driving Lessons Are Scheduled! 🚗",
            html: emailHtml,
          }),
        });

        console.log("Email sent to:", pupil.email);
      } catch (emailError) {
        console.error("Email error (non-fatal):", emailError);
      }
    }

    // Send SMS notification
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (twilioAccountSid && twilioAuthToken && twilioPhone && pupil.phone) {
      try {
        const smsBody = `Hi ${pupil.name}! Your driving lessons have been scheduled:\n\n${lessonList}\n\nSee you soon! - ${instructor?.name || 'Your Instructor'}`;

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: pupil.phone,
              From: twilioPhone,
              Body: smsBody,
            }),
          }
        );

        if (response.ok) {
          console.log("SMS sent to:", pupil.phone);
        } else {
          console.error("SMS failed:", await response.text());
        }
      } catch (smsError) {
        console.error("SMS error (non-fatal):", smsError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifications sent",
        lessonsScheduled: lessons.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
