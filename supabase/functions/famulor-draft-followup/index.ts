import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  call_log_id: z.string().uuid(),
  channel: z.enum(["sms", "whatsapp"]),
  tone: z.enum(["friendly", "professional", "booking_nudge", "apology", "custom"]).default("friendly"),
  custom_instruction: z.string().max(400).optional(),
});

function transcriptToText(t: any): string {
  if (!t) return "";
  if (typeof t === "string") return t.slice(0, 4000);
  const arr = Array.isArray(t) ? t : Array.isArray(t.turns) ? t.turns : Array.isArray(t.messages) ? t.messages : [];
  return arr
    .slice(-40)
    .map((x: any) => {
      const role = (x.role ?? x.speaker ?? "agent").toString();
      const text = x.text ?? x.content ?? "";
      return `${role}: ${text}`;
    })
    .join("\n")
    .slice(0, 4000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { call_log_id, channel, tone, custom_instruction } = parsed.data;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve calling instructor
    const { data: instructor } = await admin
      .from("instructors")
      .select("id, name, mini_website_slug")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!instructor) {
      return new Response(JSON.stringify({ error: "No instructor profile" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load + own the call log
    const { data: log } = await admin
      .from("famulor_call_logs")
      .select("id, instructor_id, pupil_id, purpose, summary, transcript, outcome, status, direction")
      .eq("id", call_log_id)
      .maybeSingle();
    if (!log || log.instructor_id !== instructor.id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pupilName = "there";
    if (log.pupil_id) {
      const { data: pupil } = await admin.from("pupils").select("name").eq("id", log.pupil_id).maybeSingle();
      if (pupil?.name) pupilName = pupil.name.split(" ")[0];
    }

    const bookingLink = instructor.mini_website_slug
      ? `https://drive365.co.uk/${instructor.mini_website_slug}`
      : null;

    const lengthRule = channel === "sms"
      ? "Hard limit: 320 characters. No emojis. Plain text only."
      : "Hard limit: 600 characters. Subtle emojis allowed (max 1).";

    const toneRule = ({
      friendly: "Warm, casual, first-name energy.",
      professional: "Polite, concise, professional.",
      booking_nudge: "Gently steer them toward booking the next lesson.",
      apology: "Apologetic for missing them, reassuring, low-pressure.",
      custom: custom_instruction ?? "Friendly and helpful.",
    })[tone];

    const systemPrompt = [
      "You draft short follow-up messages for a UK driving instructor after an AI phone call.",
      "Use UK English. Never invent specific dates, times, prices or facts not present in the transcript or summary.",
      "If the pupil's name is not 'there', address them by name. Sign off as the instructor.",
      lengthRule,
      "Do not include subject lines or headers. Just the message body.",
      "If a booking link is provided, you may include it once at the end.",
    ].join(" ");

    const userPrompt = [
      `Channel: ${channel.toUpperCase()}`,
      `Tone: ${tone} — ${toneRule}`,
      `Pupil first name: ${pupilName}`,
      `Instructor name: ${instructor.name ?? "Your instructor"}`,
      bookingLink ? `Booking link: ${bookingLink}` : "Booking link: (none)",
      `Call purpose: ${log.purpose ?? "general"}`,
      `Call status: ${log.status}`,
      log.outcome ? `Outcome: ${log.outcome}` : "",
      log.summary ? `\nAI summary of call:\n${log.summary}` : "",
      `\nTranscript (most recent turns):\n${transcriptToText(log.transcript)}`,
      "\nWrite the follow-up message now.",
    ].filter(Boolean).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const message: string = aiData?.choices?.[0]?.message?.content?.trim() ?? "";
    const trimmed = channel === "sms" ? message.slice(0, 320) : message.slice(0, 600);

    return new Response(JSON.stringify({ message: trimmed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("famulor-draft-followup error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
