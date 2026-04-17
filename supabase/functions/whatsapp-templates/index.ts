import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getInstructorContext(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: "Unauthorized", status: 401 };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: claimsData } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (!claimsData?.claims) return { error: "Unauthorized", status: 401 };

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: instructor } = await service
    .from("instructors").select("id").eq("auth_user_id", claimsData.claims.sub).maybeSingle();
  if (!instructor) return { error: "Instructor not found", status: 404 };

  const { data: acct } = await service
    .from("instructor_whatsapp_accounts")
    .select("access_token, phone_number_id, waba_id")
    .eq("instructor_id", instructor.id).maybeSingle();

  const token = acct?.access_token || Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
  const phoneId = acct?.phone_number_id || Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const wabaId = acct?.waba_id || Deno.env.get("WHATSAPP_WABA_ID");

  return { service, instructor, token, phoneId, wabaId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ctx = await getInstructorContext(req);
    if ("error" in ctx) {
      return new Response(JSON.stringify({ error: ctx.error }), { status: ctx.status, headers: corsHeaders });
    }
    const { service, instructor, token, phoneId, wabaId } = ctx;

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || (req.method === "GET" ? "list" : "");
    const body = req.method !== "GET" ? await req.json().catch(() => ({})) : {};
    const op = body.action || action;

    // ---- LIST ----
    if (op === "list") {
      const { data: local } = await service
        .from("whatsapp_templates").select("*")
        .eq("instructor_id", instructor.id)
        .order("created_at", { ascending: false });

      // Try to refresh from Meta if WABA is configured
      if (wabaId && token) {
        try {
          const metaRes = await fetch(
            `https://graph.facebook.com/v18.0/${wabaId}/message_templates?fields=name,status,category,language,components&limit=100`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (metaRes.ok) {
            const metaData = await metaRes.json();
            for (const tpl of (metaData.data || [])) {
              const bodyComp = (tpl.components || []).find((c: any) => c.type === "BODY");
              await service.from("whatsapp_templates").upsert({
                instructor_id: instructor.id,
                meta_template_id: tpl.id || tpl.name,
                name: tpl.name,
                category: (tpl.category || "utility").toLowerCase(),
                language: tpl.language || "en_GB",
                body_text: bodyComp?.text || "",
                status: (tpl.status || "pending").toLowerCase(),
              }, { onConflict: "instructor_id,name,language" });
            }
          }
        } catch (e) { console.warn("Meta template fetch failed:", e); }
      }

      const { data: refreshed } = await service
        .from("whatsapp_templates").select("*")
        .eq("instructor_id", instructor.id)
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ templates: refreshed || local || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- CREATE ----
    if (op === "create") {
      const { name, category, language, body_text, variables } = body;
      if (!name || !body_text) {
        return new Response(JSON.stringify({ error: "Missing name or body_text" }), { status: 400, headers: corsHeaders });
      }

      let metaId: string | null = null;
      let status = "pending";

      if (wabaId && token) {
        const metaRes = await fetch(
          `https://graph.facebook.com/v18.0/${wabaId}/message_templates`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.toLowerCase().replace(/\s+/g, "_"),
              category: (category || "utility").toUpperCase(),
              language: language || "en_GB",
              components: [{ type: "BODY", text: body_text }],
            }),
          }
        );
        const metaData = await metaRes.json();
        if (metaRes.ok) {
          metaId = metaData.id;
          status = (metaData.status || "pending").toLowerCase();
        } else {
          console.warn("Meta template create failed:", metaData);
        }
      }

      const { data, error } = await service.from("whatsapp_templates").insert({
        instructor_id: instructor.id,
        meta_template_id: metaId,
        name: name.toLowerCase().replace(/\s+/g, "_"),
        category: category || "utility",
        language: language || "en_GB",
        body_text,
        variables: variables || [],
        status,
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ template: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- SEND ----
    if (op === "send") {
      const { to, template_name, language, variables } = body;
      if (!to || !template_name) {
        return new Response(JSON.stringify({ error: "Missing to or template_name" }), { status: 400, headers: corsHeaders });
      }
      if (!token || !phoneId) {
        return new Response(JSON.stringify({ error: "WhatsApp not configured" }), { status: 503, headers: corsHeaders });
      }

      const params = (variables || []).map((v: string) => ({ type: "text", text: String(v) }));
      const payload: any = {
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: template_name,
          language: { code: language || "en_GB" },
        },
      };
      if (params.length > 0) {
        payload.template.components = [{ type: "body", parameters: params }];
      }

      const sendRes = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        return new Response(JSON.stringify({ error: "Send failed", details: sendData }), {
          status: 500, headers: corsHeaders,
        });
      }
      return new Response(JSON.stringify({ success: true, message_id: sendData.messages?.[0]?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
