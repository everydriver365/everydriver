import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Send push notification to instructor
async function sendPushNotification(
  supabase: any,
  instructorId: string,
  title: string,
  body: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  try {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('instructor_id', instructorId);

    if (!subscriptions?.length) return;

    for (const sub of subscriptions) {
      try {
        const payload = JSON.stringify({
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        });

        // Web Push API call would go here
        // For now, we log the attempt
        console.log(`Push notification queued for instructor ${instructorId}`);
      } catch (pushErr) {
        console.error('Push send error:', pushErr);
      }
    }
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lessons scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`Fetching lessons for ${tomorrowStr}`);

    const { data: lessons, error: lessonsError } = await supabase
      .from("scheduled_lessons")
      .select(`
        id,
        lesson_date,
        start_time,
        duration_minutes,
        pickup_location,
        pickup_postcode,
        pupil_id,
        instructor_id,
        pupils (
          id,
          name,
          email,
          phone
        ),
        instructors (
          id,
          name,
          phone,
          email
        )
      `)
      .eq("lesson_date", tomorrowStr)
      .eq("status", "scheduled");

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} lessons for tomorrow`);

    // Get instructor preferences
    const instructorIds = [...new Set(lessons?.map(l => l.instructor_id) || [])];
    const { data: preferences } = await supabase
      .from("instructor_reminder_preferences")
      .select("*")
      .in("instructor_id", instructorIds);

    const prefsMap = new Map(preferences?.map(p => [p.instructor_id, p]) || []);

    const results = {
      totalLessons: lessons?.length || 0,
      emailsSent: 0,
      smsSent: 0,
      pushSent: 0,
      skipped: 0,
      errors: [] as string[],
    };

  for (const lesson of lessons || []) {
      const pupil = Array.isArray(lesson.pupils) ? lesson.pupils[0] : lesson.pupils;
      const instructor = Array.isArray(lesson.instructors) ? lesson.instructors[0] : lesson.instructors;

      if (!pupil) {
        console.log(`Skipping lesson ${lesson.id} - no pupil data`);
        results.skipped++;
        continue;
      }

      // Get instructor preferences (default to all enabled if not set)
      const prefs = prefsMap.get(lesson.instructor_id) || {
        sms_enabled: true,
        email_enabled: true,
        push_enabled: true,
      };

      // Format time for display
      const formatTime = (time: string) => {
        const [h, m] = time.slice(0, 5).split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "pm" : "am";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${m}${ampm}`;
      };

      const lessonDate = new Date(lesson.lesson_date);
      const formattedDate = lessonDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const startTime = lesson.start_time?.slice(0, 5) || '09:00';
      const displayTime = formatTime(startTime);
      const durationHours = (lesson.duration_minutes || 60) / 60;

      // Send EMAIL reminder (if enabled)
      if (prefs.email_enabled && resendApiKey && pupil.email) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">Lesson Reminder - Tomorrow! 🚗</h2>
              <p>Hi ${pupil.name},</p>
              <p>This is a friendly reminder that you have a driving lesson scheduled for <strong>tomorrow</strong>:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 0 0 8px 0;"><strong>🕐 Time:</strong> ${displayTime}</p>
                <p style="margin: 0 0 8px 0;"><strong>⏱️ Duration:</strong> ${durationHours} hour${durationHours !== 1 ? 's' : ''}</p>
                ${lesson.pickup_location ? `<p style="margin: 0;"><strong>📍 Pickup:</strong> ${lesson.pickup_location}${lesson.pickup_postcode ? `, ${lesson.pickup_postcode}` : ''}</p>` : ''}
              </div>
              
              <h3 style="color: #374151; margin-top: 24px;">Before your lesson, please remember to:</h3>
              <ul style="color: #4b5563;">
                <li>Bring your provisional driving licence</li>
                <li>Wear comfortable shoes suitable for driving</li>
                <li>Be ready at your pickup location 5 minutes early</li>
                <li>Bring glasses/contact lenses if you need them for driving</li>
              </ul>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                Need to reschedule? Please contact ${instructor?.name || 'your instructor'} as soon as possible.
              </p>
              
              <p style="margin-top: 24px;">See you tomorrow!<br><strong>${instructor?.name || 'Your Instructor'}</strong></p>
            </div>
          `;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Drive365 <noreply@drive365.co.uk>",
              to: pupil.email,
              subject: `Reminder: Driving Lesson Tomorrow at ${displayTime} 🚗`,
              html: emailHtml,
            }),
          });

          if (emailResponse.ok) {
            console.log(`Email sent to ${pupil.email} for lesson ${lesson.id}`);
            results.emailsSent++;
          } else {
            const errorText = await emailResponse.text();
            console.error(`Failed to send email for lesson ${lesson.id}:`, errorText);
            results.errors.push(`Email ${lesson.id}: ${errorText}`);
          }
        } catch (emailError) {
          console.error(`Email error for lesson ${lesson.id}:`, emailError);
          results.errors.push(`Email ${lesson.id}: ${emailError instanceof Error ? emailError.message : "Unknown"}`);
        }
      }

      // Send SMS reminder (if enabled)
      if (prefs.sms_enabled && twilioAccountSid && twilioAuthToken && twilioPhoneNumber && pupil.phone) {
        const message = `Hi ${pupil.name}! 🚗 Reminder: Your driving lesson is tomorrow at ${displayTime} with ${instructor?.name || "your instructor"}. Pickup: ${lesson.pickup_location || "As arranged"}. Duration: ${lesson.duration_minutes} mins. See you then!`;

        try {
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: pupil.phone,
                From: twilioPhoneNumber,
                Body: message,
              }),
            }
          );

          if (response.ok) {
            console.log(`SMS sent to ${pupil.name} for lesson ${lesson.id}`);
            results.smsSent++;
          } else {
            const errorData = await response.json();
            console.error(`Failed to send SMS for lesson ${lesson.id}:`, errorData);
            results.errors.push(`SMS ${lesson.id}: ${errorData.message || "Unknown error"}`);
          }
        } catch (smsError) {
          console.error(`Error sending SMS for lesson ${lesson.id}:`, smsError);
          results.errors.push(`SMS ${lesson.id}: ${smsError instanceof Error ? smsError.message : "Unknown error"}`);
        }
      }

      // Send PUSH notification to instructor (if enabled)
      if (prefs.push_enabled && vapidPublicKey && vapidPrivateKey) {
        try {
          await sendPushNotification(
            supabase,
            lesson.instructor_id,
            "Lesson Reminder Sent",
            `Reminder sent to ${pupil.name} for tomorrow's lesson at ${displayTime}`,
            vapidPublicKey,
            vapidPrivateKey
          );
          results.pushSent++;
        } catch (pushError) {
          console.error(`Push error for lesson ${lesson.id}:`, pushError);
        }
      }
    }

    console.log("Lesson reminders complete:", results);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-lesson-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
