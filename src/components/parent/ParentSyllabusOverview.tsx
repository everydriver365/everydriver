import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DVSA_SYLLABUS, SYLLABUS_CATEGORIES } from "@/constants/dvsaSyllabus";

interface ParentSyllabusOverviewProps {
  childId: string;
  childName: string;
}

export function ParentSyllabusOverview({ childId, childName }: ParentSyllabusOverviewProps) {
  const [progress, setProgress] = useState<{ competency_id: string; level: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [childId]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from("pupil_syllabus_progress")
      .select("competency_id, level")
      .eq("pupil_id", childId);
    setProgress(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const progressMap = Object.fromEntries(progress.map(p => [p.competency_id, p.level]));

  // Test readiness
  const testReadyCount = DVSA_SYLLABUS.filter(c => (progressMap[c.id] || 0) >= 4).length;
  const testReadiness = Math.round((testReadyCount / DVSA_SYLLABUS.length) * 100);

  // Category progress
  const categoryData = SYLLABUS_CATEGORIES.map(category => {
    const competencies = DVSA_SYLLABUS.filter(c => c.category === category);
    const totalPoints = competencies.length * 5;
    const earnedPoints = competencies.reduce((sum, c) => sum + (progressMap[c.id] || 0), 0);
    const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    return { category, percent, count: competencies.length };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            DVSA Syllabus Progress
          </CardTitle>
          <Badge variant={testReadiness >= 80 ? "default" : "secondary"}>
            {testReadiness}% Test Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {categoryData.map(({ category, percent }) => (
          <div key={category}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{category}</span>
              <span className="font-medium">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
