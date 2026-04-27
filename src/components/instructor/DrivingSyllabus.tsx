import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  DVSA_SYLLABUS,
  SKILL_LEVELS,
  getCompetenciesByCategory,
  calculateSyllabusProgress,
  type SyllabusCompetency,
} from '@/constants/dvsaSyllabus';
import { Loader2, GraduationCap, Info, ChevronDown, X, Plus } from 'lucide-react';
import { titleCaseName } from '@/lib/titleCase';
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

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

// Sentence-case a stored title (display only — does not mutate stored data).
// "Safety Precautions" -> "Safety precautions", "MSM Routine" -> "MSM routine"
function sentenceCase(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // Lowercase everything except the first word's first letter and acronyms (all-caps tokens of length >= 2 with no lowercase letters)
  const words = trimmed.split(/(\s+|[/&-])/);
  let firstLetterDone = false;
  return words
    .map((w) => {
      if (/^\s+$/.test(w) || /^[/&-]$/.test(w)) return w;
      const isAcronym = /^[A-Z]{2,}$/.test(w);
      if (isAcronym) return w;
      const lower = w.toLowerCase();
      if (!firstLetterDone) {
        firstLetterDone = true;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join('');
}

// Score description text. Uses the canonical SKILL_LEVELS labels from
// dvsaSyllabus.ts so we don't invent a new vocabulary. Sentence-case for display.
function scoreLabelText(level: number): string {
  const info = SKILL_LEVELS[level];
  if (!info) return 'Not started';
  return sentenceCase(info.label);
}

// Score colour mapping per spec: 0 grey, 1-4 system blue, 5 system green.
function scoreLabelColor(level: number): string {
  if (level <= 0) return '#6E6E73';
  if (level >= 5) return '#3B8B3B';
  return '#2B7BC8';
}

export function DrivingSyllabus({ pupilId, pupilName, onClose }: DrivingSyllabusProps) {
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  // Expand-state per category (session-persistent via component state).
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Controls: true });
  // Track in-flight saves so we can show a subtle indicator without blocking taps.
  const [savingCount, setSavingCount] = useState(0);

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

  // Auto-save: persist a single competency immediately. Multiple taps queue
  // independently — each upsert keys on (pupil_id, competency_id) so concurrent
  // taps to different topics are safe and the latest value to a single topic wins.
  const persistEntry = async (competencyId: string, partial: Partial<ProgressEntry>) => {
    setSavingCount((n) => n + 1);
    try {
      const current = progress[competencyId];
      const payload = {
        pupil_id: pupilId,
        competency_id: competencyId,
        level: partial.level ?? current?.level ?? 0,
        instructor_notes:
          partial.instructor_notes !== undefined
            ? partial.instructor_notes
            : current?.instructor_notes ?? null,
        last_practiced:
          partial.last_practiced ??
          current?.last_practiced ??
          new Date().toISOString().split('T')[0],
      };
      const { error } = await supabase
        .from('pupil_syllabus_progress')
        .upsert(payload, { onConflict: 'pupil_id,competency_id' });
      if (error) throw error;
    } catch (e) {
      console.error('Error saving syllabus entry:', e);
      toast.error('Failed to save — tap again to retry');
    } finally {
      setSavingCount((n) => Math.max(0, n - 1));
    }
  };

  const updateLevel = (competencyId: string, newLevel: number) => {
    const today = new Date().toISOString().split('T')[0];
    setProgress((prev) => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        competency_id: competencyId,
        level: newLevel,
        last_practiced: today,
      },
    }));
    void persistEntry(competencyId, { level: newLevel, last_practiced: today });
  };

  const updateNotes = (competencyId: string, notes: string) => {
    setProgress((prev) => ({
      ...prev,
      [competencyId]: {
        ...prev[competencyId],
        competency_id: competencyId,
        instructor_notes: notes,
      },
    }));
  };

  const commitNotes = (competencyId: string) => {
    const entry = progress[competencyId];
    void persistEntry(competencyId, { instructor_notes: entry?.instructor_notes ?? '' });
  };

  const overallProgress = calculateSyllabusProgress(
    Object.values(progress).map((p) => ({ competency_id: p.competency_id, level: p.level })),
  );
  const masteredCount = Object.values(progress).filter((p) => p.level >= 5).length;
  const totalTopics = DVSA_SYLLABUS.length;

  const categorizedCompetencies = getCompetenciesByCategory();

  const displayName = titleCaseName(pupilName) || pupilName;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" style={{ background: '#F2F2F4' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#6E6E73' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#F2F2F4',
        padding: 16,
        fontFamily: FONT_STACK,
        minHeight: '100%',
      }}
      className="flex flex-col gap-3"
    >
      {/* Header card */}
      <div
        style={{
          background: '#FFFFFF',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: '0.5px solid #E5E5EA',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: '#F2F2F4',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={16} strokeWidth={2} color="#6E6E73" />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#6E6E73',
              letterSpacing: 0.3,
              textTransform: 'uppercase',
              margin: '0 0 1px',
            }}
            className="truncate"
          >
            {displayName}
          </p>
          <h1
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: '#000000',
              letterSpacing: -0.2,
              margin: 0,
            }}
          >
            Driving syllabus
          </h1>
        </div>
        {savingCount > 0 && (
          <Loader2 size={14} className="animate-spin" style={{ color: '#6E6E73' }} />
        )}
      </div>

      {/* Progress hero card — sits flush under header */}
      <div
        style={{
          background: '#FFFFFF',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          padding: '14px 16px',
          marginTop: -12, // pull up to sit flush against header card
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: '#FBF1DE',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GraduationCap size={20} strokeWidth={2} color="#B8801F" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#000000',
                margin: '0 0 1px',
              }}
            >
              DVSA standard syllabus
            </p>
            <p style={{ fontSize: 11, color: '#6E6E73', margin: 0 }}>
              {masteredCount} of {totalTopics} topics mastered
            </p>
          </div>
          <div
            style={{
              flexShrink: 0,
              fontSize: 24,
              fontWeight: 500,
              color: '#000000',
              letterSpacing: -0.5,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {overallProgress}
            <span style={{ fontSize: 14, color: '#6E6E73', marginLeft: 1 }}>%</span>
          </div>
        </div>
        <div
          style={{
            height: 4,
            background: '#F2F2F4',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${overallProgress}%`,
              background: '#2B7BC8',
              transition: 'width 300ms ease-out',
            }}
          />
        </div>
      </div>

      {/* Section accordion cards */}
      {Object.entries(categorizedCompetencies).map(([category, competencies]) => {
        if (!competencies.length) return null;
        const masteredInCategory = competencies.filter(
          (c) => (progress[c.id]?.level || 0) >= 5,
        ).length;
        const isOpen = !!expanded[category];

        return (
          <div
            key={category}
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [category]: !prev[category] }))
              }
              style={{
                width: '100%',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              aria-expanded={isOpen}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#000000',
                  letterSpacing: -0.1,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {sentenceCase(category)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#6E6E73',
                  letterSpacing: 0.2,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {masteredInCategory} / {competencies.length}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={1.8}
                color="#6E6E73"
                style={{
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 200ms ease',
                  flexShrink: 0,
                }}
              />
            </button>

            {isOpen && (
              <>
                <div
                  style={{
                    height: '0.5px',
                    background: '#E5E5EA',
                    margin: '0 16px',
                  }}
                />
                <div style={{ padding: '4px 12px 12px' }}>
                  {competencies.map((competency) => (
                    <CompetencyRow
                      key={competency.id}
                      competency={competency}
                      entry={progress[competency.id]}
                      onLevelChange={(level) => updateLevel(competency.id, level)}
                      onNotesChange={(notes) => updateNotes(competency.id, notes)}
                      onCommitNotes={() => commitNotes(competency.id)}
                      isEditingNotes={editingNotes === competency.id}
                      setEditingNotes={setEditingNotes}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CompetencyRowProps {
  competency: SyllabusCompetency;
  entry?: ProgressEntry;
  onLevelChange: (level: number) => void;
  onNotesChange: (notes: string) => void;
  onCommitNotes: () => void;
  isEditingNotes: boolean;
  setEditingNotes: (id: string | null) => void;
}

function CompetencyRow({
  competency,
  entry,
  onLevelChange,
  onNotesChange,
  onCommitNotes,
  isEditingNotes,
  setEditingNotes,
}: CompetencyRowProps) {
  const currentLevel = entry?.level || 0;
  const note = entry?.instructor_notes?.trim() || '';
  const hasNote = !!note;

  return (
    <div
      style={{
        background: '#F2F2F4',
        borderRadius: 10,
        padding: 12,
        margin: '8px 0',
      }}
    >
      {/* Topic header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: '#000000',
            margin: 0,
          }}
        >
          {sentenceCase(competency.name)}
        </span>
        {competency.description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${competency.name}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                  }}
                >
                  <Info size={14} strokeWidth={1.8} color="#6E6E73" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{competency.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Rating buttons row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 4,
          marginBottom: 10,
        }}
      >
        {SKILL_LEVELS.map((level) => {
          const selected = currentLevel === level.level;
          return (
            <button
              key={level.level}
              type="button"
              onClick={() => onLevelChange(level.level)}
              aria-label={`${level.label} (score ${level.level})`}
              aria-pressed={selected}
              style={{
                background: selected ? '#2B7BC8' : '#FFFFFF',
                border: `0.5px solid ${selected ? '#2B7BC8' : '#E5E5EA'}`,
                borderRadius: 6,
                padding: '8px 0',
                fontSize: 13,
                fontWeight: 500,
                color: selected ? '#FFFFFF' : '#6E6E73',
                cursor: 'pointer',
                transition:
                  'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {level.level}
            </button>
          );
        })}
      </div>

      {/* Score description label */}
      <p
        style={{
          fontSize: 11,
          margin: 0,
          textAlign: 'center',
          paddingBottom: 4,
          color: scoreLabelColor(currentLevel),
        }}
      >
        {scoreLabelText(currentLevel)}
      </p>

      {/* Notes */}
      {isEditingNotes ? (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Textarea
            placeholder="Add notes about this skill..."
            value={entry?.instructor_notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
            onBlur={() => {
              onCommitNotes();
              setEditingNotes(null);
            }}
            rows={2}
            autoFocus
            style={{
              fontSize: 13,
              background: '#FFFFFF',
              border: '0.5px solid #E5E5EA',
              borderRadius: 8,
            }}
          />
        </div>
      ) : hasNote ? (
        <button
          type="button"
          onClick={() => setEditingNotes(competency.id)}
          style={{
            display: 'block',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 8,
            padding: '8px 10px',
            marginTop: 4,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: '#000000',
              margin: 0,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
            }}
          >
            {note}
          </p>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditingNotes(competency.id)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginTop: 4,
            fontSize: 11,
            fontWeight: 500,
            color: '#2B7BC8',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={11} strokeWidth={1.6} color="#2B7BC8" />
          Add note
        </button>
      )}
    </div>
  );
}
