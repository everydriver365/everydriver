import { useState, useEffect } from "react";
import { Clock, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PupilProgressTimelineProps {
  pupilId: string;
  brandColour: string | null;
}

interface LessonEntry {
  id: string;
  lesson_date: string;
  duration_minutes: number;
  skills_practiced: string[];
  notes: string | null;
}

export function PupilProgressTimeline({ pupilId, brandColour }: PupilProgressTimelineProps) {
  const [lessons, setLessons] = useState<LessonEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, duration_minutes, skills_practiced, notes")
        .eq("pupil_id", pupilId)
        .order("lesson_date", { ascending: false })
        .limit(8);
      setLessons(data || []);
      setLoading(false);
    };
    fetchLessons();
  }, [pupilId]);

  if (loading || lessons.length === 0) return null;

  const accent = brandColour || "hsl(var(--primary))";

  return (
    <Card style={{ backgroundColor: "var(--brand-card)", borderColor: "var(--brand-border)" }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4" style={{ color: accent }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--brand-foreground)" }}>
            Recent Lessons
          </h3>
        </div>
        <div className="relative space-y-0">
          {/* Vertical line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full"
            style={{ backgroundColor: accent, opacity: 0.2 }}
          />
          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="relative flex gap-3 pb-4 last:pb-0">
              {/* Dot */}
              <div
                className="relative z-10 mt-1.5 h-[15px] w-[15px] rounded-full border-2 shrink-0"
                style={{
                  borderColor: accent,
                  backgroundColor: idx === 0 ? accent : "var(--brand-card)",
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: "var(--brand-foreground)" }}>
                    {format(new Date(lesson.lesson_date), "dd/MM/yy")}
                  </p>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-muted)" }}>
                    <Clock className="h-3 w-3" />
                    {lesson.duration_minutes ? `${lesson.duration_minutes} min` : "1 hr"}
                  </div>
                </div>
                {lesson.skills_practiced && lesson.skills_practiced.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {lesson.skills_practiced.slice(0, 4).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                        style={{ backgroundColor: `${accent}15`, color: accent }}
                      >
                        {skill.replace(/_/g, " ")}
                      </Badge>
                    ))}
                    {lesson.skills_practiced.length > 4 && (
                      <span className="text-[10px]" style={{ color: "var(--brand-muted)" }}>
                        +{lesson.skills_practiced.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
