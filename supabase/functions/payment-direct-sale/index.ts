import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createCardstreamSignature,
  verifyCardstreamSignature,
} from "../_shared/cardstream_signature.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type PayMethod = "card_token" | "apple_pay" | "google_pay";

interface DirectSaleRequest {
  orderRef: string;
  method: PayMethod;

  // Card via Hosted Payment Fields token
  cardPaymentToken?: string;

  // Apple Pay token object stringified (event.payment.token)
  applePayPaymentToken?: string;

  // Google Pay token object stringified
  googlePayPaymentToken?: string;

  customerName?: string;
  customerEmail?: string;
  customerPostcode?: string;
  customerAddress?: string;       // full comma-separated address string
  customerAddress1?: string;
  customerCountryCode?: string; // "826"
}

function splitCustomerAddress(address?: string) {
  if (!address?.trim()) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return {
    line1: parts[0] ?? address.trim(),
    line2: parts[1] ?? "",
    town: parts[2] ?? "",
    county: parts[3] ?? "",
  };
}

function toFormUrlEncoded(data: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) params.set(k, v);
  return params.toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const merchantId = Deno.env.get("NPI_MERCHANT_ID")!;
    const secretKey = Deno.env.get("NPI_MERCHANT_SECRET")!;
    const directUrl = Deno.env.get("CARDSTREAM_DIRECT_URL") ?? "https://gateway.cardstream.com/direct/";

    if (!merchantId || !secretKey) {
      return new Response(JSON.stringify({ error: "Elavon payment gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: DirectSaleRequest = await req.json();
    if (!body.orderRef || !body.method) {
      return new Response(JSON.stringify({ error: "Missing orderRef/method" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: intent, error: intentErr } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("order_ref", body.orderRef)
      .single();

    if (intentErr || !intent) {
      return new Response(JSON.stringify({ error: "Unknown orderRef" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency
    if (intent.status === "paid") {
      return new Response(JSON.stringify({ success: true, alreadyPaid: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestFields: Record<string, string> = {
      merchantID: merchantId,
      action: "SALE",
      type: "1",
      countryCode: "826",
      currencyCode: intent.currency_code ?? "826",
      amount: String(intent.amount_pence),
      orderRef: intent.order_ref,
      transactionUnique: intent.transaction_unique ?? "",
    };

    if (body.customerEmail) requestFields.customerEmail = body.customerEmail;
    if (body.customerName) requestFields.customerName = body.customerName;
    if (body.customerPostcode) requestFields.customerPostcode = body.customerPostcode;
    if (body.customerCountryCode) requestFields.customerCountryCode = body.customerCountryCode;

    // Map address: prefer structured fields, fall back to splitting full string
    if (body.customerAddress1) {
      requestFields.customerAddress1 = body.customerAddress1;
    } else if (body.customerAddress) {
      const structured = splitCustomerAddress(body.customerAddress);
      if (structured) {
        requestFields.customerAddress1 = structured.line1;
        if (structured.line2) requestFields.customerAddress2 = structured.line2;
        if (structured.town) requestFields.customerCity = structured.town;
        if (structured.county) requestFields.customerCounty = structured.county;
      }
    }

    if (body.method === "card_token") {
      if (!body.cardPaymentToken) {
        return new Response(JSON.stringify({ error: "Missing cardPaymentToken" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      requestFields.paymentToken = body.cardPaymentToken;
    } else if (body.method === "apple_pay") {
      if (!body.applePayPaymentToken) {
        return new Response(JSON.stringify({ error: "Missing applePayPaymentToken" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      requestFields.paymentMethod = "applepay";
      requestFields.paymentToken = body.applePayPaymentToken;
    } else if (body.method === "google_pay") {
      if (!body.googlePayPaymentToken) {
        return new Response(JSON.stringify({ error: "Missing googlePayPaymentToken" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      requestFields.paymentMethod = "googlepay";
      requestFields.paymentToken = body.googlePayPaymentToken;
    }

    requestFields.signature = await createCardstreamSignature(requestFields, secretKey);

    const resp = await fetch(directUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toFormUrlEncoded(requestFields),
    });

    const text = await resp.text();
    const parsed = new URLSearchParams(text);
    const responseFields: Record<string, string> = {};
    parsed.forEach((v, k) => (responseFields[k] = v));

    const okSig = await verifyCardstreamSignature(responseFields, secretKey);
    const responseCode = responseFields.responseCode ?? responseFields.ResponseCode ?? "999";
    const success = responseCode === "0";

    await supabase.from("payment_intents").update({
      status: okSig && success ? "paid" : "failed",
      gateway_response: responseFields,
    }).eq("order_ref", intent.order_ref);

    // Auto-credit pupil balance if payment succeeded and pupil is linked
    if (okSig && success && intent.pupil_id) {
      await supabase.rpc("increment_pupil_balance", {
        p_pupil_id: intent.pupil_id,
        p_amount: intent.amount_pence / 100,
      });
    }

    return new Response(
      JSON.stringify({
        success: okSig && success,
        signatureValid: okSig,
        responseCode,
        responseMessage: responseFields.responseMessage ?? responseFields.ResponseMessage ?? "",
        raw: responseFields,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Direct sale failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
