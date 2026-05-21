import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PushDataType, NotifyCategory, NotifyImportance } from "../_shared/notification-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignJobRequest {
  enquiryId: string;
  instructorId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enquiryId, instructorId }: AssignJobRequest = await req.json();

    if (!enquiryId || !instructorId) {
      return new Response(
        JSON.stringify({ error: "Missing enquiryId or instructorId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Update the enquiry with the assigned instructor
    const { data: enquiry, error: updateError } = await supabase
      .from("course_enquiries")
      .update({
        assigned_instructor_id: instructorId,
        status: "assigned",
      })
      .eq("id", enquiryId)
      .select()
      .single();

    if (updateError) {
      console.error("Error assigning job:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to assign job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get instructor details
    const { data: instructor } = await supabase
      .from("instructors")
      .select("name, hourly_rate")
      .eq("id", instructorId)
      .single();

    // 3. Calculate earnings
    const hourlyRate = instructor?.hourly_rate || 35;
    const totalPayable = (enquiry.requested_hours || 20) * hourlyRate;

    // 4. Send push notification to instructor
    try {
      const pushResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            instructorId,
            notification: {
              title: "🚗 New Job Offer!",
              body: `${enquiry.name} wants a ${enquiry.requested_hours}h ${enquiry.course_type} course in ${enquiry.postcode}. Earn £${totalPayable.toFixed(0)}!`,
              tag: `job-${enquiryId}`,
              data: {
                type: "job_offer",
                enquiryId,
                url: "/instructor/jobs",
              },
              actions: [
                { action: "view", title: "View Offer" },
                { action: "dismiss", title: "Dismiss" },
              ],
              requireInteraction: true,
            },
          }),
        }
      );

      const pushResult = await pushResponse.json();
      console.log("Push notification result:", pushResult);
    } catch (pushError) {
      // Log but don't fail - push is non-critical
      console.error("Push notification error (non-fatal):", pushError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        enquiryId,
        instructorId,
        message: `Job assigned to ${instructor?.name || "instructor"}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
