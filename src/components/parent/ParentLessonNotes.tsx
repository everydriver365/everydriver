import { useState, useEffect } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Props {
  childId: string;
}

export function ParentLessonNotes({ childId }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [childId]);

  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lesson_feedback")
      .select("id, feedback_text, created_at, lesson_id")
      .eq("pupil_id", childId)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotes(data || []);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (notes.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-500" />
          Lesson Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="p-2.5 rounded-lg bg-muted/50 border">
            <p className="text-sm">{note.feedback_text}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(note.created_at), "dd MMM yyyy")}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
