import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewEnquiryRequest {
  name: string;
  address: string;
  postcode: string;
  courseType: string;
  requestedHours: number;
  preferredTiming: string;
  additionalNotes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const enquiry: NewEnquiryRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create the enquiry
    const { data: newEnquiry, error: insertError } = await supabase
      .from("course_enquiries")
      .insert({
        name: enquiry.name,
        address: enquiry.address,
        postcode: enquiry.postcode.toUpperCase(),
        course_type: enquiry.courseType,
        requested_hours: enquiry.requestedHours,
        preferred_timing: enquiry.preferredTiming,
        additional_notes: enquiry.additionalNotes || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating enquiry:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create enquiry" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get all active instructors to notify (in production, filter by postcode proximity)
    const { data: instructors } = await supabase
      .from("instructors")
      .select("id, name, hourly_rate")
      .eq("is_active", true);

    if (!instructors || instructors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, enquiryId: newEnquiry.id, notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Send push notification to all instructors
    const avgRate = instructors.reduce((sum, i) => sum + (i.hourly_rate || 35), 0) / instructors.length;
    const estimatedEarnings = enquiry.requestedHours * avgRate;

    let notifiedCount = 0;
    for (const instructor of instructors) {
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
              instructorId: instructor.id,
              notification: {
                title: "🚗 New Job Available!",
                body: `${enquiry.name} needs a ${enquiry.requestedHours}h ${enquiry.courseType} course in ${enquiry.postcode}. Earn ~£${Math.round((instructor.hourly_rate || 35) * enquiry.requestedHours)}!`,
                tag: `job-${newEnquiry.id}`,
                data: {
                  type: "new_job",
                  enquiryId: newEnquiry.id,
                  url: "/instructor/jobs",
                },
                actions: [
                  { action: "view", title: "View Job" },
                ],
                requireInteraction: false,
              },
            }),
          }
        );

        if (pushResponse.ok) {
          notifiedCount++;
        }
      } catch (pushError) {
        console.error(`Push error for instructor ${instructor.id}:`, pushError);
      }
    }

    console.log(`Notified ${notifiedCount}/${instructors.length} instructors about new job`);

    return new Response(
      JSON.stringify({
        success: true,
        enquiryId: newEnquiry.id,
        notified: notifiedCount,
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
