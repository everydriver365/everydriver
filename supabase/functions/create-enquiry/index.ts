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
  requestedHours: z.number().int().min(0).max(200),
  preferredTiming: z.string().trim().min(1).max(100),
  additionalNotes: z.string().trim().max(2000).optional(),
  email: z.string().trim().email().max(255).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  assignedInstructorId: z.string().uuid().optional().nullable(),
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
        email: enquiry.email || null,
        phone: enquiry.phone || null,
        assigned_instructor_id: enquiry.assignedInstructorId || null,
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

    const isCallback = enquiry.courseType === "callback" || enquiry.courseType === "general";

    // 2. Resolve admin notification recipients
    let adminEmails: string[] = [];
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("admin_notification_emails")
      .not("admin_notification_emails", "is", null)
      .limit(1)
      .maybeSingle();

    if (Array.isArray(siteSettings?.admin_notification_emails)) {
      adminEmails = (siteSettings!.admin_notification_emails as string[]).filter(
        (e) => typeof e === "string" && e.includes("@"),
      );
    }
    if (adminEmails.length === 0) {
      const fallback = Deno.env.get("ADMIN_ENQUIRY_EMAIL") || "enquiries@everydriver.co.uk";
      adminEmails = [fallback];
    }

    // The Contact page packs visitor email/phone into `address`/`phone` fields.
    // Recover them so templates show clean data.
    const visitorEmail = enquiry.email
      || (enquiry.address && enquiry.address.includes("@") ? enquiry.address : null);
    const visitorPhone = enquiry.phone || null;

    const adminTemplateData = {
      name: enquiry.name,
      email: visitorEmail,
      phone: visitorPhone,
      postcode: enquiry.postcode,
      courseType: enquiry.courseType,
      requestedHours: enquiry.requestedHours,
      preferredTiming: enquiry.preferredTiming,
      additionalNotes: enquiry.additionalNotes ?? null,
      isCallback,
    };

    // 3. Enqueue admin notifications via Lovable Emails
    let adminEmailsSent = 0;
    for (const recipient of adminEmails) {
      try {
        const { error: sendErr } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "admin-enquiry-notification",
              recipientEmail: recipient,
              idempotencyKey: `enquiry-admin-${newEnquiry.id}-${recipient}`,
              templateData: adminTemplateData,
              purpose: "transactional",
            },
          }
        );
        if (sendErr) {
          console.error(`Admin email enqueue failed for ${recipient}:`, sendErr);
        } else {
          adminEmailsSent++;
        }
      } catch (err) {
        console.error(`Admin email exception for ${recipient}:`, err);
      }
    }

    // 4. Enqueue visitor confirmation when we have their email
    let confirmationSent = false;
    if (visitorEmail) {
      try {
        const { error: confirmErr } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "contact-enquiry-confirmation",
              recipientEmail: visitorEmail,
              idempotencyKey: `enquiry-confirm-${newEnquiry.id}`,
              templateData: {
                name: enquiry.name,
                isCallback,
                message: enquiry.additionalNotes ?? null,
              },
              purpose: "transactional",
            },
          }
        );
        if (confirmErr) {
          console.error("Visitor confirmation enqueue failed:", confirmErr);
        } else {
          confirmationSent = true;
        }
      } catch (err) {
        console.error("Visitor confirmation exception:", err);
      }
    }

    // 5. Notify instructors (skip for callbacks/general)
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

    const emailSent = adminEmailsSent > 0;
    console.log(
      `Enquiry ${newEnquiry.id}. Admin emails enqueued: ${adminEmailsSent}/${adminEmails.length}, Visitor confirmation: ${confirmationSent}, Instructors notified: ${notifiedCount}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        enquiryId: newEnquiry.id,
        notified: notifiedCount,
        emailSent,
        confirmationSent,
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
