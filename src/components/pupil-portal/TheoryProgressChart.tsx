import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  TrendingUp,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface TheoryProgressChartProps {
  pupilId: string;
  instructorId: string;
  brandColour?: string;
  className?: string;
}

interface TheoryAttempt {
  id: string;
  test_type: string;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  weak_categories: string[];
  created_at: string;
}

const TheoryProgressChart: React.FC<TheoryProgressChartProps> = ({
  pupilId,
  instructorId,
  brandColour = '#3B82F6',
  className,
}) => {
  const { data: attempts, isLoading } = useQuery({
    queryKey: ['theory-attempts', pupilId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theory_test_attempts')
        .select('*')
        .eq('pupil_id', pupilId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as TheoryAttempt[];
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-1">No Practice Tests Yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete some theory practice tests to see your progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((a) => a.passed).length;
  const passRate = Math.round((passedAttempts / totalAttempts) * 100);
  const avgScore = Math.round(
    attempts.reduce((sum, a) => sum + (a.correct_answers / a.total_questions) * 100, 0) / totalAttempts
  );

  // Prepare chart data
  const chartData = attempts.slice(-10).map((attempt) => ({
    date: format(new Date(attempt.created_at), 'MMM d'),
    score: Math.round((attempt.correct_answers / attempt.total_questions) * 100),
  }));

  // Find weak categories
  const categoryCounts: Record<string, number> = {};
  attempts.forEach((attempt) => {
    const categories = Array.isArray(attempt.weak_categories) 
      ? attempt.weak_categories 
      : [];
    categories.forEach((cat: string) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const latestAttempt = attempts[attempts.length - 1];
  const latestScore = Math.round((latestAttempt.correct_answers / latestAttempt.total_questions) * 100);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-5 w-5" style={{ color: brandColour }} />
          Theory Progress
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold" style={{ color: brandColour }}>
              {avgScore}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">Avg Score</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{passRate}%</div>
            <div className="text-[10px] text-muted-foreground uppercase">Pass Rate</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Tests</div>
          </div>
        </div>

        {/* Latest Result */}
        <div
          className={cn(
            "p-3 rounded-lg flex items-center gap-3",
            latestAttempt.passed
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-amber-100 dark:bg-amber-900/30"
          )}
        >
          {latestAttempt.passed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-amber-600" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              Latest: {latestScore}% ({latestAttempt.correct_answers}/{latestAttempt.total_questions})
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(latestAttempt.created_at), 'MMM d, h:mm a')}
            </p>
          </div>
          <Badge variant={latestAttempt.passed ? "default" : "secondary"}>
            {latestAttempt.passed ? "Passed" : "Failed"}
          </Badge>
        </div>

        {/* Progress Chart */}
        {chartData.length > 1 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Score']}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={brandColour}
                  strokeWidth={2}
                  dot={{ fill: brandColour, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                />
                {/* Pass line at 86% */}
                <Line
                  type="monotone"
                  dataKey={() => 86}
                  stroke="#22c55e"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weak Categories */}
        {sortedCategories.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              Focus Areas
            </h4>
            <div className="space-y-2">
              {sortedCategories.map(([category, count]) => (
                <div key={category} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm capitalize">{category.replace(/_/g, ' ')}</p>
                    <Progress
                      value={(count / totalAttempts) * 100}
                      className="h-1.5 mt-1"
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {count}x
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Tip */}
        <div className="p-3 bg-primary/5 rounded-lg text-sm">
          <div className="flex items-center gap-2 text-primary font-medium mb-1">
            <TrendingUp className="h-4 w-4" />
            Tip for Success
          </div>
          <p className="text-muted-foreground text-xs">
            The DVSA theory test requires 86% to pass. Practice consistently and focus on your weak areas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TheoryProgressChart;
