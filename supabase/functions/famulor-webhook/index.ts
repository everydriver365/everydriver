import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-famulor-signature",
};

async function verifyHmac(secret: string, raw: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // Allow either "sha256=<hex>" or raw hex
  const cleaned = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  // Constant-time-ish compare
  if (cleaned.length !== hex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cleaned.length; i++) mismatch |= cleaned.charCodeAt(i) ^ hex.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SECRET = Deno.env.get("FAMULOR_WEBHOOK_SECRET");
    if (!SECRET) throw new Error("FAMULOR_WEBHOOK_SECRET not configured");

    const raw = await req.text();
    const signature = req.headers.get("x-famulor-signature");
    const ok = await verifyHmac(SECRET, raw, signature);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(raw);
    const event = payload?.event ?? payload?.type ?? "call.completed";
    const call = payload?.data ?? payload?.call ?? payload;

    const famulorCallId: string | undefined = call?.id ?? call?.call_id;
    const logId: string | undefined = call?.metadata?.log_id ?? payload?.metadata?.log_id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Find the log row
    let row: any = null;
    if (logId) {
      const { data } = await admin.from("famulor_call_logs").select("*").eq("id", logId).maybeSingle();
      row = data;
    }
    if (!row && famulorCallId) {
      const { data } = await admin
        .from("famulor_call_logs")
        .select("*")
        .eq("famulor_call_id", famulorCallId)
        .maybeSingle();
      row = data;
    }

    // Inbound: no log row exists yet — create one if we can resolve instructor by inbound number
    if (!row && event.toString().includes("call")) {
      const toNumber: string | undefined = call?.to ?? call?.to_number ?? call?.called_number;
      if (toNumber) {
        const { data: settings } = await admin
          .from("famulor_settings")
          .select("instructor_id")
          .eq("inbound_phone_number", toNumber)
          .maybeSingle();
        if (settings?.instructor_id) {
          const { data: created } = await admin
            .from("famulor_call_logs")
            .insert({
              instructor_id: settings.instructor_id,
              direction: "inbound",
              purpose: "receptionist",
              famulor_call_id: famulorCallId ?? null,
              phone_number: call?.from ?? call?.from_number ?? null,
              status: "queued",
            })
            .select()
            .single();
          row = created;
        }
      }
    }

    if (!row) {
      // Acknowledge so Famulor doesn't retry forever, but log
      console.warn("famulor-webhook: no matching log row", { famulorCallId, logId });
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map status
    const rawStatus: string = call?.status ?? "completed";
    const status =
      rawStatus === "completed" || rawStatus === "ended" ? "completed" :
      rawStatus === "no-answer" || rawStatus === "no_answer" ? "no_answer" :
      rawStatus === "failed" || rawStatus === "error" ? "failed" :
      rawStatus === "in-progress" || rawStatus === "in_progress" ? "in_progress" :
      "completed";

    await admin
      .from("famulor_call_logs")
      .update({
        status,
        duration_seconds: call?.duration ?? call?.duration_seconds ?? null,
        transcript: call?.transcript ?? null,
        summary: call?.summary ?? call?.analysis?.summary ?? null,
        outcome: call?.outcome ?? call?.analysis?.outcome ?? null,
        recording_url: call?.recording_url ?? call?.recording?.url ?? null,
        famulor_call_id: famulorCallId ?? row.famulor_call_id,
        ended_at: status === "completed" || status === "failed" || status === "no_answer" ? new Date().toISOString() : row.ended_at,
      })
      .eq("id", row.id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("famulor-webhook error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
