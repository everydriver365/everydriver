import { useEffect, useState } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface InstructorLessonNotesProps {
  pupilId: string;
  /** From instructors.share_lesson_notes_with_pupil. When not true, the
   *  component renders nothing — pupils see no behaviour change. */
  shareEnabled: boolean | null | undefined;
  brandColour?: string | null;
}

interface NoteRow {
  id: string;
  lesson_date: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

/**
 * Read-only surface for the instructor's freeform note captured at the end of
 * each lesson (`lesson_history.notes`). Hidden by default and only mounted
 * when the instructor has opted in via `share_lesson_notes_with_pupil`.
 */
export function InstructorLessonNotes({ pupilId, shareEnabled, brandColour }: InstructorLessonNotesProps) {
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shareEnabled !== true) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, notes")
        .eq("pupil_id", pupilId)
        .not("notes", "is", null)
        .order("lesson_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(10);
      if (cancelled) return;
      const filtered = (data || []).filter((r) => (r.notes || "").trim().length > 0);
      setRows(filtered);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [pupilId, shareEnabled]);

  if (shareEnabled !== true) return null;
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // Per spec: when no notes exist, render nothing (no empty state).
  if (rows.length === 0) return null;

  const accent = brandColour || "hsl(var(--primary))";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <StickyNote className="h-4 w-4" style={{ color: accent }} />
          Instructor's note
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm whitespace-pre-wrap">{r.notes}</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {r.lesson_date ? format(new Date(r.lesson_date), "EEE d MMM yyyy") : ""}
              {r.duration_minutes ? ` · ${r.duration_minutes} min` : ""}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default InstructorLessonNotes;
