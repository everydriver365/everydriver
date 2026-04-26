import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpsellNotificationRequest {
  pupilName: string;
  pupilEmail: string;
  pupilPhone: string;
  upsellName: string;
  upsellPrice: number;
  instructorId: string;
  pupilId: string;
  firstLessonDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: UpsellNotificationRequest = await req.json();
    console.log("Upsell notification request:", data);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch instructor details
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("name, email")
      .eq("id", data.instructorId)
      .single();

    if (instructorError) {
      console.error("Error fetching instructor:", instructorError);
    }

    const instructorName = instructor?.name || "Unknown Instructor";
    const teamEmail = "team@everydriver.co.uk"; // Team notification email

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "Not scheduled yet";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", { 
        weekday: "long", 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      });
    };

    // Build the email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .info-box { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #10b981; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .info-row:last-child { border-bottom: none; }
          .label { color: #6b7280; font-size: 14px; }
          .value { font-weight: 600; color: #111827; }
          .action-required { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .action-required h3 { color: #b45309; margin: 0 0 10px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .price { font-size: 24px; color: #10b981; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Upsell Purchase!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.upsellName}</p>
          </div>
          
          <div class="content">
            <p>A new upsell has been purchased and requires attention:</p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #10b981;">📋 Purchase Details</h3>
              <div class="info-row">
                <span class="label">Upsell</span>
                <span class="value">${data.upsellName}</span>
              </div>
              <div class="info-row">
                <span class="label">Amount Paid</span>
                <span class="price">£${data.upsellPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px 0; color: #3b82f6;">👤 Pupil Information</h3>
              <div class="info-row">
                <span class="label">Name</span>
                <span class="value">${data.pupilName}</span>
              </div>
              <div class="info-row">
                <span class="label">Email</span>
                <span class="value">${data.pupilEmail}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone</span>
                <span class="value">${data.pupilPhone}</span>
              </div>
              <div class="info-row">
                <span class="label">Instructor</span>
                <span class="value">${instructorName}</span>
              </div>
              <div class="info-row">
                <span class="label">First Lesson</span>
                <span class="value">${formatDate(data.firstLessonDate)}</span>
              </div>
            </div>
            
            <div class="action-required">
              <h3>⚡ Action Required</h3>
              <p style="margin: 0;">
                ${data.upsellName.toLowerCase().includes('earlier test') 
                  ? 'Please begin monitoring DVSA for cancellations and earlier test date availability for this pupil.'
                  : 'Please review this purchase and take any necessary action.'}
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from EveryDriver</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email notification to team
    const emailResponse = await resend.emails.send({
      from: "EveryDriver <notifications@everydriver.co.uk>",
      to: [teamEmail],
      subject: `🎯 New Upsell Purchase: ${data.upsellName} - ${data.pupilName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-upsell-purchase:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
