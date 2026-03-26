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
          // Use platform location for checkout but payments go to instructor's merchant
          console.log(`Using instructor's Square OAuth token for ${body.instructorId}`);

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
        buyer_phone_number: customerPhone || undefined
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
      return new Response(
        JSON.stringify({ 
          error: "Failed to create checkout session", 
          details: responseText 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
