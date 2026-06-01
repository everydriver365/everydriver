// Transcribe an audio blob via ElevenLabs Scribe.
// Used by the instructor app's Dictate buttons (e.g. End-of-Lesson notes).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const inForm = await req.formData();
    const file = inForm.get("audio");
    if (!(file instanceof File) && !(file instanceof Blob)) {
      return new Response(JSON.stringify({ error: "Missing 'audio' file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const language = (inForm.get("language") as string | null) ?? "eng";

    const outForm = new FormData();
    outForm.append("file", file, (file as File).name ?? "audio.webm");
    outForm.append("model_id", "scribe_v2");
    outForm.append("language_code", language);
    outForm.append("tag_audio_events", "false");
    outForm.append("diarize", "false");

    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: outForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs STT failed", res.status, errText);
      return new Response(
        JSON.stringify({ error: `Transcription failed (${res.status})`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify({ text: data.text ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-audio error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
