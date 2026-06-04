import { useState, useEffect } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Props {
  childId: string;
}

interface FeedbackRow {
  id: string;
  feedback_text: string | null;
  created_at: string;
  lesson_id: string | null;
}

interface InstructorNoteRow {
  id: string;
  lesson_date: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

export function ParentLessonNotes({ childId }: Props) {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [instructorNotes, setInstructorNotes] = useState<InstructorNoteRow[]>([]);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Existing pupil-side feedback (unchanged behaviour). The legacy column
      // name `feedback_text` isn't in generated types — cast through `any` so
      // we don't change the runtime query while keeping the build green.
      const feedbackPromise = (supabase as any)
        .from("lesson_feedback")
        .select("id, feedback_text, created_at, lesson_id")
        .eq("pupil_id", childId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Look up the linked instructor for this pupil + their sharing toggle.
      const pupilPromise = supabase
        .from("pupils")
        .select("instructor_id")
        .eq("id", childId)
        .maybeSingle();

      const [feedbackRes, pupilRes] = await Promise.all([feedbackPromise, pupilPromise]);
      if (cancelled) return;

      setFeedback(feedbackRes.data || []);

      const instructorId = pupilRes.data?.instructor_id;
      if (!instructorId) {
        setShareEnabled(false);
        setInstructorNotes([]);
        setLoading(false);
        return;
      }

      const { data: instructorRow } = await supabase
        .from("instructors")
        .select("share_lesson_notes_with_pupil")
        .eq("id", instructorId)
        .maybeSingle();
      if (cancelled) return;

      const enabled = (instructorRow as any)?.share_lesson_notes_with_pupil === true;
      setShareEnabled(enabled);

      if (enabled) {
        const { data: noteRows } = await supabase
          .from("lesson_history")
          .select("id, lesson_date, duration_minutes, notes")
          .eq("pupil_id", childId)
          .not("notes", "is", null)
          .order("lesson_date", { ascending: false })
          .limit(10);
        if (cancelled) return;
        setInstructorNotes(
          (noteRows || []).filter((r: any) => (r.notes || "").trim().length > 0),
        );
      } else {
        setInstructorNotes([]);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (feedback.length === 0 && (!shareEnabled || instructorNotes.length === 0)) return null;

  return (
    <div className="space-y-4">
      {feedback.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-amber-500" />
              Lesson Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {feedback.map((note) => (
              <div key={note.id} className="p-2.5 rounded-lg bg-muted/50 border">
                <p className="text-sm">{note.feedback_text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(note.created_at), "dd/MM/yy")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {shareEnabled && instructorNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              Instructor's note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {instructorNotes.map((r) => (
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
      )}
    </div>
  );
}
