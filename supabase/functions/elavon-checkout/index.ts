import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ElavonCheckoutRequest {
  amount: number;
  orderReference: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
  instructorId?: string;
  pupilId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Elavon Converge credentials
    const merchantAlias = Deno.env.get("ELAVON_MERCHANT_ALIAS")?.trim() ?? "";
    const secretKey = Deno.env.get("ELAVON_SECRET_KEY")?.trim() ?? "";

    if (!merchantAlias || !secretKey) {
      console.error("Missing Elavon Converge credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ElavonCheckoutRequest = await req.json();
    console.log("Elavon Converge checkout request:", {
      amount: body.amount,
      orderReference: body.orderReference,
      customerEmail: body.customerEmail,
    });

    const { amount, orderReference, customerEmail, customerName, returnUrl } = body;

    if (!amount || !orderReference || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, orderReference, returnUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Elavon Converge uses decimal amount format (e.g., "10.00" not "1000")
    const amountDecimal = amount.toFixed(2);
    const transactionUnique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Elavon Converge HPP form fields
    const formFields: Record<string, string> = {
      ssl_merchant_id: merchantAlias,
      ssl_pin: secretKey,
      ssl_transaction_type: "ccsale",
      ssl_amount: amountDecimal,
      ssl_invoice_number: orderReference,
      ssl_show_form: "true",
      ssl_result_format: "HTML",
      ssl_receipt_link_url: returnUrl,
      ssl_receipt_link_text: "Return to EveryDriver",
    };

    // Add optional customer details
    if (customerEmail) formFields.ssl_email = customerEmail;
    if (customerName) formFields.ssl_first_name = customerName.split(' ')[0] || '';
    if (customerName && customerName.includes(' ')) {
      formFields.ssl_last_name = customerName.split(' ').slice(1).join(' ');
    }

    console.log("Converge form fields (excluding PIN):", {
      ...formFields,
      ssl_pin: "[REDACTED]",
    });

    // Elavon Converge HPP endpoint (production)
    // For demo/testing use: https://api.demo.convergepay.com/VirtualMerchantDemo/process.do
    const formAction = "https://api.convergepay.com/VirtualMerchant/process.do";

    // Build redirect URL for legacy GET method (fallback)
    const params = new URLSearchParams(formFields);
    const legacyRedirectUrl = `${formAction}?${params.toString()}`;

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transactionUnique,
        formAction,
        formFields,
        redirectUrl: legacyRedirectUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Elavon Converge checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Failed to process checkout", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
