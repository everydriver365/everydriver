import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Fetch telematics sessions, syllabus progress, and pedal data in parallel
    const [sessionsRes, progressRes] = await Promise.all([
      supabase
        .from("lesson_telematics")
        .select("*")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .order("started_at", { ascending: false })
        .limit(sessionCount),
      supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level")
        .eq("pupil_id", pupilId),
    ]);

    const sessions = sessionsRes.data;
    const sessionsError = sessionsRes.error;

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

    // Build syllabus context
    const syllabusProgress = progressRes.data || [];
    const syllabusContext = buildSyllabusContext(syllabusProgress, telematicsData);

    // Generate insights using Lovable AI
    const aiPrompt = buildAIPrompt(telematicsData, pupil, sessions, syllabusContext);
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY") || ""}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert DVSA driving instructor AI assistant. Analyze the driving telemetry data and syllabus progress to provide personalized coaching insights. Be specific, actionable, and encouraging. Focus on safety first. Link telematics patterns to specific DVSA competencies where relevant. Always respond with valid JSON matching this structure:
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
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

// Competency mapping for telematics
const TELEMATICS_COMPETENCY_MAP: Record<string, string[]> = {
  speeding: ["use_of_speed", "response_signs"],
  harsh_brake: ["following_distance", "awareness_planning"],
  harsh_accel: ["controls", "moving_off"],
};

function buildSyllabusContext(
  progress: { competency_id: string; level: number }[],
  telematics: TelematicsData
): string {
  if (progress.length === 0) return "";

  const progressMap: Record<string, number> = {};
  progress.forEach((p) => { progressMap[p.competency_id] = p.level; });

  const relevantSkills: string[] = [];

  // Map telematics issues to competencies
  if (telematics.speedingPercentage > 5) {
    const speedLevel = progressMap["use_of_speed"] ?? "not tracked";
    relevantSkills.push(`'Use of Speed' at Level ${speedLevel} — speeding ${telematics.speedingPercentage.toFixed(1)}% of the time`);
  }
  if (telematics.harshBrakingEvents > 2) {
    const distLevel = progressMap["following_distance"] ?? "not tracked";
    relevantSkills.push(`'Following Distance' at Level ${distLevel} — ${telematics.harshBrakingEvents} harsh braking events`);
  }
  if (telematics.harshAccelerationEvents > 2) {
    const ctrlLevel = progressMap["controls"] ?? "not tracked";
    relevantSkills.push(`'Controls' at Level ${ctrlLevel} — ${telematics.harshAccelerationEvents} harsh acceleration events`);
  }

  // Low-level skills
  const lowSkills = progress
    .filter((p) => p.level <= 2 && p.level > 0)
    .map((p) => `${p.competency_id}: Level ${p.level}`);

  let context = "\n\nDVSA SYLLABUS PROGRESS:";
  if (relevantSkills.length > 0) {
    context += "\nTelematics-linked competencies:\n- " + relevantSkills.join("\n- ");
  }
  if (lowSkills.length > 0) {
    context += "\nSkills needing development:\n- " + lowSkills.join("\n- ");
  }

  const totalCompetencies = 27;
  const atLevel4Plus = progress.filter((p) => p.level >= 4).length;
  context += `\nTest readiness: ${atLevel4Plus}/${totalCompetencies} skills at Level 4+`;

  return context;
}

function buildAIPrompt(
  data: TelematicsData,
  pupil: { first_name: string; experience_level: string } | null,
  sessions: unknown[],
  syllabusContext: string
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
${syllabusContext}

Based on this data, provide personalized coaching insights. Consider:
1. Safety implications of the driving patterns
2. Areas where the learner excels
3. Specific, actionable improvement tips linked to DVSA competencies
4. Whether the overall trend shows improvement
5. How telematics patterns relate to specific syllabus skills

Respond with JSON only.`;
}

function generateFallbackInsights(data: TelematicsData): DrivingInsight {
  const score = calculateOverallScore(data);
  const strengths: string[] = [];
  const areasToImprove: string[] = [];
  const coachingTips: DrivingInsight["coachingTips"] = [];

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

  if (data.totalDistance < 50) {
    coachingTips.push({
      priority: "medium",
      tip: "More road experience needed - aim for longer practice sessions",
      evidence: `Only ${data.totalDistance.toFixed(0)} km recorded so far`,
    });
  } else if (data.totalDistance >= 100) {
    strengths.push("Building solid road experience");
  }

  if (strengths.length === 0) strengths.push("Showing commitment to learning");
  if (areasToImprove.length === 0) areasToImprove.push("Continue building consistency");
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
  let score = 70;
  if (data.speedComplianceRate >= 95) score += 20;
  else if (data.speedComplianceRate >= 90) score += 15;
  else if (data.speedComplianceRate >= 80) score += 5;
  else if (data.speedComplianceRate < 70) score -= 15;

  const brakingPerSession = data.harshBrakingEvents / data.totalSessions;
  if (brakingPerSession < 0.5) score += 10;
  else if (brakingPerSession >= 3) score -= 10;

  const accelPerSession = data.harshAccelerationEvents / data.totalSessions;
  if (accelPerSession < 0.5) score += 5;
  else if (accelPerSession >= 2) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}
