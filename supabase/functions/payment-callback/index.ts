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
 * - Elavon (Cardstream HPP POST callback)
 * 
 * Special handling for pupil balance payments (orderRef starts with "PUPIL-"):
 * - Updates pupil account_balance directly
 * - Redirects back to pupil portal instead of booking confirmation
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
  const paymentType = url.searchParams.get("type"); // "balance" for pupil payments

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const siteBaseUrl = Deno.env.get("SITE_URL") || "https://everydriver.lovable.app";

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

    // Handle NPI/Elavon Payments response
    if (provider === "npi" || provider === "elavon") {
      // NPI response codes: 0 = approved, others = declined/error
      const responseCode = formData.responseCode || formData.ResponseCode;
      const responseMessage = formData.responseMessage || formData.ResponseMessage || "";
      const amountReceived = formData.amount || formData.Amount || "";
      const authorisationCode = formData.authorisationCode || formData.AuthorisationCode || "";
      
      paymentRef = formData.orderRef || formData.OrderRef || paymentRef;
      paymentSuccessful = responseCode === "0" || String(responseCode) === "0";
      errorMessage = responseMessage;

      console.log(`${provider.toUpperCase()} response - code: ${responseCode}, success: ${paymentSuccessful}, ref: ${paymentRef}`);

      // Check if this is a pupil balance payment (orderRef starts with "PUPIL-")
      const isPupilPayment = paymentRef.startsWith("PUPIL-") || paymentType === "balance";

      // Record the payment in database
      if (pupilId && paymentSuccessful) {
        try {
          const { data: pupil } = await supabase
            .from("pupils")
            .select("instructor_id, name, account_balance")
            .eq("id", pupilId)
            .single();

          if (pupil) {
            const paymentAmountPounds = amountReceived ? parseFloat(amountReceived) / 100 : 0;

            // Record payment in history
            await supabase.from("payment_history").insert({
              instructor_id: pupil.instructor_id,
              pupil_id: pupilId,
              amount: paymentAmountPounds,
              payment_method: `${provider}_card`,
              notes: `${provider.toUpperCase()} Payment - Ref: ${paymentRef}, Auth: ${authorisationCode}`,
            });

            // If pupil balance payment, update their account balance
            if (isPupilPayment) {
              const currentBalance = pupil.account_balance || 0;
              const newBalance = currentBalance + paymentAmountPounds;
              
              await supabase
                .from("pupils")
                .update({ account_balance: newBalance })
                .eq("id", pupilId);

              console.log(`Updated pupil balance: ${currentBalance} -> ${newBalance}`);

              // Send payment receipt email
              try {
                const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
                await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${supabaseAnonKey}`,
                  },
                  body: JSON.stringify({
                    pupilId,
                    instructorId: pupil.instructor_id,
                    amount: paymentAmountPounds,
                    paymentMethod: `${provider.toUpperCase()} Card`,
                    transactionReference: paymentRef,
                  }),
                });
                console.log("Payment receipt email triggered");
              } catch (emailError) {
                console.error("Failed to send receipt email:", emailError);
              }
            }

            // Notify instructor of payment received
            try {
              const paymentAmountDisplay = paymentAmountPounds.toFixed(2);
              await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  instructorId: pupil.instructor_id,
                  notification: {
                    title: "💰 Payment Received",
                    body: `£${paymentAmountDisplay} received from ${pupil.name || "a pupil"} via ${provider.toUpperCase()} Card`,
                    tag: `payment-received-${Date.now()}`,
                    data: { type: "payment_received", pupilId, amount: paymentAmountPounds },
                  },
                }),
              });
              console.log("Instructor payment notification sent");
            } catch (notifyError) {
              console.error("Failed to notify instructor:", notifyError);
            }

            console.log("Payment recorded in history");
          }
        } catch (dbError) {
          console.error("Failed to record payment:", dbError);
        }
      }

      // Build redirect URL - different for pupil payments vs booking
      if (isPupilPayment) {
        let instructorSlug = "";
        try {
          const { data: pupil } = await supabase
            .from("pupils")
            .select("instructors(app_slug)")
            .eq("id", pupilId)
            .single();
          instructorSlug = (pupil?.instructors as any)?.app_slug || "";
        } catch (e) {
          console.error("Could not get instructor slug:", e);
        }

        const pupilRedirectUrl = instructorSlug 
          ? `${siteBaseUrl}/i/${instructorSlug}?payment=${paymentSuccessful ? "success" : "failed"}&amount=${amountReceived ? parseFloat(amountReceived) / 100 : 0}`
          : `${siteBaseUrl}?payment=${paymentSuccessful ? "success" : "failed"}`;

        console.log("Redirecting pupil to:", pupilRedirectUrl);

        return new Response(
          `<!DOCTYPE html>
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=${pupilRedirectUrl}">
              <title>Payment ${paymentSuccessful ? "Successful" : "Failed"}</title>
            </head>
            <body>
              <p>Payment ${paymentSuccessful ? "successful" : "failed"}! Redirecting...</p>
              <script>window.location.href = "${pupilRedirectUrl}";</script>
            </body>
          </html>`,
          { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      // Standard booking redirect
      const npiRedirectParams = new URLSearchParams();
      if (pupilId) npiRedirectParams.set("pupilId", pupilId);
      if (paymentSuccessful) {
        npiRedirectParams.set("npi", "success");
      } else {
        npiRedirectParams.set("responseCode", responseCode?.toString() || "1");
        npiRedirectParams.set("responseMessage", errorMessage);
      }
      if (paymentRef) npiRedirectParams.set("ref", paymentRef);
      if (amountReceived) npiRedirectParams.set("amountReceived", amountReceived);
      if (authorisationCode) npiRedirectParams.set("authorisationCode", authorisationCode);

      const npiRedirectUrl = `${siteBaseUrl}/booking-confirmation?${npiRedirectParams.toString()}`;
      console.log("Redirecting to:", npiRedirectUrl);

      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${npiRedirectUrl}">
            <title>Redirecting...</title>
          </head>
          <body>
            <p>Payment processed. Redirecting...</p>
            <script>window.location.href = "${npiRedirectUrl}";</script>
          </body>
        </html>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Handle Clearpay token capture
    if (provider === "clearpay") {
      const token = formData.token || url.searchParams.get("token") || "";
      const status = formData.status || url.searchParams.get("status") || "";
      
      // Check if this is a pupil balance payment
      const isPupilPayment = paymentRef.startsWith("PUPIL-") || paymentType === "balance";
      let capturedAmount = 0;

      if (status === "SUCCESS" && token) {
        const merchantId = Deno.env.get("CLEARPAY_MERCHANT_ID");
        const secretKey = Deno.env.get("CLEARPAY_SECRET_KEY");
        
        if (merchantId && secretKey) {
          const isSandbox = Deno.env.get("CLEARPAY_SANDBOX") === "true";
          const clearpayBaseUrl = isSandbox 
            ? "https://global.api-sandbox.afterpay.com"
            : "https://api.eu.afterpay.com";

          const authHeader = btoa(`${merchantId}:${secretKey}`);

          const captureResponse = await fetch(`${clearpayBaseUrl}/v2/payments/capture`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authHeader}`,
              "Content-Type": "application/json",
              "User-Agent": "EveryDriver/1.0",
            },
            body: JSON.stringify({ token, merchantReference: paymentRef }),
          });

          const captureResult = await captureResponse.json();
          
          if (captureResponse.ok) {
            paymentSuccessful = true;
            capturedAmount = captureResult.amount?.amount ? parseFloat(captureResult.amount.amount) : 0;
            console.log("Clearpay payment captured:", captureResult.id);
            
            if (pupilId) {
              try {
                const { data: pupil } = await supabase
                  .from("pupils")
                  .select("instructor_id, account_balance")
                  .eq("id", pupilId)
                  .single();

                if (pupil) {
                  await supabase.from("payment_history").insert({
                    instructor_id: pupil.instructor_id,
                    pupil_id: pupilId,
                    amount: capturedAmount,
                    payment_method: "clearpay",
                    notes: `Clearpay Payment ${captureResult.id}`,
                  });

                  if (isPupilPayment) {
                    const currentBalance = pupil.account_balance || 0;
                    const newBalance = currentBalance + capturedAmount;
                    
                    await supabase
                      .from("pupils")
                      .update({ account_balance: newBalance })
                      .eq("id", pupilId);

                    console.log(`Updated pupil balance: ${currentBalance} -> ${newBalance}`);

                    // Notify instructor
                    try {
                      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${supabaseServiceKey}`,
                        },
                        body: JSON.stringify({
                          instructorId: pupil.instructor_id,
                          notification: {
                            title: "💰 Payment Received",
                            body: `£${capturedAmount.toFixed(2)} received via Clearpay`,
                            tag: `payment-received-${Date.now()}`,
                            data: { type: "payment_received", pupilId, amount: capturedAmount },
                          },
                        }),
                      });
                    } catch (notifyErr) {
                      console.error("Failed to notify instructor:", notifyErr);
                    }

                    // Send payment receipt email
                    try {
                      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
                      await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({
                          pupilId,
                          instructorId: pupil.instructor_id,
                          amount: capturedAmount,
                          paymentMethod: "Clearpay",
                          transactionReference: captureResult.id,
                        }),
                      });
                      console.log("Payment receipt email triggered");
                    } catch (emailError) {
                      console.error("Failed to send receipt email:", emailError);
                    }
                  }
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

      // Redirect for pupil payments
      if (isPupilPayment) {
        let instructorSlug = "";
        try {
          if (pupilId) {
            const { data: pupil } = await supabase
              .from("pupils")
              .select("instructors(app_slug)")
              .eq("id", pupilId)
              .single();
            instructorSlug = (pupil?.instructors as any)?.app_slug || "";
          }
        } catch (e) {
          console.error("Could not get instructor slug:", e);
        }

        const clearpayPupilRedirect = instructorSlug 
          ? `${siteBaseUrl}/i/${instructorSlug}?payment=${paymentSuccessful ? "success" : "failed"}&amount=${capturedAmount}`
          : `${siteBaseUrl}?payment=${paymentSuccessful ? "success" : "failed"}`;

        return new Response(
          `<!DOCTYPE html>
          <html>
            <head><meta http-equiv="refresh" content="0;url=${clearpayPupilRedirect}"></head>
            <body><script>window.location.href = "${clearpayPupilRedirect}";</script></body>
          </html>`,
          { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      // Standard booking redirect for Clearpay
      const clearpayRedirectParams = new URLSearchParams();
      if (pupilId) clearpayRedirectParams.set("pupilId", pupilId);
      if (paymentSuccessful) {
        clearpayRedirectParams.set("clearpay", "success");
      } else {
        clearpayRedirectParams.set("responseCode", "1");
        clearpayRedirectParams.set("responseMessage", errorMessage || "Payment failed");
      }
      if (paymentRef) clearpayRedirectParams.set("ref", paymentRef);

      const clearpayRedirectUrl = `${siteBaseUrl}/booking-confirmation?${clearpayRedirectParams.toString()}`;

      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><meta http-equiv="refresh" content="0;url=${clearpayRedirectUrl}"></head>
          <body><script>window.location.href = "${clearpayRedirectUrl}";</script></body>
        </html>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Handle Klarna callback
    if (provider === "klarna") {
      const klarnaOrderId = url.searchParams.get("order_id") || formData.order_id || "";
      const isPupilPayment = paymentRef.startsWith("PUPIL-") || paymentType === "balance";
      // Extract amount from query param (passed from checkout redirect)
      const klarnaAmountParam = url.searchParams.get("amount") || formData.amount || "0";
      const klarnaAmount = parseFloat(klarnaAmountParam) || 0;

      // For Klarna, the payment is already captured via HPP, we just need to record it
      if (klarnaOrderId && pupilId) {
        try {
          const { data: pupil } = await supabase
            .from("pupils")
            .select("instructor_id, account_balance")
            .eq("id", pupilId)
            .single();

          if (pupil) {
            await supabase.from("payment_history").insert({
              instructor_id: pupil.instructor_id,
              pupil_id: pupilId,
              amount: klarnaAmount,
              payment_method: "klarna",
              notes: `Klarna Payment - Order: ${klarnaOrderId}`,
            });

            // Update pupil balance for pupil payments
            if (isPupilPayment && klarnaAmount > 0) {
              const currentBalance = pupil.account_balance || 0;
              const newBalance = currentBalance + klarnaAmount;
              
              await supabase
                .from("pupils")
                .update({ account_balance: newBalance })
                .eq("id", pupilId);

              console.log(`Klarna: Updated pupil balance: ${currentBalance} -> ${newBalance}`);

              // Send payment receipt email
              try {
                const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
                await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${supabaseAnonKey}`,
                  },
                  body: JSON.stringify({
                    pupilId,
                    instructorId: pupil.instructor_id,
                    amount: klarnaAmount,
                    paymentMethod: "Klarna",
                    transactionReference: klarnaOrderId,
                  }),
                });
                console.log("Klarna payment receipt email triggered");
              } catch (emailError) {
                console.error("Failed to send Klarna receipt email:", emailError);
              }
            }

            // Notify instructor
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  instructorId: pupil.instructor_id,
                  notification: {
                    title: "💰 Payment Received",
                    body: `£${klarnaAmount.toFixed(2)} received via Klarna`,
                    tag: `payment-received-${Date.now()}`,
                    data: { type: "payment_received", pupilId, amount: klarnaAmount },
                  },
                }),
              });
            } catch (notifyErr) {
              console.error("Failed to notify instructor:", notifyErr);
            }

            paymentSuccessful = true;
          }
        } catch (dbError) {
          console.error("Failed to record Klarna payment:", dbError);
        }
      }

      if (isPupilPayment) {
        let instructorSlug = "";
        try {
          if (pupilId) {
            const { data: pupil } = await supabase
              .from("pupils")
              .select("instructors(app_slug)")
              .eq("id", pupilId)
              .single();
            instructorSlug = (pupil?.instructors as any)?.app_slug || "";
          }
        } catch (e) {
          console.error("Could not get instructor slug:", e);
        }

        const klarnaPupilRedirect = instructorSlug 
          ? `${siteBaseUrl}/i/${instructorSlug}?payment=success&amount=${klarnaAmount}`
          : `${siteBaseUrl}?payment=success`;

        return new Response(
          `<!DOCTYPE html>
          <html>
            <head><meta http-equiv="refresh" content="0;url=${klarnaPupilRedirect}"></head>
            <body><script>window.location.href = "${klarnaPupilRedirect}";</script></body>
          </html>`,
          { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      const klarnaRedirectUrl = `${siteBaseUrl}/booking-confirmation?klarna=success&order_id=${klarnaOrderId}&amountReceived=${klarnaAmount * 100}`;
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><meta http-equiv="refresh" content="0;url=${klarnaRedirectUrl}"></head>
          <body><script>window.location.href = "${klarnaRedirectUrl}";</script></body>
        </html>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Default: unknown provider
    return new Response(
      JSON.stringify({ error: "Unknown payment provider" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment callback error:", error);
    
    const errorParams = new URLSearchParams();
    if (pupilId) errorParams.set("pupilId", pupilId);
    errorParams.set("responseCode", "500");
    errorParams.set("responseMessage", "Payment processing error");

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><meta http-equiv="refresh" content="0;url=${siteBaseUrl}/booking-confirmation?${errorParams.toString()}"></head>
        <body><p>Error processing payment. Redirecting...</p></body>
      </html>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});
