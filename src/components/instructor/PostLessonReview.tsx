import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DVSA_SYLLABUS,
  SKILL_LEVELS,
  getCompetenciesByCategory,
} from '@/constants/dvsaSyllabus';

interface PostLessonReviewProps {
  lessonId: string;
  pupilId: string;
  instructorId: string;
  skillsPracticed?: string[];
  existingNotes?: string | null;
  existingNextPlan?: string | null;
  onSaved?: () => void;
  onClose?: () => void;
}

export function PostLessonReview({
  lessonId,
  pupilId,
  instructorId,
  skillsPracticed = [],
  existingNotes,
  existingNextPlan,
  onSaved,
  onClose,
}: PostLessonReviewProps) {
  const [currentProgress, setCurrentProgress] = useState<Record<string, number>>({});
  const [updatedLevels, setUpdatedLevels] = useState<Record<string, number>>({});
  const [nextPlan, setNextPlan] = useState(existingNextPlan || '');
  const [notes, setNotes] = useState(existingNotes || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentProgress();
  }, [pupilId]);

  const fetchCurrentProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('pupil_syllabus_progress')
        .select('competency_id, level')
        .eq('pupil_id', pupilId);

      if (error) throw error;

      const progressMap: Record<string, number> = {};
      (data || []).forEach((p) => {
        progressMap[p.competency_id] = p.level;
      });
      setCurrentProgress(progressMap);

      // Pre-populate updatedLevels with current values
      const initial: Record<string, number> = {};
      DVSA_SYLLABUS.forEach((c) => {
        initial[c.id] = progressMap[c.id] || 0;
      });
      setUpdatedLevels(initial);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (competencyId: string, level: number) => {
    setUpdatedLevels((prev) => ({
      ...prev,
      [competencyId]: prev[competencyId] === level ? level - 1 : level,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Find changed competencies
      const changes = DVSA_SYLLABUS.filter(
        (c) => (updatedLevels[c.id] || 0) !== (currentProgress[c.id] || 0)
      );

      // 2. Upsert pupil_syllabus_progress for changed items
      if (changes.length > 0) {
        const upserts = changes.map((c) => ({
          pupil_id: pupilId,
          competency_id: c.id,
          level: updatedLevels[c.id] || 0,
          instructor_id: instructorId,
        }));

        const { error: upsertError } = await supabase
          .from('pupil_syllabus_progress')
          .upsert(upserts, { onConflict: 'pupil_id,competency_id' });

        if (upsertError) throw upsertError;

        // 3. Insert audit records into lesson_syllabus_updates
        const auditRecords = changes.map((c) => ({
          lesson_history_id: lessonId,
          pupil_id: pupilId,
          competency_id: c.id,
          previous_level: currentProgress[c.id] || 0,
          new_level: updatedLevels[c.id] || 0,
        }));

        const { error: auditError } = await supabase
          .from('lesson_syllabus_updates')
          .insert(auditRecords);

        if (auditError) throw auditError;
      }

      // 4. Update lesson_history with notes and next_lesson_plan
      const updatePayload: Record<string, any> = {};
      if (notes) updatePayload.notes = notes;
      if (nextPlan) updatePayload.next_lesson_plan = nextPlan;

      if (Object.keys(updatePayload).length > 0) {
        const { error: lessonError } = await supabase
          .from('lesson_history')
          .update(updatePayload)
          .eq('id', lessonId);

        if (lessonError) throw lessonError;
      }

      toast.success(
        `Review saved${changes.length > 0 ? ` — ${changes.length} skill${changes.length > 1 ? 's' : ''} updated` : ''}`
      );
      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error('Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const categorized = getCompetenciesByCategory();
  const changedCount = DVSA_SYLLABUS.filter(
    (c) => (updatedLevels[c.id] || 0) !== (currentProgress[c.id] || 0)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Competency Grid by Category */}
      {Object.entries(categorized).map(([category, competencies]) => {
        const hasRelevantSkills = competencies.some((c) =>
          skillsPracticed.some(
            (sp) => sp.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]) || c.id === sp
          )
        );
        const isExpanded = expandedCategory === category || hasRelevantSkills;

        return (
          <Card key={category} className="border-border">
            <button
              className="w-full text-left px-4 py-3 flex items-center justify-between"
              onClick={() => setExpandedCategory(isExpanded && expandedCategory === category ? null : category)}
            >
              <span className="font-medium text-sm">{category}</span>
              <div className="flex items-center gap-2">
                {competencies.some(
                  (c) => (updatedLevels[c.id] || 0) !== (currentProgress[c.id] || 0)
                ) && (
                  <Badge variant="secondary" className="text-xs">Modified</Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <CardContent className="pt-0 pb-3 px-4 space-y-2">
                {competencies.map((competency) => {
                  const currentLevel = updatedLevels[competency.id] || 0;

                  return (
                    <div key={competency.id} className="flex items-center gap-2">
                      <span className="text-xs flex-1 min-w-0 truncate">{competency.name}</span>
                      <div className="flex gap-0.5">
                        {SKILL_LEVELS.slice(1).map((sl) => (
                          <button
                            key={sl.level}
                            onClick={() => handleLevelChange(competency.id, sl.level)}
                            className={cn(
                              'w-7 h-7 rounded text-[10px] font-medium transition-colors border',
                              currentLevel >= sl.level
                                ? `${sl.color} ${sl.textColor} border-transparent`
                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                            )}
                            title={sl.label}
                          >
                            {sl.level}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="review-notes">How did it go?</Label>
        <Textarea
          id="review-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Brief notes on how the lesson went..."
          rows={2}
        />
      </div>

      {/* Next Lesson Plan */}
      <div className="space-y-2">
        <Label htmlFor="next-plan">Plan for next lesson</Label>
        <Textarea
          id="next-plan"
          value={nextPlan}
          onChange={(e) => setNextPlan(e.target.value)}
          placeholder="What to cover in the next lesson..."
          rows={2}
        />
      </div>

      {/* Save */}
      <div className="flex gap-3 pt-2">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Review {changedCount > 0 && `(${changedCount} changes)`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
