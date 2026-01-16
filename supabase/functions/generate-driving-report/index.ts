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
  g_force: number | null;
  sensor_source: string | null;
}

interface TelematicsSession {
  total_distance_km: number;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  started_at: string;
}

interface GPSPoint {
  gps_accuracy_m: number | null;
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

    // Fetch driving events for this session (including new fields)
    const { data: events } = await supabase
      .from("driving_behavior_events")
      .select("event_type, severity, speed_at_event, notes, g_force, sensor_source")
      .eq("telematics_id", telematicsId);

    const drivingEvents: DrivingEvent[] = events || [];

    // Fetch GPS quality stats
    const { data: gpsPoints } = await supabase
      .from("telematics_gps_points")
      .select("gps_accuracy_m")
      .eq("telematics_id", telematicsId)
      .not("gps_accuracy_m", "is", null);

    const gpsAccuracies = (gpsPoints || []).map(p => p.gps_accuracy_m).filter((a): a is number => a !== null);
    const avgGpsAccuracy = gpsAccuracies.length > 0 
      ? gpsAccuracies.reduce((a, b) => a + b, 0) / gpsAccuracies.length 
      : null;
    const gpsQuality = avgGpsAccuracy !== null 
      ? avgGpsAccuracy < 20 ? "Excellent" : avgGpsAccuracy < 50 ? "Good" : avgGpsAccuracy < 100 ? "Fair" : "Poor"
      : "Unknown";

    // Categorize events
    const goodEvents = drivingEvents.filter(e => 
      e.event_type === "smooth_stop" || e.event_type === "good_acceleration" || e.event_type === "smooth_cornering"
    );
    const badEvents = drivingEvents.filter(e => 
      e.event_type === "harsh_brake" || e.event_type === "harsh_acceleration" || 
      e.event_type === "speeding" || e.event_type === "sharp_turn" || e.event_type === "hard_impact"
    );

    // Motion sensor events
    const motionEvents = drivingEvents.filter(e => e.sensor_source === "motion");
    const gpsBasedEvents = drivingEvents.filter(e => e.sensor_source === "gps" || !e.sensor_source);

    // Calculate G-force statistics
    const gForces = drivingEvents.map(e => e.g_force).filter((g): g is number => g !== null);
    const maxGForce = gForces.length > 0 ? Math.max(...gForces) : null;
    const avgGForce = gForces.length > 0 ? gForces.reduce((a, b) => a + b, 0) / gForces.length : null;

    // Enhanced scoring
    const distanceKm = Number(session.total_distance_km) > 0 ? Number(session.total_distance_km) : 1;
    const eventsPerKm = badEvents.length / distanceKm;
    const baseScore = 100 - (badEvents.length * 8) + (goodEvents.length * 3);
    const consistencyBonus = eventsPerKm < 0.5 ? 5 : eventsPerKm < 1 ? 2 : 0;
    const smoothnessBonus = avgGForce !== null && avgGForce < 0.2 ? 5 : 0;
    const drivingScore = Math.max(0, Math.min(100, baseScore + consistencyBonus + smoothnessBonus));

    // Build enhanced context for AI
    const eventsSummary = drivingEvents.map(e => {
      let eventStr = `- ${e.event_type.replace(/_/g, " ")} (${e.severity})`;
      if (e.speed_at_event) eventStr += ` at ${e.speed_at_event.toFixed(0)} km/h`;
      if (e.g_force) eventStr += ` [${e.g_force.toFixed(2)}g]`;
      if (e.sensor_source) eventStr += ` [${e.sensor_source}]`;
      if (e.notes) eventStr += `: ${e.notes}`;
      return eventStr;
    }).join("\n");

    const sessionInfo = `
Lesson Summary:
- Distance: ${Number(session.total_distance_km).toFixed(1)} km
- Average Speed: ${session.avg_speed_kmh ? Number(session.avg_speed_kmh).toFixed(0) : "N/A"} km/h
- Max Speed: ${session.max_speed_kmh ? Number(session.max_speed_kmh).toFixed(0) : "N/A"} km/h
- GPS Signal Quality: ${gpsQuality}${avgGpsAccuracy ? ` (avg ±${avgGpsAccuracy.toFixed(0)}m)` : ""}

Event Statistics:
- Good Events: ${goodEvents.length} (smooth stops, good acceleration, smooth cornering)
- Areas for Improvement: ${badEvents.length}
- Motion Sensor Events: ${motionEvents.length}
- GPS-Based Events: ${gpsBasedEvents.length}
- Driving Score: ${drivingScore}/100

Vehicle Control (from motion sensors):
- Max G-Force Recorded: ${maxGForce ? maxGForce.toFixed(2) + "g" : "N/A"}
- Average G-Force: ${avgGForce ? avgGForce.toFixed(2) + "g" : "N/A"}
- Smoothness Rating: ${avgGForce !== null ? (avgGForce < 0.15 ? "Excellent" : avgGForce < 0.25 ? "Good" : avgGForce < 0.4 ? "Moderate" : "Needs Work") : "N/A"}

Driving Events:
${eventsSummary || "No significant events recorded."}
`;

    const systemPrompt = `You are an experienced UK driving instructor providing constructive feedback to learner drivers. 
Your feedback should be:
- Encouraging and supportive
- Specific and actionable
- Based on the DVSA standards for driving tests
- Focused on safety and good habits
- Include insights from both GPS tracking AND motion sensor data when available

When analyzing the data:
- G-force readings indicate how smoothly the car is being controlled
- Motion sensor events (sharp_turn, smooth_cornering) show vehicle handling
- GPS events (harsh_brake, speeding) show speed-related behavior
- Lower G-force averages indicate smoother, safer driving

Provide your response in the following JSON format:
{
  "overallAssessment": "A 2-3 sentence summary of the lesson including observations about vehicle control",
  "strengths": ["List 2-4 specific things the pupil did well, including smooth driving if G-force was low"],
  "areasToImprove": ["List 2-4 specific areas that need work, referencing specific events if applicable"],
  "practiceRecommendations": ["2-4 focused exercises for the next lesson"],
  "safetyNotes": "Any important safety considerations based on the data (or null if none)",
  "encouragement": "A brief motivational message for the pupil",
  "vehicleControl": "A sentence about their overall vehicle control based on G-force and motion data"
}`;

    const userPrompt = `Generate a driving lesson feedback report for ${pupilName || "the pupil"} based on this enhanced telematics data:\n\n${sessionInfo}`;

    console.log("Generating report with enhanced data:", { 
      events: drivingEvents.length, 
      motionEvents: motionEvents.length,
      maxGForce,
      avgGForce,
      gpsQuality
    });

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
              description: "Generate structured driving lesson feedback with vehicle control insights",
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
                  encouragement: { type: "string", description: "Motivational message for the pupil" },
                  vehicleControl: { 
                    type: "string", 
                    description: "Assessment of vehicle control based on G-force and motion sensor data"
                  }
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
            encouragement: "Keep up the good work!",
            vehicleControl: "Vehicle control data was not available for this session."
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
          badEvents: badEvents.length,
          motionEvents: motionEvents.length,
          maxGForce: maxGForce ? maxGForce.toFixed(2) : null,
          avgGForce: avgGForce ? avgGForce.toFixed(2) : null,
          gpsQuality
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
