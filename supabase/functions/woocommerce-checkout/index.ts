import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WooCommerceCheckoutRequest {
  amount: number;
  courseName: string;
  courseHours: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderRef: string;
  instructorId: string;
  pupilId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const storeUrl = Deno.env.get('WOOCOMMERCE_STORE_URL');
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

    if (!storeUrl || !consumerKey || !consumerSecret) {
      console.error("Missing WooCommerce credentials");
      return new Response(
        JSON.stringify({ error: "WooCommerce not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WooCommerceCheckoutRequest = await req.json();
    console.log("WooCommerce checkout request:", JSON.stringify(body, null, 2));

    const {
      amount,
      courseName,
      courseHours,
      customerEmail,
      customerName,
      customerPhone,
      orderRef,
      instructorId,
      pupilId,
    } = body;

    // Validate required fields
    if (!amount || !courseName || !customerEmail || !customerName || !orderRef) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Split customer name
    const nameParts = customerName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build callback URL for payment completion
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback/woocommerce/${pupilId || 'guest'}/${orderRef}`;

    // Create WooCommerce order
    const orderPayload = {
      payment_method: "bacs", // Will be updated on checkout
      payment_method_title: "Online Payment",
      set_paid: false,
      status: "pending",
      billing: {
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,
        phone: customerPhone || "",
      },
      line_items: [
        {
          name: `${courseName} - ${courseHours} Hour Course`,
          quantity: 1,
          total: amount.toFixed(2),
        }
      ],
      meta_data: [
        { key: "order_ref", value: orderRef },
        { key: "instructor_id", value: instructorId },
        { key: "pupil_id", value: pupilId || "" },
        { key: "course_hours", value: courseHours.toString() },
        { key: "callback_url", value: callbackUrl },
      ],
    };

    console.log("Creating WooCommerce order:", JSON.stringify(orderPayload, null, 2));

    // Clean up store URL (remove trailing slash)
    const cleanStoreUrl = storeUrl.replace(/\/$/, '');
    
    // Create order via WooCommerce REST API
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const orderResponse = await fetch(`${cleanStoreUrl}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("WooCommerce API error:", orderResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create WooCommerce order",
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = await orderResponse.json();
    console.log("WooCommerce order created:", orderData.id);

    // Build checkout URL - WooCommerce uses order-pay endpoint
    const checkoutUrl = `${cleanStoreUrl}/checkout/order-pay/${orderData.id}/?pay_for_order=true&key=${orderData.order_key}`;

    console.log("Redirecting to checkout:", checkoutUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        checkoutUrl,
        orderId: orderData.id,
        orderKey: orderData.order_key,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("WooCommerce checkout error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
