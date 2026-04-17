// Shared helper to send a WhatsApp template message for a given instructor.
// Returns { ok: true, message_id } on success, { ok: false, reason } otherwise.
//
// Lookup order for credentials:
//  1. Per-instructor token in `instructor_whatsapp_accounts` (status = 'connected')
//  2. Global WHATSAPP_BUSINESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID env vars
//
// Template approval is checked via `whatsapp_templates` (status = 'approved').

export interface SendTemplateInput {
  supabase: any; // service-role client
  instructorId: string;
  to: string;
  templateName: string;
  language?: string;
  variables?: (string | number)[];
  // Optional: log to whatsapp_conversations / whatsapp_messages
  logMessage?: boolean;
  pupilId?: string | null;
}

export interface SendTemplateResult {
  ok: boolean;
  message_id?: string;
  reason?: string;
}

export async function sendWhatsAppTemplate(input: SendTemplateInput): Promise<SendTemplateResult> {
  const {
    supabase,
    instructorId,
    to,
    templateName,
    language = "en_GB",
    variables = [],
    logMessage = true,
    pupilId = null,
  } = input;

  if (!to || !templateName) return { ok: false, reason: "missing_to_or_template" };

  // 1) credentials — per-instructor first, then global
  let token = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
  let phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  const { data: acct } = await supabase
    .from("instructor_whatsapp_accounts")
    .select("access_token, phone_number_id, status")
    .eq("instructor_id", instructorId)
    .maybeSingle();

  if (acct?.access_token && acct?.phone_number_id && acct.status === "connected") {
    token = acct.access_token;
    phoneId = acct.phone_number_id;
  }

  if (!token || !phoneId) return { ok: false, reason: "whatsapp_not_configured" };

  // 2) check template is approved (best-effort)
  const { data: tpl } = await supabase
    .from("whatsapp_templates")
    .select("status, language")
    .eq("instructor_id", instructorId)
    .eq("name", templateName)
    .maybeSingle();

  if (tpl && tpl.status !== "approved") {
    return { ok: false, reason: `template_${tpl.status}` };
  }

  // 3) build & send
  const params = variables.map((v) => ({ type: "text", text: String(v) }));
  const payload: any = {
    messaging_product: "whatsapp",
    to: to.replace(/\D/g, ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: tpl?.language || language },
    },
  };
  if (params.length > 0) {
    payload.template.components = [{ type: "body", parameters: params }];
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok) {
    console.warn("WhatsApp template send failed:", data);
    return { ok: false, reason: data?.error?.message || "send_failed" };
  }

  const messageId = data.messages?.[0]?.id;

  // 4) optional log
  if (logMessage) {
    try {
      const phoneClean = to.replace(/\D/g, "");
      const { data: conv } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("phone_number", phoneClean)
        .maybeSingle();

      let conversationId = conv?.id;
      if (!conversationId) {
        const { data: newConv } = await supabase
          .from("whatsapp_conversations")
          .insert({
            instructor_id: instructorId,
            phone_number: phoneClean,
            pupil_id: pupilId,
            ai_enabled: true,
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        conversationId = newConv?.id;
      } else {
        await supabase
          .from("whatsapp_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      if (conversationId) {
        await supabase.from("whatsapp_messages").insert({
          conversation_id: conversationId,
          content: `[template:${templateName}] ${variables.join(" | ")}`,
          direction: "outbound",
          sender_type: "instructor",
        });
      }
    } catch (e) {
      console.warn("Template log failed:", e);
    }
  }

  return { ok: true, message_id: messageId };
}
