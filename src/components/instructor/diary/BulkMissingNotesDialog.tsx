import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LessonRecord {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  notes: string | null;
  rating: number | null;
  skills_practiced: string[] | null;
  pupils: { id: string; name: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessons: LessonRecord[]; // lessons missing notes (within current filters)
  onSaved: (updatedIds: string[], notes: string) => void;
}

const DEFAULT_TEMPLATE =
  "Lesson covered planned topics. Pupil engaged well — review key points next lesson and continue building confidence.";

const STORAGE_KEY = "dsm.lessonHistory.missingNotesTemplate";

export function BulkMissingNotesDialog({ open, onOpenChange, lessons, onSaved }: Props) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTemplate(saved);
      // Default: all lessons selected
      const initial: Record<string, boolean> = {};
      lessons.forEach((l) => { initial[l.id] = true; });
      setSelected(initial);
    }
  }, [open, lessons]);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  const allChecked = lessons.length > 0 && selectedIds.length === lessons.length;

  const toggleAll = () => {
    if (allChecked) setSelected({});
    else {
      const all: Record<string, boolean> = {};
      lessons.forEach((l) => { all[l.id] = true; });
      setSelected(all);
    }
  };

  const handleApply = async () => {
    const trimmed = template.trim();
    if (!trimmed) {
      toast.error("Add some text to the template first");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Select at least one lesson");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("lesson_history")
        .update({ notes: trimmed })
        .in("id", selectedIds);
      if (error) throw error;
      localStorage.setItem(STORAGE_KEY, trimmed);
      toast.success(`Notes added to ${selectedIds.length} lesson${selectedIds.length === 1 ? "" : "s"}`);
      onSaved(selectedIds, trimmed);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Bulk notes update failed", err);
      toast.error(err.message || "Failed to add notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Bulk add notes
          </DialogTitle>
          <DialogDescription>
            Apply a short notes template to lessons that are currently missing notes.
            You can edit individual notes later from each lesson.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Notes template
            </label>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              placeholder="e.g. Covered planned topics. Pupil progressing well — recap next session."
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Tip: keep it generic. Your last template is remembered for next time.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Lessons missing notes
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {selectedIds.length}/{lessons.length}
                </Badge>
              </label>
              {lessons.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline"
                >
                  {allChecked ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            {lessons.length === 0 ? (
              <div className="border rounded-md p-6 text-center text-xs text-muted-foreground">
                No lessons are missing notes in the current view. Adjust your filters and try again.
              </div>
            ) : (
              <div className="border rounded-md max-h-64 overflow-y-auto divide-y">
                {lessons.map((l) => (
                  <label
                    key={l.id}
                    className="flex items-start gap-2 p-2.5 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={!!selected[l.id]}
                      onCheckedChange={(v) =>
                        setSelected((prev) => ({ ...prev, [l.id]: v === true }))
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {l.pupils?.name || "Unknown pupil"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(l.lesson_date), "MMM d, yyyy")}
                        {l.start_time ? ` · ${l.start_time.slice(0, 5)}` : ""}
                        {` · ${l.duration_minutes}m`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={saving || lessons.length === 0}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Applying…</>
            ) : (
              `Apply to ${selectedIds.length} lesson${selectedIds.length === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
