import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, X, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Nudge {
  id: string;
  type: string;
  icon: string;
  title: string;
  action_label: string;
  action_route: string;
  priority: number;
  pupil_id?: string;
  pupil_name?: string;
  pupil_image?: string | null;
}

interface SmartNudgesCardProps {
  instructorId: string | undefined;
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function SmartNudgesCard({ instructorId }: SmartNudgesCardProps) {
  const navigate = useNavigate();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    fetchNudges();
  }, [instructorId]);

  const fetchNudges = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-nudges", {
        body: { instructor_id: instructorId },
      });
      if (!error && data?.nudges) {
        setNudges(data.nudges);
      }
    } catch (e) {
      console.error("Nudges fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const visibleNudges = nudges.filter(n => !dismissed.has(n.id));

  if (visibleNudges.length === 0) return null;

  const priorityColors: Record<number, string> = {
    1: "border-rose-200/60 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/20",
    2: "border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20",
    3: "border-blue-200/60 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20",
  };

  return (
    <div className="mt-4 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Smart Nudges</span>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleNudges.map((nudge) => (
            <motion.div
              key={nudge.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className={`rounded-xl border p-3 flex items-center gap-3 ${priorityColors[nudge.priority] || priorityColors[3]}`}
            >
              {/* Pupil avatar */}
              {nudge.pupil_name ? (
                nudge.pupil_image ? (
                  <img
                    src={nudge.pupil_image}
                    alt={nudge.pupil_name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-black/20 shrink-0"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full ${getAvatarColor(nudge.pupil_name)} flex items-center justify-center ring-2 ring-white dark:ring-black/20 shrink-0`}>
                    <span className="text-[11px] font-bold text-white">{getInitials(nudge.pupil_name)}</span>
                  </div>
                )
              ) : (
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center ring-2 ring-white dark:ring-black/20 shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground leading-tight">{nudge.title}</p>
              </div>
              <button
                onClick={() => navigate(nudge.action_route)}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold whitespace-nowrap hover:bg-primary/20 transition-colors"
              >
                {nudge.action_label}
                <ChevronRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => dismiss(nudge.id)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
