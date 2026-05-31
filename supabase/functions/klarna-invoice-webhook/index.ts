// Klarna Checkout push handler for invoice-linked Klarna orders.
// Klarna calls this URL after an order is completed:
//   POST /klarna-invoice-webhook?klarna_order_id={checkout.order.id}
// We fetch the order from Klarna, confirm status, and mark the matching
// square_invoices row as paid.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Klarna substitutes the literal {checkout.order.id} placeholder in the push URL.
    const orderId =
      url.searchParams.get("klarna_order_id") ||
      url.searchParams.get("order_id") ||
      url.searchParams.get("id");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "missing klarna_order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const klarnaUser = Deno.env.get("KLARNA_API_USERNAME");
    const klarnaPass = Deno.env.get("KLARNA_API_PASSWORD");
    if (!klarnaUser || !klarnaPass) {
      console.error("[klarna-invoice-webhook] missing credentials");
      return new Response(JSON.stringify({ error: "klarna not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isSandbox = Deno.env.get("KLARNA_SANDBOX") === "true";
    const klarnaBase = isSandbox
      ? "https://api.playground.klarna.com"
      : "https://api.klarna.com";
    const klarnaAuth = "Basic " + btoa(`${klarnaUser}:${klarnaPass}`);

    // Read the order back from Klarna to verify it really exists/completed.
    const kres = await fetch(`${klarnaBase}/ordermanagement/v1/orders/${orderId}`, {
      headers: { Authorization: klarnaAuth, "Content-Type": "application/json" },
    });
    const korder = (await kres.json().catch(() => null)) as any;
    if (!kres.ok || !korder) {
      console.error("[klarna-invoice-webhook] fetch order failed", kres.status, korder);
      return new Response(JSON.stringify({ error: "klarna order fetch failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = String(korder.status || "").toUpperCase();
    // AUTHORIZED / PART_CAPTURED / CAPTURED all count as "buyer paid" for our purposes.
    const buyerPaid = ["AUTHORIZED", "PART_CAPTURED", "CAPTURED"].includes(status);
    if (!buyerPaid) {
      console.log("[klarna-invoice-webhook] non-paid status, skipping", orderId, status);
      return new Response(JSON.stringify({ ok: true, status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: rowErr } = await supabase
      .from("square_invoices")
      .select("id, status, paid_at")
      .eq("klarna_order_id", orderId)
      .maybeSingle();

    if (rowErr) {
      console.error("[klarna-invoice-webhook] lookup error", rowErr);
      return new Response(JSON.stringify({ error: "lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!row) {
      console.warn("[klarna-invoice-webhook] no matching invoice for order", orderId);
      // Return 200 anyway so Klarna does not retry forever.
      return new Response(JSON.stringify({ ok: true, matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.paid_at || row.status === "paid") {
      return new Response(JSON.stringify({ ok: true, alreadyPaid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("square_invoices")
      .update({
        status: "paid",
        paid_at: nowIso,
        last_event_at: nowIso,
      })
      .eq("id", row.id);

    if (updErr) {
      console.error("[klarna-invoice-webhook] update error", updErr);
      return new Response(JSON.stringify({ error: "update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, paid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[klarna-invoice-webhook] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
