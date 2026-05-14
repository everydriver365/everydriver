import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyCardstreamSignature } from "../_shared/cardstream_signature.ts";

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
  const baseAmountParam = parseFloat(url.searchParams.get("baseAmount") || "0");
  const adminFeeParam = parseFloat(url.searchParams.get("adminFee") || "0");
  const callerOrigin = url.searchParams.get("origin"); // origin passed from checkout

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const siteBaseUrl = callerOrigin ? decodeURIComponent(callerOrigin) : (Deno.env.get("SITE_URL") || "https://everydriver.lovable.app");

  // Helper: atomically update pupil balance using RPC
  async function creditPupilBalance(pPupilId: string, amount: number) {
    if (amount <= 0) return;
    const { error } = await supabase.rpc("increment_pupil_balance", {
      p_pupil_id: pPupilId,
      p_amount: amount,
    });
    if (error) {
      console.error("Failed to increment pupil balance:", error);
    } else {
      console.log(`Atomically credited pupil ${pPupilId} balance by £${amount.toFixed(2)}`);
    }
  }

  // Helper: update payment_intents status
  async function updatePaymentIntentStatus(ref: string, status: "completed" | "failed") {
    if (!ref) return;
    const { error } = await supabase
      .from("payment_intents")
      .update({ status })
      .eq("order_ref", ref);
    if (error) {
      console.error(`Failed to update payment_intents for ref ${ref}:`, error);
    } else {
      console.log(`Updated payment_intents ${ref} → ${status}`);
    }
  }

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

    // Cardstream may redirect via GET with response in query params
    // Fall back to query params if POST body was empty
    // Exclude our custom routing params that aren't part of Cardstream's signed payload
    const routingParams = new Set(["provider", "pupilId", "ref", "origin", "type", "baseAmount", "adminFee"]);
    if (Object.keys(formData).length === 0) {
      url.searchParams.forEach((value, key) => {
        if (!routingParams.has(key)) {
          formData[key] = value;
        }
      });
    }

    console.log("Payment callback data:", JSON.stringify(formData, null, 2));

    // Handle NPI/Elavon Payments response
    if (provider === "npi" || provider === "elavon") {
      // Log raw gateway response BEFORE signature check so errors aren't masked
      const rawResponseCode = formData.responseCode || formData.ResponseCode || "unknown";
      const rawResponseMessage = formData.responseMessage || formData.ResponseMessage || "";
      console.log(`[Callback] Raw gateway response — code: ${rawResponseCode}, message: ${rawResponseMessage}`);

      // 🔐 Verify Cardstream gateway signature to prevent forged callbacks
      const merchantSecret = Deno.env.get("NPI_MERCHANT_SECRET") || "";
      if (merchantSecret && Object.keys(formData).length > 0) {
        const validSig = await verifyCardstreamSignature(formData, merchantSecret);
        if (!validSig) {
          console.error(`Invalid Cardstream signature on callback — responseCode: ${rawResponseCode}, responseMessage: ${rawResponseMessage}`);
          return new Response("Invalid signature", {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "text/plain" },
          });
        }
        console.log("Cardstream signature verified ✓");
      }
      // NPI response codes: 0 = approved, others = declined/error
      const responseCode = formData.responseCode || formData.ResponseCode;
      const responseMessage = formData.responseMessage || formData.ResponseMessage || "";
      const amountReceived = formData.amount || formData.Amount || "";
      const authorisationCode = formData.authorisationCode || formData.AuthorisationCode || "";
      
      paymentRef = formData.orderRef || formData.OrderRef || paymentRef;
      paymentSuccessful = responseCode === "0" || String(responseCode) === "0";
      errorMessage = responseMessage;

      console.log(`${provider.toUpperCase()} response - code: ${responseCode}, success: ${paymentSuccessful}, ref: ${paymentRef}`);

      // Update payment_intents status
      await updatePaymentIntentStatus(paymentRef, paymentSuccessful ? "completed" : "failed");

      // Check if this is a pupil balance payment (orderRef starts with "PUPIL-")
      const isPupilPayment = paymentRef.startsWith("PUPIL-") || paymentType === "balance";

      // Record the payment in database
      if (pupilId && paymentSuccessful) {
        try {
          const { data: pupil } = await supabase
            .from("pupils")
            .select("instructor_id, name")
            .eq("id", pupilId)
            .single();

          if (pupil) {
            const paymentAmountPounds = amountReceived ? parseFloat(amountReceived) / 100 : 0;
            // Determine the base amount to credit (gross minus admin fee)
            const creditAmount = adminFeeParam > 0 ? baseAmountParam : paymentAmountPounds;
            const feeAmount = adminFeeParam > 0 ? adminFeeParam : 0;

            // Record payment in history (show gross amount)
            await supabase.from("payment_history").insert({
              instructor_id: pupil.instructor_id,
              pupil_id: pupilId,
              amount: creditAmount,
              payment_method: `${provider}_card`,
              notes: `${provider.toUpperCase()} Payment - Ref: ${paymentRef}, Auth: ${authorisationCode}${feeAmount > 0 ? ` (admin fee: £${feeAmount.toFixed(2)})` : ''}`,
            });

            // Credit pupil balance with base amount only (not the fee)
            await creditPupilBalance(pupilId, creditAmount);

            // Record commission if admin fee was charged
            if (feeAmount > 0) {
              await supabase.from("platform_commissions").insert({
                instructor_id: pupil.instructor_id,
                source_type: `${provider}_card`,
                source_id: paymentRef,
                gross_amount: paymentAmountPounds,
                commission_amount: feeAmount,
                commission_rate: 0.025,
                fixed_fee: 0.20,
                net_amount: creditAmount,
                description: `Admin fee on pupil balance payment`,
              });
              console.log(`Recorded commission: £${feeAmount.toFixed(2)} on £${paymentAmountPounds.toFixed(2)} gross`);
            }

            // If pupil balance payment, send receipt email
            if (isPupilPayment) {
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

            // Notify parent of payment (if linked)
            try {
              await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  pupilId,
                  type: "payment_received",
                  body: `£${paymentAmountPounds.toFixed(2)} payment confirmed for ${pupil.name || "your child"}'s driving lessons via ${provider.toUpperCase()}.`,
                }),
              });
              console.log("Parent payment notification triggered");
            } catch (parentError) {
              console.error("Parent notification error (non-fatal):", parentError);
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

            // Update payment_intents status
            await updatePaymentIntentStatus(paymentRef, "completed");
            
            if (pupilId) {
              try {
                const { data: pupil } = await supabase
                  .from("pupils")
                  .select("instructor_id")
                  .eq("id", pupilId)
                  .single();

                if (pupil) {
                  const creditAmount = adminFeeParam > 0 ? baseAmountParam : capturedAmount;
                  const feeAmount = adminFeeParam > 0 ? adminFeeParam : 0;

                  await supabase.from("payment_history").insert({
                    instructor_id: pupil.instructor_id,
                    pupil_id: pupilId,
                    amount: creditAmount,
                    payment_method: "Clearpay",
                    notes: `Clearpay Payment ${captureResult.id}${feeAmount > 0 ? ` (admin fee: £${feeAmount.toFixed(2)})` : ''}`,
                  });

                  // Credit pupil balance with base amount only
                  await creditPupilBalance(pupilId, creditAmount);

                  // Record commission if admin fee was charged
                  if (feeAmount > 0) {
                    await supabase.from("platform_commissions").insert({
                      instructor_id: pupil.instructor_id,
                      source_type: "clearpay",
                      source_id: captureResult.id || paymentRef,
                      gross_amount: capturedAmount,
                      commission_amount: feeAmount,
                      commission_rate: 0.025,
                      fixed_fee: 0.20,
                      net_amount: creditAmount,
                      description: `Admin fee on pupil balance payment`,
                    });
                  }

                  if (isPupilPayment) {
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

                  // Notify parent of Clearpay payment
                  try {
                    await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${supabaseServiceKey}`,
                      },
                      body: JSON.stringify({
                        pupilId,
                        type: "payment_received",
                        body: `£${capturedAmount.toFixed(2)} payment confirmed for ${pupil.name || "your child"}'s driving lessons via Clearpay.`,
                      }),
                    });
                  } catch (parentErr) {
                    console.error("Parent notification error (non-fatal):", parentErr);
                  }
                }
              } catch (dbError) {
                console.error("Failed to record Clearpay payment:", dbError);
              }
            }
          } else {
            errorMessage = captureResult.message || "Capture failed";
            console.error("Clearpay capture failed:", captureResult);
            await updatePaymentIntentStatus(paymentRef, "failed");
          }
        }
      } else {
        await updatePaymentIntentStatus(paymentRef, "failed");
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
            .select("instructor_id")
            .eq("id", pupilId)
            .single();

          if (pupil) {
            const klarnaCreditAmount = adminFeeParam > 0 ? baseAmountParam : klarnaAmount;
            const klarnaFee = adminFeeParam > 0 ? adminFeeParam : 0;

            await supabase.from("payment_history").insert({
              instructor_id: pupil.instructor_id,
              pupil_id: pupilId,
              amount: klarnaCreditAmount,
              payment_method: "Klarna",
              notes: `Klarna Payment - Order: ${klarnaOrderId}${klarnaFee > 0 ? ` (admin fee: £${klarnaFee.toFixed(2)})` : ''}`,
            });

            // Credit pupil balance with base amount only
            await creditPupilBalance(pupilId, klarnaCreditAmount);

            // Record commission if admin fee was charged
            if (klarnaFee > 0) {
              await supabase.from("platform_commissions").insert({
                instructor_id: pupil.instructor_id,
                source_type: "klarna",
                source_id: klarnaOrderId || paymentRef,
                gross_amount: klarnaAmount,
                commission_amount: klarnaFee,
                commission_rate: 0.025,
                fixed_fee: 0.20,
                net_amount: klarnaCreditAmount,
                description: `Admin fee on pupil balance payment`,
              });
            }

            // Update payment_intents status
            await updatePaymentIntentStatus(paymentRef, "completed");

            // Send receipt email for pupil balance payments
            if (isPupilPayment && klarnaAmount > 0) {
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

            // Notify parent of Klarna payment
            try {
              await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  pupilId,
                  type: "payment_received",
                  body: `£${klarnaAmount.toFixed(2)} payment confirmed for ${pupil.name || "your child"}'s driving lessons via Klarna.`,
                }),
              });
            } catch (parentErr) {
              console.error("Parent notification error (non-fatal):", parentErr);
            }

            paymentSuccessful = true;
          }
        } catch (dbError) {
          console.error("Failed to record Klarna payment:", dbError);
          await updatePaymentIntentStatus(paymentRef, "failed");
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
