import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

interface PayoutStatusBadgeProps {
  status?: string | null;
  size?: "sm" | "md";
}

export function PayoutStatusBadge({ status, size = "sm" }: PayoutStatusBadgeProps) {
  const isTransferred = status === "transferred";
  const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5";
  const iconSize = size === "sm" ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1";

  if (isTransferred) {
    return (
      <Badge variant="outline" className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ${sizeClasses}`}>
        <CheckCircle className={iconSize} />
        Transferred
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 ${sizeClasses}`}>
      <Clock className={iconSize} />
      Pending
    </Badge>
  );
}
