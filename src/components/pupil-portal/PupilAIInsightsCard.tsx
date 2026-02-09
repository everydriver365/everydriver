import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Sparkles, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useDrivingInsights } from "@/hooks/useDrivingInsights";

interface PupilAIInsightsCardProps {
  pupilId: string;
  instructorId: string;
}

export function PupilAIInsightsCard({ pupilId, instructorId }: PupilAIInsightsCardProps) {
  const { data: insights, isLoading, refetch, isRefetching } = useDrivingInsights({
    pupilId,
    instructorId,
    sessionCount: 10,
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-xs text-muted-foreground">Analysing your driving...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.overallScore === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">Not enough data for AI insights</p>
          <p className="text-xs text-muted-foreground mt-1">Complete more tracked lessons to unlock</p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = insights.weeklyTrend === 'improving' ? TrendingUp
    : insights.weeklyTrend === 'declining' ? TrendingDown : Minus;
  const trendLabel = insights.weeklyTrend === 'improving' ? 'Improving'
    : insights.weeklyTrend === 'declining' ? 'Declining' : 'Steady';
  const trendColor = insights.weeklyTrend === 'improving' ? 'text-emerald-600'
    : insights.weeklyTrend === 'declining' ? 'text-red-500' : 'text-amber-500';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            AI Driving Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div className="flex items-center justify-between bg-primary/5 rounded-lg p-4">
          <div>
            <div className="text-3xl font-bold text-primary">{insights.overallScore}</div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{trendLabel}</span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground">{insights.summary}</p>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Strengths
            </h4>
            {insights.strengths.slice(0, 3).map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground bg-emerald-50 dark:bg-emerald-900/20 rounded px-2 py-1">
                {s}
              </p>
            ))}
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> To Improve
            </h4>
            {insights.areasToImprove.slice(0, 3).map((a, i) => (
              <p key={i} className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">
                {a}
              </p>
            ))}
          </div>
        </div>

        {/* Top Coaching Tips */}
        {insights.coachingTips.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Top Tips</h4>
            {insights.coachingTips.slice(0, 2).map((tip, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={tip.priority === 'high' ? 'destructive' : tip.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-[10px] h-4"
                  >
                    {tip.priority}
                  </Badge>
                </div>
                <p className="text-xs font-medium">{tip.tip}</p>
                <p className="text-[11px] text-muted-foreground">{tip.evidence}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
