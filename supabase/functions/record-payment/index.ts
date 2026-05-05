import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

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

    // ---- Card: create Square checkout link, record pending tx ----
    if (body.method === "card") {
      const orderRef = `manual-${Date.now()}-${body.pupilId.slice(0, 6)}`;
      const { data: ck, error: ckErr } = await admin.functions.invoke("square-checkout", {
        body: {
          amount: positive,
          orderReference: orderRef,
          customerEmail: body.customerEmail || pupil.email || undefined,
          customerName: body.customerName || pupil.name,
          customerPhone: body.customerPhone || undefined,
          description: body.note || `Payment from ${pupil.name}`,
          returnUrl: body.returnUrl,
          cancelUrl: body.cancelUrl,
          instructorId,
          pupilId: body.pupilId,
        },
      });
      if (ckErr) throw ckErr;
      const checkoutUrl: string | undefined =
        ck?.checkoutUrl || ck?.url || ck?.payment_link?.url;
      if (!checkoutUrl) return json({ error: ck?.error || "Failed to create payment link" }, 502);

      const { data: inserted, error: insErr } = await admin
        .from("payment_history")
        .insert({
          pupil_id: body.pupilId,
          instructor_id: instructorId,
          amount: positive,
          payment_method: "Square",
          notes: `${body.note ? body.note + " · " : ""}Awaiting payment · ${orderRef} pending`,
          payout_status: "pending",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      return json({
        ok: true,
        kind: "card",
        paymentId: inserted?.id,
        checkoutUrl,
        message: "Payment link created. Share with pupil to complete.",
      });
    }

    // ---- Cash / Bank: atomic insert + balance increment ----
    const { data: inserted, error: insErr } = await admin
      .from("payment_history")
      .insert({
        pupil_id: body.pupilId,
        instructor_id: instructorId,
        amount: signed,
        payment_method: methodLabel,
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
