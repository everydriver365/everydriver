import { useState, useEffect } from "react";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Target,
  Loader2,
  RefreshCw,
  ChevronRight,
  Calendar,
  PoundSterling,
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface RetentionInsights {
  riskLevel: "low" | "medium" | "high";
  summary: string;
  atRiskPupils: string[];
  recommendations: string[];
}

interface PricingInsights {
  currentAssessment: string;
  recommendation: string;
  potentialRevenue?: string;
}

interface DemandForecast {
  nextWeekOutlook: string;
  peakTimes: string[];
  slowPeriods?: string[];
  recommendations: string[];
}

interface BusinessInsights {
  weeklyHighlight: string;
  retentionInsights: RetentionInsights;
  pricingInsights: PricingInsights;
  demandForecast: DemandForecast;
  quickWins: string[];
  monthlyGoal: string;
  metrics?: {
    totalPupils: number;
    activePupils: number;
    passRate: number;
    monthlyRevenue: number;
    cancellationRate: number;
  };
  generatedAt?: string;
}

interface SmartInsightsPanelProps {
  instructorId: string;
}

export function SmartInsightsPanel({ instructorId }: SmartInsightsPanelProps) {
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [instructorId]);

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-business-insights", {
        body: { instructorId },
      });

      if (error) throw error;
      setInsights(data);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-emerald-500 bg-emerald-500/10";
      case "medium": return "text-amber-500 bg-amber-500/10";
      case "high": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <Brain className="h-10 w-10 text-primary animate-pulse" />
              <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1 -right-1" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Generating AI Insights</p>
              <p className="text-sm text-muted-foreground">Analyzing your business data...</p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Unable to load insights</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchInsights()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Business Insights</h2>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Weekly Highlight */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-none bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Weekly Highlight</p>
              <p className="text-base font-semibold mt-1">{insights.weeklyHighlight}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Quick Wins This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.quickWins.map((win, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 rounded-none bg-muted/50">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{win}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Retention Risk */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Pupil Retention
            </CardTitle>
            <Badge className={getRiskColor(insights.retentionInsights.riskLevel)}>
              {insights.retentionInsights.riskLevel.charAt(0).toUpperCase() + insights.retentionInsights.riskLevel.slice(1)} Risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{insights.retentionInsights.summary}</p>
          
          {insights.retentionInsights.atRiskPupils && insights.retentionInsights.atRiskPupils.length > 0 && (
            <div className="p-2 rounded-none bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Pupils needing attention:
              </p>
              <p className="text-sm mt-1">{insights.retentionInsights.atRiskPupils.join(", ")}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Recommendations:</p>
            {insights.retentionInsights.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PoundSterling className="h-4 w-4 text-emerald-500" />
            Pricing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Current Assessment</p>
            <p className="text-sm mt-1">{insights.pricingInsights.currentAssessment}</p>
          </div>
          <div className="p-3 rounded-none bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm font-medium text-emerald-600">{insights.pricingInsights.recommendation}</p>
            {insights.pricingInsights.potentialRevenue && (
              <p className="text-xs text-emerald-600/80 mt-1">
                Potential impact: {insights.pricingInsights.potentialRevenue}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demand Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            Demand Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{insights.demandForecast.nextWeekOutlook}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-none bg-emerald-500/10">
              <p className="text-xs font-medium text-emerald-600 mb-1">Peak Times</p>
              <div className="space-y-1">
                {insights.demandForecast.peakTimes.slice(0, 3).map((time, idx) => (
                  <p key={idx} className="text-xs">{time}</p>
                ))}
              </div>
            </div>
            {insights.demandForecast.slowPeriods && insights.demandForecast.slowPeriods.length > 0 && (
              <div className="p-2 rounded-none bg-muted">
                <p className="text-xs font-medium text-muted-foreground mb-1">Slow Periods</p>
                <div className="space-y-1">
                  {insights.demandForecast.slowPeriods.slice(0, 3).map((time, idx) => (
                    <p key={idx} className="text-xs">{time}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Schedule Optimisation:</p>
            {insights.demandForecast.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goal */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-none bg-primary/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">30-Day Goal</p>
              <p className="text-sm mt-1">{insights.monthlyGoal}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated timestamp */}
      {insights.generatedAt && (
        <p className="text-xs text-center text-muted-foreground">
          Insights generated {format(new Date(insights.generatedAt), "d MMM yyyy 'at' HH:mm")}
        </p>
      )}
    </div>
  );
}
