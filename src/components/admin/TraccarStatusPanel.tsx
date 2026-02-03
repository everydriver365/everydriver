import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, MapPin, Activity, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveSession {
  id: string;
  pupil_id: string;
  instructor_id: string;
  speed_kmh: number | null;
  trip_status: string;
  updated_at: string;
  pupil_name?: string;
  instructor_name?: string;
}

interface TraccarDevice {
  id: string;
  instructor_id: string;
  device_id: string;
  device_name: string | null;
  last_seen_at: string | null;
  instructor_name?: string;
}

export function TraccarStatusPanel() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [devices, setDevices] = useState<TraccarDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds for instant updates

    const channel = supabase
      .channel("admin-traccar-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_pupil_positions" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const [sessionsRes, devicesRes] = await Promise.all([
      // Fetch active live sessions
      supabase
        .from("live_pupil_positions")
        .select(`
          id,
          pupil_id,
          instructor_id,
          speed_kmh,
          trip_status,
          updated_at,
          pupils (name),
          instructors (name)
        `)
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      // Fetch GPS devices - get all active devices
      supabase
        .from("gps_devices")
        .select(`
          id,
          instructor_id,
          device_id:device_identifier,
          device_name,
          last_seen_at,
          is_active,
          instructors (name)
        `)
        .eq("is_active", true)
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .limit(10),
    ]);

    if (!sessionsRes.error) {
      setLiveSessions(
        (sessionsRes.data || []).map((s: any) => ({
          ...s,
          pupil_name: s.pupils?.name,
          instructor_name: s.instructors?.name,
        }))
      );
    }

    if (!devicesRes.error) {
      setDevices(
        (devicesRes.data || []).map((d: any) => ({
          ...d,
          instructor_name: d.instructors?.name,
        }))
      );
    }

    setLoading(false);
  };

  const getDeviceStatus = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return { label: "Never", color: "bg-muted text-muted-foreground" };
    
    const secondsAgo = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
    
    if (secondsAgo < 30) return { label: "Live", color: "bg-green-500/10 text-green-600" };
    if (secondsAgo < 120) return { label: "Recent", color: "bg-amber-500/10 text-amber-600" };
    return { label: "Offline", color: "bg-red-500/10 text-red-600" };
  };

  const activeSessions = liveSessions.length;
  const onlineDevices = devices.filter(d => {
    if (!d.last_seen_at) return false;
    return (Date.now() - new Date(d.last_seen_at).getTime()) / 1000 < 120;
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Radio className="h-5 w-5 text-green-500" />
            Traccar Live Tracking
          </CardTitle>
          <div className="flex gap-2">
            {activeSessions > 0 && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <Activity className="h-3 w-3 mr-1" />
                {activeSessions} Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : (
          <>
            {/* Active Sessions */}
            {liveSessions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Active Sessions
                </div>
                {liveSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 border border-green-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium">{session.pupil_name || "Unknown Pupil"}</p>
                        <p className="text-xs text-muted-foreground">
                          with {session.instructor_name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {session.speed_kmh ? Math.round(session.speed_kmh * 0.621371) : 0} mph
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {session.trip_status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Devices */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Registered Devices
                </span>
                <span className="text-xs text-muted-foreground">
                  {onlineDevices}/{devices.length} online
                </span>
              </div>
              
              {devices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No Traccar devices registered yet
                </p>
              ) : (
                <div className="space-y-1 max-h-[180px] overflow-y-auto">
                  {devices.map((device) => {
                    const status = getDeviceStatus(device.last_seen_at);
                    return (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm block truncate">
                              {device.device_name || device.instructor_name || "Unknown"}
                            </span>
                            {device.device_name && device.instructor_name && (
                              <span className="text-xs text-muted-foreground truncate block">
                                {device.instructor_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                          {device.last_seen_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Empty state */}
            {liveSessions.length === 0 && devices.length === 0 && (
              <div className="text-center py-4">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active tracking sessions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Instructors can set up Traccar in their portal
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
