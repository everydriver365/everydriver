import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAMULOR_BASE = "https://api.famulor.de/v1"; // Famulor public API base

const BodySchema = z.object({
  pupil_id: z.string().uuid().optional(),
  phone_number: z.string().optional(),
  purpose: z.enum(["receptionist", "reminder", "win_back", "test", "custom"]),
  custom_prompt: z.string().max(2000).optional(),
  lesson_id: z.string().uuid().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FAMULOR_API_KEY = Deno.env.get("FAMULOR_API_KEY");
    if (!FAMULOR_API_KEY) throw new Error("FAMULOR_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify the calling instructor via JWT
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: instructorRow } = await admin
      .from("instructors")
      .select("id, name, phone")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!instructorRow) {
      return new Response(JSON.stringify({ error: "No instructor profile" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = parsed.data;

    // Load instructor settings
    const { data: settings } = await admin
      .from("famulor_settings")
      .select("*")
      .eq("instructor_id", instructorRow.id)
      .maybeSingle();
    if (!settings || !settings.enabled) {
      return new Response(JSON.stringify({ error: "Famulor not enabled for this instructor" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Daily cap check
    const sinceMidnight = new Date();
    sinceMidnight.setHours(0, 0, 0, 0);
    const { count: todayCount } = await admin
      .from("famulor_call_logs")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorRow.id)
      .gte("created_at", sinceMidnight.toISOString());
    if ((todayCount ?? 0) >= (settings.daily_call_cap ?? 20)) {
      return new Response(JSON.stringify({ error: "Daily call cap reached" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve pupil + phone
    let pupil: any = null;
    let toNumber = body.phone_number;
    if (body.pupil_id) {
      const { data: p } = await admin
        .from("pupils")
        .select("id, name, phone, account_balance, instructor_id")
        .eq("id", body.pupil_id)
        .maybeSingle();
      if (!p || p.instructor_id !== instructorRow.id) {
        return new Response(JSON.stringify({ error: "Pupil not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      pupil = p;
      toNumber = toNumber || p.phone;
    }
    if (body.purpose === "test") toNumber = toNumber || instructorRow.phone || "";
    if (!toNumber) {
      return new Response(JSON.stringify({ error: "No phone number to call" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up next lesson for context if reminder
    let nextLesson: any = null;
    if (body.lesson_id) {
      const { data: l } = await admin
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_address")
        .eq("id", body.lesson_id)
        .maybeSingle();
      nextLesson = l;
    } else if (pupil) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: l } = await admin
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_address")
        .eq("pupil_id", pupil.id)
        .gte("lesson_date", today)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();
      nextLesson = l;
    }

    const agentId =
      body.purpose === "receptionist"
        ? settings.inbound_agent_id
        : settings.outbound_agent_id;
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: `No agent configured for purpose ${body.purpose}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert log row first (queued) so we can correlate webhook by metadata
    const { data: logRow, error: logErr } = await admin
      .from("famulor_call_logs")
      .insert({
        instructor_id: instructorRow.id,
        pupil_id: pupil?.id ?? null,
        direction: "outbound",
        purpose: body.purpose,
        phone_number: toNumber,
        status: "queued",
        metadata: {
          lesson_id: nextLesson?.id ?? null,
          pupil_name: pupil?.name ?? null,
        },
      })
      .select()
      .single();
    if (logErr) throw logErr;

    // Build dynamic variables for the Famulor agent
    const dynamic_variables: Record<string, string> = {
      instructor_name: instructorRow.name ?? "your instructor",
      pupil_name: pupil?.name ?? "",
      purpose: body.purpose,
      log_id: logRow.id,
    };
    if (nextLesson) {
      dynamic_variables.lesson_date = String(nextLesson.lesson_date);
      dynamic_variables.lesson_time = String(nextLesson.start_time);
      dynamic_variables.lesson_duration = String(nextLesson.duration_minutes ?? "");
      dynamic_variables.pickup_address = String(nextLesson.pickup_address ?? "");
    }
    if (body.custom_prompt) dynamic_variables.custom_prompt = body.custom_prompt;

    // Trigger Famulor outbound call
    const fRes = await fetch(`${FAMULOR_BASE}/calls`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FAMULOR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        to: toNumber,
        voice_id: settings.voice_id ?? undefined,
        dynamic_variables,
        metadata: { log_id: logRow.id, instructor_id: instructorRow.id },
      }),
    });
    const fJson = await fRes.json().catch(() => ({}));
    if (!fRes.ok) {
      await admin
        .from("famulor_call_logs")
        .update({ status: "failed", summary: `Trigger failed: ${JSON.stringify(fJson).slice(0, 500)}` })
        .eq("id", logRow.id);
      return new Response(JSON.stringify({ error: "Famulor trigger failed", detail: fJson }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("famulor_call_logs")
      .update({
        status: "in_progress",
        famulor_call_id: fJson?.id ?? fJson?.call_id ?? null,
      })
      .eq("id", logRow.id);

    return new Response(JSON.stringify({ success: true, log_id: logRow.id, famulor: fJson }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("famulor-trigger-call error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
