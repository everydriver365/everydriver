import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Trophy, Star, Target, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PupilAvatar } from "@/components/instructor/PupilAvatar";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  pupil_id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  created_at: string;
  pupil_name: string | null;
  pupil_image: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  first_lesson: Star,
  "10_lessons": Award,
  "25_lessons": Trophy,
  "50_lessons": Sparkles,
  test_booked: Target,
  test_passed: Trophy,
  perfect_manoeuvre: Star,
};

const COLOR_MAP: Record<string, string> = {
  first_lesson: "bg-amber-500/10 text-amber-600",
  "10_lessons": "bg-blue-500/10 text-blue-600",
  "25_lessons": "bg-purple-500/10 text-purple-600",
  "50_lessons": "bg-emerald-500/10 text-emerald-600",
  test_booked: "bg-primary/10 text-primary",
  test_passed: "bg-emerald-500/10 text-emerald-600",
  perfect_manoeuvre: "bg-amber-500/10 text-amber-600",
};

interface PupilMilestoneFeedProps {
  instructorId: string | undefined;
}

export function PupilMilestoneFeed({ instructorId }: PupilMilestoneFeedProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) return;

    const fetchMilestones = async () => {
      const { data } = await supabase
        .from("pupil_milestones" as any)
        .select("id, pupil_id, milestone_type, title, description, icon_name, created_at")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data || data.length === 0) {
        setMilestones([]);
        setLoading(false);
        return;
      }

      // Fetch pupil names
      const pupilIds = [...new Set((data as any[]).map((d: any) => d.pupil_id))];
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id, name, profile_image_url")
        .in("id", pupilIds);

      const pupilMap = new Map((pupils || []).map(p => [p.id, p]));

      setMilestones((data as any[]).map((m: any) => ({
        ...m,
        pupil_name: pupilMap.get(m.pupil_id)?.name || "Unknown",
        pupil_image: pupilMap.get(m.pupil_id)?.profile_image_url || null,
      })));
      setLoading(false);
    };

    fetchMilestones();
  }, [instructorId]);

  if (loading || milestones.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Pupil Achievements
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <AnimatePresence>
          {milestones.map((m, i) => {
            const Icon = ICON_MAP[m.milestone_type] || Award;
            const colorClass = COLOR_MAP[m.milestone_type] || "bg-muted text-muted-foreground";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="shrink-0 w-44 rounded-none border bg-card p-3 space-y-2 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <PupilAvatar
                    name={m.pupil_name || "?"}
                    imageUrl={m.pupil_image}
                    size="xs"
                  />
                  <span className="text-xs font-medium truncate">{m.pupil_name}</span>
                </div>
                <div className={cn("w-8 h-8 rounded-none flex items-center justify-center", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold leading-tight">{m.title}</p>
                {m.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{m.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
