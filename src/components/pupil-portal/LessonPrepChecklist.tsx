import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface LessonPrepChecklistProps {
  pupilId: string;
  instructorId: string;
  brandColour?: string | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'id'>[] = [
  { label: "Bring provisional driving licence", checked: false },
  { label: "Wear comfortable shoes", checked: false },
  { label: "Bring glasses/contacts if needed", checked: false },
  { label: "Have water bottle ready", checked: false },
];

export function LessonPrepChecklist({ pupilId, instructorId, brandColour }: LessonPrepChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [hasUpcomingLesson, setHasUpcomingLesson] = useState(false);
  const [nextLessonType, setNextLessonType] = useState<string | null>(null);

  useEffect(() => {
    checkUpcomingLesson();
  }, [pupilId, instructorId]);

  const checkUpcomingLesson = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('scheduled_lessons')
      .select('id, lesson_type, lesson_date')
      .eq('pupil_id', pupilId)
      .eq('instructor_id', instructorId)
      .neq('status', 'cancelled')
      .gte('lesson_date', today)
      .order('lesson_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data) {
      setHasUpcomingLesson(true);
      setNextLessonType(data.lesson_type);

      // Build contextual checklist
      const baseItems = DEFAULT_ITEMS.map((item, i) => ({ ...item, id: `default-${i}` }));

      // Add lesson-type specific items
      if (data.lesson_type?.toLowerCase().includes('test')) {
        baseItems.push(
          { id: 'test-1', label: "Review test routes and common fault areas", checked: false },
          { id: 'test-2', label: "Get a good night's sleep", checked: false },
        );
      }
      if (data.lesson_type?.toLowerCase().includes('motorway')) {
        baseItems.push(
          { id: 'mway-1', label: "Review motorway rules and lane discipline", checked: false },
        );
      }

      // Load saved state from localStorage
      const storageKey = `prep_${pupilId}_${data.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedChecks: Record<string, boolean> = JSON.parse(saved);
        baseItems.forEach(item => {
          if (savedChecks[item.id] !== undefined) {
            item.checked = savedChecks[item.id];
          }
        });
      }

      setItems(baseItems);
    }
  };

  const toggleItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      // Persist to localStorage
      const checks: Record<string, boolean> = {};
      updated.forEach(i => { checks[i.id] = i.checked; });
      // We don't have lesson id here easily, so use pupilId
      localStorage.setItem(`prep_${pupilId}_latest`, JSON.stringify(checks));
      return updated;
    });
  };

  if (!hasUpcomingLesson || items.length === 0) return null;

  const completedCount = items.filter(i => i.checked).length;
  const allDone = completedCount === items.length;

  return (
    <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
          <ClipboardList className="h-4 w-4" style={{ color: brandColour || '#3b82f6' }} />
          Lesson Prep
          <span className="text-xs font-normal ml-auto" style={{ color: 'var(--brand-muted)' }}>
            {completedCount}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="flex items-center gap-2 w-full text-left p-1.5 rounded-md hover:bg-muted/30 transition-colors"
          >
            {item.checked ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: brandColour || '#22c55e' }} />
            ) : (
              <Circle className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-muted)' }} />
            )}
            <span
              className={`text-sm ${item.checked ? 'line-through opacity-60' : ''}`}
              style={{ color: 'var(--brand-text)' }}
            >
              {item.label}
            </span>
          </button>
        ))}
        {allDone && (
          <p className="text-xs text-center pt-1" style={{ color: brandColour || '#22c55e' }}>
            ✓ You're all set for your lesson!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
