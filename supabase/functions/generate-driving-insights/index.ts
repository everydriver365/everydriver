import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DrivingInsight {
  overallScore: number;
  strengths: string[];
  areasToImprove: string[];
  coachingTips: { priority: "high" | "medium" | "low"; tip: string; evidence: string }[];
  weeklyTrend: "improving" | "steady" | "declining";
  summary: string;
}

interface TelematicsData {
  totalSessions: number;
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  speedingPercentage: number;
  harshBrakingEvents: number;
  harshAccelerationEvents: number;
  speedComplianceRate: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pupilId, instructorId, sessionCount = 5 } = await req.json();

    if (!pupilId || !instructorId) {
      return new Response(
        JSON.stringify({ error: "pupilId and instructorId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent telematics sessions for the pupil
    const { data: sessions, error: sessionsError } = await supabase
      .from("lesson_telematics")
      .select("*")
      .eq("pupil_id", pupilId)
      .eq("instructor_id", instructorId)
      .order("started_at", { ascending: false })
      .limit(sessionCount);

    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({
          overallScore: 0,
          strengths: [],
          areasToImprove: ["Not enough driving data yet"],
          coachingTips: [
            {
              priority: "medium",
              tip: "Complete more lessons to receive personalized insights",
              evidence: "No telemetry data available",
            },
          ],
          weeklyTrend: "steady",
          summary: "Complete more lessons with GPS tracking to receive AI-powered coaching insights.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate telematics data
    const telematicsData: TelematicsData = {
      totalSessions: sessions.length,
      totalDistance: sessions.reduce((sum, s) => sum + (s.total_distance_km || 0), 0),
      averageSpeed: sessions.reduce((sum, s) => sum + (s.average_speed_kmh || 0), 0) / sessions.length,
      maxSpeed: Math.max(...sessions.map((s) => s.max_speed_kmh || 0)),
      speedingPercentage: sessions.reduce((sum, s) => sum + (s.speeding_percentage || 0), 0) / sessions.length,
      harshBrakingEvents: sessions.reduce((sum, s) => sum + (s.harsh_braking_count || 0), 0),
      harshAccelerationEvents: sessions.reduce((sum, s) => sum + (s.harsh_acceleration_count || 0), 0),
      speedComplianceRate: 100 - (sessions.reduce((sum, s) => sum + (s.speeding_percentage || 0), 0) / sessions.length),
    };

    // Fetch pupil info for context
    const { data: pupil } = await supabase
      .from("pupils")
      .select("first_name, experience_level")
      .eq("id", pupilId)
      .single();

    // Generate insights using Lovable AI
    const aiPrompt = buildAIPrompt(telematicsData, pupil, sessions);
    
    const aiResponse = await fetch("https://llm.lovable.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY") || ""}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert driving instructor AI assistant. Analyze the driving telemetry data and provide personalized coaching insights. Be specific, actionable, and encouraging. Focus on safety first. Always respond with valid JSON matching this structure:
{
  "overallScore": number (0-100),
  "strengths": string[] (2-4 items),
  "areasToImprove": string[] (2-3 items),
  "coachingTips": [{ "priority": "high"|"medium"|"low", "tip": string, "evidence": string }] (3-5 items),
  "weeklyTrend": "improving"|"steady"|"declining",
  "summary": string (1-2 sentences)
}`,
          },
          {
            role: "user",
            content: aiPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      // Fallback to rule-based insights if AI fails
      const fallbackInsights = generateFallbackInsights(telematicsData);
      return new Response(JSON.stringify(fallbackInsights), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      const fallbackInsights = generateFallbackInsights(telematicsData);
      return new Response(JSON.stringify(fallbackInsights), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse AI response
    let insights: DrivingInsight;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                       content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      insights = JSON.parse(jsonStr.trim());
    } catch {
      const fallbackInsights = generateFallbackInsights(telematicsData);
      return new Response(JSON.stringify(fallbackInsights), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate insights";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildAIPrompt(
  data: TelematicsData,
  pupil: { first_name: string; experience_level: string } | null,
  sessions: unknown[]
): string {
  const pupilName = pupil?.first_name || "the learner";
  const level = pupil?.experience_level || "intermediate";

  return `Analyze this driving telemetry data for ${pupilName} (experience level: ${level}):

DRIVING STATISTICS (last ${data.totalSessions} sessions):
- Total distance driven: ${data.totalDistance.toFixed(1)} km
- Average speed: ${data.averageSpeed.toFixed(1)} km/h
- Maximum speed recorded: ${data.maxSpeed.toFixed(1)} km/h
- Speed compliance rate: ${data.speedComplianceRate.toFixed(1)}% within limits
- Speeding percentage: ${data.speedingPercentage.toFixed(1)}% of time over limit
- Harsh braking events: ${data.harshBrakingEvents} total
- Harsh acceleration events: ${data.harshAccelerationEvents} total

Based on this data, provide personalized coaching insights. Consider:
1. Safety implications of the driving patterns
2. Areas where the learner excels
3. Specific, actionable improvement tips
4. Whether the overall trend shows improvement

Respond with JSON only.`;
}

function generateFallbackInsights(data: TelematicsData): DrivingInsight {
  const score = calculateOverallScore(data);
  const strengths: string[] = [];
  const areasToImprove: string[] = [];
  const coachingTips: DrivingInsight["coachingTips"] = [];

  // Analyze speed compliance
  if (data.speedComplianceRate >= 90) {
    strengths.push("Excellent speed limit awareness");
  } else if (data.speedComplianceRate < 80) {
    areasToImprove.push("Speed management needs attention");
    coachingTips.push({
      priority: "high",
      tip: "Focus on checking and obeying speed limits consistently",
      evidence: `Currently ${data.speedComplianceRate.toFixed(0)}% compliance rate`,
    });
  }

  // Analyze braking
  const brakingPerSession = data.harshBrakingEvents / data.totalSessions;
  if (brakingPerSession < 1) {
    strengths.push("Smooth braking technique");
  } else if (brakingPerSession >= 3) {
    areasToImprove.push("Braking technique needs improvement");
    coachingTips.push({
      priority: "high",
      tip: "Practice anticipating traffic and braking earlier, more gently",
      evidence: `${brakingPerSession.toFixed(1)} harsh braking events per lesson`,
    });
  }

  // Analyze acceleration
  const accelPerSession = data.harshAccelerationEvents / data.totalSessions;
  if (accelPerSession < 1) {
    strengths.push("Progressive acceleration control");
  } else if (accelPerSession >= 2) {
    coachingTips.push({
      priority: "medium",
      tip: "Practice smoother acceleration, especially from junctions",
      evidence: `${accelPerSession.toFixed(1)} harsh acceleration events per lesson`,
    });
  }

  // Add distance-based tip
  if (data.totalDistance < 50) {
    coachingTips.push({
      priority: "medium",
      tip: "More road experience needed - aim for longer practice sessions",
      evidence: `Only ${data.totalDistance.toFixed(0)} km recorded so far`,
    });
  } else if (data.totalDistance >= 100) {
    strengths.push("Building solid road experience");
  }

  // Ensure we have some content
  if (strengths.length === 0) {
    strengths.push("Showing commitment to learning");
  }
  if (areasToImprove.length === 0) {
    areasToImprove.push("Continue building consistency");
  }
  if (coachingTips.length === 0) {
    coachingTips.push({
      priority: "low",
      tip: "Keep practicing regularly to build muscle memory",
      evidence: "Consistent practice is key to becoming a safe driver",
    });
  }

  return {
    overallScore: score,
    strengths,
    areasToImprove,
    coachingTips,
    weeklyTrend: "steady",
    summary: `Based on ${data.totalSessions} recent lessons, focus on ${areasToImprove[0].toLowerCase()} while maintaining your ${strengths[0].toLowerCase()}.`,
  };
}

function calculateOverallScore(data: TelematicsData): number {
  let score = 70; // Base score

  // Speed compliance impact (max ±20 points)
  if (data.speedComplianceRate >= 95) score += 20;
  else if (data.speedComplianceRate >= 90) score += 15;
  else if (data.speedComplianceRate >= 80) score += 5;
  else if (data.speedComplianceRate < 70) score -= 15;

  // Harsh braking impact (max ±10 points)
  const brakingPerSession = data.harshBrakingEvents / data.totalSessions;
  if (brakingPerSession < 0.5) score += 10;
  else if (brakingPerSession >= 3) score -= 10;

  // Harsh acceleration impact (max ±5 points)
  const accelPerSession = data.harshAccelerationEvents / data.totalSessions;
  if (accelPerSession < 0.5) score += 5;
  else if (accelPerSession >= 2) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}
