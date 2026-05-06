import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SquareCheckoutRequest {
  amount: number;
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
  instructorId?: string;
  pupilId?: string;
  courseName?: string;
  lessonSlots?: Array<{ date: string; time: string }>;
}

// Normalize phone numbers to E.164 (Square requirement). Returns null if it can't be normalized.
function normalizePhoneE164(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s\-()._]/g, "");
  if (!cleaned) return null;
  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
  if (cleaned.startsWith("00")) {
    const rest = cleaned.slice(2);
    return /^\d{8,15}$/.test(rest) ? `+${rest}` : null;
  }
  // UK mobile: 07XXXXXXXXX (11 digits)
  if (/^07\d{9}$/.test(cleaned)) return `+44${cleaned.slice(1)}`;
  // UK mobile without leading 0: 7XXXXXXXXX (10 digits)
  if (/^7\d{9}$/.test(cleaned)) return `+44${cleaned}`;
  // 447XXXXXXXXX
  if (/^44\d{9,10}$/.test(cleaned)) return `+${cleaned}`;
  return null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN")?.trim();
    const locationId = Deno.env.get("SQUARE_LOCATION_ID")?.trim();
    const environment = Deno.env.get("SQUARE_ENVIRONMENT")?.trim() || "sandbox";

    if (!accessToken || !locationId) {
      console.error("Missing Square credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SquareCheckoutRequest = await req.json();
    console.log("Square checkout request:", {
      amount: body.amount,
      orderReference: body.orderReference,
      customerEmail: body.customerEmail,
      courseName: body.courseName,
    });

    const { amount, orderReference, customerEmail, customerName, customerPhone, description, returnUrl, courseName, lessonSlots } = body;

    if (!amount || !orderReference || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, orderReference, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount < 0.50) {
      return new Response(
        JSON.stringify({ error: "Minimum payment amount is £0.50" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if instructor has connected Square OAuth
    let useInstructorToken = false;
    let effectiveAccessToken = accessToken;
    let effectiveLocationId = locationId;
    let appFeeAmountPence = 0;

    if (body.instructorId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { data: instructor } = await supabase
          .from("instructors")
          .select("square_merchant_id, square_access_token_encrypted")
          .eq("id", body.instructorId)
          .maybeSingle();

        if (instructor?.square_merchant_id && instructor?.square_access_token_encrypted) {
          useInstructorToken = true;
          effectiveAccessToken = instructor.square_access_token_encrypted;
          console.log(`Using instructor's Square OAuth token for ${body.instructorId}`);

          // Fetch instructor's main location from Square API
          try {
            const locEnv = environment.toLowerCase();
            const locIsProduction = locEnv === "production" || locEnv === "prod" || locEnv === "live";
            const locBaseUrl = locIsProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
            const locRes = await fetch(`${locBaseUrl}/v2/locations`, {
              headers: {
                "Authorization": `Bearer ${effectiveAccessToken}`,
                "Square-Version": "2024-01-18",
              },
            });
            if (locRes.ok) {
              const locData = await locRes.json();
              const mainLoc = locData.locations?.find((l: any) => l.status === "ACTIVE") || locData.locations?.[0];
              if (mainLoc?.id) {
                effectiveLocationId = mainLoc.id;
                console.log(`Using instructor's location: ${effectiveLocationId}`);
              }
            }
          } catch (locErr) {
            console.error("Error fetching instructor locations:", locErr);
          }

          // Calculate platform fee (service fee)
          if (body.platformFeePence && body.platformFeePence > 0) {
            appFeeAmountPence = body.platformFeePence;
          }
        }
      } catch (e) {
        console.error("Error checking instructor Square OAuth:", e);
      }
    }

    // Square uses amount in smallest currency unit (pence for GBP)
    const amountInPence = Math.round(amount * 100);
    const idempotencyKey = `${orderReference}-${Date.now()}`;

    // Build item description with course and lesson details
    let itemName = courseName || description || "Driving Course";
    if (itemName.length > 50) {
      itemName = itemName.substring(0, 47) + "...";
    }

    // Build order note with lesson details
    let orderNote = `Booking Ref: ${orderReference}`;
    if (lessonSlots && lessonSlots.length > 0) {
      orderNote += `\nLessons: ${lessonSlots.map(s => `${s.date} at ${s.time}`).join(", ")}`;
    }

    // Square API base URL
    const env = environment.toLowerCase();
    const isProduction = env === "production" || env === "prod" || env === "live";
    const baseUrl = isProduction
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

    // Create payment link using Square Checkout API
    const payload: Record<string, unknown> = {
      idempotency_key: idempotencyKey,
      quick_pay: {
        name: itemName,
        price_money: {
          amount: amountInPence,
          currency: "GBP"
        },
        location_id: effectiveLocationId
      },
      checkout_options: {
        redirect_url: returnUrl,
        cancel_url: body.cancelUrl || returnUrl,
        ask_for_shipping_address: false
      },
      pre_populated_data: {
        buyer_email: customerEmail || undefined,
        buyer_phone_number: normalizePhoneE164(customerPhone) || undefined
      }
    };

    // Add app_fee_money for OAuth connected instructors (platform takes this fee)
    if (useInstructorToken && appFeeAmountPence > 0) {
      (payload as any).quick_pay.price_money.app_fee_money = {
        amount: appFeeAmountPence,
        currency: "GBP"
      };
    }

    console.log("Square API payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Square-Version": "2024-01-18",
        "Authorization": `Bearer ${effectiveAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log("Square API response status:", response.status);
    console.log("Square API response:", responseText);

    if (!response.ok) {
      console.error("Square API error:", responseText);

      // Parse Square error and build a friendly message
      let squareErrors: any[] = [];
      try {
        const parsed = JSON.parse(responseText);
        squareErrors = Array.isArray(parsed?.errors) ? parsed.errors : [];
      } catch { /* not JSON */ }

      const first = squareErrors[0] || {};
      const code = String(first.code || "").toUpperCase();
      const field = String(first.field || "");
      const detail = String(first.detail || "");

      let userMessage = "We couldn't create the payment link. Please try again.";
      if (code === "UNAUTHORIZED" || code === "ACCESS_TOKEN_EXPIRED" || code === "ACCESS_TOKEN_REVOKED") {
        userMessage = "Your Square account isn't connected. Reconnect Square in Settings → Payments.";
      } else if (code === "FORBIDDEN" || code === "INSUFFICIENT_SCOPES") {
        userMessage = "Square is missing the required permissions. Reconnect Square in Settings → Payments.";
      } else if (code === "MERCHANT_SUBSCRIPTION_NOT_FOUND" || code === "LOCATION_MISMATCH" || code === "INVALID_LOCATION") {
        userMessage = "Your Square location isn't set up for online payments. Check your Square dashboard.";
      } else if (code === "INVALID_PHONE_NUMBER" || field.includes("phone")) {
        userMessage = "The phone number isn't valid for Square. Use a UK mobile (e.g. 07…) or leave it blank.";
      } else if (code === "INVALID_EMAIL_ADDRESS" || field.includes("email")) {
        userMessage = "The email address isn't valid. Check it and try again.";
      } else if (code === "BAD_REQUEST" || code === "INVALID_REQUEST_ERROR" || code === "VALUE_TOO_LONG" || code === "VALUE_TOO_SHORT" || code === "INVALID_VALUE") {
        userMessage = detail ? `Square rejected the request: ${detail}` : "Square rejected the request. Check the amount and customer details.";
      } else if (code === "RATE_LIMITED") {
        userMessage = "Square is rate-limiting requests. Please wait a moment and try again.";
      } else if (response.status >= 500) {
        userMessage = "Square is temporarily unavailable. Please try again in a moment.";
      } else if (detail) {
        userMessage = `Square: ${detail}`;
      }

      // Return 200 so supabase-js delivers the body to the client (otherwise it
      // surfaces a generic FunctionsHttpError and we lose the friendly message).
      return new Response(
        JSON.stringify({
          error: userMessage,
          userMessage,
          code: code || undefined,
          field: field || undefined,
          status: response.status,
          details: responseText,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    
    if (!data.payment_link?.url) {
      console.error("No payment URL in Square response:", data);
      return new Response(
        JSON.stringify({ error: "No payment URL received from Square" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Square checkout URL created:", data.payment_link.url);

    // Create payment_intent record so the webhook can match this payment
    if (body.instructorId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        await supabase.from("payment_intents").insert({
          instructor_id: body.instructorId,
          pupil_id: body.pupilId || null,
          provider: "square_checkout",
          order_ref: orderReference,
          amount_pence: amountInPence,
          status: "pending",
          transaction_unique: data.payment_link.order_id,
        });
        console.log(`Created payment_intent for order ${data.payment_link.order_id}, ref ${orderReference}`);
      } catch (intentErr) {
        console.error("Failed to create payment_intent (non-blocking):", intentErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: data.payment_link.url,
        orderId: data.payment_link.order_id,
        paymentLinkId: data.payment_link.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Square checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to process checkout", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
