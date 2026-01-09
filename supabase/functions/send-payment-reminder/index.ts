import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  instructorId: string;
  instructorName: string;
  pupilIds?: string[]; // Optional - if not provided, send to all pupils with outstanding balance
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("Twilio credentials not configured - cannot send reminders");
      return new Response(
        JSON.stringify({ success: false, error: "SMS service not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const data: PaymentReminderRequest = await req.json();

    console.log("Payment reminder request:", data);

    // Fetch pupils with outstanding balances (negative balance)
    let query = supabase
      .from("pupils")
      .select("id, name, phone, account_balance")
      .eq("instructor_id", data.instructorId)
      .lt("account_balance", 0);

    // If specific pupil IDs provided, filter to those
    if (data.pupilIds && data.pupilIds.length > 0) {
      query = query.in("id", data.pupilIds);
    }

    const { data: pupils, error: pupilsError } = await query;

    if (pupilsError) {
      console.error("Error fetching pupils:", pupilsError);
      throw pupilsError;
    }

    if (!pupils || pupils.length === 0) {
      console.log("No pupils with outstanding balances found");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No pupils with outstanding balances" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pupils.length} pupils with outstanding balances`);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as { name: string; status: string; error?: string }[]
    };

    // Send reminders to each pupil
    for (const pupil of pupils) {
      if (!pupil.phone) {
        console.log(`Skipping ${pupil.name} - no phone number`);
        results.skipped++;
        results.details.push({ name: pupil.name, status: "skipped", error: "No phone number" });
        continue;
      }

      const amountOwed = Math.abs(Number(pupil.account_balance));
      const formattedAmount = `£${amountOwed.toFixed(2)}`;

      const message = `💳 Payment Reminder: Hi ${pupil.name}, you have an outstanding balance of ${formattedAmount} for your driving lessons. Please arrange payment at your earliest convenience. Thank you! - ${data.instructorName}`;

      console.log(`Sending reminder to ${pupil.name} at ${pupil.phone}`);

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

        const result = await response.json();

        if (response.ok) {
          console.log(`SMS sent to ${pupil.name}:`, result.sid);
          results.sent++;
          results.details.push({ name: pupil.name, status: "sent" });
        } else {
          console.error(`Failed to send to ${pupil.name}:`, result);
          results.failed++;
          results.details.push({ name: pupil.name, status: "failed", error: result.message });
        }
      } catch (smsError) {
        console.error(`Error sending to ${pupil.name}:`, smsError);
        results.failed++;
        results.details.push({ 
          name: pupil.name, 
          status: "failed", 
          error: smsError instanceof Error ? smsError.message : "Unknown error" 
        });
      }
    }

    console.log("Reminder results:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.sent,
        failed: results.failed,
        skipped: results.skipped,
        details: results.details
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-payment-reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
