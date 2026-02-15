import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, PoundSterling, CheckCircle2, XCircle } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklySummaryWidgetProps {
  instructorId: string;
}

interface WeeklyStats {
  hoursTaught: number;
  earnings: number;
  lessonsCompleted: number;
  cancellationRate: number;
}

export function WeeklySummaryWidget({ instructorId }: WeeklySummaryWidgetProps) {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) return;
    
    const fetchWeeklyStats = async () => {
      setLoading(true);
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // Sunday
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      try {
        // Fetch lessons for the week
        const { data: lessons, error: lessonsError } = await supabase
          .from('scheduled_lessons')
          .select('status, duration_minutes, amount_due, payment_status')
          .eq('instructor_id', instructorId)
          .gte('lesson_date', weekStartStr)
          .lte('lesson_date', weekEndStr);

        if (lessonsError) throw lessonsError;

        const completedLessons = lessons?.filter(l => l.status === 'completed') || [];
        const cancelledLessons = lessons?.filter(l => l.status === 'cancelled') || [];
        const totalLessons = lessons?.length || 0;

        // Calculate hours from completed lessons
        const hoursTaught = completedLessons.reduce((sum, l) => 
          sum + (l.duration_minutes || 60) / 60, 0
        );

        // Calculate earnings from completed/paid lessons
        const earnings = completedLessons
          .filter(l => l.payment_status === 'paid')
          .reduce((sum, l) => sum + (l.amount_due || 0), 0);

        // Cancellation rate
        const cancellationRate = totalLessons > 0 
          ? (cancelledLessons.length / totalLessons) * 100 
          : 0;

        setStats({
          hoursTaught,
          earnings,
          lessonsCompleted: completedLessons.length,
          cancellationRate,
        });
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
        setStats({
          hoursTaught: 0,
          earnings: 0,
          lessonsCompleted: 0,
          cancellationRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [instructorId]);

  if (loading) {
    return (
      <Card className="border-0 bg-muted/30">
        <CardContent className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: Clock,
      value: stats.hoursTaught.toFixed(1),
      label: "Hours",
      color: "text-primary",
    },
    {
      icon: PoundSterling,
      value: `${Math.round(stats.earnings)}`,
      label: "Earned",
      color: "text-emerald-500",
    },
    {
      icon: CheckCircle2,
      value: stats.lessonsCompleted.toString(),
      label: "Done",
      color: "text-primary",
    },
    {
      icon: XCircle,
      value: `${stats.cancellationRate.toFixed(0)}%`,
      label: "Cancel",
      color: stats.cancellationRate > 15 ? "text-destructive" : "text-muted-foreground",
    },
  ];

  return (
    <Card className="border-0 bg-muted/30">
      <CardContent className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {statItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center">
              <item.icon className={`h-4 w-4 ${item.color} mb-0.5`} />
              <span className="text-base font-bold leading-tight">{item.value}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          This week (Mon–Sun)
        </p>
      </CardContent>
    </Card>
  );
}
