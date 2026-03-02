import { Badge } from "@/components/ui/badge";
import { Car, Play, Clock, Navigation } from "lucide-react";

type LessonStatus = "scheduled" | "en_route" | "in_progress" | "completed" | "cancelled" | "no-show";

const statusConfig: Record<string, { label: string; icon: React.ComponentType<any>; className: string }> = {
  scheduled: { label: "Scheduled", icon: Clock, className: "bg-muted text-muted-foreground" },
  en_route: { label: "Instructor on the way", icon: Navigation, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse" },
  in_progress: { label: "Lesson in progress", icon: Play, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse" },
  completed: { label: "Completed", icon: Car, className: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelled", icon: Clock, className: "bg-destructive/10 text-destructive" },
};

interface LessonStatusBadgeProps {
  status: string;
}

export function LessonStatusBadge({ status }: LessonStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.scheduled;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} border-0 gap-1 text-[10px] font-semibold`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
