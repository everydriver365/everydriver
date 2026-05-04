import { useState } from "react";
import { CalendarDays, Loader2, ArrowRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { checkLessonClash, describeLessonClashError } from "@/lib/lessonClashCheck";

interface Lesson {
  id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  pupil_name: string;
}

interface BulkRescheduleTabProps {
  instructorId: string | undefined;
}

export function BulkRescheduleTab({ instructorId }: BulkRescheduleTabProps) {
  const [sourceDate, setSourceDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchLessons = async () => {
    if (!sourceDate || !instructorId) return;
    setLoading(true);
    const { data } = await supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, start_time, duration_minutes, pupils!inner(name)")
      .eq("instructor_id", instructorId)
      .eq("lesson_date", sourceDate)
      .neq("status", "cancelled")
      .order("start_time") as any;

    const mapped = (data || []).map((l: any) => ({
      id: l.id,
      date: l.lesson_date,
      start_time: l.start_time,
      duration_minutes: l.duration_minutes,
      pupil_name: l.pupils?.name || "Unknown",
    }));
    setLessons(mapped);
    setSelectedLessons(mapped.map((l: Lesson) => l.id));
    setLoading(false);
  };

  const toggleLesson = (id: string) => {
    setSelectedLessons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleReschedule = async () => {
    if (!targetDate || selectedLessons.length === 0) {
      toast.error("Select a target date and at least one lesson");
      return;
    }
    if (!instructorId) {
      toast.error("Missing instructor");
      return;
    }
    setSaving(true);
    try {
      // Pre-check every selected lesson against the target date so we don't half-apply.
      const selected = lessons.filter(l => selectedLessons.includes(l.id));
      const checks = await Promise.all(
        selected.map(l =>
          checkLessonClash({
            instructorId,
            date: targetDate,
            startTime: l.start_time,
            durationMinutes: l.duration_minutes,
            excludeLessonId: l.id,
          }).then(result => ({ lesson: l, result }))
        )
      );
      const offenders = checks.filter(c => c.result.hardOverlap);
      if (offenders.length > 0) {
        const list = offenders.map(o => `${o.lesson.pupil_name} (${o.lesson.start_time?.slice(0, 5)})`).join(", ");
        toast.error(`Cannot move — these lessons clash on ${format(new Date(targetDate), "EEE dd MMM")}: ${list}`);
        return;
      }

      const results = await Promise.allSettled(
        selected.map(l =>
          supabase.from("scheduled_lessons").update({ lesson_date: targetDate }).eq("id", l.id)
        )
      );
      const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && (r as any).value?.error));
      if (failed.length > 0) {
        const firstErr = failed
          .map(r => (r.status === "fulfilled" ? (r as any).value?.error : (r as any).reason))
          .find(Boolean);
        const friendly = describeLessonClashError(firstErr);
        toast.error(friendly ?? `Failed to move ${failed.length} lesson${failed.length > 1 ? "s" : ""}`);
        return;
      }
      const ok = results.length;
      toast.success(`Rescheduled ${ok} lesson${ok > 1 ? "s" : ""} to ${format(new Date(targetDate), "EEE dd MMM")}`);
      setLessons([]);
      setSelectedLessons([]);
      setSourceDate("");
      setTargetDate("");
    } catch (err) {
      const friendly = describeLessonClashError(err);
      toast.error(friendly ?? "Failed to reschedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Bulk Reschedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Move all lessons from one date to another — ideal for bank holidays.</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={sourceDate} onChange={e => setSourceDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={fetchLessons} disabled={!sourceDate || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Find Lessons
        </Button>

        {lessons.length > 0 && (
          <>
            <div className="border rounded-2xl max-h-48 overflow-y-auto">
              <div className="flex justify-between p-2 border-b">
                <span className="text-xs text-muted-foreground">{selectedLessons.length}/{lessons.length} selected</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedLessons(lessons.map(l => l.id))}>All</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedLessons([])}>None</Button>
                </div>
              </div>
              {lessons.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer" onClick={() => toggleLesson(l.id)}>
                  <Checkbox checked={selectedLessons.includes(l.id)} />
                  <span className="flex-1 text-sm">{l.pupil_name}</span>
                  <span className="text-xs text-muted-foreground">{l.start_time?.slice(0, 5)} • {l.duration_minutes}min</span>
                </div>
              ))}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={saving || !targetDate || selectedLessons.length === 0} className="w-full gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Move {selectedLessons.length} Lesson{selectedLessons.length !== 1 ? "s" : ""} to {targetDate ? format(new Date(targetDate), "dd MMM") : "..."}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Reschedule</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move {selectedLessons.length} lesson{selectedLessons.length !== 1 ? "s" : ""} from {sourceDate ? format(new Date(sourceDate), "EEE dd MMM") : "..."} to {targetDate ? format(new Date(targetDate), "EEE dd MMM") : "..."}. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReschedule} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {lessons.length === 0 && sourceDate && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No lessons found on this date</p>
        )}
      </CardContent>
    </Card>
  );
}
