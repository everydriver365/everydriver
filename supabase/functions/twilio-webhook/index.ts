import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twilio-signature",
};

// Verify Twilio request signature (HMAC-SHA1 of URL + sorted POST params, base64).
// https://www.twilio.com/docs/usage/webhooks/webhooks-security
async function verifyTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): Promise<boolean> {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  // base64 encode
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  const expected = btoa(bin);
  return expected === signature;
}

// Parse multiple slot numbers from response (e.g., "1 and 3", "1,3", "1 3", "1, 2, 3")
function parseSlotNumbers(body: string): number[] {
  // Remove common words and split by various separators
  const cleaned = body
    .replace(/\band\b/gi, " ")
    .replace(/[,;]/g, " ");
  
  const numbers: number[] = [];
  const matches = cleaned.match(/\d+/g);
  
  if (matches) {
    for (const match of matches) {
      const num = parseInt(match, 10);
      if (num >= 1 && num <= 5 && !numbers.includes(num)) {
        numbers.push(num);
      }
    }
  }
  
  return numbers.sort((a, b) => a - b);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse Twilio webhook data (application/x-www-form-urlencoded)
    const contentType = req.headers.get("content-type") || "";
    let from: string | null = null;
    let body: string | null = null;
    let messageSid: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      from = params.get("From");
      body = params.get("Body")?.toLowerCase().trim() || null;
      messageSid = params.get("MessageSid");
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      from = formData.get("From") as string;
      body = (formData.get("Body") as string)?.toLowerCase().trim() || null;
      messageSid = formData.get("MessageSid") as string;
    } else {
      // Try JSON as fallback
      try {
        const json = await req.json();
        from = json.From;
        body = json.Body?.toLowerCase().trim() || null;
        messageSid = json.MessageSid;
      } catch {
        console.log("Could not parse request body");
      }
    }

    console.log(`Received SMS from ${from}: "${body}"`);

    if (!from || !body) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Normalize phone number (remove spaces, ensure format)
    const normalizedPhone = from.replace(/\s+/g, "");

    // Parse slot numbers from response (supports "1", "1,3", "1 and 3", etc.)
    const slotNumbers = parseSlotNumbers(body);
    const hasNumericReply = slotNumbers.length > 0;

    // Check for yes/no responses
    const isAccepted = ["yes", "y", "book", "confirm", "ok", "sure", "please", "all"].some(
      keyword => body.includes(keyword)
    );
    const isDeclined = ["no", "n", "cancel", "decline", "pass", "skip"].some(
      keyword => body.includes(keyword)
    );

    // Handle decline
    if (isDeclined && !hasNumericReply) {
      const { data: offers } = await supabase
        .from("gap_offers")
        .select("id")
        .eq("pupil_phone", normalizedPhone)
        .eq("status", "pending");

      if (offers && offers.length > 0) {
        await supabase
          .from("gap_offers")
          .update({
            status: "declined",
            responded_at: new Date().toISOString(),
            response_message: body,
          })
          .eq("pupil_phone", normalizedPhone)
          .eq("status", "pending");

        console.log(`Declined ${offers.length} pending offers for ${normalizedPhone}`);
      }

      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Determine which slots to book
    let slotsToBook: number[] = [];
    
    if (hasNumericReply) {
      slotsToBook = slotNumbers;
    } else if (isAccepted) {
      // YES/ALL - book all available slots (or just first one for "yes")
      if (body.includes("all")) {
        slotsToBook = [1, 2, 3, 4, 5]; // Will filter to available ones
      } else {
        slotsToBook = [1]; // Just first slot for simple YES
      }
    }

    if (slotsToBook.length === 0) {
      console.log(`Unrecognized response: "${body}" from ${normalizedPhone}`);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Fetch pending offers for this phone number
    const { data: pendingOffers, error: offersError } = await supabase
      .from("gap_offers")
      .select(`
        id,
        instructor_id,
        pupil_id,
        slot_date,
        slot_start_time,
        slot_end_time,
        discount_type,
        discount_value,
        slot_number,
        batch_id,
        instructors!inner(id, name, auth_user_id, phone),
        pupils!inner(id, name)
      `)
      .eq("pupil_phone", normalizedPhone)
      .eq("status", "pending")
      .in("slot_number", slotsToBook)
      .order("slot_number", { ascending: true });

    if (offersError) {
      console.error("Error fetching offers:", offersError);
      throw offersError;
    }

    if (!pendingOffers || pendingOffers.length === 0) {
      console.log(`No pending offers found for slots ${slotsToBook.join(", ")} from ${normalizedPhone}`);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Book all selected slots
    const bookedSlots: string[] = [];
    const batchIds = new Set<string>();

    for (const offer of pendingOffers) {
      // Update offer status to accepted
      const { error: updateError } = await supabase
        .from("gap_offers")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
          response_message: body,
        })
        .eq("id", offer.id);

      if (updateError) {
        console.error(`Error updating offer ${offer.id}:`, updateError);
        continue;
      }

      console.log(`Offer ${offer.id} (slot ${offer.slot_number}) updated to accepted`);

      // Create the scheduled lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from("scheduled_lessons")
        .insert({
          instructor_id: offer.instructor_id,
          pupil_id: offer.pupil_id,
          lesson_date: offer.slot_date,
          start_time: offer.slot_start_time,
          end_time: offer.slot_end_time,
          status: "scheduled",
          notes: `Booked via SMS gap offer${offer.discount_type ? ` (${offer.discount_type === 'percentage' ? offer.discount_value + '%' : '£' + offer.discount_value} discount applied)` : ''}`,
        })
        .select("id")
        .single();

      if (lessonError) {
        console.error("Error creating lesson:", lessonError);
      } else {
        console.log(`Created lesson ${lessonData.id} from gap offer ${offer.id}`);
        
        const date = new Date(offer.slot_date);
        const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
        const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        bookedSlots.push(`${dayName} ${dateStr} ${offer.slot_start_time}-${offer.slot_end_time}`);
      }

      if (offer.batch_id) {
        batchIds.add(offer.batch_id);
      }
    }

    // Mark remaining offers from the same batch(es) as passed
    if (batchIds.size > 0) {
      const bookedOfferIds = pendingOffers.map(o => o.id);
      
      for (const batchId of batchIds) {
        const { data: siblings } = await supabase
          .from("gap_offers")
          .select("id")
          .eq("batch_id", batchId)
          .eq("status", "pending")
          .not("id", "in", `(${bookedOfferIds.join(",")})`);

        if (siblings && siblings.length > 0) {
          await supabase
            .from("gap_offers")
            .update({
              status: "passed",
              responded_at: new Date().toISOString(),
              response_message: `Pupil selected slot(s) ${slotsToBook.join(", ")}`,
            })
            .in("id", siblings.map(s => s.id));

          console.log(`Marked ${siblings.length} sibling offers as passed`);
        }
      }
    }

    // Send branded confirmation SMS and push notification to instructor
    if (bookedSlots.length > 0 && pendingOffers.length > 0) {
      const firstOffer = pendingOffers[0];
      const pupilName = (firstOffer.pupils as any)?.name || "A pupil";
      const instructorName = (firstOffer.instructors as any)?.name || "your instructor";
      
      const slotsText = bookedSlots.length === 1 
        ? bookedSlots[0]
        : `${bookedSlots.length} slots`;

      // Send branded confirmation SMS from "EveryDriver"
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioMessagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

      if (twilioAccountSid && twilioAuthToken && twilioMessagingServiceSid) {
        try {
          const confirmationMessage = bookedSlots.length === 1
            ? `✅ Booking Confirmed!\n\nHi ${pupilName.split(' ')[0]}, your lesson with ${instructorName} is booked for:\n\n📅 ${bookedSlots[0]}\n\nSee you then! - EveryDriver`
            : `✅ Bookings Confirmed!\n\nHi ${pupilName.split(' ')[0]}, your ${bookedSlots.length} lessons with ${instructorName} are booked:\n\n${bookedSlots.map(s => `📅 ${s}`).join('\n')}\n\nSee you then! - EveryDriver`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

          const confirmSmsBody = new URLSearchParams({
            To: normalizedPhone,
            Body: confirmationMessage,
            MessagingServiceSid: twilioMessagingServiceSid,
          });

          const smsResponse = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: confirmSmsBody,
          });

          const smsResult = await smsResponse.json();
          if (smsResponse.ok) {
            console.log(`Branded confirmation SMS sent to ${normalizedPhone}: ${smsResult.sid}`);
          } else {
            console.error("Failed to send confirmation SMS:", smsResult);
          }
        } catch (smsError) {
          console.error("Error sending confirmation SMS:", smsError);
        }
      }

      // Send SMS to instructor about the booking
      const instructorPhone = (firstOffer.instructors as any)?.phone;
      if (instructorPhone && twilioAccountSid && twilioAuthToken && twilioMessagingServiceSid) {
        try {
          // Format instructor phone to E.164
          let formattedInstructorPhone = instructorPhone.replace(/\s+/g, "");
          if (formattedInstructorPhone.startsWith("07")) {
            formattedInstructorPhone = "+44" + formattedInstructorPhone.substring(1);
          } else if (!formattedInstructorPhone.startsWith("+")) {
            formattedInstructorPhone = "+" + formattedInstructorPhone;
          }

          const instructorSmsMessage = bookedSlots.length === 1
            ? `🎉 Gap Filled!\n\n${pupilName} just booked:\n📅 ${bookedSlots[0]}\n\nCheck your calendar for details. - EveryDriver`
            : `🎉 ${bookedSlots.length} Gaps Filled!\n\n${pupilName} just booked:\n${bookedSlots.map(s => `📅 ${s}`).join('\n')}\n\nCheck your calendar for details. - EveryDriver`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

          const instructorSmsBody = new URLSearchParams({
            To: formattedInstructorPhone,
            Body: instructorSmsMessage,
            MessagingServiceSid: twilioMessagingServiceSid,
          });

          const instructorSmsResponse = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: instructorSmsBody,
          });

          const instructorSmsResult = await instructorSmsResponse.json();
          if (instructorSmsResponse.ok) {
            console.log(`Instructor SMS sent to ${formattedInstructorPhone}: ${instructorSmsResult.sid}`);
          } else {
            console.error("Failed to send instructor SMS:", instructorSmsResult);
          }
        } catch (instructorSmsError) {
          console.error("Error sending instructor SMS:", instructorSmsError);
        }
      }

      // Create in-app notification for the instructor
      try {
        const notificationTitle = bookedSlots.length === 1 ? "🎉 Gap Filled!" : `🎉 ${bookedSlots.length} Gaps Filled!`;
        const notificationMessage = bookedSlots.length === 1
          ? `${pupilName} booked ${bookedSlots[0]}`
          : `${pupilName} booked ${bookedSlots.length} slots: ${bookedSlots.join(", ")}`;

        await supabase
          .from("instructor_notifications")
          .insert({
            instructor_id: firstOffer.instructor_id,
            title: notificationTitle,
            message: notificationMessage,
            type: "gap_filled",
            action_url: "/instructor/calendar",
            metadata: {
              pupil_id: firstOffer.pupil_id,
              pupil_name: pupilName,
              booked_slots: bookedSlots,
              offer_id: firstOffer.id,
            },
          });
        console.log("In-app notification created for instructor");
      } catch (notifError) {
        console.error("Error creating in-app notification:", notifError);
      }

      const notification = {
        title: bookedSlots.length === 1 ? "🎉 Gap Filled!" : "🎉 Multiple Gaps Filled!",
        body: `${pupilName} booked ${slotsText}`,
        tag: `gap-filled-${firstOffer.id}`,
        data: {
          type: "gap_filled",
          offerId: firstOffer.id,
          pupilId: firstOffer.pupil_id,
          slotDate: firstOffer.slot_date,
          slotTime: firstOffer.slot_start_time,
          url: "/instructor/calendar",
          bookedCount: bookedSlots.length,
        },
        requireInteraction: true,
      };

      try {
        const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            instructorId: firstOffer.instructor_id,
            notification,
          }),
        });

        const pushResult = await pushResponse.json();
        console.log("Push notification result:", pushResult);
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
      }
    }

    // Return TwiML response (empty, Twilio expects XML)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );

  } catch (error: any) {
    console.error("Error in twilio-webhook:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  }
};

serve(handler);
