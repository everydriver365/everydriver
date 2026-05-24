import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  DVSA_SYLLABUS, 
  SKILL_LEVELS, 
  getCompetenciesByCategory,
  calculateSyllabusProgress 
} from '@/constants/dvsaSyllabus';
import { ChevronDown, ChevronUp, GraduationCap, Loader2, CheckCircle2, Circle, TrendingUp, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyllabusProgressChart } from '@/components/instructor/SyllabusProgressChart';
import { format } from 'date-fns';

interface PupilSyllabusViewProps {
  pupilId: string;
  brandColour?: string | null;
  darkMode?: boolean;
}

export function PupilSyllabusView({ pupilId, brandColour, darkMode }: PupilSyllabusViewProps) {
  const [progress, setProgress] = useState<{ competency_id: string; level: number; instructor_notes?: string | null; updated_at?: string | null }[]>([]);
  const [recentChanges, setRecentChanges] = useState<{
    competency_id: string;
    previous_level: number;
    new_level: number;
    created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, [pupilId]);

  const fetchProgress = async () => {
    try {
      const [progressRes, changesRes] = await Promise.all([
        supabase
          .from('pupil_syllabus_progress')
          .select('competency_id, level, instructor_notes, updated_at')
          .eq('pupil_id', pupilId),
        supabase
          .from('lesson_syllabus_updates')
          .select('competency_id, previous_level, new_level, created_at')
          .eq('pupil_id', pupilId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (progressRes.error) throw progressRes.error;
      setProgress(progressRes.data || []);

      if (!changesRes.error && changesRes.data) {
        setRecentChanges(changesRes.data);
      }
    } catch (error) {
      console.error('Error fetching syllabus progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallProgress = calculateSyllabusProgress(progress);
  const categorizedCompetencies = getCompetenciesByCategory();
  const masteredCount = progress.filter(p => p.level >= 5).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColour || undefined }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      {/* Overall Progress Card */}
      <Card 
        style={{ 
          backgroundColor: brandColour || '#1e3a5f',
          borderColor: 'transparent'
        }}
      >
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">Driving Syllabus</span>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-4xl font-bold">{overallProgress}%</div>
            <div className="text-white/70 text-sm mt-1">
              {masteredCount} of {DVSA_SYLLABUS.length} skills mastered
            </div>
          </div>

          <Progress 
            value={overallProgress} 
            className="h-3 bg-white/20"
          />
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <SyllabusProgressChart progress={progress} />

      {/* Recent Skill Changes */}
      {recentChanges.length > 0 && (
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              <TrendingUp className="h-4 w-4" />
              Recent Skill Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3 px-4 space-y-2">
            {recentChanges.slice(0, 5).map((change, i) => {
              const comp = DVSA_SYLLABUS.find(c => c.id === change.competency_id);
              const improved = change.new_level > change.previous_level;
              return (
                <div key={i} className="flex items-center gap-2 text-sm py-1 border-b last:border-b-0" style={{ borderColor: 'var(--brand-border)' }}>
                  {improved && <ArrowUp className="h-3 w-3 text-green-500 flex-shrink-0" />}
                  <span className="flex-1 truncate" style={{ color: 'var(--brand-text)' }}>
                    {comp?.name || change.competency_id}
                  </span>
                  <Badge className={cn('text-xs', SKILL_LEVELS[change.new_level]?.color, SKILL_LEVELS[change.new_level]?.textColor)}>
                    {SKILL_LEVELS[change.new_level]?.label}
                  </Badge>
                  <span className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                    {format(new Date(change.created_at), 'd MMM')}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      {Object.entries(categorizedCompetencies).map(([category, competencies]) => {
        const categoryProgress = competencies.reduce((sum, c) => {
          const entry = progress.find(p => p.competency_id === c.id);
          return sum + (entry?.level || 0);
        }, 0);
        const categoryMax = competencies.length * 5;
        const categoryPercent = Math.round((categoryProgress / categoryMax) * 100);
        const categoryMastered = competencies.filter(c => {
          const entry = progress.find(p => p.competency_id === c.id);
          return (entry?.level || 0) >= 5;
        }).length;

        return (
          <Card 
            key={category}
            style={{ 
              backgroundColor: 'var(--brand-card)', 
              borderColor: 'var(--brand-border)' 
            }}
          >
            <button
              className="w-full text-left"
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle 
                      className="text-base"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      {category}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={categoryPercent} className="h-2 flex-1" />
                      <span 
                        className="text-xs font-medium"
                        style={{ color: 'var(--brand-muted)' }}
                      >
                        {categoryMastered}/{competencies.length}
                      </span>
                    </div>
                  </div>
                  {expandedCategory === category ? (
                    <ChevronUp className="h-4 w-4 ml-2" style={{ color: 'var(--brand-muted)' }} />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" style={{ color: 'var(--brand-muted)' }} />
                  )}
                </div>
              </CardHeader>
            </button>

            {expandedCategory === category && (
              <CardContent className="pt-0 pb-4 px-4 space-y-2">
                {competencies.map((competency) => {
                  const entry = progress.find(p => p.competency_id === competency.id);
                  const level = entry?.level || 0;
                  const levelInfo = SKILL_LEVELS[level];
                  const isMastered = level >= 5;

                  return (
                    <div 
                      key={competency.id}
                      className="flex items-center gap-3 py-2 border-b last:border-b-0"
                      style={{ borderColor: 'var(--brand-border)' }}
                    >
                      {isMastered ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle 
                          className="h-5 w-5 flex-shrink-0"
                          style={{ color: 'var(--brand-muted)' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span 
                          className={cn(
                            'text-sm block truncate',
                            isMastered && 'line-through opacity-60'
                          )}
                          style={{ color: 'var(--brand-text)' }}
                        >
                          {competency.name}
                        </span>
                        {entry?.instructor_notes && (
                          <span className="text-[11px] italic block mt-0.5 truncate" style={{ color: 'var(--brand-muted)' }}>
                            "{entry.instructor_notes}"
                          </span>
                        )}
                      </div>
                      <Badge 
                        className={cn('text-xs flex-shrink-0', levelInfo.color, levelInfo.textColor)}
                      >
                        {levelInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
