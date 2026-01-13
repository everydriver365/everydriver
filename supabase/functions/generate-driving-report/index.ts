import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DrivingEvent {
  event_type: string;
  severity: string;
  speed_at_event: number | null;
  notes: string | null;
}

interface TelematicsSession {
  total_distance_km: number;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  started_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telematicsId, pupilName } = await req.json();

    if (!telematicsId) {
      return new Response(
        JSON.stringify({ error: "telematicsId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch telematics session
    const { data: session, error: sessionError } = await supabase
      .from("lesson_telematics")
      .select("*")
      .eq("id", telematicsId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Telematics session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch driving events for this session
    const { data: events } = await supabase
      .from("driving_behavior_events")
      .select("event_type, severity, speed_at_event, notes")
      .eq("telematics_id", telematicsId);

    const drivingEvents: DrivingEvent[] = events || [];

    // Calculate statistics
    const goodEvents = drivingEvents.filter(e => 
      e.event_type === "smooth_stop" || e.event_type === "good_acceleration"
    );
    const badEvents = drivingEvents.filter(e => 
      e.event_type === "harsh_brake" || e.event_type === "harsh_acceleration" || 
      e.event_type === "speeding" || e.event_type === "sharp_turn"
    );

    const drivingScore = Math.max(0, Math.min(100, 100 - (badEvents.length * 10) + (goodEvents.length * 5)));

    // Build context for AI
    const eventsSummary = drivingEvents.map(e => 
      `- ${e.event_type.replace(/_/g, " ")} (${e.severity})${e.speed_at_event ? ` at ${e.speed_at_event.toFixed(0)} km/h` : ""}${e.notes ? `: ${e.notes}` : ""}`
    ).join("\n");

    const sessionInfo = `
Lesson Summary:
- Distance: ${Number(session.total_distance_km).toFixed(1)} km
- Average Speed: ${session.avg_speed_kmh ? Number(session.avg_speed_kmh).toFixed(0) : "N/A"} km/h
- Max Speed: ${session.max_speed_kmh ? Number(session.max_speed_kmh).toFixed(0) : "N/A"} km/h
- Good Events: ${goodEvents.length}
- Areas for Improvement: ${badEvents.length}
- Driving Score: ${drivingScore}/100

Driving Events:
${eventsSummary || "No significant events recorded."}
`;

    const systemPrompt = `You are an experienced UK driving instructor providing constructive feedback to learner drivers. 
Your feedback should be:
- Encouraging and supportive
- Specific and actionable
- Based on the DVSA standards for driving tests
- Focused on safety and good habits

Provide your response in the following JSON format:
{
  "overallAssessment": "A 2-3 sentence summary of the lesson",
  "strengths": ["List 2-3 specific things the pupil did well"],
  "areasToImprove": ["List 2-3 specific areas that need work"],
  "practiceRecommendations": ["2-3 focused exercises for the next lesson"],
  "safetyNotes": "Any important safety considerations (or null if none)",
  "encouragement": "A brief motivational message for the pupil"
}`;

    const userPrompt = `Generate a driving lesson feedback report for ${pupilName || "the pupil"} based on this telematics data:\n\n${sessionInfo}`;

    // Call Lovable AI Gateway with tool calling for structured output
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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_driving_feedback",
              description: "Generate structured driving lesson feedback",
              parameters: {
                type: "object",
                properties: {
                  overallAssessment: { type: "string", description: "2-3 sentence summary of the lesson" },
                  strengths: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "List of things the pupil did well"
                  },
                  areasToImprove: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "List of areas that need work"
                  },
                  practiceRecommendations: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Focused exercises for the next lesson"
                  },
                  safetyNotes: { 
                    type: "string", 
                    nullable: true,
                    description: "Important safety considerations if any"
                  },
                  encouragement: { type: "string", description: "Motivational message for the pupil" }
                },
                required: ["overallAssessment", "strengths", "areasToImprove", "practiceRecommendations", "encouragement"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_driving_feedback" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate report");
    }

    const aiResponse = await response.json();
    
    // Extract the function call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    let feedback;
    
    if (toolCall?.function?.arguments) {
      feedback = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content if tool calling didn't work
      const content = aiResponse.choices?.[0]?.message?.content;
      if (content) {
        try {
          feedback = JSON.parse(content);
        } catch {
          feedback = {
            overallAssessment: "Unable to generate detailed feedback at this time.",
            strengths: ["Completed the lesson successfully"],
            areasToImprove: ["Continue practicing regularly"],
            practiceRecommendations: ["Focus on smooth vehicle control"],
            safetyNotes: null,
            encouragement: "Keep up the good work!"
          };
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        drivingScore,
        sessionStats: {
          distance: Number(session.total_distance_km).toFixed(1),
          avgSpeed: session.avg_speed_kmh ? Number(session.avg_speed_kmh).toFixed(0) : null,
          maxSpeed: session.max_speed_kmh ? Number(session.max_speed_kmh).toFixed(0) : null,
          goodEvents: goodEvents.length,
          badEvents: badEvents.length
        },
        feedback
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating driving report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});