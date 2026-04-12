import { useState } from "react";
import { enrichFaultCode, isGenericDescription } from "@/lib/obdCodeLookup";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { Link } from "react-router-dom";

const DISMISSED_KEY = "check_engine_dismissed_at";

export function CheckEngineBanner() {
  const { devices } = useVehicleHealth();
  const [dismissed, setDismissed] = useState(() => {
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (!ts) return false;
    // Auto-re-show after 4 hours
    return Date.now() - parseInt(ts) < 4 * 60 * 60 * 1000;
  });
  const [expanded, setExpanded] = useState(false);

  // Collect all fault codes across devices
  const allFaults = devices.flatMap((d) => {
    if (!d.last_fault_codes || d.last_fault_codes.length === 0) return [];
    return d.last_fault_codes.map((f) => ({
      ...f,
      deviceName: d.device_name || d.device_identifier,
      registration: d.vehicle?.registration || null,
    }));
  });

  if (dismissed || allFaults.length === 0) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setDismissed(true);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div className="mt-4 mx-0 rounded-2xl overflow-hidden border border-destructive/30 bg-destructive/5">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">
            Check Engine Warning
          </p>
          <p className="text-xs text-muted-foreground">
            {allFaults.length} active fault{allFaults.length > 1 ? "s" : ""} detected — check before your next lesson
          </p>
        </div>
        <button
          onClick={toggleExpand}
          className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 text-destructive transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Expanded fault list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {allFaults.slice(0, 8).map((fault, i) => {
            const enriched = enrichFaultCode(fault);
            return (
              <div
                key={i}
                className="flex items-start gap-2 text-xs p-2 rounded-2xl bg-background/50"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0 shrink-0 mt-0.5",
                    enriched.severity.toLowerCase().includes("red") ||
                      enriched.severity.toLowerCase().includes("critical")
                      ? "border-destructive text-destructive"
                      : enriched.severity.toLowerCase().includes("amber") ||
                        enriched.severity.toLowerCase().includes("warning")
                      ? "border-orange-500 text-orange-500"
                      : "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {enriched.code}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground leading-tight font-medium">{enriched.description}</p>
                  {fault.registration && (
                    <p className="text-muted-foreground mt-0.5">{fault.registration}</p>
                  )}
                </div>
              </div>
            );
          })}
          {allFaults.length > 8 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{allFaults.length - 8} more faults
            </p>
          )}
          <Link
            to="/instructor/vehicle-health"
            className="block text-center text-xs font-medium text-destructive hover:underline pt-1"
          >
            View Vehicle Health →
          </Link>
        </div>
      )}
    </div>
  );
}
