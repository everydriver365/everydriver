import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Car,
  Fuel,
  ShieldAlert,
  ShieldCheck,
  Video,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { kmhToMph, kmToMiles } from "@/lib/utils";
import { enrichFaultCode } from "@/lib/obdCodeLookup";
import { useGeotabHealth } from "@/hooks/useGeotabHealth";

interface Props {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';

/* ─────────── small UI helpers ─────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-2xl border p-4"
      style={{ borderColor: "#e0e3ea", fontFamily: FONT }}
    >
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground font-medium">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
    </div>
  );
}

function severityColor(s: string | null | undefined) {
  switch ((s ?? "").toLowerCase()) {
    case "high":
    case "critical":
      return "destructive" as const;
    case "medium":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

/* ─────────── Overview ─────────── */

function OverviewSection({ instructorId }: Props) {
  const { data: health } = useGeotabHealth(instructorId);

  const { data: lastSync } = useQuery({
    queryKey: ["geotab-last-sync", instructorId],
    enabled: !!instructorId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("geotab_sync_cursors")
        .select("cursor_name, last_run_at, last_error")
        .eq("instructor_id", instructorId)
        .order("last_run_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: latestImpact } = useQuery({
    queryKey: ["geotab-latest-impact", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data } = await supabase
        .from("geotab_impact_events")
        .select("event_time, g_force, severity")
        .eq("instructor_id", instructorId)
        .order("event_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: latestFuel } = useQuery({
    queryKey: ["geotab-latest-fuel", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data } = await supabase
        .from("geotab_fuel_usage")
        .select("trip_end, cost_gbp, litres_per_100km, distance_km")
        .eq("instructor_id", instructorId)
        .order("trip_end", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const score = health?.score ?? 100;
  const accent =
    score >= 85 ? { bg: "#E8F3E8", fg: "#3B8B3B" } :
    score >= 60 ? { bg: "#FBF1DE", fg: "#B8801F" } :
                  { bg: "#FBEAEC", fg: "#C8434F" };

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Health score
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-gray-900">{score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {health?.activeFaults ?? 0} active fault{(health?.activeFaults ?? 0) === 1 ? "" : "s"} · {health?.harshEvents24h ?? 0} harsh event{(health?.harshEvents24h ?? 0) === 1 ? "" : "s"} 24h
            </p>
          </div>
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{ background: accent.bg }}
          >
            {score >= 85 ? (
              <ShieldCheck className="h-7 w-7" style={{ color: accent.fg }} />
            ) : (
              <ShieldAlert className="h-7 w-7" style={{ color: accent.fg }} />
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Latest impact
          </p>
          {latestImpact ? (
            <>
              <p className="text-sm font-semibold mt-1 text-gray-900">
                {latestImpact.g_force ? `${latestImpact.g_force.toFixed(2)}g` : latestImpact.severity}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(latestImpact.event_time), { addSuffix: true })}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">None recorded</p>
          )}
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Latest fuel trip
          </p>
          {latestFuel ? (
            <>
              <p className="text-sm font-semibold mt-1 text-gray-900">
                {latestFuel.cost_gbp ? `£${latestFuel.cost_gbp.toFixed(2)}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestFuel.distance_km ? `${kmToMiles(latestFuel.distance_km).toFixed(1)} mi` : "—"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">No trips yet</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Last sync
            </p>
            <p className="text-sm font-medium mt-1 text-gray-900">
              {lastSync?.last_run_at
                ? formatDistanceToNow(new Date(lastSync.last_run_at), { addSuffix: true })
                : "Never"}
            </p>
            {lastSync?.last_error && (
              <p className="text-xs text-red-600 mt-1 line-clamp-2">{lastSync.last_error}</p>
            )}
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}

/* ─────────── Driver Behaviour ─────────── */

function DriverBehaviourSection({ instructorId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["geotab-driver-events", instructorId],
    enabled: !!instructorId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("geotab_driver_events")
        .select("id, event_type, rule_name, severity, speed_kmh, started_at, duration_seconds, latitude, longitude")
        .eq("instructor_id", instructorId)
        .order("started_at", { ascending: false, nullsFirst: false })
        .limit(50);
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No driver events"
        subtitle="Harsh braking, acceleration and speeding will appear here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {data.map((e: any) => (
        <Card key={e.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {e.rule_name || e.event_type}
                </p>
                <Badge variant={severityColor(e.severity)} className="text-[10px] h-4">
                  {e.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {e.started_at ? format(new Date(e.started_at), "d MMM, HH:mm") : "—"}
                {e.duration_seconds ? ` · ${e.duration_seconds}s` : ""}
                {typeof e.speed_kmh === "number" ? ` · ${Math.round(kmhToMph(e.speed_kmh))} mph` : ""}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─────────── Vehicle Health (faults) ─────────── */

function FaultCodesSection({ instructorId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["geotab-fault-codes", instructorId],
    enabled: !!instructorId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("geotab_fault_codes")
        .select("id, fault_code, description, severity, detected_at, resolved_at, is_active")
        .eq("instructor_id", instructorId)
        .order("detected_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No fault codes"
        subtitle="OBD-II diagnostic codes will appear here when detected."
      />
    );
  }

  return (
    <div className="space-y-2">
      {data.map((f: any) => {
        const enriched = enrichFaultCode({
          code: f.fault_code,
          source: "geotab",
          severity: f.severity,
          description: f.description,
        });
        return (
          <Card key={f.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-semibold text-gray-900">{f.fault_code}</p>
                  <Badge variant={severityColor(enriched.severity)} className="text-[10px] h-4">
                    {enriched.severity}
                  </Badge>
                  {!f.is_active && (
                    <Badge variant="outline" className="text-[10px] h-4">resolved</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-700 mt-1">{enriched.description}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Detected {format(new Date(f.detected_at), "d MMM, HH:mm")}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ─────────── Impacts ─────────── */

function ImpactsSection({ instructorId }: Props) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["geotab-impacts", instructorId],
    enabled: !!instructorId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("geotab_impact_events")
        .select("id, event_time, g_force, speed_kmh, severity, acknowledged, latitude, longitude")
        .eq("instructor_id", instructorId)
        .order("event_time", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const ackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("geotab_impact_events")
        .update({ acknowledged: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geotab-impacts", instructorId] });
      qc.invalidateQueries({ queryKey: ["geotab-health", instructorId] });
      toast({ title: "Impact acknowledged" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (!data || data.length === 0) {
    return <EmptyState icon={ShieldCheck} title="No impacts" subtitle="Collisions and sudden g-force events will appear here." />;
  }

  return (
    <div className="space-y-2">
      {data.map((i: any) => (
        <Card key={i.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {i.g_force ? `${i.g_force.toFixed(2)}g impact` : "Impact"}
                </p>
                <Badge variant={severityColor(i.severity)} className="text-[10px] h-4">
                  {i.severity}
                </Badge>
                {!i.acknowledged && <span className="inline-block w-2 h-2 rounded-full bg-red-500" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(i.event_time), "d MMM, HH:mm")}
                {typeof i.speed_kmh === "number" ? ` · ${Math.round(kmhToMph(i.speed_kmh))} mph` : ""}
              </p>
            </div>
            {!i.acknowledged && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => ackMutation.mutate(i.id)}
                disabled={ackMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Ack
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─────────── Fuel / EV ─────────── */

function FuelSection({ instructorId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["geotab-fuel", instructorId],
    enabled: !!instructorId,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("geotab_fuel_usage")
        .select("id, trip_start, trip_end, fuel_used_litres, distance_km, litres_per_100km, cost_gbp")
        .eq("instructor_id", instructorId)
        .order("trip_end", { ascending: false, nullsFirst: false })
        .limit(50);
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    if (!data) return { cost: 0, miles: 0, litres: 0 };
    return data.reduce(
      (acc, t: any) => ({
        cost: acc.cost + (t.cost_gbp ?? 0),
        miles: acc.miles + (t.distance_km ? kmToMiles(t.distance_km) : 0),
        litres: acc.litres + (t.fuel_used_litres ?? 0),
      }),
      { cost: 0, miles: 0, litres: 0 },
    );
  }, [data]);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (!data || data.length === 0) {
    return <EmptyState icon={Fuel} title="No fuel data" subtitle="Fuel transactions and consumption will appear here." />;
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Cost</p>
            <p className="text-lg font-bold text-gray-900 mt-1">£{totals.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Distance</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{totals.miles.toFixed(0)} mi</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Fuel</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{totals.litres.toFixed(1)} L</p>
          </div>
        </div>
      </Card>

      {data.map((t: any) => (
        <Card key={t.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {t.trip_end ? format(new Date(t.trip_end), "d MMM, HH:mm") : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.distance_km ? `${kmToMiles(t.distance_km).toFixed(1)} mi` : "—"}
                {t.litres_per_100km ? ` · ${t.litres_per_100km.toFixed(1)} L/100km` : ""}
              </p>
            </div>
            <p className="text-base font-bold text-gray-900">
              {t.cost_gbp ? `£${t.cost_gbp.toFixed(2)}` : "—"}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─────────── Video (ProPlus dashcam) ─────────── */

function VideoSection({ instructorId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["geotab-dashcam-media", instructorId],
    enabled: !!instructorId,
    refetchInterval: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("dashcam_media")
        .select("id, file_name, thumbnail_url, recorded_at, duration_seconds, is_incident, event_tags, g_force, speed_at_event_kmh")
        .eq("instructor_id", instructorId)
        .order("recorded_at", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No dashcam clips"
        subtitle="ProPlus video clips from Geotab will sync here automatically."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {data.map((m: any) => (
        <div key={m.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#e0e3ea" }}>
          <div className="relative w-full bg-gray-900" style={{ aspectRatio: "16/9" }}>
            {m.thumbnail_url ? (
              <img src={m.thumbnail_url} alt={m.file_name ?? "Dashcam clip"} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="h-6 w-6 text-gray-500" />
              </div>
            )}
            {m.is_incident && (
              <Badge variant="destructive" className="absolute top-1.5 left-1.5 text-[10px] h-4">
                Incident
              </Badge>
            )}
            {m.duration_seconds && (
              <span className="absolute bottom-1.5 right-1.5 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                {Math.round(m.duration_seconds)}s
              </span>
            )}
          </div>
          <div className="p-2.5">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {format(new Date(m.recorded_at), "d MMM, HH:mm")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {typeof m.speed_at_event_kmh === "number" ? `${Math.round(kmhToMph(Number(m.speed_at_event_kmh)))} mph` : ""}
              {m.g_force ? ` · ${Number(m.g_force).toFixed(2)}g` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Main tab container ─────────── */

export function GeotabTab({ instructorId }: Props) {
  const qc = useQueryClient();
  const [sub, setSub] = useState("overview");

  const triggerPoll = async () => {
    try {
      await supabase.functions.invoke("geotab-poller", { body: {} });
      toast({ title: "Sync triggered", description: "Fetching latest Geotab data." });
      setTimeout(() => {
        qc.invalidateQueries({ predicate: (q) => String(q.queryKey?.[0] ?? "").startsWith("geotab-") });
      }, 3000);
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-gray-900">Geotab</span>
        </div>
        <Button size="sm" variant="ghost" onClick={triggerPoll} className="h-8 gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="text-xs">Sync</span>
        </Button>
      </div>

      <Tabs value={sub} onValueChange={setSub} className="w-full">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6 gap-1">
            <TabsTrigger value="overview" className="text-xs whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="driver" className="text-xs whitespace-nowrap">Driver</TabsTrigger>
            <TabsTrigger value="faults" className="text-xs whitespace-nowrap">Faults</TabsTrigger>
            <TabsTrigger value="impacts" className="text-xs whitespace-nowrap">Impacts</TabsTrigger>
            <TabsTrigger value="fuel" className="text-xs whitespace-nowrap">Fuel</TabsTrigger>
            <TabsTrigger value="video" className="text-xs whitespace-nowrap">Video</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-3">
          <OverviewSection instructorId={instructorId} />
        </TabsContent>
        <TabsContent value="driver" className="mt-3">
          <DriverBehaviourSection instructorId={instructorId} />
        </TabsContent>
        <TabsContent value="faults" className="mt-3">
          <FaultCodesSection instructorId={instructorId} />
        </TabsContent>
        <TabsContent value="impacts" className="mt-3">
          <ImpactsSection instructorId={instructorId} />
        </TabsContent>
        <TabsContent value="fuel" className="mt-3">
          <FuelSection instructorId={instructorId} />
        </TabsContent>
        <TabsContent value="video" className="mt-3">
          <VideoSection instructorId={instructorId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GeotabTab;
