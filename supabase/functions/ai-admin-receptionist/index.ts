import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, message } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if a human admin has already replied since the visitor's message
    const { data: recentMessages } = await supabase
      .from("live_chat_messages")
      .select("sender_type, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(3);

    // If the most recent message is from admin (human), skip AI
    if (recentMessages && recentMessages.length > 0 && recentMessages[0].sender_type === "admin") {
      return new Response(JSON.stringify({ reply: null, reason: "human_replied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get conversation history for context
    const { data: history } = await supabase
      .from("live_chat_messages")
      .select("sender_type, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(20);

    const conversationHistory = (history || []).map(m => ({
      role: m.sender_type === "visitor" ? "user" : "assistant",
      content: m.content,
    }));

    const systemPrompt = `You are a friendly, helpful receptionist for EveryDriver (Drive365), an online platform that connects learner drivers with qualified driving instructors across the UK.

Key information:
- EveryDriver helps learners find local driving instructors
- Instructors offer manual and automatic lessons
- Learners can search by postcode to find instructors in their area
- Courses range from regular weekly lessons to intensive crash courses
- Pricing varies by instructor and location
- The platform offers online booking and secure payments
- Learners can read reviews and compare instructors

Guidelines:
- Be warm, professional, and concise (2-3 sentences max)
- Answer questions about finding instructors, booking lessons, pricing, and how the platform works
- If they want to find an instructor, suggest they use the search feature or browse courses
- If they have account issues, suggest they contact support
- Don't make up specific prices or instructor details
- If unsure, suggest they browse the website or contact support
- Use British English`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service unavailable" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Please try browsing our website or contacting support.";

    // Insert AI response as a chat message
    await supabase.from("live_chat_messages").insert({
      session_id,
      sender_type: "admin",
      content: `🤖 ${reply}`,
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-admin-receptionist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
