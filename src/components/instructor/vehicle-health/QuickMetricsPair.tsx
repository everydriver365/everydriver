import { differenceInDays } from "date-fns";
import { Shield, Wrench, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickMetricsPairProps {
  motExpiry?: string | null;
  nextServiceKm?: number | null;
  currentOdometerKm?: number | null;
  onMotClick?: () => void;
  onServiceClick?: () => void;
}

export function QuickMetricsPair({ 
  motExpiry, 
  nextServiceKm, 
  currentOdometerKm,
  onMotClick,
  onServiceClick
}: QuickMetricsPairProps) {
  const motDays = motExpiry ? differenceInDays(new Date(motExpiry), new Date()) : null;
  const serviceKmLeft = nextServiceKm && currentOdometerKm 
    ? Math.max(0, Math.round(nextServiceKm - currentOdometerKm)) 
    : null;

  const getMotColor = (days: number | null) => {
    if (days === null) return "text-muted-foreground";
    if (days <= 14) return "text-destructive";
    if (days <= 30) return "text-orange-500";
    return "text-emerald-600";
  };

  const getMotBg = (days: number | null) => {
    if (days === null) return "bg-muted/50";
    if (days <= 14) return "bg-destructive/10";
    if (days <= 30) return "bg-orange-500/10";
    return "bg-emerald-500/10";
  };

  const getServiceColor = (km: number | null) => {
    if (km === null) return "text-muted-foreground";
    if (km <= 500) return "text-destructive";
    if (km <= 2000) return "text-orange-500";
    return "text-emerald-600";
  };

  const getServiceBg = (km: number | null) => {
    if (km === null) return "bg-muted/50";
    if (km <= 500) return "bg-destructive/10";
    if (km <= 2000) return "bg-orange-500/10";
    return "bg-emerald-500/10";
  };

  // MOT progress ring (0-100 based on 365 days)
  const motProgress = motDays !== null ? Math.min(100, Math.max(0, (motDays / 365) * 100)) : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (motProgress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-2 gap-3"
    >
      {/* MOT Card */}
      <button
        onClick={onMotClick}
        className={cn(
          "rounded-2xl border border-border/40 p-4 text-left transition-all active:scale-[0.97]",
          getMotBg(motDays)
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Shield className={cn("h-4 w-4", getMotColor(motDays))} />
            <span className="text-xs font-semibold text-foreground">Next MOT</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className={cn("text-2xl font-bold leading-none tracking-tight", getMotColor(motDays))}>
              {motDays !== null ? motDays : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">days left</p>
          </div>
          {/* Mini progress ring */}
          <svg width="52" height="52" className="shrink-0 -rotate-90">
            <circle cx="26" cy="26" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="3" opacity="0.3" />
            <circle
              cx="26" cy="26" r={radius} fill="none"
              stroke={motDays !== null && motDays <= 14 ? "hsl(var(--destructive))" : motDays !== null && motDays <= 30 ? "#f97316" : "#10b981"}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
        </div>
      </button>

      {/* Service Card */}
      <button
        onClick={onServiceClick}
        className={cn(
          "rounded-2xl border border-border/40 p-4 text-left transition-all active:scale-[0.97]",
          getServiceBg(serviceKmLeft)
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Wrench className={cn("h-4 w-4", getServiceColor(serviceKmLeft))} />
            <span className="text-xs font-semibold text-foreground">Next Service</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className={cn("text-2xl font-bold leading-none tracking-tight", getServiceColor(serviceKmLeft))}>
            {serviceKmLeft !== null ? serviceKmLeft.toLocaleString() : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">km remaining</p>
        </div>
        {/* Progress bar */}
        {serviceKmLeft !== null && (
          <div className="mt-3 h-1.5 rounded-full bg-border/30 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                serviceKmLeft <= 500 ? "bg-destructive" : serviceKmLeft <= 2000 ? "bg-orange-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, Math.max(5, (serviceKmLeft / 20000) * 100))}%` }}
            />
          </div>
        )}
      </button>
    </motion.div>
  );
}
