import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface WaitlistFreshnessIndicatorProps {
  lastConfirmedAt: string | null;
  createdAt: string | null;
  autoExpired?: boolean;
}

export function WaitlistFreshnessIndicator({
  lastConfirmedAt,
  createdAt,
  autoExpired,
}: WaitlistFreshnessIndicatorProps) {
  if (autoExpired) {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-0 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  const referenceDate = lastConfirmedAt || createdAt;
  if (!referenceDate) return null;

  const daysSince = differenceInDays(new Date(), parseISO(referenceDate));

  if (daysSince <= 14) {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Fresh
      </Badge>
    );
  }

  if (daysSince <= 21) {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-0 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
        <Clock className="h-3 w-3" />
        Awaiting
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs gap-1 border-0 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
      <AlertTriangle className="h-3 w-3" />
      Stale
    </Badge>
  );
}
