import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface PupilCoachingCardProps {
  pupilId: string;
}

interface CoachingMessage {
  id: string;
  date: string;
  notes: string;
  nextPlan: string | null;
  rating: number | null;
  skills: string[];
}

export function PupilCoachingCard({ pupilId }: PupilCoachingCardProps) {
  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, notes, next_lesson_plan, rating, skills_practiced")
        .eq("pupil_id", pupilId)
        .not("notes", "is", null)
        .order("lesson_date", { ascending: false })
        .limit(5);

      if (data) {
        setMessages(data.filter(d => d.notes).map(d => ({
          id: d.id,
          date: d.lesson_date,
          notes: d.notes!,
          nextPlan: d.next_lesson_plan,
          rating: d.rating,
          skills: d.skills_practiced || [],
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [pupilId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No coaching notes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your instructor's feedback will appear here after lessons</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          Instructor Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {format(parseISO(msg.date), "EEE, d MMM yyyy")}
              </span>
              {msg.rating && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < msg.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <p className="text-sm">{msg.notes}</p>

            {msg.nextPlan && (
              <div className="bg-primary/5 rounded-md p-2 border border-primary/10">
                <p className="text-xs font-medium text-primary mb-0.5">Next Lesson Plan</p>
                <p className="text-xs text-muted-foreground">{msg.nextPlan}</p>
              </div>
            )}

            {msg.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {msg.skills.slice(0, 4).map(skill => (
                  <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                ))}
                {msg.skills.length > 4 && (
                  <Badge variant="outline" className="text-[10px]">+{msg.skills.length - 4}</Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
