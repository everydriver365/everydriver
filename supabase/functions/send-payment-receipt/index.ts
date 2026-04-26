import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReceiptRequest {
  pupilId: string;
  instructorId: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  receiptUrl?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pupilId, instructorId, amount, paymentMethod, transactionReference, receiptUrl }: PaymentReceiptRequest = await req.json();

    if (!pupilId || !instructorId || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pupil details
    const { data: pupil, error: pupilError } = await supabase
      .from("pupils")
      .select("name, email, account_balance")
      .eq("id", pupilId)
      .single();

    if (pupilError || !pupil) {
      console.error("Failed to fetch pupil:", pupilError);
      return new Response(
        JSON.stringify({ error: "Pupil not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pupil.email) {
      console.log("Pupil has no email address, skipping receipt");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No email address" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch instructor details
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("name, email, phone, logo_url, brand_colour")
      .eq("id", instructorId)
      .single();

    if (instructorError || !instructor) {
      console.error("Failed to fetch instructor:", instructorError);
      return new Response(
        JSON.stringify({ error: "Instructor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentDate = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const paymentTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const brandColor = instructor.brand_colour || "#2563eb";
    const newBalance = pupil.account_balance || 0;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: ${brandColor}; border-radius: 12px 12px 0 0;">
          <tr>
            <td style="padding: 30px; text-align: center;">
              ${instructor.logo_url ? `<img src="${instructor.logo_url}" alt="${instructor.name}" style="max-height: 60px; margin-bottom: 15px;">` : ""}
              <h1 style="color: white; margin: 0; font-size: 24px;">Payment Receipt</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Thank you for your payment!</p>
            </td>
          </tr>
        </table>

        <!-- Main Content -->
        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: white; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
          <tr>
            <td style="padding: 30px;">
              <p style="color: #3f3f46; margin: 0 0 20px 0; font-size: 16px;">
                Hi ${pupil.name},
              </p>
              <p style="color: #71717a; margin: 0 0 30px 0; font-size: 14px;">
                We've received your payment. Here's your receipt for your records.
              </p>

              <!-- Payment Amount Box -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="color: #71717a; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
                    <p style="color: ${brandColor}; margin: 0; font-size: 36px; font-weight: bold;">£${amount.toFixed(2)}</p>
                  </td>
                </tr>
              </table>

              <!-- Transaction Details -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 14px;">Date</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                    <span style="color: #3f3f46; font-size: 14px; font-weight: 500;">${paymentDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 14px;">Time</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                    <span style="color: #3f3f46; font-size: 14px; font-weight: 500;">${paymentTime}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 14px;">Payment Method</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                    <span style="color: #3f3f46; font-size: 14px; font-weight: 500;">${paymentMethod}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
                    <span style="color: #71717a; font-size: 14px;">Reference</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                    <span style="color: #3f3f46; font-size: 14px; font-weight: 500; font-family: monospace;">${transactionReference}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #71717a; font-size: 14px;">New Balance</span>
                  </td>
                  <td style="padding: 12px 0; text-align: right;">
                    <span style="color: ${newBalance >= 0 ? "#16a34a" : "#dc2626"}; font-size: 14px; font-weight: 600;">
                      ${newBalance >= 0 ? "£" + newBalance.toFixed(2) + " credit" : "-£" + Math.abs(newBalance).toFixed(2) + " owed"}
                    </span>
                  </td>
                </tr>
              </table>

              ${receiptUrl ? `
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${receiptUrl}" style="display: inline-block; background-color: ${brandColor}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">View Full Receipt</a>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Instructor Contact -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #71717a; margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Instructor</p>
                    <p style="color: #3f3f46; margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">${instructor.name}</p>
                    ${instructor.email ? `<p style="color: #71717a; margin: 0 0 3px 0; font-size: 14px;">${instructor.email}</p>` : ""}
                    ${instructor.phone ? `<p style="color: #71717a; margin: 0; font-size: 14px;">${instructor.phone}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7; border-top: none;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
                This is an automated receipt for your records.<br>
                Please keep this email as proof of payment.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${instructor.name} <noreply@everydriver.lovable.app>`,
      to: [pupil.email],
      subject: `Payment Receipt - £${amount.toFixed(2)}`,
      html: emailHtml,
    });

    console.log("Payment receipt sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: (emailResponse as any)?.data?.id || "sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending payment receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
