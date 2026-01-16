import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateOrderRequest {
  orderId: number;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  transactionId?: string;
  paymentMethod?: string;
  paymentMethodTitle?: string;
}

serve(async (req: Request) => {
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

    const body: UpdateOrderRequest = await req.json();
    console.log("WooCommerce update order request:", JSON.stringify(body, null, 2));

    const { orderId, status, transactionId, paymentMethod, paymentMethodTitle } = body;

    if (!orderId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: orderId and status" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status,
    };

    if (status === 'completed' || status === 'processing') {
      updatePayload.set_paid = true;
    }

    if (transactionId) {
      updatePayload.transaction_id = transactionId;
    }

    if (paymentMethod) {
      updatePayload.payment_method = paymentMethod;
    }

    if (paymentMethodTitle) {
      updatePayload.payment_method_title = paymentMethodTitle;
    }

    console.log("Updating WooCommerce order:", orderId, updatePayload);

    const cleanStoreUrl = storeUrl.replace(/\/$/, '');
    const qp = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;
    const authString = btoa(`${consumerKey}:${consumerSecret}`);

    const attempts: Array<{ url: string; headers: Record<string, string> }> = [
      {
        url: `${cleanStoreUrl}/wp-json/wc/v3/orders/${orderId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
      },
      {
        url: `${cleanStoreUrl}/wp-json/wc/v3/orders/${orderId}?${qp}`,
        headers: { 'Content-Type': 'application/json' },
      },
      {
        url: `${cleanStoreUrl}/?rest_route=/wc/v3/orders/${orderId}&${qp}`,
        headers: { 'Content-Type': 'application/json' },
      },
    ];

    let lastStatus = 0;
    let lastBody = '';

    for (const attempt of attempts) {
      console.log(`Attempting WooCommerce order update via: ${attempt.url}`);

      const res = await fetch(attempt.url, {
        method: 'PUT',
        headers: attempt.headers,
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        const orderData = await res.json();
        console.log("WooCommerce order updated successfully:", orderData.id, orderData.status);

        return new Response(
          JSON.stringify({
            success: true,
            orderId: orderData.id,
            status: orderData.status,
            datePaid: orderData.date_paid,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      lastStatus = res.status;
      lastBody = await res.text();
      console.error("WooCommerce API error:", res.status, `(${attempt.url})`, lastBody.slice(0, 800));

      if ([400, 401, 403, 404].includes(res.status)) break;
    }

    return new Response(
      JSON.stringify({
        error: "Failed to update WooCommerce order",
        status: lastStatus,
        details: lastBody?.slice(0, 500) || "",
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("WooCommerce update order error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
