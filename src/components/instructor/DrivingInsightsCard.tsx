import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useDrivingInsights } from '@/hooks/useDrivingInsights';
import { cn } from '@/lib/utils';

interface DrivingInsightsCardProps {
  pupilId: string;
  instructorId: string;
  sessionCount?: number;
  className?: string;
  compact?: boolean;
}

const DrivingInsightsCard: React.FC<DrivingInsightsCardProps> = ({
  pupilId,
  instructorId,
  sessionCount = 5,
  className,
  compact = false,
}) => {
  const { data: insights, isLoading, error, refetch, isFetching } = useDrivingInsights({
    pupilId,
    instructorId,
    sessionCount,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unable to generate insights</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = insights.weeklyTrend === 'improving' ? TrendingUp :
                    insights.weeklyTrend === 'declining' ? TrendingDown : Minus;
  
  const trendColor = insights.weeklyTrend === 'improving' ? 'text-green-500' :
                     insights.weeklyTrend === 'declining' ? 'text-amber-500' : 'text-muted-foreground';

  const scoreColor = insights.overallScore >= 80 ? 'text-green-600' :
                     insights.overallScore >= 60 ? 'text-amber-600' : 'text-destructive';

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Insights</span>
            </div>
            <div className={cn("text-2xl font-bold", scoreColor)}>
              {insights.overallScore}
            </div>
          </div>
          <Progress value={insights.overallScore} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">{insights.summary}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            AI Driving Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Score and Trend */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn("text-4xl font-bold", scoreColor)}>
                {insights.overallScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <Progress value={insights.overallScore} className="h-2" />
          </div>
          
          <div className="text-center">
            <TrendIcon className={cn("h-6 w-6 mx-auto", trendColor)} />
            <span className={cn("text-xs capitalize", trendColor)}>
              {insights.weeklyTrend}
            </span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground bg-primary/5 p-3 rounded-2xl">
          {insights.summary}
        </p>

        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Strengths
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {insights.strengths.map((strength, i) => (
                <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Areas to Improve */}
        {insights.areasToImprove.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Focus Areas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {insights.areasToImprove.map((area, i) => (
                <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Coaching Tips */}
        {insights.coachingTips.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              Coaching Tips
            </h4>
            <div className="space-y-2">
              {insights.coachingTips.slice(0, 3).map((tip, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-2xl border text-sm",
                    tip.priority === 'high' && "border-destructive/30 bg-destructive/5",
                    tip.priority === 'medium' && "border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10",
                    tip.priority === 'low' && "border-border bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0",
                        tip.priority === 'high' && "border-destructive text-destructive",
                        tip.priority === 'medium' && "border-amber-500 text-amber-600",
                        tip.priority === 'low' && "border-muted-foreground text-muted-foreground"
                      )}
                    >
                      {tip.priority}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{tip.tip}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tip.evidence}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DrivingInsightsCard;
