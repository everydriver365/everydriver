import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, pupilNames } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are ED, a voice assistant for driving instructors. Parse the user's spoken command into a structured action.

Available pupils: ${pupilNames?.join(", ") || "none loaded"}

Return a JSON tool call with one of these actions:

1. send_message - Send a message to a pupil
   Parameters: pupil_name (string), message (string)
   Examples: "Tell Sarah I'm on my way", "Message John that I'll be 10 minutes late"

2. next_lesson - Query the next upcoming lesson
   Parameters: none
   Example: "What's my next lesson?"

3. today_schedule - Query today's full schedule
   Parameters: none
   Example: "What's my schedule today?", "How many lessons do I have?"

4. pupil_balance - Check a pupil's balance
   Parameters: pupil_name (string)
   Example: "How much does Sarah owe?"

5. navigate - Navigate to a page in the app
   Parameters: page (string - one of: schedule, pupils, messages, payments, settings, home, gaps, tracking)
   Example: "Show my schedule", "Go to payments"

6. unknown - Could not understand the command
   Parameters: original_text (string)

Match pupil names fuzibly (e.g. "sara" matches "Sarah Jones"). Pick the closest match from the available pupils list.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "execute_command",
              description: "Execute a parsed voice command",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["send_message", "next_lesson", "today_schedule", "pupil_balance", "navigate", "unknown"],
                  },
                  pupil_name: { type: "string", description: "Matched pupil name from the available list" },
                  message: { type: "string", description: "Message content for send_message" },
                  page: { type: "string", description: "Page name for navigate" },
                  original_text: { type: "string", description: "Original text for unknown commands" },
                },
                required: ["action"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "execute_command" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ action: "unknown", original_text: transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-parse-intent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
