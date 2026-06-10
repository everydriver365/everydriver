// Assess pupil test readiness using Lovable AI Gateway.
// Triggered manually per-pupil or in bulk via cron when
// instructors.ai_test_readiness_enabled = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface AssessInput { pupilId: string; instructorId: string }

interface Assessment {
  score: number;
  verdict: "not_ready" | "nearly_ready" | "ready";
  summary: string;
  recommendations: string[];
}

async function assessOne(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  pupilId: string,
  instructorId: string,
): Promise<Assessment> {
  // Pupil + lessons
  const [pupilRes, lessonsRes, ratingsRes, mocksRes] = await Promise.all([
    supabase.from("pupils").select("id, name").eq("id", pupilId).maybeSingle(),
    supabase
      .from("scheduled_lessons")
      .select("id, duration_minutes, scheduled_date, status")
      .eq("pupil_id", pupilId)
      .eq("status", "completed"),
    supabase.from("lesson_ratings").select("rating").eq("pupil_id", pupilId),
    supabase.from("theory_mock_results").select("score, total_questions").eq("pupil_id", pupilId).order("created_at", { ascending: false }).limit(5),
  ]);

  const lessons = (lessonsRes.data ?? []) as Array<{ duration_minutes: number | null; scheduled_date: string }>;
  const totalMinutes = lessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
  const hoursCompleted = Math.round(totalMinutes / 60);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const recentLessons = lessons.filter((l) => l.scheduled_date >= cutoff).length;

  const ratings = (ratingsRes.data ?? []) as Array<{ rating: number }>;
  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length).toFixed(1)
    : "n/a";

  const mocks = (mocksRes.data ?? []) as Array<{ score: number; total_questions: number }>;
  const mockScores = mocks.length
    ? mocks.map((m) => `${m.score}/${m.total_questions}`).join(", ")
    : "none recorded";

  // Notes — instructor notes about this pupil (if shared)
  const { data: notesData } = await supabase
    .from("notes")
    .select("content")
    .eq("owner_id", instructorId)
    .eq("shared_with_id", pupilId)
    .limit(5);
  const notes = (notesData ?? []).map((n: { content: string }) => n.content).join("\n").slice(0, 1500) || "none";

  const prompt = `You are an expert DVSA driving examiner assessing whether a pupil is ready for their practical driving test.

Pupil data:
- Total hours completed: ${hoursCompleted}
- Lessons in last 30 days: ${recentLessons}
- Average lesson rating: ${avgRating}/5
- Mock theory test scores: ${mockScores}
- Instructor notes: ${notes}

UK average is 45 hours of lessons before passing. Assess this pupil's readiness on a scale of 1-10 where:
1-3 = Not ready, needs significant more practice
4-6 = Making progress but not ready yet
7-8 = Nearly ready, a few more lessons recommended
9-10 = Ready to book test

Respond ONLY with valid JSON: { "score": number, "verdict": "not_ready"|"nearly_ready"|"ready", "summary": "2-3 sentence summary", "recommendations": ["up to 3 specific recommendations"] }`;

  const aiRes = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are a UK DVSA driving examiner. Respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!aiRes.ok) {
    const text = await aiRes.text();
    throw new Error(`AI gateway ${aiRes.status}: ${text}`);
  }
  const aiJson = await aiRes.json();
  const content: string = aiJson.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Assessment;

  await supabase.from("pupil_test_readiness").insert({
    pupil_id: pupilId,
    instructor_id: instructorId,
    score: parsed.score,
    verdict: parsed.verdict,
    summary: parsed.summary,
    recommendations: parsed.recommendations ?? [],
  });

  return parsed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Bulk cron mode
    if (body?.mode === "cron") {
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id")
        .eq("ai_test_readiness_enabled", true);

      let assessed = 0, skipped = 0, failed = 0;
      for (const inst of instructors ?? []) {
        const { data: pupils } = await supabase
          .from("pupils")
          .select("id")
          .eq("instructor_id", inst.id)
          .is("deleted_at", null);
        for (const p of pupils ?? []) {
          try {
            await assessOne(supabase, apiKey, p.id as string, inst.id as string);
            assessed++;
          } catch (e) {
            console.error("assess failed", p.id, e);
            failed++;
          }
        }
      }
      return new Response(JSON.stringify({ success: true, assessed, skipped, failed }), {
        status: 200, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Single-pupil mode
    const { pupilId, instructorId } = body as AssessInput;
    if (!pupilId || !instructorId) {
      return new Response(JSON.stringify({ error: "pupilId and instructorId required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Gate on instructor toggle
    const { data: inst } = await supabase
      .from("instructors")
      .select("ai_test_readiness_enabled")
      .eq("id", instructorId)
      .maybeSingle();
    if (!inst?.ai_test_readiness_enabled) {
      return new Response(JSON.stringify({ error: "ai_test_readiness disabled for this instructor" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const result = await assessOne(supabase, apiKey, pupilId, instructorId);
    return new Response(JSON.stringify({ success: true, assessment: result }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assess-test-readiness fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
