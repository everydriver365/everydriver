import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Circle, Radio, MapPin } from "lucide-react";

export type RouteStatus = "not_started" | "recording" | "captured";

interface Props {
  lessonId: string;
  className?: string;
  /** Optional preloaded status to avoid a query */
  status?: RouteStatus;
}

/**
 * Shows route-tracking status for a driving test lesson.
 * - not_started: no lesson_routes row
 * - recording:   row exists with no ended_at
 * - captured:    row exists with ended_at and coordinates
 */
export function RouteStatusBadge({ lessonId, className, status: preset }: Props) {
  const [status, setStatus] = useState<RouteStatus | null>(preset ?? null);

  useEffect(() => {
    if (preset || !lessonId) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("lesson_routes")
        .select("id, ended_at, coordinates")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (!data) {
        setStatus("not_started");
      } else if (!data.ended_at) {
        setStatus("recording");
      } else {
        setStatus("captured");
      }
    };

    load();

    const channel = supabase
      .channel(`route-status-${lessonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesson_routes", filter: `lesson_id=eq.${lessonId}` },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [lessonId, preset]);

  if (!status) return null;

  const config = {
    not_started: {
      label: "Not started",
      icon: Circle,
      className: "bg-muted text-muted-foreground border-border",
    },
    recording: {
      label: "Recording",
      icon: Radio,
      className: "bg-red-500/15 text-red-600 border-red-500/30 animate-pulse",
    },
    captured: {
      label: "Route captured",
      icon: MapPin,
      className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    },
  }[status];

  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${config.className} ${className ?? ""}`}>
      <Icon className="h-3 w-3" />
      <span className="text-[11px] font-medium">{config.label}</span>
    </Badge>
  );
}
