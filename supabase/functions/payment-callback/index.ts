import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Payment Callback Handler
 * 
 * This edge function handles POST callbacks from payment providers that redirect
 * users after payment completion. It processes the payment response, records the
 * transaction, and redirects the user to the confirmation page with appropriate params.
 * 
 * Supported providers:
 * - NPI Payments (Hosted Payment Page POST callback)
 * - Clearpay (token capture after redirect)
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") || "npi";
  const pupilId = url.searchParams.get("pupilId");
  const orderRef = url.searchParams.get("ref");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`Payment callback received for provider: ${provider}, pupilId: ${pupilId}`);

    // Parse the form data (NPI sends POST form data)
    let formData: Record<string, string> = {};
    let paymentSuccessful = false;
    let paymentRef = orderRef || "";
    let errorMessage = "";

    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      
      if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        form.forEach((value, key) => {
          formData[key] = value.toString();
        });
      } else if (contentType.includes("application/json")) {
        formData = await req.json();
      } else {
        // Try to parse as form data anyway
        try {
          const text = await req.text();
          const params = new URLSearchParams(text);
          params.forEach((value, key) => {
            formData[key] = value;
          });
        } catch {
          console.log("Could not parse request body");
        }
      }
    }

    console.log("Payment callback data:", JSON.stringify(formData, null, 2));

    // Handle NPI Payments response
    if (provider === "npi") {
      // NPI response codes: 0 = approved, others = declined/error
      const responseCode = formData.responseCode || formData.ResponseCode;
      const responseMessage = formData.responseMessage || formData.ResponseMessage || "";
      const transactionId = formData.xref || formData.transactionUnique || formData.TransactionID || "";
      const amountReceived = formData.amount || formData.Amount || "";
      const authorisationCode = formData.authorisationCode || formData.AuthorisationCode || "";
      
      paymentRef = formData.orderRef || formData.OrderRef || paymentRef;
      paymentSuccessful = responseCode === "0" || String(responseCode) === "0";
      errorMessage = responseMessage;

      console.log(`NPI response - code: ${responseCode}, success: ${paymentSuccessful}, ref: ${paymentRef}`);

      // Record the payment in database
      if (pupilId && paymentSuccessful) {
        try {
          // Get pupil info to find instructor
          const { data: pupil } = await supabase
            .from("pupils")
            .select("instructor_id, name")
            .eq("id", pupilId)
            .single();

          if (pupil) {
            await supabase.from("payment_history").insert({
              instructor_id: pupil.instructor_id,
              pupil_id: pupilId,
              amount: amountReceived ? parseFloat(amountReceived) / 100 : 0,
              payment_method: "npi_card",
              notes: `NPI Payment - Ref: ${paymentRef}, Auth: ${authorisationCode}`,
            });
            console.log("Payment recorded in history");
          }
        } catch (dbError) {
          console.error("Failed to record payment:", dbError);
        }
      }

      // Build redirect URL to confirmation page
      const baseUrl = Deno.env.get("SITE_URL") || "https://easy-learn-map.lovable.app";
      const redirectParams = new URLSearchParams();
      
      if (pupilId) redirectParams.set("pupilId", pupilId);
      if (paymentSuccessful) {
        redirectParams.set("npi", "success");
      } else {
        redirectParams.set("responseCode", responseCode?.toString() || "1");
        redirectParams.set("responseMessage", errorMessage);
      }
      if (paymentRef) redirectParams.set("ref", paymentRef);
      if (amountReceived) redirectParams.set("amountReceived", amountReceived);
      if (authorisationCode) redirectParams.set("authorisationCode", authorisationCode);

      const redirectUrl = `${baseUrl}/booking-confirmation?${redirectParams.toString()}`;
      console.log("Redirecting to:", redirectUrl);

      // Return HTML redirect (for browser POST)
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${redirectUrl}">
            <title>Redirecting...</title>
          </head>
          <body>
            <p>Payment processed. Redirecting...</p>
            <script>window.location.href = "${redirectUrl}";</script>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    // Handle Clearpay token capture
    if (provider === "clearpay") {
      const token = formData.token || url.searchParams.get("token") || "";
      const status = formData.status || url.searchParams.get("status") || "";
      
      if (status === "SUCCESS" && token) {
        // Capture the payment
        const merchantId = Deno.env.get("CLEARPAY_MERCHANT_ID");
        const secretKey = Deno.env.get("CLEARPAY_SECRET_KEY");
        
        if (merchantId && secretKey) {
          const isSandbox = Deno.env.get("CLEARPAY_SANDBOX") === "true";
          const baseUrl = isSandbox 
            ? "https://global.api-sandbox.afterpay.com"
            : "https://api.eu.afterpay.com";

          const authHeader = btoa(`${merchantId}:${secretKey}`);

          const captureResponse = await fetch(`${baseUrl}/v2/payments/capture`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authHeader}`,
              "Content-Type": "application/json",
              "User-Agent": "EveryDriver/1.0",
            },
            body: JSON.stringify({
              token,
              merchantReference: paymentRef,
            }),
          });

          const captureResult = await captureResponse.json();
          
          if (captureResponse.ok) {
            paymentSuccessful = true;
            console.log("Clearpay payment captured:", captureResult.id);
            
            // Record payment
            if (pupilId) {
              try {
                const { data: pupil } = await supabase
                  .from("pupils")
                  .select("instructor_id")
                  .eq("id", pupilId)
                  .single();

                if (pupil) {
                  await supabase.from("payment_history").insert({
                    instructor_id: pupil.instructor_id,
                    pupil_id: pupilId,
                    amount: captureResult.amount?.amount ? parseFloat(captureResult.amount.amount) : 0,
                    payment_method: "clearpay",
                    notes: `Clearpay Payment ${captureResult.id}`,
                  });
                }
              } catch (dbError) {
                console.error("Failed to record Clearpay payment:", dbError);
              }
            }
          } else {
            errorMessage = captureResult.message || "Capture failed";
            console.error("Clearpay capture failed:", captureResult);
          }
        }
      }

      const baseUrl = Deno.env.get("SITE_URL") || "https://easy-learn-map.lovable.app";
      const redirectParams = new URLSearchParams();
      
      if (pupilId) redirectParams.set("pupilId", pupilId);
      if (paymentSuccessful) {
        redirectParams.set("clearpay", "success");
      } else {
        redirectParams.set("responseCode", "1");
        redirectParams.set("responseMessage", errorMessage || "Payment failed");
      }
      if (paymentRef) redirectParams.set("ref", paymentRef);

      const redirectUrl = `${baseUrl}/booking-confirmation?${redirectParams.toString()}`;

      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          </head>
          <body>
            <script>window.location.href = "${redirectUrl}";</script>
          </body>
        </html>`,
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        }
      );
    }

    // Default: unknown provider
    return new Response(
      JSON.stringify({ error: "Unknown payment provider" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment callback error:", error);
    
    // On error, still redirect to confirmation with error
    const baseUrl = Deno.env.get("SITE_URL") || "https://easy-learn-map.lovable.app";
    const errorParams = new URLSearchParams();
    if (pupilId) errorParams.set("pupilId", pupilId);
    errorParams.set("responseCode", "500");
    errorParams.set("responseMessage", "Payment processing error");

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${baseUrl}/booking-confirmation?${errorParams.toString()}">
        </head>
        <body>
          <p>Error processing payment. Redirecting...</p>
        </body>
      </html>`,
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      }
    );
  }
});
