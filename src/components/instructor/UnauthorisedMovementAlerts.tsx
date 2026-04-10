import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Check, Clock, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface MovementAlert {
  id: string;
  detected_at: string;
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number | null;
  road_name: string | null;
  is_read: boolean;
  gps_devices: { device_name: string | null } | null;
}

interface WorkingHoursConfig {
  working_hours_start: string;
  working_hours_end: string;
  working_days: number[];
}

interface Props {
  instructorId: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function UnauthorisedMovementAlerts({ instructorId }: Props) {
  const [alerts, setAlerts] = useState<MovementAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WorkingHoursConfig>({
    working_hours_start: "07:00", working_hours_end: "20:00", working_days: [1, 2, 3, 4, 5, 6],
  });
  const [showSettings, setShowSettings] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("movement_alerts")
      .select("*, gps_devices(device_name)")
      .eq("instructor_id", instructorId)
      .order("detected_at", { ascending: false })
      .limit(50);
    setAlerts((data as unknown as MovementAlert[]) || []);
    setLoading(false);
  }, [instructorId]);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase
      .from("instructor_tracking_config")
      .select("working_hours_start, working_hours_end, working_days")
      .eq("instructor_id", instructorId)
      .maybeSingle();
    if (data) {
      setConfig({
        working_hours_start: data.working_hours_start || "07:00",
        working_hours_end: data.working_hours_end || "20:00",
        working_days: data.working_days || [1, 2, 3, 4, 5, 6],
      });
    }
  }, [instructorId]);

  useEffect(() => { fetchAlerts(); fetchConfig(); }, [fetchAlerts, fetchConfig]);

  const saveConfig = async () => {
    const { error } = await supabase
      .from("instructor_tracking_config")
      .update({
        working_hours_start: config.working_hours_start,
        working_hours_end: config.working_hours_end,
        working_days: config.working_days,
      })
      .eq("instructor_id", instructorId);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Working hours updated");
    setShowSettings(false);
  };

  const toggleDay = (day: number) => {
    setConfig(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort(),
    }));
  };

  const markAllRead = async () => {
    await supabase.from("movement_alerts").update({ is_read: true }).eq("instructor_id", instructorId).eq("is_read", false);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          After-Hours Movement
          {unreadCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5">{unreadCount}</Badge>}
        </h2>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
              <Check className="h-3 w-3 mr-1" /> Read all
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Hours
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Working Hours Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start time</Label>
                <Input type="time" value={config.working_hours_start} onChange={e => setConfig({...config, working_hours_start: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">End time</Label>
                <Input type="time" value={config.working_hours_end} onChange={e => setConfig({...config, working_hours_end: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Working days</Label>
              <div className="flex gap-1 mt-1">
                {DAY_NAMES.map((name, i) => (
                  <Button
                    key={i}
                    variant={config.working_days.includes(i) ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-10 text-xs p-0"
                    onClick={() => toggleDay(i)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={saveConfig}>Save</Button>
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No unauthorised movement detected</p>
            <p className="text-xs text-muted-foreground mt-1">Alerts appear when vehicles move outside working hours</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Card key={alert.id} className={!alert.is_read ? "border-destructive/30 bg-destructive/5" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-none bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {alert.gps_devices?.device_name || "Vehicle"} moved at{" "}
                        {format(new Date(alert.detected_at), "HH:mm")}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {alert.road_name && <span>{alert.road_name}</span>}
                        {alert.speed_kmh && <span>• {Math.round(alert.speed_kmh * 0.621371)} mph</span>}
                        <span>• {formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
