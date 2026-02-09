import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DVSA_SYLLABUS, SYLLABUS_CATEGORIES, calculateSyllabusProgress } from "@/constants/dvsaSyllabus";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from "recharts";

interface PupilDashboardRadarProps {
  pupilId: string;
  accentColor?: string;
}

export function PupilDashboardRadar({ pupilId, accentColor = "hsl(var(--primary))" }: PupilDashboardRadarProps) {
  const [progress, setProgress] = useState<{ competency_id: string; level: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("pupil_syllabus_progress")
        .select("competency_id, level")
        .eq("pupil_id", pupilId);
      setProgress(data || []);
      setLoading(false);
    };
    fetch();
  }, [pupilId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const overallProgress = calculateSyllabusProgress(progress);
  const masteredCount = progress.filter(p => p.level >= 5).length;

  const chartData = SYLLABUS_CATEGORIES.map(category => {
    const competencies = DVSA_SYLLABUS.filter(c => c.category === category);
    const totalPoints = competencies.reduce((sum, comp) => {
      const entry = progress.find(p => p.competency_id === comp.id);
      return sum + (entry?.level || 0);
    }, 0);
    const maxPoints = competencies.length * 5;
    return {
      category: category.split(' ')[0],
      fullCategory: category,
      value: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
      fullMark: 100,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            DVSA Skills Overview
          </CardTitle>
          <Badge variant={overallProgress >= 80 ? "default" : "secondary"}>
            {overallProgress}% Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              tickCount={5}
            />
            <Radar
              name="Progress"
              dataKey="value"
              stroke={accentColor}
              fill={accentColor}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          {chartData.map((item) => (
            <div key={item.fullCategory} className="flex items-center justify-between px-2 py-1.5 bg-muted/50 rounded">
              <span className="text-muted-foreground truncate">{item.fullCategory}</span>
              <span className="font-medium ml-2">{item.value}%</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          {masteredCount}/{DVSA_SYLLABUS.length} skills mastered
        </p>
      </CardContent>
    </Card>
  );
}
