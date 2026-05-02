import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LessonCheckInBadgeProps {
  status: string | null;
  className?: string;
}

export function LessonCheckInBadge({ status, className }: LessonCheckInBadgeProps) {
  if (!status) return null;

  const config = {
    confirmed: {
      icon: CheckCircle2,
      label: "Confirmed",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    declined: {
      icon: AlertCircle,
      label: "Declined",
      className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    },
    pending: {
      icon: Clock,
      label: "Awaiting confirmation",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    },
  }[status] || null;

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs gap-1 border-0", config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
