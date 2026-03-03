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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const REMINDER_INTERVAL_DAYS = 7;
    const MAX_REMINDERS = 3;

    // Find active pupils with negative balance
    const { data: debtors, error: debtorsError } = await supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance, instructor_id")
      .eq("is_active", true)
      .lt("account_balance", 0);

    if (debtorsError) {
      console.error("Error fetching debtors:", debtorsError);
      throw debtorsError;
    }

    if (!debtors || debtors.length === 0) {
      console.log("No pupils with outstanding balances");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${debtors.length} pupils with outstanding balances`);

    // Get recent reminder logs to avoid spamming
    const sevenDaysAgo = new Date(Date.now() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentReminders } = await supabase
      .from("payment_reminder_log")
      .select("pupil_id, channel, sent_at")
      .gte("sent_at", sevenDaysAgo);

    // Count total reminders per pupil (all time)
    const pupilIds = debtors.map(d => d.id);
    const { data: allReminders } = await supabase
      .from("payment_reminder_log")
      .select("pupil_id")
      .in("pupil_id", pupilIds);

    const reminderCounts: Record<string, number> = {};
    (allReminders || []).forEach((r: any) => {
      reminderCounts[r.pupil_id] = (reminderCounts[r.pupil_id] || 0) + 1;
    });

    // Build set of recently reminded pupils
    const recentlyReminded = new Set(
      (recentReminders || []).map((r: any) => r.pupil_id)
    );

    // Get instructor names for message personalization
    const instructorIds = [...new Set(debtors.map(d => d.instructor_id))];
    const { data: instructorData } = await supabase
      .from("instructors")
      .select("id, name")
      .in("id", instructorIds);

    const instructorNames: Record<string, string> = {};
    (instructorData || []).forEach((i: any) => { instructorNames[i.id] = i.name; });

    let smsSent = 0, emailSent = 0, pushSent = 0, skipped = 0;

    for (const pupil of debtors) {
      // Skip if reminded recently or max reminders reached
      if (recentlyReminded.has(pupil.id)) {
        skipped++;
        continue;
      }
      if ((reminderCounts[pupil.id] || 0) >= MAX_REMINDERS) {
        skipped++;
        continue;
      }

      const amountOwed = Math.abs(Number(pupil.account_balance));
      const formattedAmount = `£${amountOwed.toFixed(2)}`;
      const instructorName = instructorNames[pupil.instructor_id] || "Your instructor";

      // Send SMS
      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && pupil.phone) {
        try {
          const message = `💳 Payment Reminder: Hi ${pupil.name}, you have an outstanding balance of ${formattedAmount} for your driving lessons. Please arrange payment at your earliest convenience. Thank you! - ${instructorName}`;
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ To: pupil.phone, From: twilioPhoneNumber, Body: message }),
            }
          );
          if (response.ok) {
            smsSent++;
            await supabase.from("payment_reminder_log").insert({
              pupil_id: pupil.id,
              instructor_id: pupil.instructor_id,
              reminder_type: "outstanding_balance",
              channel: "sms",
              amount_owed: amountOwed,
            });
          }
          await response.text(); // consume body
        } catch (e) {
          console.error(`SMS failed for ${pupil.name}:`, e);
        }
      }

      // Send Email
      if (resendApiKey && pupil.email) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "EveryDriver <noreply@everydriver.lovable.app>",
              to: [pupil.email],
              subject: `Payment Reminder - ${formattedAmount} Outstanding`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Payment Reminder</h2>
                  <p>Hi ${pupil.name},</p>
                  <p>This is a friendly reminder that you have an outstanding balance of <strong>${formattedAmount}</strong> for your driving lessons with ${instructorName}.</p>
                  <p>Please arrange payment at your earliest convenience.</p>
                  <p>Thank you!</p>
                  <p style="color: #666; font-size: 12px;">- ${instructorName} via EveryDriver</p>
                </div>
              `,
            }),
          });
          if (response.ok) {
            emailSent++;
            await supabase.from("payment_reminder_log").insert({
              pupil_id: pupil.id,
              instructor_id: pupil.instructor_id,
              reminder_type: "outstanding_balance",
              channel: "email",
              amount_owed: amountOwed,
            });
          }
          await response.text();
        } catch (e) {
          console.error(`Email failed for ${pupil.name}:`, e);
        }
      }

      // Send Push Notification to instructor about outstanding pupil
      try {
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            instructorId: pupil.instructor_id,
            notification: {
              title: "Payment Reminder Sent",
              body: `Reminder sent to ${pupil.name} for ${formattedAmount} outstanding balance`,
              tag: `payment-reminder-${pupil.id}`,
              data: { type: "payment_reminder", pupilId: pupil.id },
            },
          }),
        });
        pushSent++;
      } catch (e) {
        console.error(`Push notification failed:`, e);
      }
    }

    const result = { success: true, processed: debtors.length, smsSent, emailSent, pushSent, skipped };
    console.log("Auto payment reminders result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auto payment reminders error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
