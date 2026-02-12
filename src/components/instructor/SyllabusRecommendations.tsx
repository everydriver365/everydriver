import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, AlertTriangle, Circle, CheckCircle2 } from 'lucide-react';
import { DVSA_SYLLABUS, SKILL_LEVELS, SYLLABUS_CATEGORIES } from '@/constants/dvsaSyllabus';

interface SyllabusRecommendationsProps {
  pupilId: string;
}

interface ProgressEntry {
  competency_id: string;
  level: number;
  updated_at?: string;
}

export function SyllabusRecommendations({ pupilId }: SyllabusRecommendationsProps) {
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [pupilId]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('pupil_syllabus_progress')
      .select('competency_id, level, updated_at')
      .eq('pupil_id', pupilId);
    setProgress(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progressMap = Object.fromEntries(progress.map((p) => [p.competency_id, p]));

  // Categorise skills
  const notStarted = DVSA_SYLLABUS.filter((c) => !progressMap[c.id]?.level);
  const needsAttention = DVSA_SYLLABUS.filter((c) => {
    const level = progressMap[c.id]?.level || 0;
    return level >= 1 && level <= 2;
  });
  const readyToProgress = DVSA_SYLLABUS.filter((c) => {
    const level = progressMap[c.id]?.level || 0;
    return level === 3 || level === 4;
  });
  const testReady = DVSA_SYLLABUS.filter((c) => (progressMap[c.id]?.level || 0) >= 5);

  // Test readiness: all competencies at level 4+
  const testReadyCount = DVSA_SYLLABUS.filter((c) => (progressMap[c.id]?.level || 0) >= 4).length;
  const testReadinessPercent = Math.round((testReadyCount / DVSA_SYLLABUS.length) * 100);

  const sections = [
    {
      title: 'Needs Attention',
      icon: AlertTriangle,
      items: needsAttention,
      color: 'text-orange-500',
      show: needsAttention.length > 0,
    },
    {
      title: 'Ready to Progress',
      icon: TrendingUp,
      items: readyToProgress,
      color: 'text-[#0075c9]',
      show: readyToProgress.length > 0,
    },
    {
      title: 'Not Yet Started',
      icon: Circle,
      items: notStarted.slice(0, 5),
      color: 'text-muted-foreground',
      show: notStarted.length > 0,
      suffix: notStarted.length > 5 ? `+${notStarted.length - 5} more` : undefined,
    },
    {
      title: 'Test Ready',
      icon: CheckCircle2,
      items: testReady,
      color: 'text-green-500',
      show: testReady.length > 0,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Syllabus Recommendations
          <Badge variant={testReadinessPercent >= 80 ? 'default' : 'secondary'} className="text-xs">
            {testReadinessPercent}% Test Ready
          </Badge>
        </CardTitle>
        <Progress value={testReadinessPercent} className="h-1.5" />
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {sections
          .filter((s) => s.show)
          .map((section) => (
            <div key={section.title} className="space-y-1">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${section.color}`}>
                <section.icon className="h-3.5 w-3.5" />
                {section.title}
              </div>
              <div className="flex flex-wrap gap-1">
                {section.items.map((c) => {
                  const level = progressMap[c.id]?.level || 0;
                  const sl = SKILL_LEVELS[level];
                  return (
                    <Badge key={c.id} variant="outline" className="text-[10px] gap-1">
                      {c.name}
                      {level > 0 && <span className={sl?.textColor}>L{level}</span>}
                    </Badge>
                  );
                })}
                {section.suffix && (
                  <span className="text-[10px] text-muted-foreground self-center">{section.suffix}</span>
                )}
              </div>
            </div>
          ))}

        {testReadinessPercent === 100 && (
          <p className="text-xs text-green-600 font-medium text-center pt-1">
            🎉 All skills at test-ready level!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
