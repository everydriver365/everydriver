import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, TrendingUp, TrendingDown, Minus, Sparkles, 
  CheckCircle2, AlertTriangle, Target, RefreshCw 
} from "lucide-react";
import { useDrivingInsights } from "@/hooks/useDrivingInsights";

interface PupilAICoachingProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  darkMode: boolean;
}

export function PupilAICoaching({ pupilId, instructorId, brandColour }: PupilAICoachingProps) {
  const { data: insights, isLoading, refetch, isRefetching } = useDrivingInsights({
    pupilId,
    instructorId,
    sessionCount: 10,
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="px-4 flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: brandColour || '#1e3a5f' }} />
          <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>Analysing your driving data...</p>
        </div>
      </div>
    );
  }

  if (!insights || insights.overallScore === 0) {
    return (
      <div className="px-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
            <h3 className="font-medium mb-1" style={{ color: 'var(--brand-text)' }}>
              Not Enough Data Yet
            </h3>
            <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
              Complete more lessons with GPS tracking to receive AI coaching insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TrendIcon = insights.weeklyTrend === 'improving' ? TrendingUp 
    : insights.weeklyTrend === 'declining' ? TrendingDown : Minus;
  const trendLabel = insights.weeklyTrend === 'improving' ? 'Improving' 
    : insights.weeklyTrend === 'declining' ? 'Declining' : 'Steady';
  const trendColor = insights.weeklyTrend === 'improving' ? 'text-green-500' 
    : insights.weeklyTrend === 'declining' ? 'text-red-500' : 'text-amber-500';

  return (
    <div className="px-4 space-y-4">
      {/* Score Card */}
      <Card style={{ backgroundColor: brandColour || '#1e3a5f', borderColor: 'transparent' }}>
        <CardContent className="p-6 text-center text-white">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-80" />
          <div className="text-5xl font-bold mb-1">{insights.overallScore}</div>
          <div className="opacity-80 text-sm mb-3">Overall Driving Score</div>
          <div className="flex items-center justify-center gap-2">
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm">{trendLabel}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-3 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardContent className="p-4">
          <p className="text-sm" style={{ color: 'var(--brand-text)' }}>{insights.summary}</p>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Your Strengths
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.strengths.map((s, i) => (
            <div 
              key={i} 
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{ backgroundColor: 'var(--brand-bg)' }}
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-sm" style={{ color: 'var(--brand-text)' }}>{s}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Areas to Improve */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
            <Target className="h-4 w-4 text-amber-500" />
            Areas to Improve
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.areasToImprove.map((a, i) => (
            <div 
              key={i} 
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{ backgroundColor: 'var(--brand-bg)' }}
            >
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm" style={{ color: 'var(--brand-text)' }}>{a}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Coaching Tips */}
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
            <Sparkles className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
            Coaching Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.coachingTips.map((tip, i) => (
            <div 
              key={i} 
              className="rounded-lg p-3 space-y-1"
              style={{ backgroundColor: `${brandColour || '#1e3a5f'}08` }}
            >
              <div className="flex items-center gap-2">
                <Badge 
                  variant={tip.priority === 'high' ? 'destructive' : tip.priority === 'medium' ? 'default' : 'secondary'}
                  className="text-[10px] h-4"
                >
                  {tip.priority}
                </Badge>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{tip.tip}</p>
              <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>{tip.evidence}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
