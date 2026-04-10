import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, ChevronDown, ChevronUp, AlertTriangle, Shield, Car, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

interface OutstandingTasksCardProps {
  instructorId: string | undefined;
}

interface TaskItem {
  id: string;
  label: string;
  category: "compliance" | "vehicle" | "cpd" | "todo";
  urgency: "overdue" | "urgent" | "upcoming" | "info";
  detail: string;
  route?: string;
}

function getUrgencyColor(urgency: TaskItem["urgency"]) {
  switch (urgency) {
    case "overdue": return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
    case "urgent": return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
    case "upcoming": return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
    case "info": return "bg-muted text-muted-foreground";
  }
}

function getCategoryIcon(category: TaskItem["category"]) {
  switch (category) {
    case "compliance": return <Shield className="h-3.5 w-3.5" />;
    case "vehicle": return <Car className="h-3.5 w-3.5" />;
    case "cpd": return <BookOpen className="h-3.5 w-3.5" />;
    case "todo": return <CheckCircle2 className="h-3.5 w-3.5" />;
  }
}

export function OutstandingTasksCard({ instructorId }: OutstandingTasksCardProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["outstanding-tasks", instructorId],
    queryFn: async (): Promise<TaskItem[]> => {
      if (!instructorId) return [];
      const items: TaskItem[] = [];
      const now = new Date();

      // 1. Compliance items (ADI badge, car insurance)
      const { data: instructor } = await supabase
        .from("instructors")
        .select("adi_badge_expiry, car_insurance_expiry")
        .eq("id", instructorId)
        .maybeSingle();

      if (instructor) {
        const complianceChecks = [
          { label: "ADI Badge", date: instructor.adi_badge_expiry },
          { label: "Car Insurance", date: instructor.car_insurance_expiry },
        ];
        for (const check of complianceChecks) {
          if (check.date) {
            const days = differenceInDays(parseISO(check.date), now);
            if (days < 0) {
              items.push({ id: `comp-${check.label}`, label: check.label, category: "compliance", urgency: "overdue", detail: `Expired ${Math.abs(days)} days ago`, route: "/instructor/compliance" });
            } else if (days <= 30) {
              items.push({ id: `comp-${check.label}`, label: check.label, category: "compliance", urgency: days <= 7 ? "urgent" : "upcoming", detail: `Expires in ${days} days`, route: "/instructor/compliance" });
            }
          }
        }
      }

      // 2. Vehicle health (MOT, tax, insurance)
      const { data: vehicles } = await supabase
        .from("instructor_vehicles")
        .select("id, make, model, mot_expiry, tax_expiry, insurance_expiry")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      if (vehicles) {
        for (const v of vehicles) {
          const vName = `${v.make || ""} ${v.model || ""}`.trim() || "Vehicle";
          const vChecks = [
            { label: `${vName} MOT`, date: v.mot_expiry },
            { label: `${vName} Tax`, date: v.tax_expiry },
            { label: `${vName} Insurance`, date: v.insurance_expiry },
          ];
          for (const check of vChecks) {
            if (check.date) {
              const days = differenceInDays(parseISO(check.date), now);
              if (days < 0) {
                items.push({ id: `veh-${v.id}-${check.label}`, label: check.label, category: "vehicle", urgency: "overdue", detail: `Expired ${Math.abs(days)} days ago`, route: "/instructor/vehicle" });
              } else if (days <= 30) {
                items.push({ id: `veh-${v.id}-${check.label}`, label: check.label, category: "vehicle", urgency: days <= 7 ? "urgent" : "upcoming", detail: `Due in ${days} days`, route: "/instructor/vehicle" });
              }
            }
          }
        }
      }

      // 3. CPD hours check
      const { data: cpdEntries } = await supabase
        .from("cpd_log_entries")
        .select("hours")
        .eq("instructor_id", instructorId);

      const totalCpdHours = (cpdEntries || []).reduce((s, e) => s + (e.hours || 0), 0);
      if (totalCpdHours < 7) {
        items.push({ id: "cpd-hours", label: "CPD Hours", category: "cpd", urgency: totalCpdHours < 3 ? "urgent" : "upcoming", detail: `${totalCpdHours.toFixed(1)}/7 hrs logged`, route: "/instructor/cpd" });
      }

      // Sort: overdue first, then urgent, then upcoming
      const urgencyOrder = { overdue: 0, urgent: 1, upcoming: 2, info: 3 };
      items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      return items;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  const overdueCount = tasks.filter(t => t.urgency === "overdue").length;
  const urgentCount = tasks.filter(t => t.urgency === "urgent").length;
  const totalCount = tasks.length;

  if (isLoading || totalCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-none p-4 mt-3"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-400/20 flex items-center justify-center">
            <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Outstanding Tasks</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1.5">{overdueCount} overdue</Badge>
              )}
              {urgentCount > 0 && (
                <Badge className="text-[9px] h-4 px-1.5 bg-amber-500 hover:bg-amber-600">{urgentCount} urgent</Badge>
              )}
              {totalCount - overdueCount - urgentCount > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{totalCount - overdueCount - urgentCount} upcoming</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => task.route && navigate(task.route)}
              className={`flex items-center gap-2.5 p-2.5 rounded-none cursor-pointer transition-colors ${getUrgencyColor(task.urgency)}`}
            >
              <div className="flex-shrink-0">{getCategoryIcon(task.category)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate">{task.label}</p>
                <p className="text-[10px] opacity-75">{task.detail}</p>
              </div>
              {task.urgency === "overdue" && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />}
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
