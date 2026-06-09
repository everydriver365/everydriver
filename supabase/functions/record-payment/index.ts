import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import {
  PushDataType,
  NotifyCategory,
  NotifyImportance,
  PupilNotifyType,
} from "../_shared/notification-types.ts";

type Method = "cash" | "bank" | "card";

interface Body {
  pupilId: string;
  amount: number;            // always positive; refund flag flips sign
  method: Method;
  isRefund?: boolean;
  note?: string;
  // card-only:
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = (await req.json()) as Body;
    if (!body?.pupilId) return json({ error: "pupilId required" }, 400);
    if (!body?.amount || body.amount < 0.5) return json({ error: "Amount must be at least £0.50" }, 400);
    if (!["cash", "bank", "card"].includes(body.method)) return json({ error: "Invalid method" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve instructor id from auth user
    const { data: instructorIdRpc, error: instErr } = await admin.rpc(
      "get_instructor_id_for_user",
      { p_user_id: userId },
    );
    if (instErr || !instructorIdRpc) return json({ error: "Not an instructor" }, 403);
    const instructorId = instructorIdRpc as string;

    // Verify pupil belongs to this instructor
    const { data: pupil, error: pupilErr } = await admin
      .from("pupils")
      .select("id, name, email, instructor_id")
      .eq("id", body.pupilId)
      .is("deleted_at", null)
      .maybeSingle();
    if (pupilErr || !pupil || pupil.instructor_id !== instructorId) {
      return json({ error: "Pupil not found for this instructor" }, 404);
    }

    const positive = Math.abs(Number(body.amount));
    const signed = body.isRefund ? -positive : positive;
    const methodLabel = body.method === "card" ? "Square" : body.method === "cash" ? "Cash" : "Bank Transfer";

    // ---- Card: hand off to Square hosted checkout ----
    if (body.method === "card") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/square-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          pupilId: body.pupilId,
          instructorId,
          amount: positive,
          customerEmail: body.customerEmail ?? pupil.email ?? undefined,
          customerName: body.customerName ?? pupil.name ?? undefined,
          customerPhone: body.customerPhone,
          returnUrl: body.returnUrl,
          cancelUrl: body.cancelUrl,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return json({ error: data?.error || "Failed to create Square checkout" }, resp.status);
      }
      return json({ ok: true, kind: "card", ...data });
    }

    // ---- Cash / Bank: atomic insert + balance increment ----
    const { data: inserted, error: insErr } = await admin
      .from("payment_history")
      .insert({
        pupil_id: body.pupilId,
        instructor_id: instructorId,
        amount: signed,
        payment_method: methodLabel,
        payment_type: body.isRefund ? "refund" : "lesson_payment",
        notes: body.note || (body.isRefund ? "Refund" : `${methodLabel} payment`),
      })
      .select("id, recorded_at")
      .single();
    if (insErr) throw insErr;

    const { data: newBalance, error: balErr } = await admin.rpc("increment_pupil_balance", {
      p_pupil_id: body.pupilId,
      p_amount: signed,
    });
    if (balErr) throw balErr;

    // Fire receipt email (non-blocking). Cash/bank payments and refunds both
    // get a receipt — consistent with Square flow.
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          pupilId: body.pupilId,
          instructorId,
          amount: positive,
          paymentMethod: methodLabel,
          transactionReference: inserted?.id ?? `${body.method}-${Date.now()}`,
          type: body.isRefund ? "refund" : "payment",
        }),
      }).catch((e) => console.error("[record-payment] receipt fire failed:", e));
    } catch (e) {
      console.error("[record-payment] receipt block error:", e);
    }

    // Fire instructor push (non-blocking) for cash / bank — Square flow
    // already fires from square-webhook. Refunds get their own framing.
    if (!body.isRefund) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            instructorId,
            category: NotifyCategory.PAYMENT,
            importance: NotifyImportance.NORMAL,
            notification: {
              title: "💰 Payment Received",
              body: `£${positive.toFixed(2)} received from ${pupil.name || "a pupil"} via ${methodLabel}`,
              tag: `payment-received-${inserted?.id ?? Date.now()}`,
              data: { type: PushDataType.PAYMENT_RECEIVED, pupilId: body.pupilId, amount: positive, method: methodLabel },
            },
          }),
        }).catch((e) => console.error("[record-payment] push fire failed:", e));
      } catch (e) {
        console.error("[record-payment] push block error:", e);
      }

      // Notify pupil (non-blocking) that their payment was confirmed.
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${supabaseUrl}/functions/v1/notify-pupil`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            pupilId: body.pupilId,
            type: PupilNotifyType.PAYMENT_CONFIRMED,
            data: { type: PushDataType.PAYMENT_CONFIRMED, amount: positive, method: methodLabel },
          }),
        }).catch((e) => console.error("[record-payment] pupil notify failed:", e));
      } catch (e) {
        console.error("[record-payment] pupil notify block error:", e);
      }
    }

    return json({
      ok: true,
      kind: body.method,
      paymentId: inserted?.id,
      recordedAt: inserted?.recorded_at,
      newBalance,
      message: `${body.isRefund ? "Refunded" : "Recorded"} £${positive.toFixed(2)} (${methodLabel})`,
    });

  } catch (e) {
    console.error("record-payment error:", e);
    return json({ error: (e as Error)?.message || "Internal error" }, 500);
  }
});
