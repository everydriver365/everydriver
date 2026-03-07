import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, MapPin, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SOSAlert {
  id: string;
  instructor_id: string;
  alert_level: string;
  latitude: number | null;
  longitude: number | null;
  what3words: string | null;
  message: string | null;
  resolved_at: string | null;
  created_at: string;
  instructor_name?: string;
}

export const SOSAlertsPanel = () => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    const { data } = await (supabase.from as any)("sos_alerts")
      .select("*")
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    if (data) {
      const instructorIds = [...new Set((data as any[]).map((a: any) => a.instructor_id))];
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);

      const nameMap = new Map((instructors || []).map((i: any) => [i.id, i.name]));
      setAlerts(
        data.map((a: any) => ({ ...a, instructor_name: nameMap.get(a.instructor_id) || "Unknown" }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel("sos-alerts-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const resolveAlert = async (id: string) => {
    const { error } = await (supabase.from as any)("sos_alerts")
      .update({ resolved_at: new Date().toISOString(), resolved_by: "admin" })
      .eq("id", id);

    if (error) {
      toast.error("Failed to resolve alert");
    } else {
      toast.success("Alert resolved");
      fetchAlerts();
    }
  };

  const levelColors: Record<string, string> = {
    call_me: "bg-amber-100 text-amber-800 border-amber-300",
    help: "bg-orange-100 text-orange-800 border-orange-400",
    sos: "bg-red-100 text-red-800 border-destructive",
  };

  const levelLabels: Record<string, string> = {
    call_me: "Call Me",
    help: "Help — ASAP",
    sos: "🚨 SOS",
  };

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-destructive bg-red-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
        <h3 className="font-bold text-destructive">Active SOS Alerts ({alerts.length})</h3>
      </div>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border-2 p-3 space-y-2 ${levelColors[alert.alert_level] || "bg-muted"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm">{alert.instructor_name}</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60">
                {levelLabels[alert.alert_level] || alert.alert_level}
              </span>
            </div>
            <span className="text-xs opacity-70">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </span>
          </div>

          {alert.message && <p className="text-sm">{alert.message}</p>}

          <div className="flex items-center gap-3 text-xs">
            {alert.latitude && alert.longitude && (
              <a
                href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 underline"
              >
                <MapPin className="h-3 w-3" />
                Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {alert.what3words && (
              <a
                href={`https://what3words.com/${alert.what3words}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 underline"
              >
                ///{alert.what3words}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => resolveAlert(alert.id)}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Resolve
          </Button>
        </div>
      ))}
    </div>
  );
};
