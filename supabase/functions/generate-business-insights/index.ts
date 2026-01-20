import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PupilData {
  id: string;
  name: string;
  created_at: string;
  progress: number | null;
  lessons_completed: number | null;
  last_lesson_date: string | null;
  account_balance: number | null;
  test_passed: boolean | null;
}

interface LessonData {
  lesson_date: string;
  day_of_week: number;
  hour: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instructorId } = await req.json();

    if (!instructorId) {
      return new Response(
        JSON.stringify({ error: "instructorId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch instructor data
    const { data: instructor } = await supabase
      .from("instructors")
      .select("name, hourly_rate, postcode, coverage_radius_miles")
      .eq("id", instructorId)
      .single();

    // Fetch all pupils with their data
    const { data: pupils } = await supabase
      .from("pupils")
      .select("id, name, created_at, progress, lessons_completed, account_balance, test_passed")
      .eq("instructor_id", instructorId);

    // Fetch lesson history for patterns
    const { data: lessonHistory } = await supabase
      .from("lesson_history")
      .select("lesson_date, duration_minutes")
      .eq("instructor_id", instructorId)
      .order("lesson_date", { ascending: false })
      .limit(200);

    // Fetch scheduled lessons
    const { data: scheduledLessons } = await supabase
      .from("scheduled_lessons")
      .select("lesson_date, start_time, status")
      .eq("instructor_id", instructorId)
      .gte("lesson_date", new Date().toISOString().split("T")[0]);

    // Fetch payment history
    const { data: payments } = await supabase
      .from("payment_history")
      .select("amount, recorded_at")
      .eq("instructor_id", instructorId)
      .order("recorded_at", { ascending: false })
      .limit(100);

    // Fetch cancellations
    const { data: cancellations } = await supabase
      .from("scheduled_lessons")
      .select("lesson_date, status")
      .eq("instructor_id", instructorId)
      .eq("status", "cancelled")
      .limit(50);

    // Calculate metrics for AI context
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentPayments = payments?.filter(p => new Date(p.recorded_at) > thirtyDaysAgo) || [];
    const monthlyRevenue = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const activePupils = pupils?.filter(p => !p.test_passed && (p.progress || 0) < 100) || [];
    const passedPupils = pupils?.filter(p => p.test_passed) || [];
    
    // Lesson timing patterns
    const lessonTimings = lessonHistory?.map(l => {
      const date = new Date(l.lesson_date);
      return {
        dayOfWeek: date.getDay(),
        hour: date.getHours(),
      };
    }) || [];

    // Calculate busiest days/times
    const dayCount: Record<number, number> = {};
    lessonTimings.forEach(l => {
      dayCount[l.dayOfWeek] = (dayCount[l.dayOfWeek] || 0) + 1;
    });

    const cancellationRate = lessonHistory && lessonHistory.length > 0
      ? ((cancellations?.length || 0) / lessonHistory.length) * 100
      : 0;

    // Build context for AI
    const businessContext = {
      instructorName: instructor?.name || "Instructor",
      hourlyRate: instructor?.hourly_rate || 40,
      totalPupils: pupils?.length || 0,
      activePupils: activePupils.length,
      passedPupils: passedPupils.length,
      passRate: pupils && pupils.length > 0 ? Math.round((passedPupils.length / pupils.length) * 100) : 0,
      monthlyRevenue,
      averageRevenuePerPupil: activePupils.length > 0 ? Math.round(monthlyRevenue / activePupils.length) : 0,
      cancellationRate: Math.round(cancellationRate),
      upcomingLessons: scheduledLessons?.filter(l => l.status !== "cancelled").length || 0,
      busiestDays: Object.entries(dayCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][parseInt(day)]),
      pupilsAtRisk: activePupils.filter(p => {
        // Pupils with low progress and few lessons may drop off
        const lessonsCompleted = p.lessons_completed || 0;
        const progress = p.progress || 0;
        return lessonsCompleted > 3 && progress < 30;
      }).map(p => ({ name: p.name, progress: p.progress, lessons: p.lessons_completed })),
      outstandingBalances: activePupils
        .filter(p => (p.account_balance || 0) > 0)
        .reduce((sum, p) => sum + (p.account_balance || 0), 0),
    };

    const systemPrompt = `You are an expert driving school business analyst providing weekly insights to driving instructors. 
Your analysis should be:
- Data-driven and specific to their business
- Actionable with clear recommendations
- Encouraging but realistic
- Focused on retention, revenue optimization, and demand patterns

Provide your response in the following JSON format:
{
  "weeklyHighlight": "A single compelling metric or achievement to celebrate",
  "retentionInsights": {
    "riskLevel": "low" | "medium" | "high",
    "summary": "Brief summary of retention status",
    "atRiskPupils": ["Names of pupils showing dropout signals"],
    "recommendations": ["2-3 specific actions to improve retention"]
  },
  "pricingInsights": {
    "currentAssessment": "How their pricing compares to market",
    "recommendation": "Specific pricing advice",
    "potentialRevenue": "Estimated monthly revenue change if implemented"
  },
  "demandForecast": {
    "nextWeekOutlook": "Expected demand level",
    "peakTimes": ["Best times to offer lessons"],
    "slowPeriods": ["Times to consider promotions"],
    "recommendations": ["2-3 ways to optimize schedule"]
  },
  "quickWins": ["3 immediate actions they can take this week"],
  "monthlyGoal": "A specific, measurable goal for the next 30 days"
}`;

    const userPrompt = `Analyze this driving instructor's business data and provide personalized insights:

Business Overview:
- Instructor: ${businessContext.instructorName}
- Current hourly rate: £${businessContext.hourlyRate}
- Total pupils: ${businessContext.totalPupils}
- Active pupils: ${businessContext.activePupils}
- Passed pupils: ${businessContext.passedPupils}
- Pass rate: ${businessContext.passRate}%
- Monthly revenue: £${businessContext.monthlyRevenue}
- Average revenue per pupil: £${businessContext.averageRevenuePerPupil}
- Cancellation rate: ${businessContext.cancellationRate}%
- Upcoming scheduled lessons: ${businessContext.upcomingLessons}
- Busiest days: ${businessContext.busiestDays.join(", ")}
- Outstanding balances: £${businessContext.outstandingBalances}

At-Risk Pupils (low progress despite multiple lessons):
${businessContext.pupilsAtRisk.length > 0 
  ? businessContext.pupilsAtRisk.map(p => `- ${p.name}: ${p.progress}% progress after ${p.lessons} lessons`).join("\n")
  : "No pupils currently showing risk signals"}

Provide actionable, personalized insights based on this data.`;

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
              name: "generate_business_insights",
              description: "Generate structured business insights for driving instructor",
              parameters: {
                type: "object",
                properties: {
                  weeklyHighlight: { type: "string", description: "A compelling metric or achievement" },
                  retentionInsights: {
                    type: "object",
                    properties: {
                      riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                      summary: { type: "string" },
                      atRiskPupils: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } }
                    },
                    required: ["riskLevel", "summary", "recommendations"]
                  },
                  pricingInsights: {
                    type: "object",
                    properties: {
                      currentAssessment: { type: "string" },
                      recommendation: { type: "string" },
                      potentialRevenue: { type: "string" }
                    },
                    required: ["currentAssessment", "recommendation"]
                  },
                  demandForecast: {
                    type: "object",
                    properties: {
                      nextWeekOutlook: { type: "string" },
                      peakTimes: { type: "array", items: { type: "string" } },
                      slowPeriods: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } }
                    },
                    required: ["nextWeekOutlook", "peakTimes", "recommendations"]
                  },
                  quickWins: { type: "array", items: { type: "string" } },
                  monthlyGoal: { type: "string" }
                },
                required: ["weeklyHighlight", "retentionInsights", "pricingInsights", "demandForecast", "quickWins", "monthlyGoal"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_business_insights" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    let insights;
    if (aiResponse.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      insights = JSON.parse(aiResponse.choices[0].message.tool_calls[0].function.arguments);
    } else if (aiResponse.choices?.[0]?.message?.content) {
      // Try to parse from content if tool call not used
      const content = aiResponse.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    }

    if (!insights) {
      throw new Error("Failed to parse AI response");
    }

    // Add raw metrics for display
    insights.metrics = businessContext;
    insights.generatedAt = new Date().toISOString();

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating business insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
