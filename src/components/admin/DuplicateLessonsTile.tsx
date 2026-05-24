import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DuplicateRow {
  instructor_id: string;
  pupil_id: string;
  lesson_date: string;
  start_time: string;
  duplicate_count: number;
  lesson_ids: string[];
}

export function DuplicateLessonsTile() {
  const [count, setCount] = useState<number | null>(null);
  const [rows, setRows] = useState<DuplicateRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("v_duplicate_active_lessons" as any)
      .select("*")
      .order("lesson_date", { ascending: false })
      .limit(200);
    if (error) {
      console.error("duplicate lessons load error", error.message);
      setCount(0);
      return;
    }
    const list = (data as unknown as DuplicateRow[]) ?? [];
    setRows(list);
    setCount(list.length);
  }

  const hasDupes = (count ?? 0) > 0;

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className={`transition-colors h-full cursor-pointer ${hasDupes ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10" : "hover:bg-accent/50"}`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className={`h-4 w-4 ${hasDupes ? "text-destructive" : ""}`} />
            Duplicate active lessons
            <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {count === null
              ? "Loading…"
              : hasDupes
                ? `${count} duplicate group${count === 1 ? "" : "s"} — review required`
                : "No duplicates found"}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duplicate active lessons</DialogTitle>
            <DialogDescription>
              Lessons sharing instructor, pupil, date and start time. Human review required — do not auto-cancel.
            </DialogDescription>
          </DialogHeader>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No duplicates.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {rows.map((r, i) => (
                <div key={`${r.instructor_id}-${r.pupil_id}-${r.lesson_date}-${r.start_time}-${i}`} className="text-xs border rounded-md p-3 space-y-1">
                  <div className="font-medium">
                    {r.lesson_date} @ {r.start_time} ({r.duplicate_count} copies)
                  </div>
                  <div className="text-muted-foreground">Instructor: {r.instructor_id}</div>
                  <div className="text-muted-foreground">Pupil: {r.pupil_id}</div>
                  <div className="text-muted-foreground">Lesson IDs:</div>
                  <ul className="font-mono ml-3">
                    {r.lesson_ids.map((id) => <li key={id}>{id}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
