// External-partner payment kickoff. Auth via x-partner-key + EXTERNAL_BOOKING_PARTNER_KEYS.
// Card payments dispatch to ryft-create-checkout. BNPL methods dispatch to klarna-checkout / clearpay-checkout.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-partner-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Method = "card" | "square" | "klarna" | "clearpay"; // "square" kept as deprecated alias for "card"

interface Body {
  partner_key: string;
  booking_id: string;
  method: Method;
  customer: { name: string; email: string; phone?: string };
  return_url: string;
  cancel_url: string;
}

function verifyPartner(partnerKey: string, sharedSecret: string): boolean {
  const raw = Deno.env.get("EXTERNAL_BOOKING_PARTNER_KEYS");
  if (!raw) return false;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    const expected = map[partnerKey];
    return typeof expected === "string" && expected.length > 0 && expected === sharedSecret;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const sharedSecret = req.headers.get("x-partner-key") || "";
    const body = (await req.json()) as Body;

    if (!body?.partner_key || !sharedSecret || !verifyPartner(body.partner_key, sharedSecret)) {
      return json({ error: "Invalid partner credentials" }, 401);
    }
    if (!body.booking_id || !body.method || !body.customer?.email || !body.return_url || !body.cancel_url) {
      return json({ error: "Missing required fields" }, 400);
    }
    if (!["card", "square", "klarna", "clearpay"].includes(body.method)) {
      return json({ error: "Unsupported payment method" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load booking + verify partner ownership
    const { data: lesson, error: lessonErr } = await admin
      .from("scheduled_lessons")
      .select("id, instructor_id, pupil_id, amount_due, booking_method")
      .eq("id", body.booking_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (lessonErr) throw lessonErr;
    if (!lesson) return json({ error: "Booking not found" }, 404);
    if (lesson.booking_method !== `partner:${body.partner_key}`) {
      return json({ error: "Booking does not belong to this partner" }, 403);
    }

    const amount = Number(lesson.amount_due || 0);
    if (amount < 0.5) return json({ error: "Amount too small" }, 400);

    const orderRef = `partner-${body.partner_key}-${lesson.id.slice(0, 8)}-${Date.now()}`;

    const payload = {
      amount,
      orderReference: orderRef,
      customerEmail: body.customer.email,
      customerName: body.customer.name,
      customerPhone: body.customer.phone,
      description: `Driving lesson booking ${lesson.id.slice(0, 8)}`,
      returnUrl: body.return_url,
      cancelUrl: body.cancel_url,
      instructorId: lesson.instructor_id,
      pupilId: lesson.pupil_id,
    };

    const fnName =
      body.method === "card" || body.method === "square" ? "ryft-create-checkout" :
      body.method === "klarna" ? "klarna-checkout" :
      "clearpay-checkout";

    const { data: ck, error: ckErr } = await admin.functions.invoke(fnName, { body: payload });
    if (ckErr) throw ckErr;
    const checkoutUrl: string | undefined =
      ck?.checkoutUrl || ck?.url || ck?.redirect_url || ck?.payment_link?.url;
    if (!checkoutUrl) return json({ error: ck?.error || "Failed to create payment link" }, 502);

    return json({ ok: true, checkout_url: checkoutUrl, method: body.method, amount });
  } catch (e) {
    console.error("[public-start-payment] error:", e);
    return json({ error: (e as Error)?.message || "Internal error" }, 500);
  }
});
