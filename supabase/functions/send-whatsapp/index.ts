import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    const { to, message, media } = await req.json();

    if (!to || (!message && !media?.url)) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'message'/'media'" }), { status: 400, headers: corsHeaders });
    }

    // Use service role client for logging
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up instructor
    const { data: instructor } = await serviceClient
      .from("instructors")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    // Per-instructor token first, fall back to global
    let WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
    let WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (instructor) {
      const { data: acct } = await serviceClient
        .from("instructor_whatsapp_accounts")
        .select("access_token, phone_number_id, status")
        .eq("instructor_id", instructor.id)
        .maybeSingle();
      if (acct?.access_token && acct?.phone_number_id && acct.status === "connected") {
        WHATSAPP_TOKEN = acct.access_token;
        WHATSAPP_PHONE_ID = acct.phone_number_id;
      }
    }

    let sentVia: string = "whatsapp";
    let messageId: string | null = null;
    let smsSid: string | null = null;

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      // WhatsApp not configured — fall back to SMS via Twilio
      console.log("WhatsApp not configured, falling back to SMS");

      const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
      const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
      const TWILIO_MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

      if (!TWILIO_SID || !TWILIO_TOKEN) {
        return new Response(JSON.stringify({ error: "Neither WhatsApp nor SMS is configured" }), {
          status: 503, headers: corsHeaders,
        });
      }

      const params = new URLSearchParams();
      if (TWILIO_MSG_SID) params.append("MessagingServiceSid", TWILIO_MSG_SID);
      else if (TWILIO_FROM) params.append("From", TWILIO_FROM);
      params.append("To", to);
      params.append("Body", message || (media?.caption ?? "(media attachment)"));

      const smsRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );
      const smsData = await smsRes.json();
      sentVia = "sms";
      smsSid = smsData.sid;
    } else {
      // Build WhatsApp payload (text or media)
      let payload: any;
      if (media?.url) {
        const t = media.type || "image";
        payload = {
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: t,
          [t]: {
            link: media.url,
            ...(media.caption && (t === "image" || t === "document" || t === "video") ? { caption: media.caption } : {}),
            ...(t === "document" && media.filename ? { filename: media.filename } : {}),
          },
        };
      } else {
        payload = {
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: "text",
          text: { body: message },
        };
      }

      const waRes = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const waData = await waRes.json();
      if (!waRes.ok) {
        console.error("WhatsApp API error:", waData);
        return new Response(JSON.stringify({ error: "WhatsApp send failed", details: waData }), {
          status: 500, headers: corsHeaders,
        });
      }
      messageId = waData.messages?.[0]?.id;
    }

    // Log to whatsapp_conversations and whatsapp_messages if instructor found
    if (instructor) {
      try {
        const phoneClean = to.replace(/\D/g, "");

        const { data: conv } = await serviceClient
          .from("whatsapp_conversations")
          .select("id")
          .eq("instructor_id", instructor.id)
          .eq("phone_number", phoneClean)
          .maybeSingle();

        let conversationId: string;
        if (conv) {
          conversationId = conv.id;
          await serviceClient
            .from("whatsapp_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conv.id);
        } else {
          const { data: newConv } = await serviceClient
            .from("whatsapp_conversations")
            .insert({
              instructor_id: instructor.id,
              phone_number: phoneClean,
              visitor_name: null,
              ai_enabled: true,
              last_message_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          conversationId = newConv!.id;
        }

        await serviceClient
          .from("whatsapp_messages")
          .insert({
            conversation_id: conversationId,
            content: message || media?.caption || "",
            direction: "outbound",
            sender_type: "instructor",
            ...(media?.url ? {
              media_url: media.url,
              media_type: media.type || "image",
              media_mime: media.mime || null,
            } : {}),
          });
      } catch (logErr) {
        console.error("Failed to log WhatsApp message:", logErr);
      }
    }

    return new Response(JSON.stringify({
      sent_via: sentVia,
      message_id: messageId,
      sid: smsSid,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-whatsapp error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
