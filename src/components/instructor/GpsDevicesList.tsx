import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, WifiOff, Satellite, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  getDeviceStatus,
  isDeviceConnected,
  STATUS_LABEL,
  type GpsDeviceStatus,
} from "@/lib/gpsDeviceStatus";

interface GpsDeviceRow {
  id: string;
  device_name: string | null;
  device_identifier: string | null;
  tracking_provider: string | null;
  is_active: boolean | null;
  last_seen_at: string | null;
  last_heartbeat_at: string | null;
  vehicle_id: string | null;
}

interface Props {
  instructorId: string;
  refreshKey?: number;
  onAnyConnected?: (connected: boolean) => void;
}

const STATUS_COLOR: Record<GpsDeviceStatus, string> = {
  active: "hsl(142 71% 45%)",
  recent: "hsl(142 71% 45%)",
  stationary: "hsl(210 80% 55%)",
  offline: "hsl(var(--muted-foreground))",
};

function ProviderBadge({ provider }: { provider: string | null }) {
  const label = (provider || "unknown").toUpperCase();
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
      style={{
        background: "hsl(var(--muted))",
        color: "hsl(var(--muted-foreground))",
      }}
    >
      {label}
    </span>
  );
}

export function GpsDevicesList({ instructorId, refreshKey, onAnyConnected }: Props) {
  const [devices, setDevices] = useState<GpsDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    if (!instructorId) return;
    const { data, error } = await supabase
      .from("gps_devices")
      .select(
        "id, device_name, device_identifier, tracking_provider, is_active, last_seen_at, last_heartbeat_at, vehicle_id",
      )
      .eq("instructor_id", instructorId)
      .order("is_active", { ascending: false })
      .order("last_seen_at", { ascending: false });

    if (!error) {
      setDevices((data as GpsDeviceRow[] | null) || []);
    }
    setLoading(false);
  }, [instructorId]);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices, refreshKey]);

  useEffect(() => {
    if (!onAnyConnected) return;
    const anyConnected = devices.some(
      (d) => d.is_active && isDeviceConnected(getDeviceStatus(d.last_seen_at, d.last_heartbeat_at)),
    );
    onAnyConnected(anyConnected);
  }, [devices, onAnyConnected]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading trackers…
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              No trackers fitted yet — contact admin to add one.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {devices.map((d) => {
        const status = getDeviceStatus(d.last_seen_at, d.last_heartbeat_at);
        const connected = isDeviceConnected(status);
        const lastSeenLabel = d.last_seen_at
          ? formatDistanceToNow(new Date(d.last_seen_at), { addSuffix: true })
          : "never";
        const showWaitingNote =
          d.is_active &&
          !connected &&
          d.last_seen_at &&
          Date.now() - new Date(d.last_seen_at).getTime() < 24 * 60 * 60 * 1000;

        return (
          <Card key={d.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Satellite className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {d.device_name || d.device_identifier || "Unnamed device"}
                      </span>
                      <ProviderBadge provider={d.tracking_provider} />
                    </div>
                    {d.device_name && d.device_identifier && (
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        {d.device_identifier}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {connected ? (
                    <Wifi className="h-3.5 w-3.5" style={{ color: STATUS_COLOR[status] }} />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5" style={{ color: STATUS_COLOR[status] }} />
                  )}
                  <span
                    className="text-xs font-medium"
                    style={{ color: STATUS_COLOR[status] }}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last update: {lastSeenLabel}</span>
                {!d.is_active && <span>Disabled by admin</span>}
              </div>

              {showWaitingNote && (
                <p className="text-xs text-muted-foreground">
                  Tracker fitted — waiting for the vehicle to wake up.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
