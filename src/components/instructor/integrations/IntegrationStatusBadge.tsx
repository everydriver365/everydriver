import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDashed, MinusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntegrationStatusKind = "connected" | "disconnected" | "available" | "loading";

interface Props {
  status: IntegrationStatusKind;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

const META: Record<IntegrationStatusKind, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  connected: { label: "Connected", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  disconnected: { label: "Not connected", icon: MinusCircle, tone: "bg-muted text-muted-foreground border-border" },
  available: { label: "Available", icon: CircleDashed, tone: "bg-sky-50 text-sky-700 border-sky-200" },
  loading: { label: "Checking…", icon: Loader2, tone: "bg-muted text-muted-foreground border-border" },
};

export function IntegrationStatusBadge({ status, label, className, size = "sm" }: Props) {
  const m = META[status];
  const Icon = m.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        m.tone,
        "gap-1 font-medium",
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className,
      )}
    >
      <Icon className={cn("h-3 w-3", status === "loading" && "animate-spin")} />
      {label ?? m.label}
    </Badge>
  );
}
