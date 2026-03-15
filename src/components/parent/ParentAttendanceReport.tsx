import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  childId: string;
}

export function ParentAttendanceReport({ childId }: Props) {
  const [stats, setStats] = useState({ total: 0, completed: 0, cancelled: 0, noShow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [childId]);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scheduled_lessons")
      .select("status")
      .eq("pupil_id", childId);

    const lessons = data || [];
    setStats({
      total: lessons.length,
      completed: lessons.filter(l => l.status === "completed").length,
      cancelled: lessons.filter(l => l.status === "cancelled").length,
      noShow: lessons.filter(l => l.status === "no_show").length,
    });
    setLoading(false);
  };

  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{rate}%</p>
            <p className="text-xs text-muted-foreground">Attendance</p>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs">{stats.completed} done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs">{stats.cancelled} cancelled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs">{stats.noShow} no-show</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
