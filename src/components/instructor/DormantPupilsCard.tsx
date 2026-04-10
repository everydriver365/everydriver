import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserMinus, MessageSquare, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface DormantPupil {
  id: string;
  name: string;
  lastLessonDate: string;
  daysSince: number;
}

interface DormantPupilsCardProps {
  instructorId: string | undefined;
}

export function DormantPupilsCard({ instructorId }: DormantPupilsCardProps) {
  const navigate = useNavigate();
  const [dormant, setDormant] = useState<DormantPupil[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!instructorId) return;
    fetchDormant();
  }, [instructorId]);

  const fetchDormant = async () => {
    if (!instructorId) return;

    const { data: pupils } = await supabase
      .from("pupils")
      .select("id, name")
      .eq("instructor_id", instructorId)
      .is("deleted_at", null)
      .eq("status", "active");

    if (!pupils || pupils.length === 0) return;

    const cutoff = format(subDays(new Date(), 14), "yyyy-MM-dd");
    const dormantList: DormantPupil[] = [];

    for (const pupil of pupils.slice(0, 30)) {
      const { data: lastLesson } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date")
        .eq("pupil_id", pupil.id)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: false })
        .limit(1);

      if (lastLesson && lastLesson.length > 0) {
        const lastDate = lastLesson[0].lesson_date;
        if (lastDate < cutoff) {
          const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
          dormantList.push({
            id: pupil.id,
            name: pupil.name,
            lastLessonDate: lastDate,
            daysSince,
          });
        }
      }
    }

    dormantList.sort((a, b) => b.daysSince - a.daysSince);
    setDormant(dormantList.slice(0, 5));
  };

  const visible = dormant.filter(d => !dismissed.has(d.id));

  if (visible.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <UserMinus className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Re-engage Pupils
        </span>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visible.map((pupil) => (
            <motion.div
              key={pupil.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              className="bg-card border border-border/40 rounded-none p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">{pupil.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Last lesson {pupil.daysSince} days ago
                </p>
              </div>
              <button
                onClick={() => navigate(`/instructor/messages?pupil=${pupil.id}`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Check in
              </button>
              <button
                onClick={() => setDismissed(prev => new Set(prev).add(pupil.id))}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-3 w-3 text-muted-foreground/50" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
