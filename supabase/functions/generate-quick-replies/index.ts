import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { instructor_id, pupil_id, recent_messages } = await req.json();
    if (!instructor_id || !pupil_id) throw new Error("instructor_id and pupil_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get pupil context
    const { data: pupil } = await supabase
      .from("pupils")
      .select("name, test_date, account_balance")
      .eq("id", pupil_id)
      .maybeSingle();

    // Get instructor rate
    const { data: instructor } = await supabase
      .from("instructors")
      .select("hourly_rate, name")
      .eq("id", instructor_id)
      .maybeSingle();

    const context = {
      pupilName: pupil?.name || "pupil",
      testDate: pupil?.test_date,
      balance: pupil?.account_balance,
      hourlyRate: instructor?.hourly_rate || 35,
      recentMessages: recent_messages || [],
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        replies: ["Thanks, see you then!", "No problem at all", "Let me check and get back to you"]
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are helping a driving instructor write quick reply messages to a pupil. Given the conversation context, suggest exactly 3 short reply options (under 15 words each). Make them natural, friendly, and contextually relevant. If the pupil asks about rescheduling, include available time options. If asking about price, mention the rate. Return ONLY a JSON array of 3 strings.`
          },
          { role: "user", content: JSON.stringify(context) }
        ],
      }),
    });

    let replies = ["Thanks, see you then!", "No problem at all", "Let me check and get back to you"];
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
        if (Array.isArray(parsed) && parsed.length >= 3) {
          replies = parsed.slice(0, 3);
        }
      } catch {
        // Use defaults
      }
    }

    return new Response(JSON.stringify({ replies }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Quick replies error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
