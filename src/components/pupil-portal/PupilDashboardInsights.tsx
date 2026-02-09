import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { useDrivingInsights } from "@/hooks/useDrivingInsights";

interface PupilDashboardInsightsProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
}

export function PupilDashboardInsights({ pupilId, instructorId, brandColour }: PupilDashboardInsightsProps) {
  const { data: insights, isLoading } = useDrivingInsights({
    pupilId,
    instructorId,
    sessionCount: 5,
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--brand-muted)' }} />
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.overallScore === 0) return null;

  const TrendIcon = insights.weeklyTrend === 'improving' ? TrendingUp 
    : insights.weeklyTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = insights.weeklyTrend === 'improving' ? 'text-green-500' 
    : insights.weeklyTrend === 'declining' ? 'text-red-500' : 'text-amber-500';

  return (
    <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--brand-text)' }}>
              AI Driving Score
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <span 
              className="text-2xl font-bold"
              style={{ color: brandColour || '#1e3a5f' }}
            >
              {insights.overallScore}
            </span>
            <span className="text-xs" style={{ color: 'var(--brand-muted)' }}>/100</span>
          </div>
        </div>

        {/* Top coaching tip */}
        {insights.coachingTips[0] && (
          <div 
            className="rounded-lg p-3 text-sm"
            style={{ backgroundColor: `${brandColour || '#1e3a5f'}10`, color: 'var(--brand-text)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Badge 
                variant={insights.coachingTips[0].priority === 'high' ? 'destructive' : 'secondary'}
                className="text-[10px] h-4"
              >
                {insights.coachingTips[0].priority}
              </Badge>
              <span className="text-xs font-medium">Top Tip</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>
              {insights.coachingTips[0].tip}
            </p>
          </div>
        )}

        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {insights.strengths.slice(0, 3).map((s, i) => (
              <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}>
                ✓ {s}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
