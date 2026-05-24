import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PushDataType, NotifyCategory, NotifyImportance, PupilNotifyType } from "../_shared/notification-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Only chase if balance owed is at least £5 (i.e. account_balance <= -5.00).
const MIN_CHASE_THRESHOLD = -5.00;
// Defaults applied when no instructor_reminder_preferences row exists.
const DEFAULT_INTERVAL_DAYS = 7;
const DEFAULT_MAX_REMINDERS = 3;
const DEFAULT_CHASE_ENABLED = true;

type Tier = 1 | 2 | 3;

function tierFor(reminderCount: number): Tier {
  if (reminderCount <= 0) return 1;
  if (reminderCount === 1) return 2;
  return 3;
}

function smsBody(tier: Tier, pupilName: string, amount: string, instructorName: string): string {
  switch (tier) {
    case 1:
      return `Hi ${pupilName}, just a reminder that you have ${amount} outstanding with ${instructorName}. Please arrange payment at your earliest convenience.`;
    case 2:
      return `Hi ${pupilName}, your outstanding balance of ${amount} is now overdue. Please pay as soon as possible to continue your lessons with ${instructorName}.`;
    case 3:
      return `Final reminder: ${amount} is outstanding on your account with ${instructorName}. Please contact your instructor urgently.`;
  }
}

function emailSubject(tier: Tier, amount: string): string {
  switch (tier) {
    case 1: return `Payment reminder — ${amount} outstanding`;
    case 2: return `Overdue: ${amount} outstanding`;
    case 3: return `Final reminder — ${amount} outstanding`;
  }
}

function emailHtml(tier: Tier, pupilName: string, amount: string, instructorName: string): string {
  const heading = tier === 1 ? "Payment reminder" : tier === 2 ? "Payment overdue" : "Final reminder";
  const message = smsBody(tier, pupilName, amount, instructorName);
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${heading}</h2>
      <p>${message}</p>
      <p>Thank you.</p>
      <p style="color: #666; font-size: 12px;">- ${instructorName} via EveryDriver</p>
    </div>
  `;
}

function pushBody(tier: Tier, amount: string, instructorName: string): string {
  switch (tier) {
    case 1: return `You have ${amount} outstanding with ${instructorName}. Tap to view.`;
    case 2: return `${amount} is overdue with ${instructorName}. Tap to pay.`;
    case 3: return `Final reminder: ${amount} outstanding with ${instructorName}. Tap to pay.`;
  }
}

function pushTitle(tier: Tier): string {
  switch (tier) {
    case 1: return "Payment reminder 💳";
    case 2: return "Payment overdue 💳";
    case 3: return "Final reminder 💳";
  }
}

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

    // Find active pupils owing at least the minimum threshold.
    const { data: debtors, error: debtorsError } = await supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance, instructor_id")
      .eq("is_active", true)
      .lte("account_balance", MIN_CHASE_THRESHOLD);

    if (debtorsError) {
      console.error("Error fetching debtors:", debtorsError);
      throw debtorsError;
    }

    if (!debtors || debtors.length === 0) {
      console.log("No pupils above chase threshold");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${debtors.length} pupils above chase threshold (${MIN_CHASE_THRESHOLD})`);

    // Load per-instructor chasing prefs for all involved instructors.
    const instructorIds = [...new Set(debtors.map(d => d.instructor_id))];
    const { data: prefRows } = await supabase
      .from("instructor_reminder_preferences")
      .select("instructor_id, payment_chase_enabled, payment_chase_interval_days, payment_chase_max_reminders")
      .in("instructor_id", instructorIds);

    const prefs: Record<string, { enabled: boolean; interval: number; max: number }> = {};
    (prefRows || []).forEach((r: any) => {
      prefs[r.instructor_id] = {
        enabled: r.payment_chase_enabled ?? DEFAULT_CHASE_ENABLED,
        interval: r.payment_chase_interval_days ?? DEFAULT_INTERVAL_DAYS,
        max: r.payment_chase_max_reminders ?? DEFAULT_MAX_REMINDERS,
      };
    });

    // Per-pupil all-time reminder count.
    const pupilIds = debtors.map(d => d.id);
    const { data: allReminders } = await supabase
      .from("payment_reminder_log")
      .select("pupil_id, sent_at")
      .in("pupil_id", pupilIds);

    const reminderCounts: Record<string, number> = {};
    const lastSentAt: Record<string, string> = {};
    (allReminders || []).forEach((r: any) => {
      reminderCounts[r.pupil_id] = (reminderCounts[r.pupil_id] || 0) + 1;
      if (!lastSentAt[r.pupil_id] || r.sent_at > lastSentAt[r.pupil_id]) {
        lastSentAt[r.pupil_id] = r.sent_at;
      }
    });

    // Instructor names + slug context (slug lookup used for push deep-link reference; notify-pupil builds the actual URL itself).
    const { data: instructorData } = await supabase
      .from("instructors")
      .select("id, name")
      .in("id", instructorIds);
    const instructorNames: Record<string, string> = {};
    (instructorData || []).forEach((i: any) => { instructorNames[i.id] = i.name; });

    let smsSent = 0, emailSent = 0, pushSent = 0, instructorPushSent = 0;
    const skippedReasons: Record<string, number> = {};
    const bump = (reason: string) => { skippedReasons[reason] = (skippedReasons[reason] || 0) + 1; };

    for (const pupil of debtors) {
      const pref = prefs[pupil.instructor_id] || {
        enabled: DEFAULT_CHASE_ENABLED,
        interval: DEFAULT_INTERVAL_DAYS,
        max: DEFAULT_MAX_REMINDERS,
      };

      if (!pref.enabled) {
        bump("instructor_disabled");
        continue;
      }

      const count = reminderCounts[pupil.id] || 0;
      if (count >= pref.max) {
        bump("max_reached");
        continue;
      }

      // Interval gate: must be at least `interval` days since last reminder.
      const last = lastSentAt[pupil.id];
      if (last) {
        const ageMs = Date.now() - new Date(last).getTime();
        if (ageMs < pref.interval * 24 * 60 * 60 * 1000) {
          bump("within_interval");
          continue;
        }
      }

      const amountOwed = Math.abs(Number(pupil.account_balance));
      const formattedAmount = `£${amountOwed.toFixed(2)}`;
      const instructorName = instructorNames[pupil.instructor_id] || "Your instructor";
      const tier: Tier = tierFor(count);

      // 1) SMS
      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && pupil.phone) {
        try {
          const body = `💳 ${smsBody(tier, pupil.name, formattedAmount, instructorName)}`;
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ To: pupil.phone, From: twilioPhoneNumber, Body: body }),
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
          await response.text();
        } catch (e) {
          console.error(`SMS failed for ${pupil.name}:`, e);
        }
      }

      // 2) Email
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
              subject: emailSubject(tier, formattedAmount),
              html: emailHtml(tier, pupil.name, formattedAmount, instructorName),
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

      // 3) Pupil push (additive) — only if subscription exists. notify-pupil builds the branded URL.
      try {
        const [{ count: webCount }, { count: nativeCount }] = await Promise.all([
          supabase.from("pupil_push_subscriptions").select("id", { count: "exact", head: true }).eq("pupil_id", pupil.id),
          supabase.from("pupil_native_push_bindings").select("id", { count: "exact", head: true }).eq("pupil_id", pupil.id),
        ]);

        const hasSubscription = (webCount ?? 0) > 0 || (nativeCount ?? 0) > 0;
        if (hasSubscription) {
          const pushResp = await fetch(`${supabaseUrl}/functions/v1/notify-pupil`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              pupilId: pupil.id,
              type: PupilNotifyType.PAYMENT_REMINDER,
              title: pushTitle(tier),
              body: pushBody(tier, formattedAmount, instructorName),
              data: {
                type: PushDataType.PAYMENT_REMINDER,
                section: "payments",
                amount: amountOwed,
                tier,
              },
            }),
          });
          if (pushResp.ok) {
            pushSent++;
            await supabase.from("payment_reminder_log").insert({
              pupil_id: pupil.id,
              instructor_id: pupil.instructor_id,
              reminder_type: "outstanding_balance",
              channel: "push",
              amount_owed: amountOwed,
            });
          }
          await pushResp.text();
        }
      } catch (e) {
        console.error(`Pupil push failed for ${pupil.name}:`, e);
      }

      // 4) Instructor heads-up push (existing behaviour).
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            instructorId: pupil.instructor_id,
            category: NotifyCategory.PAYMENT,
            importance: NotifyImportance.IMPORTANT,
            pupilId: pupil.id,
            notification: {
              title: "Payment Reminder Sent",
              body: `Tier ${tier} reminder sent to ${pupil.name} for ${formattedAmount} outstanding`,
              tag: `payment-reminder-${pupil.id}`,
              data: { type: PushDataType.PAYMENT_REMINDER, pupilId: pupil.id, tier },
            },
          }),
        });
        instructorPushSent++;
      } catch (e) {
        console.error(`Instructor push failed:`, e);
      }
    }

    const result = {
      success: true,
      processed: debtors.length,
      smsSent,
      emailSent,
      pushSent,
      instructorPushSent,
      skipped: skippedReasons,
    };
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
