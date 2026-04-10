import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles, MessageSquare, CheckSquare } from 'lucide-react';
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { cn } from '@/lib/utils';
import {
  DVSA_SYLLABUS,
  SKILL_LEVELS,
  getCompetenciesByCategory,
  calculateSyllabusProgress,
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
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [nextPlan, setNextPlan] = useState(existingNextPlan || '');
  const [notes, setNotes] = useState(existingNotes || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [bulkLevel, setBulkLevel] = useState<Record<string, number | null>>({});

  useEffect(() => {
    fetchCurrentProgress();
  }, [pupilId]);

  const fetchCurrentProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('pupil_syllabus_progress')
        .select('competency_id, level, instructor_notes')
        .eq('pupil_id', pupilId);

      if (error) throw error;

      const progressMap: Record<string, number> = {};
      const commentsMap: Record<string, string> = {};
      (data || []).forEach((p: any) => {
        progressMap[p.competency_id] = p.level;
        if (p.instructor_notes) commentsMap[p.competency_id] = p.instructor_notes;
      });
      setCurrentProgress(progressMap);
      setComments(commentsMap);

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

  const handleBulkSet = (category: string, competencies: typeof DVSA_SYLLABUS, level: number) => {
    setUpdatedLevels((prev) => {
      const next = { ...prev };
      competencies.forEach((c) => {
        next[c.id] = level;
      });
      return next;
    });
    setBulkLevel((prev) => ({ ...prev, [category]: level }));
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
        body: { pupilId, instructorId },
      });

      if (error) throw error;

      if (data?.plan_text) {
        setNextPlan(data.plan_text);
        toast.success('AI lesson plan generated');
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast.error('Failed to generate lesson plan');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changes = DVSA_SYLLABUS.filter(
        (c) => (updatedLevels[c.id] || 0) !== (currentProgress[c.id] || 0)
      );

      // Upsert all competencies that have changes OR comments
      const allToUpsert = DVSA_SYLLABUS.filter(
        (c) => (updatedLevels[c.id] || 0) !== (currentProgress[c.id] || 0) || comments[c.id]
      );

      if (allToUpsert.length > 0) {
        const upserts = allToUpsert.map((c) => ({
          pupil_id: pupilId,
          competency_id: c.id,
          level: updatedLevels[c.id] || 0,
          instructor_id: instructorId,
          instructor_notes: comments[c.id] || null,
        }));

        const { error: upsertError } = await supabase
          .from('pupil_syllabus_progress')
          .upsert(upserts, { onConflict: 'pupil_id,competency_id' });

        if (upsertError) throw upsertError;
      }

      if (changes.length > 0) {
        const auditRecords = changes.map((c) => ({
          lesson_history_id: lessonId,
          pupil_id: pupilId,
          competency_id: c.id,
          previous_level: currentProgress[c.id] || 0,
          new_level: updatedLevels[c.id] || 0,
          comment: comments[c.id] || null,
        }));

        const { error: auditError } = await supabase
          .from('lesson_syllabus_updates')
          .insert(auditRecords);

        if (auditError) throw auditError;
      }

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
  const overallProgress = calculateSyllabusProgress(
    DVSA_SYLLABUS.map((c) => ({ competency_id: c.id, level: updatedLevels[c.id] || 0 }))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-muted/50 rounded-none px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">{overallProgress}% complete</span>
          {changedCount > 0 && (
            <Badge variant="secondary" className="text-xs">{changedCount} change{changedCount !== 1 ? 's' : ''}</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{DVSA_SYLLABUS.length} skills</span>
      </div>

      {/* Competency Grid by Category */}
      {Object.entries(categorized).map(([category, competencies]) => {
        const hasRelevantSkills = competencies.some((c) =>
          skillsPracticed.some(
            (sp) => sp.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]) || c.id === sp
          )
        );
        const isExpanded = expandedCategory === category || hasRelevantSkills;
        const categoryChanges = competencies.filter(
          (c) => (updatedLevels[c.id] || 0) !== (currentProgress[c.id] || 0)
        ).length;

        return (
          <Card key={category} className="border-border">
            <button
              className="w-full text-left px-4 py-3 flex items-center justify-between"
              onClick={() => setExpandedCategory(isExpanded && expandedCategory === category ? null : category)}
            >
              <span className="font-medium text-sm">{category}</span>
              <div className="flex items-center gap-2">
                {categoryChanges > 0 && (
                  <Badge variant="secondary" className="text-xs">{categoryChanges} modified</Badge>
                )}
                <ExpandChevron isExpanded={isExpanded} />
              </div>
            </button>

            {isExpanded && (
              <CardContent className="pt-0 pb-3 px-4 space-y-3">
                {/* Bulk set row */}
                <div className="flex items-center gap-1.5 pb-2 border-b border-border">
                  <CheckSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-muted-foreground mr-auto">Set all:</span>
                  {SKILL_LEVELS.slice(1).map((sl) => (
                    <button
                      key={sl.level}
                      onClick={() => handleBulkSet(category, competencies, sl.level)}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors',
                        bulkLevel[category] === sl.level
                          ? `${sl.color} ${sl.textColor} border-transparent`
                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {sl.label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {competencies.map((competency) => {
                  const currentLevel = updatedLevels[competency.id] || 0;
                  const levelInfo = SKILL_LEVELS[currentLevel];
                  const hasComment = !!comments[competency.id];
                  const isCommentOpen = expandedComment === competency.id;

                  return (
                    <div key={competency.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium block truncate">{competency.name}</span>
                          {competency.description && (
                            <span className="text-[10px] text-muted-foreground block truncate">{competency.description}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedComment(isCommentOpen ? null : competency.id)}
                          className={cn(
                            'shrink-0 p-1 rounded transition-colors',
                            hasComment ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        {SKILL_LEVELS.slice(1).map((sl) => (
                          <button
                            key={sl.level}
                            onClick={() => handleLevelChange(competency.id, sl.level)}
                            className={cn(
                              'flex-1 h-7 rounded text-[9px] font-medium transition-colors border',
                              currentLevel >= sl.level
                                ? `${sl.color} ${sl.textColor} border-transparent`
                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                            )}
                            title={sl.label}
                          >
                            {sl.label.length > 8 ? sl.label.split(' ')[0] : sl.label}
                          </button>
                        ))}
                      </div>
                      {currentLevel > 0 && (
                        <span className={cn('text-[10px] font-medium', levelInfo.textColor)}>
                          {levelInfo.label}
                        </span>
                      )}
                      {/* Comment input */}
                      {isCommentOpen && (
                        <Input
                          value={comments[competency.id] || ''}
                          onChange={(e) => setComments((prev) => ({ ...prev, [competency.id]: e.target.value }))}
                          placeholder={`Note for ${competency.name}...`}
                          className="h-8 text-xs mt-1"
                        />
                      )}
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
        <div className="flex items-center justify-between">
          <Label htmlFor="next-plan">Plan for next lesson</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
            className="h-7 text-xs gap-1.5 text-primary"
          >
            {generatingPlan ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generatingPlan ? 'Generating...' : 'AI Suggest'}
          </Button>
        </div>
        <Textarea
          id="next-plan"
          value={nextPlan}
          onChange={(e) => setNextPlan(e.target.value)}
          placeholder="What to cover in the next lesson..."
          rows={3}
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
