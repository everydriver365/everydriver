import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

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

function ProgressRing({ progress, size = 40, strokeWidth = 3, color }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color || 'hsl(var(--primary))'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export function LessonPrepChecklist({ pupilId, instructorId, brandColour }: LessonPrepChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [hasUpcomingLesson, setHasUpcomingLesson] = useState(false);
  const [nextLessonType, setNextLessonType] = useState<string | null>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

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

      const baseItems = DEFAULT_ITEMS.map((item, i) => ({ ...item, id: `default-${i}` }));

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
      const checks: Record<string, boolean> = {};
      updated.forEach(i => { checks[i.id] = i.checked; });
      localStorage.setItem(`prep_${pupilId}_latest`, JSON.stringify(checks));
      return updated;
    });
  };

  // Confetti when all done
  const completedCount = items.filter(i => i.checked).length;
  const allDone = items.length > 0 && completedCount === items.length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  useEffect(() => {
    if (allDone && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: [brandColour || '#22c55e', '#fbbf24', '#3b82f6'],
      });
    }
    if (!allDone) {
      setHasTriggeredConfetti(false);
    }
  }, [allDone, hasTriggeredConfetti, brandColour]);

  if (!hasUpcomingLesson || items.length === 0) return null;

  const lessonTomorrow = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  })();

  return (
    <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
          <ClipboardList className="h-4 w-4" style={{ color: brandColour || '#3b82f6' }} />
          Lesson Prep
          <div className="ml-auto flex items-center gap-2">
            <ProgressRing progress={progress} size={28} strokeWidth={2.5} color={brandColour || undefined} />
            <span className="text-xs font-normal" style={{ color: 'var(--brand-muted)' }}>
              {completedCount}/{items.length}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Tomorrow reminder nudge */}
        {!allDone && nextLessonType && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: `${brandColour || '#3b82f6'}15`, color: brandColour || '#3b82f6' }}
          >
            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
            Complete your checklist before your {nextLessonType} lesson!
          </motion.div>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="flex items-center gap-2 w-full text-left p-1.5 rounded-md hover:bg-muted/30 transition-colors"
          >
            {item.checked ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: brandColour || '#22c55e' }} />
              </motion.div>
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
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs text-center pt-1 font-medium"
            style={{ color: brandColour || '#22c55e' }}
          >
            🎉 You're all set for your lesson!
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}
