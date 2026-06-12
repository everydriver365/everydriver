import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "info@everydriver.co.uk";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authHeader || !serviceKey || !authHeader.includes(serviceKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      instructor_name = "Unknown Instructor",
      instructor_id,
      content = "",
      conversation_id,
    } = body ?? {};

    const subject = `New support message from ${instructor_name}`;
    const preview = content.length > 500 ? content.slice(0, 500) + "…" : content;

    const result = await sendBrandedEmail({
      to: ADMIN_EMAIL,
      subject,
      heading: "New instructor message",
      intro: `${instructor_name} just sent a message in the EveryDriver support inbox.`,
      paragraphs: preview ? [preview] : [],
      details: [
        { label: "Conversation", value: conversation_id ?? "—" },
        { label: "Instructor ID", value: instructor_id ?? "—" },
      ],
      ctaLabel: "Open Admin Inbox",
      ctaUrl: "https://everydriver.co.uk/admin/messages",
      idempotencyKey: `admin-msg-${conversation_id ?? instructor_id ?? Date.now()}`,
    });

    if (result.enqueued === 0) {
      return new Response(JSON.stringify({ error: "Email send failed", detail: result.errors }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-admin-message error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
