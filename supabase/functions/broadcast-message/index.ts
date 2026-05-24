import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface BroadcastRequest {
  pupil_ids: string[];
  message: string;
  template_id?: string | null;
}

const BATCH_SIZE = 50;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Caller client — verifies JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // Service client — bypasses RLS for safe fan-out + log insert
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Resolve caller's instructor row
    const { data: instructor, error: instErr } = await admin
      .from("instructors")
      .select("id, name, business_name, broadcast_messaging_enabled")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (instErr || !instructor) {
      return new Response(JSON.stringify({ error: "Instructor not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (instructor.broadcast_messaging_enabled === false) {
      return new Response(
        JSON.stringify({ error: "Broadcast messaging is disabled for this account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json().catch(() => null)) as BroadcastRequest | null;
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const pupilIds = Array.isArray(body.pupil_ids)
      ? body.pupil_ids.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    const templateId = body.template_id || null;

    if (!message || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Message must be 1–2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (pupilIds.length === 0 || pupilIds.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Must provide 1–1000 pupil_ids" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Restrict to pupils that actually belong to this instructor
    const { data: ownedPupils, error: pupilErr } = await admin
      .from("pupils")
      .select("id")
      .eq("instructor_id", instructor.id)
      .is("deleted_at", null)
      .in("id", pupilIds);

    if (pupilErr) {
      return new Response(JSON.stringify({ error: "Failed to resolve pupils" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validIds = (ownedPupils || []).map((p) => p.id);
    if (validIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid pupils for this instructor" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const senderName = instructor.business_name || instructor.name || "Your instructor";
    const pushTitle = `${senderName} sent you a message`;
    const pushBody = message.length > 100 ? message.slice(0, 97) + "..." : message;

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
      const batch = validIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (pupilId) => {
          try {
            // Upsert conversation
            let convId: string | null = null;
            const { data: existing } = await admin
              .from("conversations")
              .select("id")
              .eq("instructor_id", instructor.id)
              .eq("pupil_id", pupilId)
              .maybeSingle();

            if (existing?.id) {
              convId = existing.id;
            } else {
              const { data: newConv, error: convErr } = await admin
                .from("conversations")
                .insert({ instructor_id: instructor.id, pupil_id: pupilId })
                .select("id")
                .single();
              if (convErr || !newConv) {
                failed++;
                return;
              }
              convId = newConv.id;
            }

            const { error: msgErr } = await admin.from("messages").insert({
              conversation_id: convId,
              sender_type: "instructor",
              sender_id: instructor.id,
              content: message,
            });

            if (msgErr) {
              failed++;
              return;
            }

            sent++;

            // Fire-and-forget push notification
            admin.functions
              .invoke("notify-pupil", {
                body: {
                  pupilId,
                  type: "message",
                  title: pushTitle,
                  body: pushBody,
                },
              })
              .catch(() => {});
          } catch (_err) {
            failed++;
          }
        }),
      );
    }

    const status = failed === 0 ? "sent" : sent === 0 ? "failed" : "partial";

    const { data: logRow } = await admin
      .from("broadcast_log")
      .insert({
        instructor_id: instructor.id,
        message,
        recipient_count: sent,
        failed_count: failed,
        template_id: templateId,
        status,
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({
        sent,
        failed,
        broadcast_id: logRow?.id ?? null,
        status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("broadcast-message error", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
