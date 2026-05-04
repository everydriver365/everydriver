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
  const cleaned = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  if (cleaned.length !== hex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cleaned.length; i++) mismatch |= cleaned.charCodeAt(i) ^ hex.charCodeAt(i);
  return mismatch === 0;
}

function toE164(raw: string): string {
  let f = (raw ?? "").replace(/\s+/g, "");
  if (f.startsWith("07")) f = "+44" + f.substring(1);
  else if (f.startsWith("00")) f = "+" + f.substring(2);
  else if (!f.startsWith("+")) f = "+" + f;
  return f;
}

function withinUkQuietHoursOk(now = new Date()): boolean {
  // London local hour 08:00–20:00
  const london = new Date(now.toLocaleString("en-GB", { timeZone: "Europe/London" }));
  const h = london.getHours();
  return h >= 8 && h < 20;
}

function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

const DEFAULT_FALLBACK_TEMPLATE =
  "Hi {name}, sorry we just missed you on the phone. If you'd like to chat or book a lesson, reply here{booking_suffix}. Thanks, {instructor}.";

async function sendWhatsApp(token: string, phoneId: string, to: string, body: string) {
  const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "text",
      text: { body },
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`WhatsApp send failed [${r.status}]: ${JSON.stringify(data)}`);
  return data;
}

async function sendSms(sid: string, token: string, from: string | null, msgSid: string | null, to: string, body: string) {
  const params = new URLSearchParams({ To: to, Body: body });
  if (msgSid) params.append("MessagingServiceSid", msgSid);
  else if (from) params.append("From", from);
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${sid}:${token}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Twilio send failed [${r.status}]: ${JSON.stringify(data)}`);
  return data;
}

async function maybeSendAutoFallback(admin: any, row: any, status: string) {
  try {
    if (row.direction !== "outbound") return null;
    if (status !== "no_answer" && status !== "failed") return null;
    if (row?.metadata?.auto_fallback) return null; // idempotent
    if (!withinUkQuietHoursOk()) return { skipped: "quiet_hours" };

    const phone = row.phone_number ?? row.to_number;
    if (!phone) return { skipped: "no_phone" };

    // Settings
    const { data: settings } = await admin
      .from("famulor_settings")
      .select("auto_fallback_enabled, auto_fallback_channel, fallback_template")
      .eq("instructor_id", row.instructor_id)
      .maybeSingle();
    if (!settings?.auto_fallback_enabled) return { skipped: "disabled" };

    // Instructor name + booking link
    const { data: instructor } = await admin
      .from("instructors")
      .select("id, name, mini_website_slug")
      .eq("id", row.instructor_id)
      .maybeSingle();

    // Pupil name
    let pupilName = "there";
    if (row.pupil_id) {
      const { data: pupil } = await admin.from("pupils").select("name").eq("id", row.pupil_id).maybeSingle();
      if (pupil?.name) pupilName = pupil.name.split(" ")[0];
    }

    // 6-hour duplicate guard per pupil
    if (row.pupil_id) {
      const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await admin
        .from("famulor_call_logs")
        .select("id")
        .eq("pupil_id", row.pupil_id)
        .gte("created_at", since)
        .not("metadata->auto_fallback", "is", null)
        .limit(1);
      if (recent && recent.length > 0) return { skipped: "recent_fallback" };
    }

    const bookingLink = instructor?.mini_website_slug
      ? `https://drive365.co.uk/${instructor.mini_website_slug}`
      : null;
    const tpl = settings.fallback_template?.trim() || DEFAULT_FALLBACK_TEMPLATE;
    const message = renderTemplate(tpl, {
      name: pupilName,
      instructor: instructor?.name ?? "your instructor",
      booking_link: bookingLink ?? "",
      booking_suffix: bookingLink ? ` or book online: ${bookingLink}` : "",
    }).slice(0, 600);

    const e164 = toE164(phone);
    const channelPref = settings.auto_fallback_channel ?? "whatsapp_first";
    let sentVia: "whatsapp" | "sms" | null = null;
    let result: any = null;
    let lastError: string | null = null;

    if (channelPref === "whatsapp_first") {
      const { data: acct } = await admin
        .from("instructor_whatsapp_accounts")
        .select("access_token, phone_number_id, status")
        .eq("instructor_id", row.instructor_id)
        .maybeSingle();
      const waToken = acct?.status === "connected" ? acct?.access_token : Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
      const waPhoneId = acct?.status === "connected" ? acct?.phone_number_id : Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      if (waToken && waPhoneId) {
        try {
          result = await sendWhatsApp(waToken, waPhoneId, e164, message);
          sentVia = "whatsapp";
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
          console.warn("famulor auto-fallback: WhatsApp failed, falling back to SMS", lastError);
        }
      }
    }

    if (!sentVia) {
      const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TOK = Deno.env.get("TWILIO_AUTH_TOKEN");
      const FROM = Deno.env.get("TWILIO_PHONE_NUMBER") ?? null;
      const MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID") ?? null;
      if (SID && TOK && (FROM || MSG_SID)) {
        try {
          result = await sendSms(SID, TOK, FROM, MSG_SID, e164, message);
          sentVia = "sms";
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
        }
      }
    }

    const stamp = {
      auto_fallback: {
        sent: !!sentVia,
        channel: sentVia,
        at: new Date().toISOString(),
        to: e164,
        error: sentVia ? null : lastError,
      },
    };
    const newMetadata = { ...(row.metadata ?? {}), ...stamp };
    await admin.from("famulor_call_logs").update({ metadata: newMetadata }).eq("id", row.id);
    return stamp;
  } catch (e) {
    console.error("auto-fallback error", e);
    return { skipped: "error" };
  }
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
      console.warn("famulor-webhook: no matching log row", { famulorCallId, logId });
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawStatus: string = call?.status ?? "completed";
    const status =
      rawStatus === "completed" || rawStatus === "ended" ? "completed" :
      rawStatus === "no-answer" || rawStatus === "no_answer" ? "no_answer" :
      rawStatus === "failed" || rawStatus === "error" ? "failed" :
      rawStatus === "in-progress" || rawStatus === "in_progress" ? "in_progress" :
      "completed";

    const previousStatus = row.status;

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

    // Auto-fallback only if newly transitioned into no_answer/failed
    let fallback: any = null;
    if ((status === "no_answer" || status === "failed") && previousStatus !== status) {
      // Refetch row to get up-to-date metadata
      const { data: fresh } = await admin.from("famulor_call_logs").select("*").eq("id", row.id).maybeSingle();
      if (fresh) fallback = await maybeSendAutoFallback(admin, fresh, status);
    }

    return new Response(JSON.stringify({ ok: true, fallback }), {
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
