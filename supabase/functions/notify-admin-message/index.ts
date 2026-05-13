import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "info@everydriver.co.uk";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      instructor_name = "Unknown Instructor",
      instructor_id,
      content = "",
      conversation_id,
    } = body ?? {};

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `New support message from ${instructor_name}`;
    const preview = content.length > 500 ? content.slice(0, 500) + "…" : content;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 8px; color: #0f172a;">New instructor message</h2>
        <p style="color: #475569; margin: 0 0 16px;">
          <strong>${instructor_name}</strong> just sent you a message in the EveryDriver support inbox.
        </p>
        <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; color: #0f172a; white-space: pre-wrap; line-height: 1.5;">
          ${preview.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>
        <p style="margin-top: 20px;">
          <a href="https://everydriver.co.uk/admin/messages"
             style="background: #2B7BC8; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Open Admin Inbox
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          Conversation: ${conversation_id ?? "—"} · Instructor ID: ${instructor_id ?? "—"}
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EveryDriver Support <support@everydriver.co.uk>",
        to: [ADMIN_EMAIL],
        subject,
        html,
        reply_to: ADMIN_EMAIL,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend error:", res.status, text);
      return new Response(JSON.stringify({ error: "Email send failed", detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-admin-message error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
