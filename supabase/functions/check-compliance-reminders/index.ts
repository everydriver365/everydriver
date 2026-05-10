import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldSendToInstructor } from "../_shared/notify-gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ComplianceItem {
  type: string;
  label: string;
  expiryField: string;
}

// Instructor-level compliance items
const instructorComplianceItems: ComplianceItem[] = [
  { type: "adi_badge", label: "ADI Badge", expiryField: "adi_badge_expiry" },
  { type: "car_insurance", label: "Car Insurance", expiryField: "car_insurance_expiry" },
  { type: "car_mot", label: "MOT Certificate", expiryField: "car_mot_expiry" },
  { type: "car_tax", label: "Road Tax", expiryField: "car_tax_expiry" },
  { type: "dbs_certificate", label: "DBS Certificate", expiryField: "dbs_certificate_expiry" },
];

// Vehicle-level compliance items
interface VehicleComplianceItem {
  type: string;
  label: string;
  expiryField: string;
}

const vehicleComplianceItems: VehicleComplianceItem[] = [
  { type: "vehicle_mot", label: "Vehicle MOT", expiryField: "mot_expiry" },
  { type: "vehicle_insurance", label: "Vehicle Insurance", expiryField: "insurance_expiry" },
  { type: "vehicle_tax", label: "Vehicle Tax", expiryField: "tax_expiry" },
];

const reminderDays = [30, 14, 7, 1];

async function sendEmail(resendApiKey: string, to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EveryDriver <notifications@everydriver.co.uk>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error: ${error}`);
  }
  
  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active instructors with compliance dates
    const { data: instructors, error: fetchError } = await supabase
      .from("instructors")
      .select("id, name, email, phone, adi_badge_expiry, car_insurance_expiry, car_mot_expiry, car_tax_expiry, dbs_certificate_expiry")
      .eq("is_active", true);

    if (fetchError) {
      throw fetchError;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let remindersSent = 0;

    // Process instructor-level compliance
    for (const instructor of instructors || []) {
      for (const item of instructorComplianceItems) {
        const expiryDateStr = instructor[item.expiryField as keyof typeof instructor] as string | null;
        
        if (!expiryDateStr) continue;

        const expiryDate = new Date(expiryDateStr);
        expiryDate.setHours(0, 0, 0, 0);
        
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check if we should send a reminder at this day interval
        if (!reminderDays.includes(daysUntilExpiry)) continue;

        // Check if we already sent this reminder
        const { data: existingReminder } = await supabase
          .from("compliance_reminders")
          .select("id")
          .eq("instructor_id", instructor.id)
          .eq("reminder_type", item.type)
          .eq("days_before", daysUntilExpiry)
          .eq("expiry_date", expiryDateStr)
          .is("vehicle_id", null)
          .maybeSingle();

        if (existingReminder) continue;

        // Determine urgency
        const isUrgent = daysUntilExpiry <= 7;
        const urgencyText = daysUntilExpiry === 1 ? "TOMORROW" : 
                           daysUntilExpiry <= 7 ? "URGENT" : "Reminder";

        // Compliance is treated as system + important so cadence and quiet
        // hours are bypassed, but a hard category mute still suppresses it.
        const emailGate = await shouldSendToInstructor(supabase, instructor.id, {
          category: "system", channel: "email", importance: "important",
        });
        const smsGate = await shouldSendToInstructor(supabase, instructor.id, {
          category: "system", channel: "sms", importance: "important",
        });

        // Send email if Resend is configured
        if (emailGate.allow && resendApiKey && instructor.email) {
          try {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: ${isUrgent ? '#dc2626' : '#3b82f6'};">${item.label} Expiry ${urgencyText}</h2>
                <p>Hi ${instructor.name},</p>
                <p>This is a reminder that your <strong>${item.label}</strong> expires on <strong>${new Date(expiryDateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
                ${isUrgent ? '<p style="color: #dc2626; font-weight: bold;">⚠️ You must renew this before it expires to continue teaching legally.</p>' : ''}
                <p>Please ensure you renew it before the expiry date to avoid any disruption to your teaching.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">This is an automated reminder from EveryDriver. Log in to your instructor portal to update your compliance dates.</p>
              </div>
            `;

            await sendEmail(
              resendApiKey,
              instructor.email,
              `${urgencyText}: Your ${item.label} expires ${daysUntilExpiry === 1 ? "tomorrow" : `in ${daysUntilExpiry} days`}`,
              emailHtml
            );

            // Log the reminder
            await supabase.from("compliance_reminders").insert({
              instructor_id: instructor.id,
              reminder_type: item.type,
              expiry_date: expiryDateStr,
              days_before: daysUntilExpiry,
              sent_via: "email",
            });

            remindersSent++;
            console.log(`Email sent to ${instructor.email} for ${item.label} (${daysUntilExpiry} days)`);
          } catch (emailError) {
            console.error(`Failed to send email to ${instructor.email}:`, emailError);
          }
        }

        // Send SMS for urgent reminders (7 days or less)
        if (smsGate.allow && isUrgent && twilioSid && twilioToken && twilioPhone && instructor.phone) {
          try {
            const formattedPhone = instructor.phone.startsWith("+") 
              ? instructor.phone 
              : `+44${instructor.phone.replace(/^0/, "")}`;

            const smsMessage = daysUntilExpiry === 1
              ? `⚠️ URGENT: Your ${item.label} expires TOMORROW. Please renew immediately to continue teaching. - EveryDriver`
              : `⚠️ Reminder: Your ${item.label} expires in ${daysUntilExpiry} days (${new Date(expiryDateStr).toLocaleDateString('en-GB')}). Please renew soon. - EveryDriver`;

            const twilioResponse = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: formattedPhone,
                  From: twilioPhone,
                  Body: smsMessage,
                }),
              }
            );

            if (twilioResponse.ok) {
              // Log the SMS reminder
              await supabase.from("compliance_reminders").insert({
                instructor_id: instructor.id,
                reminder_type: item.type,
                expiry_date: expiryDateStr,
                days_before: daysUntilExpiry,
                sent_via: "sms",
              });
              
              remindersSent++;
              console.log(`SMS sent to ${instructor.phone} for ${item.label} (${daysUntilExpiry} days)`);
            }
          } catch (smsError) {
            console.error(`Failed to send SMS to ${instructor.phone}:`, smsError);
          }
        }
      }
    }

    // Process vehicle-level compliance
    const { data: vehicles, error: vehicleError } = await supabase
      .from("instructor_vehicles")
      .select(`
        id,
        registration,
        make,
        model,
        mot_expiry,
        insurance_expiry,
        tax_expiry,
        instructor_id,
        instructors!inner (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("is_active", true);

    if (vehicleError) {
      console.error("Error fetching vehicles:", vehicleError);
    }

    for (const vehicle of vehicles || []) {
      const instructor = vehicle.instructors as unknown as { id: string; name: string; email: string | null; phone: string | null };
      
      for (const item of vehicleComplianceItems) {
        const expiryDateStr = vehicle[item.expiryField as keyof typeof vehicle] as string | null;
        
        if (!expiryDateStr) continue;

        const expiryDate = new Date(expiryDateStr);
        expiryDate.setHours(0, 0, 0, 0);
        
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Check if we should send a reminder at this day interval
        if (!reminderDays.includes(daysUntilExpiry)) continue;

        // Check if we already sent this reminder for this vehicle
        const { data: existingReminder } = await supabase
          .from("compliance_reminders")
          .select("id")
          .eq("instructor_id", instructor.id)
          .eq("vehicle_id", vehicle.id)
          .eq("reminder_type", item.type)
          .eq("days_before", daysUntilExpiry)
          .eq("expiry_date", expiryDateStr)
          .maybeSingle();

        if (existingReminder) continue;

        // Determine urgency
        const isUrgent = daysUntilExpiry <= 7;
        const urgencyText = daysUntilExpiry === 1 ? "TOMORROW" : 
                           daysUntilExpiry <= 7 ? "URGENT" : "Reminder";
        const vehicleLabel = `${vehicle.registration}${vehicle.make ? ` (${vehicle.make}${vehicle.model ? ` ${vehicle.model}` : ''})` : ''}`;

        // Send email if Resend is configured
        if (resendApiKey && instructor.email) {
          try {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: ${isUrgent ? '#dc2626' : '#3b82f6'};">${item.label} Expiry ${urgencyText}</h2>
                <p>Hi ${instructor.name},</p>
                <p>This is a reminder that the <strong>${item.label}</strong> for your vehicle <strong>${vehicleLabel}</strong> expires on <strong>${new Date(expiryDateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
                ${isUrgent ? '<p style="color: #dc2626; font-weight: bold;">⚠️ You must renew this before it expires to continue using this vehicle for teaching.</p>' : ''}
                <p>Please ensure you renew it before the expiry date to avoid any disruption to your teaching.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">This is an automated reminder from EveryDriver. Log in to your instructor portal to update your vehicle compliance dates.</p>
              </div>
            `;

            await sendEmail(
              resendApiKey,
              instructor.email,
              `${urgencyText}: ${item.label} for ${vehicle.registration} expires ${daysUntilExpiry === 1 ? "tomorrow" : `in ${daysUntilExpiry} days`}`,
              emailHtml
            );

            // Log the reminder with vehicle_id
            await supabase.from("compliance_reminders").insert({
              instructor_id: instructor.id,
              vehicle_id: vehicle.id,
              reminder_type: item.type,
              expiry_date: expiryDateStr,
              days_before: daysUntilExpiry,
              sent_via: "email",
            });

            remindersSent++;
            console.log(`Vehicle email sent to ${instructor.email} for ${vehicle.registration} ${item.label} (${daysUntilExpiry} days)`);
          } catch (emailError) {
            console.error(`Failed to send vehicle email to ${instructor.email}:`, emailError);
          }
        }

        // Send SMS for urgent reminders (7 days or less)
        if (isUrgent && twilioSid && twilioToken && twilioPhone && instructor.phone) {
          try {
            const formattedPhone = instructor.phone.startsWith("+") 
              ? instructor.phone 
              : `+44${instructor.phone.replace(/^0/, "")}`;

            const smsMessage = daysUntilExpiry === 1
              ? `⚠️ URGENT: ${item.label} for ${vehicle.registration} expires TOMORROW. Please renew immediately. - EveryDriver`
              : `⚠️ Reminder: ${item.label} for ${vehicle.registration} expires in ${daysUntilExpiry} days (${new Date(expiryDateStr).toLocaleDateString('en-GB')}). Please renew soon. - EveryDriver`;

            const twilioResponse = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: formattedPhone,
                  From: twilioPhone,
                  Body: smsMessage,
                }),
              }
            );

            if (twilioResponse.ok) {
              // Log the SMS reminder with vehicle_id
              await supabase.from("compliance_reminders").insert({
                instructor_id: instructor.id,
                vehicle_id: vehicle.id,
                reminder_type: item.type,
                expiry_date: expiryDateStr,
                days_before: daysUntilExpiry,
                sent_via: "sms",
              });
              
              remindersSent++;
              console.log(`Vehicle SMS sent to ${instructor.phone} for ${vehicle.registration} ${item.label} (${daysUntilExpiry} days)`);
            }
          } catch (smsError) {
            console.error(`Failed to send vehicle SMS to ${instructor.phone}:`, smsError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${instructors?.length || 0} instructors, sent ${remindersSent} reminders` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in compliance reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
