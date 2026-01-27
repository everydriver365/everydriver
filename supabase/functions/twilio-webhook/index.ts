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

    // Find pending gap offers for this phone number
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
        instructors!inner(id, name, auth_user_id),
        pupils!inner(id, name)
      `)
      .eq("pupil_phone", normalizedPhone)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (offersError) {
      console.error("Error fetching offers:", offersError);
      throw offersError;
    }

    if (!pendingOffers || pendingOffers.length === 0) {
      console.log(`No pending offers found for ${normalizedPhone}`);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    const offer = pendingOffers[0];
    const isAccepted = ["yes", "y", "book", "confirm", "ok", "sure", "please"].some(
      keyword => body.includes(keyword)
    );
    const isDeclined = ["no", "n", "cancel", "decline", "pass", "skip"].some(
      keyword => body.includes(keyword)
    );

    if (!isAccepted && !isDeclined) {
      console.log(`Unrecognized response: "${body}"`);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Update the offer status
    const newStatus = isAccepted ? "accepted" : "declined";
    const { error: updateError } = await supabase
      .from("gap_offers")
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        response_message: body,
      })
      .eq("id", offer.id);

    if (updateError) {
      console.error("Error updating offer:", updateError);
      throw updateError;
    }

    console.log(`Offer ${offer.id} updated to ${newStatus}`);

    // If accepted, create the lesson and notify the instructor
    if (isAccepted) {
      const pupilName = (offer.pupils as any)?.name || "A pupil";
      const date = new Date(offer.slot_date);
      const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
      const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

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
      }

      // Send push notification to instructor
      const notification = {
        title: "🎉 Gap Filled!",
        body: `${pupilName} accepted your slot: ${dayName} ${dateStr} ${offer.slot_start_time}-${offer.slot_end_time}`,
        tag: `gap-filled-${offer.id}`,
        data: {
          type: "gap_filled",
          offerId: offer.id,
          pupilId: offer.pupil_id,
          slotDate: offer.slot_date,
          slotTime: offer.slot_start_time,
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
            instructorId: offer.instructor_id,
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
