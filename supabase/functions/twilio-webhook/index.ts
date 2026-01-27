import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse Twilio webhook data (form-urlencoded)
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string)?.toLowerCase().trim();
    const messageSid = formData.get("MessageSid") as string;

    console.log(`Received SMS from ${from}: "${body}"`);

    if (!from || !body) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Normalize phone number (remove spaces, ensure format)
    const normalizedPhone = from.replace(/\s+/g, "");

    // Check if response is a number (slot selection)
    const slotNumber = parseInt(body, 10);
    const isNumericReply = !isNaN(slotNumber) && slotNumber >= 1 && slotNumber <= 5;

    // Check for yes/no responses
    const isAccepted = ["yes", "y", "book", "confirm", "ok", "sure", "please"].some(
      keyword => body.includes(keyword)
    );
    const isDeclined = ["no", "n", "cancel", "decline", "pass", "skip"].some(
      keyword => body.includes(keyword)
    );

    let selectedOffer = null;
    let siblingOffers: any[] = [];

    if (isNumericReply) {
      // Find the specific slot by number for this phone
      const { data: offers, error: offersError } = await supabase
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
          instructors!inner(id, name, auth_user_id),
          pupils!inner(id, name)
        `)
        .eq("pupil_phone", normalizedPhone)
        .eq("status", "pending")
        .eq("slot_number", slotNumber)
        .order("created_at", { ascending: false })
        .limit(1);

      if (offersError) {
        console.error("Error fetching offers:", offersError);
        throw offersError;
      }

      if (offers && offers.length > 0) {
        selectedOffer = offers[0];
        
        // Get sibling offers from same batch to mark as passed
        if (selectedOffer.batch_id) {
          const { data: siblings } = await supabase
            .from("gap_offers")
            .select("id")
            .eq("batch_id", selectedOffer.batch_id)
            .eq("status", "pending")
            .neq("id", selectedOffer.id);
          
          siblingOffers = siblings || [];
        }
      } else {
        console.log(`No pending offer found for slot ${slotNumber} from ${normalizedPhone}`);
      }
    } else if (isAccepted) {
      // YES response - book the first available slot (slot_number = 1 or earliest)
      const { data: offers, error: offersError } = await supabase
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
          instructors!inner(id, name, auth_user_id),
          pupils!inner(id, name)
        `)
        .eq("pupil_phone", normalizedPhone)
        .eq("status", "pending")
        .order("slot_number", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(1);

      if (offersError) {
        console.error("Error fetching offers:", offersError);
        throw offersError;
      }

      if (offers && offers.length > 0) {
        selectedOffer = offers[0];
        
        // Get sibling offers from same batch
        if (selectedOffer.batch_id) {
          const { data: siblings } = await supabase
            .from("gap_offers")
            .select("id")
            .eq("batch_id", selectedOffer.batch_id)
            .eq("status", "pending")
            .neq("id", selectedOffer.id);
          
          siblingOffers = siblings || [];
        }
      }
    } else if (isDeclined) {
      // NO response - decline all pending offers for this phone
      const { data: offers, error: offersError } = await supabase
        .from("gap_offers")
        .select("id, batch_id")
        .eq("pupil_phone", normalizedPhone)
        .eq("status", "pending");

      if (!offersError && offers && offers.length > 0) {
        // Update all pending offers to declined
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

    // If no offer selected and not a decline, return empty response
    if (!selectedOffer) {
      if (!isDeclined) {
        console.log(`No pending offers found or unrecognized response: "${body}" from ${normalizedPhone}`);
      }
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Update the selected offer status to accepted
    const { error: updateError } = await supabase
      .from("gap_offers")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
        response_message: body,
      })
      .eq("id", selectedOffer.id);

    if (updateError) {
      console.error("Error updating offer:", updateError);
      throw updateError;
    }

    console.log(`Offer ${selectedOffer.id} (slot ${selectedOffer.slot_number}) updated to accepted`);

    // Mark sibling offers as passed (not selected)
    if (siblingOffers.length > 0) {
      const siblingIds = siblingOffers.map(s => s.id);
      await supabase
        .from("gap_offers")
        .update({
          status: "passed",
          responded_at: new Date().toISOString(),
          response_message: `Pupil selected slot ${selectedOffer.slot_number}`,
        })
        .in("id", siblingIds);

      console.log(`Marked ${siblingIds.length} sibling offers as passed`);
    }

    // Create the scheduled lesson
    const pupilName = (selectedOffer.pupils as any)?.name || "A pupil";
    const date = new Date(selectedOffer.slot_date);
    const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
    const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    const { data: lessonData, error: lessonError } = await supabase
      .from("scheduled_lessons")
      .insert({
        instructor_id: selectedOffer.instructor_id,
        pupil_id: selectedOffer.pupil_id,
        lesson_date: selectedOffer.slot_date,
        start_time: selectedOffer.slot_start_time,
        end_time: selectedOffer.slot_end_time,
        status: "scheduled",
        notes: `Booked via SMS gap offer${selectedOffer.discount_type ? ` (${selectedOffer.discount_type === 'percentage' ? selectedOffer.discount_value + '%' : '£' + selectedOffer.discount_value} discount applied)` : ''}`,
      })
      .select("id")
      .single();

    if (lessonError) {
      console.error("Error creating lesson:", lessonError);
    } else {
      console.log(`Created lesson ${lessonData.id} from gap offer ${selectedOffer.id}`);
    }

    // Send push notification to instructor
    const notification = {
      title: "🎉 Gap Filled!",
      body: `${pupilName} accepted your slot: ${dayName} ${dateStr} ${selectedOffer.slot_start_time}-${selectedOffer.slot_end_time}`,
      tag: `gap-filled-${selectedOffer.id}`,
      data: {
        type: "gap_filled",
        offerId: selectedOffer.id,
        pupilId: selectedOffer.pupil_id,
        slotDate: selectedOffer.slot_date,
        slotTime: selectedOffer.slot_start_time,
        url: "/instructor/calendar",
      },
      requireInteraction: true,
    };

    // Call the push notification function
    try {
      const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          instructorId: selectedOffer.instructor_id,
          notification,
        }),
      });

      const pushResult = await pushResponse.json();
      console.log("Push notification result:", pushResult);
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
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
