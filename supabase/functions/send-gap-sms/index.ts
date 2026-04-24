import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GapSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface SendGapSmsRequest {
  instructorId: string;
  instructorName: string;
  slots: GapSlot[];
  discountType: "percentage" | "fixed" | null;
  discountValue: number | null;
  customMessage?: string;
  pupilId?: string; // Optional: target a single pupil instead of all instructor pupils
  pupilIds?: string[]; // Optional: target a specific subset of pupils (e.g. only those that fit the slot after travel time)
}

function formatPhoneToE164(rawPhone: string): string {
  // Format phone number to E.164 (UK numbers starting with 07 become +44...)
  let formatted = rawPhone.replace(/\s+/g, "");
  if (formatted.startsWith("07")) {
    formatted = "+44" + formatted.substring(1);
  } else if (!formatted.startsWith("+")) {
    formatted = "+" + formatted;
  }
  return formatted;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const twilioMessagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

    if (!twilioAccountSid || !twilioAuthToken || (!twilioPhoneNumber && !twilioMessagingServiceSid)) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { instructorId, instructorName, slots, discountType, discountValue, customMessage, pupilId, pupilIds }: SendGapSmsRequest = await req.json();

    console.log(`Sending gap SMS for instructor ${instructorId}, ${slots.length} slots${pupilId ? `, single pupil ${pupilId}` : ""}${pupilIds?.length ? `, targeted ${pupilIds.length} pupils` : ""}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pupils — single pupil, a feasibility-filtered subset, or all instructor pupils with phone numbers
    let pupilsQuery = supabase
      .from("pupils")
      .select("id, name, phone")
      .eq("instructor_id", instructorId)
      .not("phone", "is", null);

    if (pupilId) {
      pupilsQuery = pupilsQuery.eq("id", pupilId);
    } else if (Array.isArray(pupilIds) && pupilIds.length > 0) {
      pupilsQuery = pupilsQuery.in("id", pupilIds);
    }

    const { data: pupils, error: pupilsError } = await pupilsQuery;

    if (pupilsError) {
      console.error("Error fetching pupils:", pupilsError);
      throw new Error("Failed to fetch pupils");
    }

    if (!pupils || pupils.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No pupils with phone numbers found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit to 5 slots max
    const slotsToSend = slots.slice(0, 5);
    
    // Format slots for message with numbers
    const slotsText = slotsToSend.map((slot, index) => {
      const date = new Date(slot.date);
      const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
      const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `${index + 1}. ${dayName} ${dateStr} ${slot.startTime}-${slot.endTime}`;
    }).join("\n");

    // Build discount text
    let discountText = "";
    if (discountType && discountValue) {
      if (discountType === "percentage") {
        discountText = `\n\n🎉 SPECIAL OFFER: ${discountValue}% OFF if you book now!`;
      } else {
        discountText = `\n\n🎉 SPECIAL OFFER: £${discountValue} OFF if you book now!`;
      }
    }

    // Build reply instructions based on number of slots
    const replyInstructions = slotsToSend.length > 1
      ? `Reply with the number(s) to book (e.g. "1 and 3"), or NO to pass! - EveryDriver`
      : `Reply YES to book or NO to pass! - EveryDriver`;

    // Send SMS to each pupil and track offers
    const results = [];
    for (const pupil of pupils) {
      if (!pupil.phone) continue;

      const formattedPhone = formatPhoneToE164(pupil.phone);

      // Generate a batch ID to group offers for this pupil in this send
      const batchId = crypto.randomUUID();

      // For each slot, create a gap offer record with slot number
      const slotOffers = [];
      for (let i = 0; i < slotsToSend.length; i++) {
        const slot = slotsToSend[i];
        const { data: offerData, error: offerError } = await supabase
          .from("gap_offers")
          .insert({
            instructor_id: instructorId,
            pupil_id: pupil.id,
            // Store normalized phone so inbound replies (From is E.164) can match offers
            pupil_phone: formattedPhone,
            slot_date: slot.date,
            slot_start_time: slot.startTime,
            slot_end_time: slot.endTime,
            discount_type: discountType,
            discount_value: discountValue,
            status: "pending",
            slot_number: i + 1,
            batch_id: batchId,
          })
          .select("id")
          .single();

        if (!offerError && offerData) {
          slotOffers.push(offerData.id);
        }
      }

      const message = customMessage || 
        `Hi ${pupil.name}! I have some short notice lesson slots available if you want one:\n\n${slotsText}${discountText}\n\n${replyInstructions} - ${instructorName}`;

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        // Build request body - prioritize phone number for two-way SMS capability
        const smsBody: Record<string, string> = {
          To: formattedPhone,
          Body: message,
        };
        
        // Use phone number first (enables replies), fall back to Messaging Service
        if (twilioPhoneNumber) {
          smsBody.From = twilioPhoneNumber;
        } else if (twilioMessagingServiceSid) {
          smsBody.MessagingServiceSid = twilioMessagingServiceSid;
          console.warn("Using Messaging Service - replies may not work with alphanumeric sender ID");
        }

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(smsBody),
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`SMS sent to ${pupil.name}: ${result.sid}`);
          
          // Update offers with Twilio message SID
          if (slotOffers.length > 0) {
            await supabase
              .from("gap_offers")
              .update({ twilio_message_sid: result.sid })
              .in("id", slotOffers);
          }
          
          results.push({ pupilId: pupil.id, name: pupil.name, success: true, offerIds: slotOffers });
        } else {
          console.error(`Failed to send SMS to ${pupil.name}:`, result);
          results.push({ pupilId: pupil.id, name: pupil.name, success: false, error: result.message });
        }
      } catch (smsError) {
        console.error(`Error sending SMS to ${pupil.name}:`, smsError);
        results.push({ pupilId: pupil.id, name: pupil.name, success: false, error: String(smsError) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`SMS batch complete: ${successCount}/${results.length} sent successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount: successCount,
        totalPupils: results.length,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-gap-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
