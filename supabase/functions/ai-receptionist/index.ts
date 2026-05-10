import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, message, instructor_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if AI receptionist is enabled
    const { data: instructor, error: instructorError } = await supabase
      .from("instructors")
      .select("name, phone, hourly_rate, car_type, car_make, car_model, ai_receptionist_enabled, home_postcode, weekend_surcharge_amount, bank_holiday_surcharge_amount, odd_hours_surcharge_amount, odd_hours_start, odd_hours_end")
      .eq("id", instructor_id)
      .single();

    if (!instructor?.ai_receptionist_enabled) {
      return new Response(JSON.stringify({ reply: null, reason: "ai_disabled" }), {
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

    const areasText = instructor.home_postcode 
      ? `around ${instructor.home_postcode}`
      : "local area";

    const systemPrompt = `You are a friendly, helpful receptionist for ${instructor.name}'s driving school. You answer questions from website visitors.

Key information:
- Instructor: ${instructor.name}
- Phone: ${instructor.phone || "Contact via the website"}
- Hourly rate: ${instructor.hourly_rate ? `£${instructor.hourly_rate}/hour` : "Please enquire for pricing"}
- Transmission: ${instructor.car_type || "Manual"}
- Car: ${instructor.car_make ? `${instructor.car_make} ${instructor.car_model || ""}`.trim() : "Modern dual-control vehicle"}
- Areas covered: ${areasText}

Guidelines:
- Be warm, professional, and concise (2-3 sentences max)
- Answer questions about pricing, availability, areas, the car, and lessons
- If they want to book, encourage them to call ${instructor.phone || "us"} or use the booking form
- Don't make up information you don't have
- If unsure, suggest they contact the instructor directly
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
    const reply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Please try contacting us directly.";

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
    console.error("ai-receptionist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
