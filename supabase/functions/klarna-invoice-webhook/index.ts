// Klarna Checkout push handler for invoice-linked Klarna orders.
// Klarna calls this URL after an order is completed:
//   POST /klarna-invoice-webhook?klarna_order_id={checkout.order.id}
// We fetch the order from Klarna, confirm status, and mark the matching
// square_invoices row as paid. Any error encountered is also persisted
// onto the matching row (klarna_last_error/klarna_last_error_at) for
// troubleshooting from the invoice details view.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Helper: persist the latest error against the matching invoice (if any).
  const recordError = async (orderId: string | null, message: string) => {
    if (!orderId) return;
    try {
      await supabase
        .from("square_invoices")
        .update({
          klarna_last_error: message.slice(0, 2000),
          klarna_last_error_at: new Date().toISOString(),
        })
        .eq("klarna_order_id", orderId);
    } catch (e) {
      console.error("[klarna-invoice-webhook] failed to record error", e);
    }
  };

  let orderId: string | null = null;

  try {
    const url = new URL(req.url);
    orderId =
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
      await recordError(orderId, "Klarna API credentials not configured on server");
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

    const kres = await fetch(`${klarnaBase}/ordermanagement/v1/orders/${orderId}`, {
      headers: { Authorization: klarnaAuth, "Content-Type": "application/json" },
    });
    const korder = (await kres.json().catch(() => null)) as any;
    if (!kres.ok || !korder) {
      const msg = `Klarna order fetch failed (HTTP ${kres.status}): ${
        korder ? JSON.stringify(korder).slice(0, 500) : "no body"
      }`;
      console.error("[klarna-invoice-webhook]", msg);
      await recordError(orderId, msg);
      return new Response(JSON.stringify({ error: "klarna order fetch failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = String(korder.status || "").toUpperCase();
    let klarnaStatus: "pending" | "paid" | "failed" | "cancelled" = "pending";
    if (["AUTHORIZED", "PART_CAPTURED", "CAPTURED"].includes(status)) klarnaStatus = "paid";
    else if (status === "CANCELLED") klarnaStatus = "cancelled";
    else if (status === "EXPIRED" || status === "CLOSED") klarnaStatus = "failed";

    const buyerPaid = klarnaStatus === "paid";

    const { data: row, error: rowErr } = await supabase
      .from("square_invoices")
      .select("id, status, paid_at, klarna_status")
      .eq("klarna_order_id", orderId)
      .maybeSingle();

    if (rowErr) {
      console.error("[klarna-invoice-webhook] lookup error", rowErr);
      await recordError(orderId, `Invoice lookup failed: ${rowErr.message}`);
      return new Response(JSON.stringify({ error: "lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!row) {
      console.warn("[klarna-invoice-webhook] no matching invoice for order", orderId);
      return new Response(JSON.stringify({ ok: true, matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();
    const update: Record<string, unknown> = {
      klarna_status: klarnaStatus,
      last_event_at: nowIso,
    };
    // Clear stale error on a successful processing pass.
    update.klarna_last_error = null;
    update.klarna_last_error_at = null;
    // Surface a soft error message when Klarna reports a non-success terminal state.
    if (klarnaStatus === "failed") {
      update.klarna_last_error = `Klarna order ended as ${status}`;
      update.klarna_last_error_at = nowIso;
    } else if (klarnaStatus === "cancelled") {
      update.klarna_last_error = `Buyer cancelled the Klarna order (${status})`;
      update.klarna_last_error_at = nowIso;
    }
    if (buyerPaid && !row.paid_at && row.status !== "paid") {
      update.status = "paid";
      update.paid_at = nowIso;
    }

    const { error: updErr } = await supabase
      .from("square_invoices")
      .update(update)
      .eq("id", row.id);

    if (updErr) {
      console.error("[klarna-invoice-webhook] update error", updErr);
      await recordError(orderId, `DB update failed: ${updErr.message}`);
      return new Response(JSON.stringify({ error: "update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, klarna_status: klarnaStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[klarna-invoice-webhook] fatal", e);
    await recordError(orderId, `Unhandled webhook error: ${String(e)}`);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
