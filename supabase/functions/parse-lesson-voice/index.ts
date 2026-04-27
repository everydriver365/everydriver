// Parse a free-form voice transcript into structured lesson fields using
// Lovable AI Gateway (google/gemini-2.5-flash). No user-supplied API key needed.
//
// Request:  { transcript: string, pupil_names?: string[], today_iso?: string }
// Response: { parsed: { pupil_name?: string, lesson_date?: string, start_time?: string,
//                       duration_minutes?: number, location?: string, notes?: string } }
//
// All fields are optional; the client confirms before writing to the DB.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an assistant that converts a UK driving instructor's spoken note into structured lesson booking fields.

Rules:
- Output only JSON matching the supplied schema. No commentary.
- Resolve relative dates ("tomorrow", "next Tuesday") using the supplied today_iso (YYYY-MM-DD).
- start_time must be 24-hour HH:mm. Convert "half past three" -> "15:30", "quarter to four" -> "15:45".
- duration_minutes: integer; if user says "an hour" -> 60, "two hours" -> 120, "ninety minutes" -> 90. Default to 60 if unspecified.
- pupil_name should match one of the supplied pupil_names if any are an obvious phonetic match; otherwise echo what was said.
- location: pickup spot or postcode if mentioned; otherwise leave empty.
- notes: anything else useful (lesson type, focus area, test prep, etc.).
- If a field is not in the transcript, omit it.`;

const tool = {
  type: "function",
  function: {
    name: "submit_lesson_draft",
    description: "Submit the structured lesson draft parsed from the transcript",
    parameters: {
      type: "object",
      properties: {
        pupil_name: { type: "string", description: "Pupil's name as best understood" },
        lesson_date: { type: "string", description: "Lesson date in YYYY-MM-DD" },
        start_time: { type: "string", description: "Start time in 24-hour HH:mm" },
        duration_minutes: { type: "integer", description: "Lesson duration in minutes" },
        location: { type: "string", description: "Pickup location or postcode" },
        notes: { type: "string", description: "Any other relevant info" },
      },
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, pupil_names = [], today_iso } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = today_iso || new Date().toISOString().slice(0, 10);
    const namesHint = pupil_names.length
      ? `Known pupil names (use the closest phonetic match if obvious): ${pupil_names.slice(0, 200).join(", ")}.`
      : "";

    const userPrompt = `today_iso: ${today}\n${namesHint}\n\nTranscript:\n"""${transcript.trim()}"""`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_lesson_draft" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: Record<string, unknown> = {};
    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        parsed = {};
      }
    }

    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-lesson-voice error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
