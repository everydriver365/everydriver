import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Clock,
  Calendar,
  Star,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  CheckCircle2,
  X,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { PostLessonReview } from "./PostLessonReview";
import { format } from "date-fns";
import { EOLAuditLog } from "./EOLAuditLog";

interface LessonRecord {
  id: string;
  pupil_id: string;
  instructor_id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  skills_practiced: string[];
  notes: string | null;
  rating: number | null;
  created_at: string;
}

interface MissingEolLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
}

interface LessonHistoryProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
  onLessonAdded?: () => void;
}

const SKILL_OPTIONS = [
  "Clutch Control",
  "Moving Off & Stopping",
  "Steering",
  "Gear Changing",
  "Junctions",
  "Roundabouts",
  "Dual Carriageways",
  "Motorways",
  "Emergency Stop",
  "Reversing",
  "Parallel Parking",
  "Bay Parking",
  "Turn in the Road",
  "Hill Starts",
  "Independent Driving",
  "Show Me Tell Me",
  "Hazard Perception",
  "Mirror Checks",
  "Signalling",
  "Lane Discipline",
];

const DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

export function LessonHistory({
  pupilId,
  pupilName,
  instructorId,
  onLessonAdded,
}: LessonHistoryProps) {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [missingEol, setMissingEol] = useState<MissingEolLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewLessonId, setReviewLessonId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    lesson_date: format(new Date(), "yyyy-MM-dd"),
    start_time: "10:00",
    duration_minutes: 60,
    skills_practiced: [] as string[],
    notes: "",
    rating: 0,
  });

  useEffect(() => {
    fetchLessons();
  }, [pupilId]);

  const fetchLessons = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const [historyRes, scheduledRes] = await Promise.all([
        supabase
          .from("lesson_history")
          .select("*")
          .eq("pupil_id", pupilId)
          .order("lesson_date", { ascending: false }),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, status, deleted_at")
          .eq("pupil_id", pupilId)
          .lte("lesson_date", today)
          .neq("status", "cancelled")
          .is("deleted_at", null)
          .order("lesson_date", { ascending: false }),
      ]);

      if (historyRes.error) throw historyRes.error;
      if (scheduledRes.error) throw scheduledRes.error;

      const history = historyRes.data || [];
      setLessons(history);

      const norm = (t: string | null) =>
        !t ? "" : t.length === 5 ? `${t}:00` : t;
      const eolKeys = new Set(
        history
          .filter((r: any) => r.start_time)
          .map((r: any) => `${r.lesson_date}|${norm(r.start_time)}`),
      );

      const missing: MissingEolLesson[] = (scheduledRes.data || [])
        .filter((s: any) => {
          if (!s.start_time) return false;
          return !eolKeys.has(`${s.lesson_date}|${norm(s.start_time)}`);
        })
        .map((s: any) => ({
          id: s.id,
          lesson_date: s.lesson_date,
          start_time: s.start_time,
          duration_minutes: s.duration_minutes,
        }));
      setMissingEol(missing);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      lesson_date: format(new Date(), "yyyy-MM-dd"),
      start_time: "10:00",
      duration_minutes: 60,
      skills_practiced: [],
      notes: "",
      rating: 0,
    });
  };

  const handleAddLesson = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("lesson_history").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        lesson_date: formData.lesson_date,
        start_time: formData.start_time,
        duration_minutes: formData.duration_minutes,
        skills_practiced: formData.skills_practiced,
        notes: formData.notes || null,
        rating: formData.rating > 0 ? formData.rating : null,
      });

      if (error) throw error;

      toast.success("Lesson logged successfully");
      setIsAddOpen(false);
      resetForm();
      fetchLessons();
      onLessonAdded?.();
    } catch (error) {
      console.error("Error adding lesson:", error);
      toast.error("Failed to log lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleEditLesson = async () => {
    if (!selectedLesson) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("lesson_history")
        .update({
          lesson_date: formData.lesson_date,
          start_time: formData.start_time,
          duration_minutes: formData.duration_minutes,
          skills_practiced: formData.skills_practiced,
          notes: formData.notes || null,
          rating: formData.rating > 0 ? formData.rating : null,
        })
        .eq("id", selectedLesson.id);

      if (error) throw error;

      toast.success("Lesson updated");
      setIsEditOpen(false);
      resetForm();
      fetchLessons();
    } catch (error) {
      console.error("Error updating lesson:", error);
      toast.error("Failed to update lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lesson: LessonRecord) => {
    if (!confirm("Delete this lesson record?")) return;

    try {
      const { softDelete } = await import("@/lib/auditLogger");
      await softDelete("lesson_history", lesson.id, lesson.instructor_id || "", { lesson_date: lesson.lesson_date });

      toast.success("Lesson deleted");
      fetchLessons();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    }
  };

  const openEditDialog = (lesson: LessonRecord) => {
    setSelectedLesson(lesson);
    setFormData({
      lesson_date: lesson.lesson_date,
      start_time: lesson.start_time?.slice(0, 5) || "10:00",
      duration_minutes: lesson.duration_minutes,
      skills_practiced: lesson.skills_practiced || [],
      notes: lesson.notes || "",
      rating: lesson.rating || 0,
    });
    setIsEditOpen(true);
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills_practiced: prev.skills_practiced.includes(skill)
        ? prev.skills_practiced.filter((s) => s !== skill)
        : [...prev.skills_practiced, skill],
    }));
  };

  const totalHours = lessons.reduce((acc, l) => acc + l.duration_minutes / 60, 0);

  const LessonForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lesson_date">Date</Label>
          <Input
            id="lesson_date"
            type="date"
            value={formData.lesson_date}
            onChange={(e) =>
              setFormData({ ...formData, lesson_date: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) =>
              setFormData({ ...formData, start_time: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <Select
          value={String(formData.duration_minutes)}
          onValueChange={(v) =>
            setFormData({ ...formData, duration_minutes: parseInt(v) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Skills Practiced</Label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-2xl">
          {SKILL_OPTIONS.map((skill) => (
            <Badge
              key={skill}
              variant={
                formData.skills_practiced.includes(skill) ? "default" : "outline"
              }
              className="cursor-pointer transition-colors"
              onClick={() => toggleSkill(skill)}
            >
              {formData.skills_practiced.includes(skill) && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {skill}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {formData.skills_practiced.length} skills selected
        </p>
      </div>

      <div className="space-y-2">
        <Label>Lesson Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  rating: formData.rating === star ? 0 : star,
                })
              }
              className="p-1 transition-colors"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= formData.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="How did the lesson go? Any areas to focus on next time?"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => {
            isEdit ? setIsEditOpen(false) : setIsAddOpen(false);
            resetForm();
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={isEdit ? handleEditLesson : handleAddLesson}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            "Update Lesson"
          ) : (
            "Log Lesson"
          )}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Lesson History
          </h3>
          <p className="text-sm text-muted-foreground">
            {lessons.length} lessons • {totalHours.toFixed(1)} hours total
            {missingEol.length > 0 && (
              <>
                {" • "}
                <span className="text-amber-600 font-medium">
                  {missingEol.length} EOL missing
                </span>
              </>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Log Lesson
        </Button>
      </div>

      {/* Missing EOL list */}
      {missingEol.length > 0 && (
        <div className="space-y-2">
          {missingEol.map((m) => (
            <Card
              key={`missing-${m.id}`}
              className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
            >
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {format(new Date(m.lesson_date), "EEE, d MMM yyyy")}
                      {m.start_time && ` • ${m.start_time.slice(0, 5)}`}
                      <span className="text-muted-foreground font-normal">
                        {" • "}
                        {m.duration_minutes / 60}h
                      </span>
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      EOL missing — no end-of-lesson record yet
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => {
                    setFormData({
                      lesson_date: m.lesson_date,
                      start_time: m.start_time
                        ? m.start_time.slice(0, 5)
                        : "10:00",
                      duration_minutes: m.duration_minutes,
                      skills_practiced: [],
                      notes: "",
                      rating: 0,
                    });
                    setIsAddOpen(true);
                  }}
                >
                  Log
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No lessons logged yet.
              <br />
              <button
                onClick={() => setIsAddOpen(true)}
                className="text-primary hover:underline"
              >
                Log the first lesson
              </button>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {/* Date and Time */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-primary" />
                            {format(new Date(lesson.lesson_date), "EEE, d MMM yyyy")}
                          </div>
                          {lesson.start_time && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {lesson.start_time.slice(0, 5)}
                            </div>
                          )}
                          <Badge variant="secondary">
                            {lesson.duration_minutes / 60}h
                          </Badge>
                          {lesson.rating && (
                            <div className="flex items-center gap-0.5">
                              {[...Array(lesson.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 fill-amber-400 text-amber-400"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {lesson.skills_practiced &&
                          lesson.skills_practiced.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {lesson.skills_practiced.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}

                        {/* Notes */}
                        {lesson.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {lesson.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Review Skills"
                          onClick={() => {
                            setReviewLessonId(lesson.id);
                            setSelectedLesson(lesson);
                            setIsReviewOpen(true);
                          }}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(lesson)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteLesson(lesson)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Lesson Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Lesson</DialogTitle>
            <DialogDescription>
              Record a lesson with {pupilName}
            </DialogDescription>
          </DialogHeader>
          <LessonForm />
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              Update lesson details for {pupilName}
            </DialogDescription>
          </DialogHeader>
          <LessonForm isEdit />
        </DialogContent>
      </Dialog>

      {/* Post-Lesson Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post-Lesson Review</DialogTitle>
            <DialogDescription>
              Update {pupilName}'s skills and plan next lesson
            </DialogDescription>
          </DialogHeader>
          {reviewLessonId && (
            <PostLessonReview
              lessonId={reviewLessonId}
              pupilId={pupilId}
              instructorId={instructorId}
              skillsPracticed={selectedLesson?.skills_practiced || []}
              existingNotes={selectedLesson?.notes}
              onSaved={() => fetchLessons()}
              onClose={() => setIsReviewOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <EOLAuditLog instructorId={instructorId} />
    </div>
  );
}
