import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  DVSA_SYLLABUS, 
  SKILL_LEVELS, 
  getCompetenciesByCategory,
  calculateSyllabusProgress,
  type SyllabusCompetency 
} from '@/constants/dvsaSyllabus';
import { Save, Loader2, GraduationCap, Info } from 'lucide-react';
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DrivingSyllabusProps {
  pupilId: string;
  pupilName: string;
  onClose?: () => void;
}

interface ProgressEntry {
  id?: string;
  competency_id: string;
  level: number;
  instructor_notes: string | null;
  last_practiced: string | null;
}

export function DrivingSyllabus({ pupilId, pupilName, onClose }: DrivingSyllabusProps) {
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Controls');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProgress();
  }, [pupilId]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pupil_syllabus_progress')
        .select('*')
        .eq('pupil_id', pupilId);

      if (error) throw error;

      const progressMap: Record<string, ProgressEntry> = {};
      (data || []).forEach((entry) => {
        progressMap[entry.competency_id] = {
          id: entry.id,
          competency_id: entry.competency_id,
          level: entry.level || 0,
          instructor_notes: entry.instructor_notes,
          last_practiced: entry.last_practiced,
        };
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching syllabus progress:', error);
      toast.error('Failed to load syllabus progress');
    } finally {
      setLoading(false);
    }
  };

  const updateLevel = (competencyId: string, newLevel: number) => {
    setProgress(prev => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        competency_id: competencyId,
        level: newLevel,
        last_practiced: new Date().toISOString().split('T')[0],
      }
    }));
    setPendingChanges(prev => new Set(prev).add(competencyId));
  };

  const updateNotes = (competencyId: string, notes: string) => {
    setProgress(prev => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        competency_id: competencyId,
        instructor_notes: notes,
      }
    }));
    setPendingChanges(prev => new Set(prev).add(competencyId));
  };

  const saveChanges = async () => {
    if (pendingChanges.size === 0) return;

    setSaving(true);
    try {
      const upserts = Array.from(pendingChanges).map(competencyId => {
        const entry = progress[competencyId];
        return {
          pupil_id: pupilId,
          competency_id: competencyId,
          level: entry?.level || 0,
          instructor_notes: entry?.instructor_notes || null,
          last_practiced: entry?.last_practiced || new Date().toISOString().split('T')[0],
        };
      });

      const { error } = await supabase
        .from('pupil_syllabus_progress')
        .upsert(upserts, { onConflict: 'pupil_id,competency_id' });

      if (error) throw error;

      toast.success('Progress saved');
      setPendingChanges(new Set());
      fetchProgress();
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const overallProgress = calculateSyllabusProgress(
    Object.values(progress).map(p => ({ competency_id: p.competency_id, level: p.level }))
  );

  const categorizedCompetencies = getCompetenciesByCategory();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with overall progress */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-medium">{pupilName}'s Syllabus</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {overallProgress}%
            </Badge>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{Object.values(progress).filter(p => p.level >= 5).length} / {DVSA_SYLLABUS.length} mastered</span>
            <span>DVSA Standard Syllabus</span>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-2">
        {Object.entries(categorizedCompetencies).map(([category, competencies]) => {
          const categoryProgress = competencies.reduce((sum, c) => {
            return sum + (progress[c.id]?.level || 0);
          }, 0);
          const categoryMax = competencies.length * 5;
          const categoryPercent = Math.round((categoryProgress / categoryMax) * 100);

          return (
            <Card key={category}>
              <button
                className="w-full text-left"
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{category}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {categoryPercent}%
                      </Badge>
                    </div>
                    <ExpandChevron isExpanded={expandedCategory === category} />
                  </div>
                  <Progress value={categoryPercent} className="h-1.5 mt-2" />
                </CardHeader>
              </button>

              {expandedCategory === category && (
                <CardContent className="pt-0 pb-4 px-4 space-y-3">
                  {competencies.map((competency) => (
                    <CompetencyRow
                      key={competency.id}
                      competency={competency}
                      entry={progress[competency.id]}
                      onLevelChange={(level) => updateLevel(competency.id, level)}
                      onNotesChange={(notes) => updateNotes(competency.id, notes)}
                      isEditingNotes={editingNotes === competency.id}
                      setEditingNotes={setEditingNotes}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Save button */}
      {pendingChanges.size > 0 && (
        <div className="sticky bottom-4 flex justify-center">
          <Button onClick={saveChanges} disabled={saving} size="lg" className="shadow-lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save {pendingChanges.size} Change{pendingChanges.size > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface CompetencyRowProps {
  competency: SyllabusCompetency;
  entry?: ProgressEntry;
  onLevelChange: (level: number) => void;
  onNotesChange: (notes: string) => void;
  isEditingNotes: boolean;
  setEditingNotes: (id: string | null) => void;
}

function CompetencyRow({ 
  competency, 
  entry, 
  onLevelChange, 
  onNotesChange,
  isEditingNotes,
  setEditingNotes
}: CompetencyRowProps) {
  const currentLevel = entry?.level || 0;
  const levelInfo = SKILL_LEVELS[currentLevel];

  return (
    <div className="border rounded-none p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{competency.name}</span>
            {competency.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{competency.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Badge className={cn('mt-1 text-xs', levelInfo.color, levelInfo.textColor)}>
            {levelInfo.label}
          </Badge>
        </div>
      </div>

      {/* Level selector */}
      <div className="flex gap-1">
        {SKILL_LEVELS.map((level) => (
          <button
            key={level.level}
            onClick={() => onLevelChange(level.level)}
            className={cn(
              'flex-1 h-8 rounded text-xs font-medium transition-all',
              currentLevel === level.level
                ? cn(level.color, level.textColor, 'ring-2 ring-offset-1 ring-primary')
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
            title={level.label}
          >
            {level.level}
          </button>
        ))}
      </div>

      {/* Notes section */}
      {isEditingNotes ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Add notes about this skill..."
            value={entry?.instructor_notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setEditingNotes(null)}
          >
            Done
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setEditingNotes(competency.id)}
          className="text-xs text-muted-foreground hover:text-foreground text-left w-full"
        >
          {entry?.instructor_notes || 'Tap to add notes...'}
        </button>
      )}

      {entry?.last_practiced && (
        <p className="text-xs text-muted-foreground">
          Last practiced: {new Date(entry.last_practiced).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
