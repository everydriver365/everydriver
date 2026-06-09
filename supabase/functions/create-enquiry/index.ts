import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { z } from "https://esm.sh/zod@3.25.76";
import { PushDataType, NotifyCategory, NotifyImportance } from "../_shared/notification-types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  address: z.string().trim().min(1, "Address is required").max(500),
  postcode: z.string().trim().min(1, "Postcode is required").max(20),
  courseType: z.string().trim().min(1, "Course type is required").max(100),
  requestedHours: z.number().int().min(1).max(200),
  preferredTiming: z.string().trim().min(1).max(100),
  additionalNotes: z.string().trim().max(2000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const parseResult = enquirySchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const enquiry = parseResult.data;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
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

    // 2. Get admin notification emails from site_settings
    let adminEmails: string[] = [];
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("admin_notification_emails")
      .single();
    
    if (siteSettings?.admin_notification_emails) {
      adminEmails = siteSettings.admin_notification_emails;
    }

    // 3. Send email notification to admins
    let emailSent = false;
    if (resendApiKey && adminEmails.length > 0) {
      try {
        const isCallback = enquiry.courseType === "callback" || enquiry.courseType === "general";
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "EveryDriver <noreply@everydriver.co.uk>",
            to: adminEmails,
            subject: isCallback 
              ? `📞 New Callback Request from ${enquiry.name}`
              : `📝 New Bespoke Course Enquiry from ${enquiry.name}`,
            html: buildEnquiryEmailHtml(enquiry, isCallback),
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log("Admin notification email sent");
        } else {
          const errorData = await emailResponse.text();
          console.error("Resend API error:", errorData);
        }
      } catch (emailError) {
        console.error("Error sending admin email:", emailError);
      }
    }

    // 4. Notify instructors (skip for callbacks/general)
    const isCallback = enquiry.courseType === "callback" || enquiry.courseType === "general";
    let notifiedCount = 0;

    if (!isCallback) {
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name, hourly_rate")
        .eq("is_active", true);

      if (instructors && instructors.length > 0) {
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
                  category: NotifyCategory.JOB,
                  importance: NotifyImportance.NORMAL,
                  jobValue: Math.round((instructor.hourly_rate || 35) * enquiry.requestedHours),
                  notification: {
                    title: "🚗 New Job Available!",
                    body: `${enquiry.name} needs a ${enquiry.requestedHours}h ${enquiry.courseType} course in ${enquiry.postcode}. Earn ~£${Math.round((instructor.hourly_rate || 35) * enquiry.requestedHours)}!`,
                    tag: `job-${newEnquiry.id}`,
                    data: {
                      type: PushDataType.JOB_OFFER,
                      enquiryId: newEnquiry.id,
                      url: "/instructor/jobs",
                    },
                    actions: [{ action: "view", title: "View Job" }],
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
      }
    }

    console.log(`Enquiry created. Email sent: ${emailSent}, Instructors notified: ${notifiedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        enquiryId: newEnquiry.id,
        notified: notifiedCount,
        emailSent,
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

function buildEnquiryEmailHtml(enquiry: z.infer<typeof enquirySchema>, isCallback: boolean): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">
          ${isCallback ? "📞 New Callback Request" : "📝 New Course Enquiry"}
        </h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #374151; margin-top: 0;">Contact Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Name:</td><td style="padding: 8px 0; color: #111827; font-weight: 600;">${enquiry.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Contact:</td><td style="padding: 8px 0; color: #111827;">${enquiry.postcode}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email:</td><td style="padding: 8px 0; color: #111827;">${enquiry.address}</td></tr>
        </table>
        ${!isCallback ? `
        <h2 style="color: #374151; margin-top: 24px;">Course Requirements</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Course Type:</td><td style="padding: 8px 0; color: #111827; font-weight: 600;">${enquiry.courseType.replace("-", " ")}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Hours:</td><td style="padding: 8px 0; color: #111827;">${enquiry.requestedHours} hours</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Timing:</td><td style="padding: 8px 0; color: #111827;">${enquiry.preferredTiming.replace("-", " ")}</td></tr>
        </table>
        ` : ""}
        ${enquiry.additionalNotes ? `
        <h2 style="color: #374151; margin-top: 24px;">Message</h2>
        <p style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; color: #374151; margin: 0;">${enquiry.additionalNotes}</p>
        ` : ""}
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">View and manage this enquiry in the Admin Portal.</p>
        </div>
      </div>
    </div>
  `;
}
