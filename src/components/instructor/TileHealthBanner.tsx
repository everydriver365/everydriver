import { useState } from "react";
import { AlertTriangle, ChevronDown, RotateCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTileHealth } from "@/hooks/useTileHealth";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  instructorId: string | undefined;
}

const SOURCE_LABELS: Record<string, string> = {
  scheduled_lessons: "Today's lessons",
  pupils: "Pupils & balances",
  payment_history: "This week's earnings",
  messages: "Messages",
  course_enquiries: "Job offers",
  calendar_sync_queue: "Calendar sync",
  payment_gateways: "Payments",
  telematics_poller: "GPS tracking",
};

export function TileHealthBanner({ instructorId }: Props) {
  const { alerts, hasOutage, lastChecked } = useTileHealth(instructorId);
  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (!hasOutage) return null;

  const retry = async () => {
    if (!instructorId) return;
    setRetrying(true);
    try {
      await supabase.functions.invoke("tile-health-check", {
        body: { mode: "hot", instructorId },
      });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className="mx-[14px] mb-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <AlertTriangle size={14} className="shrink-0" />
        <span className="flex-1 text-[12px] font-medium leading-tight">
          Some live data is delayed
          {lastChecked && (
            <span className="font-normal opacity-70">
              {" "}— last checked {formatDistanceToNow(new Date(lastChecked), { addSuffix: true })}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-amber-200/60">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-[12px]">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: a.severity === "fail" ? "#A32D2D" : "#C68B16" }}
              />
              <span className="flex-1">{SOURCE_LABELS[a.source] ?? a.source}</span>
              <span className="opacity-60 capitalize">{a.severity}</span>
            </div>
          ))}
          <button
            onClick={retry}
            disabled={retrying}
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-900 hover:text-amber-950 disabled:opacity-50"
          >
            <RotateCw size={12} className={retrying ? "animate-spin" : ""} />
            {retrying ? "Re-checking…" : "Retry now"}
          </button>
        </div>
      )}
    </div>
  );
}
