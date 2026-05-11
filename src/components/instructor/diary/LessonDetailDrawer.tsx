import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DiaryLesson {
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
  lesson: DiaryLesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: DiaryLesson) => void;
}

export function LessonDetailDrawer({ lesson, open, onOpenChange, onSaved }: Props) {
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    setNotes(lesson.notes || "");
    setRating(lesson.rating ?? null);
    setSkills(lesson.skills_practiced || []);
    setSkillInput("");
  }, [lesson]);

  if (!lesson) return null;

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v || skills.includes(v)) return;
    setSkills([...skills, v]);
    setSkillInput("");
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        notes: notes.trim() || null,
        rating,
        skills_practiced: skills,
      };
      const { error } = await supabase
        .from("lesson_history")
        .update(payload)
        .eq("id", lesson.id);
      if (error) throw error;
      onSaved({ ...lesson, ...payload });
      toast.success("Lesson updated");
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Couldn't save lesson");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lesson.pupils?.name || "Lesson"}</SheetTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(lesson.lesson_date), "EEE d MMM yyyy")}
            </span>
            {lesson.start_time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.start_time.slice(0, 5)}
              </span>
            )}
            <span>
              {lesson.duration_minutes >= 60
                ? `${lesson.duration_minutes / 60}h`
                : `${lesson.duration_minutes}m`}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Rating */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  className="p-1"
                  aria-label={`${n} stars`}
                >
                  <Star
                    className={
                      rating && n <= rating
                        ? "h-6 w-6 fill-amber-400 text-amber-400"
                        : "h-6 w-6 text-muted-foreground"
                    }
                  />
                </button>
              ))}
              {rating && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="ml-2 text-xs text-muted-foreground underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Pupil notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you cover? How did the pupil get on?"
              rows={6}
              className="text-sm"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Skills practiced
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. Roundabouts"
                className="text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={addSkill}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.length === 0 && (
                <span className="text-xs text-muted-foreground">No skills added yet</span>
              )}
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-[11px] gap-1 pr-1">
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="hover:bg-muted rounded-full p-0.5"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
