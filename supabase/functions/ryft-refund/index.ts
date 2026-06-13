// Ryft refund — replaces square-refund.
// Looks up payment_history record (with ryft session id), calls Ryft refund API,
// updates payment_history and decrements pupil balance via increment_pupil_balance RPC.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundBody {
  paymentHistoryId: string;
  amount: number; // pounds
  reason?: string;
}

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function ryftBase(): string {
  const e = (Deno.env.get("RYFT_ENVIRONMENT") || "production").toLowerCase();
  return e === "production" || e === "live" || e === "prod"
    ? "https://api.ryftpay.com/v1"
    : "https://sandbox-api.ryftpay.com/v1";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Not authenticated" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Not authenticated" }, 401);

    const { paymentHistoryId, amount, reason } = (await req.json()) as RefundBody;
    if (!paymentHistoryId || !amount || amount <= 0) return json({ error: "Invalid request" }, 400);

    const { data: ph, error: phErr } = await admin
      .from("payment_history")
      .select("*")
      .eq("id", paymentHistoryId)
      .maybeSingle();
    if (phErr || !ph) return json({ error: "Payment not found" }, 404);

    // Ownership check
    const { data: instructorRow } = await admin
      .from("instructors")
      .select("id")
      .eq("auth_user_id", u.user.id)
      .maybeSingle();
    if (!instructorRow || ph.instructor_id !== instructorRow.id) {
      return json({ error: "Forbidden" }, 403);
    }

    const sessionId =
      (ph as any).ryft_payment_session_id ||
      (ph as any).external_id ||
      null;
    if (!sessionId) return json({ error: "No Ryft session ID on payment" }, 400);

    const amountPence = Math.round(amount * 100);
    const secret = Deno.env.get("RYFT_SECRET_KEY")?.trim();
    if (!secret) return json({ error: "Gateway not configured" }, 500);

    const r = await fetch(`${ryftBase()}/payment-sessions/${sessionId}/refunds`, {
      method: "POST",
      headers: { Authorization: secret, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountPence, reason: reason || "Requested by instructor" }),
    });
    const text = await r.text();
    if (!r.ok) return json({ error: `Ryft refund failed: ${r.status}`, detail: text }, 502);

    await admin
      .from("payment_history")
      .update({ status: "refunded", refunded_amount_pence: amountPence, refunded_at: new Date().toISOString() })
      .eq("id", paymentHistoryId);

    if (ph.pupil_id) {
      await admin.rpc("increment_pupil_balance", { p_pupil_id: ph.pupil_id, p_amount_pence: -amountPence });
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
