import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, addDays, isAfter, isBefore } from "date-fns";

interface PupilCheckInCardProps {
  pupilId: string;
}

interface PendingLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  check_in_status: string | null;
}

export function PupilCheckInCard({ pupilId }: PupilCheckInCardProps) {
  const [lessons, setLessons] = useState<PendingLesson[]>([]);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCheckins();
  }, [pupilId]);

  const fetchPendingCheckins = async () => {
    const today = new Date();
    const twoDaysOut = addDays(today, 2);

    const { data, error } = await supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, start_time, duration_minutes, check_in_status")
      .eq("pupil_id", pupilId)
      .eq("status", "scheduled")
      .is("deleted_at", null)
      .gte("lesson_date", format(today, "yyyy-MM-dd"))
      .lte("lesson_date", format(twoDaysOut, "yyyy-MM-dd"))
      .is("check_in_status", null)
      .order("lesson_date", { ascending: true });

    if (!error && data) {
      setLessons(data);
    }
  };

  const handleResponse = async (lessonId: string, status: "confirmed" | "declined") => {
    setResponding(lessonId);
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({
          check_in_status: status,
          check_in_responded_at: new Date().toISOString(),
        })
        .eq("id", lessonId);

      if (error) throw error;

      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      toast.success(status === "confirmed" ? "See you there! ✅" : "Instructor notified");
    } catch {
      toast.error("Failed to respond");
    } finally {
      setResponding(null);
    }
  };

  if (lessons.length === 0) return null;

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <Card key={lesson.id} className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">
                Lesson on {format(parseISO(lesson.lesson_date), "EEE d MMM")}
              </span>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {lesson.start_time.slice(0, 5)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Can you confirm you'll be there?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => handleResponse(lesson.id, "confirmed")}
                disabled={responding === lesson.id}
              >
                <CheckCircle2 className="h-4 w-4" />
                I'll be there
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => handleResponse(lesson.id, "declined")}
                disabled={responding === lesson.id}
              >
                <XCircle className="h-4 w-4" />
                Can't make it
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
