import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, LogIn, LogOut, Check, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface GeofenceAlert {
  id: string;
  alert_type: string;
  triggered_at: string;
  latitude: number | null;
  longitude: number | null;
  is_read: boolean;
  geofences: { name: string } | null;
  gps_devices: { device_name: string | null } | null;
}

interface GeofenceAlertsListProps {
  instructorId: string;
}

export function GeofenceAlertsList({ instructorId }: GeofenceAlertsListProps) {
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("geofence_alerts")
      .select("*, geofences(name), gps_devices(device_name)")
      .eq("instructor_id", instructorId)
      .order("triggered_at", { ascending: false })
      .limit(50);
    setAlerts((data as unknown as GeofenceAlert[]) || []);
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markRead = async (id: string) => {
    await supabase.from("geofence_alerts").update({ is_read: true }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const markAllRead = async () => {
    await supabase.from("geofence_alerts").update({ is_read: true }).eq("instructor_id", instructorId).eq("is_read", false);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Geofence Alerts
          {unreadCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5">{unreadCount}</Badge>}
        </h3>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
            <Check className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No geofence alerts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Card key={alert.id} className={!alert.is_read ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-2xl ${alert.alert_type === 'enter' ? 'bg-success/10' : 'bg-warning/10'}`}>
                      {alert.alert_type === "enter" ? (
                        <LogIn className="h-4 w-4 text-success" />
                      ) : (
                        <LogOut className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {alert.gps_devices?.device_name || "Vehicle"} {alert.alert_type === "enter" ? "entered" : "left"}{" "}
                        <span className="text-primary">{alert.geofences?.name || "zone"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(alert.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
