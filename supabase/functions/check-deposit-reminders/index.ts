import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(resendApiKey: string, to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EveryDriver <noreply@everydriver.co.uk>",
      to: [to],
      subject,
      html,
    }),
  });
  return response.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("Checking deposit reminders for:", today.toISOString().split('T')[0]);

    // Find pupils with deposit payments and outstanding balances
    const { data: pupils, error: pupilsError } = await supabase
      .from("pupils")
      .select(`
        id, name, email, phone, account_balance, balance_due_date, deposit_paid,
        instructor:instructors(id, name, email, phone)
      `)
      .eq("payment_type", "deposit")
      .lt("account_balance", 0)
      .eq("deposit_forfeited", false)
      .not("balance_due_date", "is", null);

    if (pupilsError) {
      console.error("Error fetching pupils:", pupilsError);
      throw pupilsError;
    }

    console.log(`Found ${pupils?.length || 0} pupils with outstanding deposits`);

    const results = {
      reminders_14_days: 0,
      reminders_7_days: 0,
      reminders_1_day: 0,
      forfeitures: 0,
      errors: [] as string[],
    };

    for (const pupil of pupils || []) {
      const dueDate = new Date(pupil.balance_due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const amountOwed = Math.abs(Number(pupil.account_balance));
      const formattedAmount = `£${amountOwed.toFixed(2)}`;
      const formattedDueDate = dueDate.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });

      const instructor = Array.isArray(pupil.instructor) ? pupil.instructor[0] : pupil.instructor;
      if (!instructor) continue;

      let reminderType: "14_days" | "7_days" | "1_day" | "overdue" | null = null;

      if (daysUntilDue === 14) reminderType = "14_days";
      else if (daysUntilDue === 7) reminderType = "7_days";
      else if (daysUntilDue === 1) reminderType = "1_day";
      else if (daysUntilDue < 0) reminderType = "overdue";

      if (!reminderType) continue;

      console.log(`Processing ${reminderType} reminder for ${pupil.name} (${pupil.id})`);

      // Handle overdue - forfeit deposit and cancel lessons
      if (reminderType === "overdue") {
        // Mark deposit as forfeited
        await supabase
          .from("pupils")
          .update({ deposit_forfeited: true })
          .eq("id", pupil.id);

        // Cancel all scheduled lessons
        await supabase
          .from("scheduled_lessons")
          .update({ status: "cancelled" })
          .eq("pupil_id", pupil.id)
          .eq("status", "scheduled");

        results.forfeitures++;

        // Notify instructor
        if (instructor.phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          const message = `⚠️ BOOKING CANCELLED: ${pupil.name}'s deposit has been forfeited due to non-payment. Their lessons have been cancelled.`;
          
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: instructor.phone,
                From: twilioPhoneNumber,
                Body: message,
              }),
            }
          );
        }
        continue;
      }

      // Send reminder SMS to pupil
      if (pupil.phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        let urgency = "";
        if (reminderType === "14_days") urgency = "📅 Reminder:";
        else if (reminderType === "7_days") urgency = "⏰ Important:";
        else if (reminderType === "1_day") urgency = "🚨 URGENT:";

        const smsMessage = `${urgency} Your driving course balance of ${formattedAmount} is due by ${formattedDueDate}. Please arrange payment with ${instructor.name} to avoid cancellation and forfeit of your deposit.`;

        try {
          await fetch(
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
                Body: smsMessage,
              }),
            }
          );
          console.log(`SMS sent to ${pupil.name}`);
        } catch (smsError) {
          console.error(`SMS failed for ${pupil.name}:`, smsError);
          results.errors.push(`SMS to ${pupil.name}: ${smsError}`);
        }
      }

      // Send reminder email to pupil
      if (pupil.email && resendApiKey) {
        let subject = "";
        let urgencyText = "";
        
        if (reminderType === "14_days") {
          subject = `Payment Reminder: ${formattedAmount} due in 2 weeks`;
          urgencyText = "This is a friendly reminder that";
        } else if (reminderType === "7_days") {
          subject = `Important: ${formattedAmount} payment due in 7 days`;
          urgencyText = "This is an important reminder that";
        } else if (reminderType === "1_day") {
          subject = `🚨 URGENT: ${formattedAmount} payment due tomorrow`;
          urgencyText = "URGENT: This is your final reminder that";
        }

        try {
          await sendEmail(
            resendApiKey,
            pupil.email,
            subject,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Payment Reminder</h2>
                <p>Hi ${pupil.name},</p>
                <p>${urgencyText} your remaining course balance of <strong>${formattedAmount}</strong> is due by <strong>${formattedDueDate}</strong>.</p>
                
                <div style="background: ${reminderType === "1_day" ? "#fee2e2" : "#fef3c7"}; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold; color: ${reminderType === "1_day" ? "#dc2626" : "#d97706"};">
                    ⚠️ If payment is not received by ${formattedDueDate}, your booking will be cancelled and your deposit of £${pupil.deposit_paid} will be forfeited.
                  </p>
                </div>
                
                <p>Please contact your instructor <strong>${instructor.name}</strong>${instructor.phone ? ` on ${instructor.phone}` : ''} to arrange payment.</p>
                
                <p style="color: #666; font-size: 14px;">Thank you,<br>Your Driving School</p>
              </div>
            `
          );
          console.log(`Email sent to ${pupil.name}`);
        } catch (emailError) {
          console.error(`Email failed for ${pupil.name}:`, emailError);
          results.errors.push(`Email to ${pupil.name}: ${emailError}`);
        }
      }

      // Increment counter
      if (reminderType === "14_days") results.reminders_14_days++;
      else if (reminderType === "7_days") results.reminders_7_days++;
      else if (reminderType === "1_day") results.reminders_1_day++;
    }

    console.log("Reminder results:", results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-deposit-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
