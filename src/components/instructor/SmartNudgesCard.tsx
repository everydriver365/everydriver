import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, ChevronRight, ChevronUp, ChevronDown, X, User,
  Bell, UserMinus, PoundSterling, Award, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

function getIcon(type: string) {
  switch (type) {
    case "dormant_pupil": return UserMinus;
    case "overdue_payments": return PoundSterling;
    case "upcoming_test": return Award;
    case "schedule_gap": return Clock;
    default: return Bell;
  }
}

function getCategory(type: string): string {
  switch (type) {
    case "dormant_pupil": return "Pupils";
    case "overdue_payments": return "Payments";
    case "upcoming_test": return "Tests";
    case "schedule_gap": return "Schedule";
    default: return "Other";
  }
}

const CATEGORY_ORDER = ["Payments", "Tests", "Pupils", "Schedule", "Other"];
const CATEGORY_EMOJI: Record<string, string> = {
  Payments: "🔴",
  Tests: "🟡",
  Pupils: "🟠",
  Schedule: "🔵",
  Other: "⚪",
};

export function SmartNudgesCard({ instructorId }: SmartNudgesCardProps) {
  const navigate = useNavigate();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  // Group by category
  const grouped = visibleNudges.reduce((acc, n) => {
    const cat = getCategory(n.type);
    (acc[cat] = acc[cat] || []).push(n);
    return acc;
  }, {} as Record<string, Nudge[]>);

  return (
    <div className="mt-4 mb-4">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-muted/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[13px] font-semibold text-foreground">Smart Nudges</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
              {visibleNudges.length}
            </Badge>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Feed */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/30">
                {CATEGORY_ORDER.map(cat => {
                  const items = grouped[cat];
                  if (!items) return null;
                  return (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="px-4 py-1.5 bg-muted/5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {CATEGORY_EMOJI[cat]} {cat}
                        </span>
                      </div>
                      {/* Items */}
                      <AnimatePresence mode="popLayout">
                        {items.map((nudge, i) => {
                          const Icon = getIcon(nudge.type);
                          return (
                            <motion.div
                              key={nudge.id}
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20, height: 0 }}
                              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-muted/5 transition-colors ${
                                i < items.length - 1 ? "border-b border-border/20" : ""
                              }`}
                            >
                              {/* Avatar or icon */}
                              {nudge.pupil_name ? (
                                nudge.pupil_image ? (
                                  <img
                                    src={nudge.pupil_image}
                                    alt={nudge.pupil_name}
                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(nudge.pupil_name)} flex items-center justify-center shrink-0`}>
                                    <span className="text-[10px] font-bold text-white">{getInitials(nudge.pupil_name)}</span>
                                  </div>
                                )
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted/15 flex items-center justify-center shrink-0">
                                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}

                              {/* Title */}
                              <p className="flex-1 text-[12px] text-foreground leading-tight min-w-0">{nudge.title}</p>

                              {/* Action */}
                              <button
                                onClick={() => navigate(nudge.action_route)}
                                className="text-[11px] font-semibold text-primary hover:underline whitespace-nowrap flex items-center gap-0.5"
                              >
                                {nudge.action_label}
                                <ChevronRight className="h-3 w-3" />
                              </button>

                              {/* Dismiss */}
                              <button
                                onClick={() => dismiss(nudge.id)}
                                className="p-1 rounded-full hover:bg-foreground/5 transition-colors -mr-1"
                              >
                                <X className="h-3 w-3 text-muted-foreground/40" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
