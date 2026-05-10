import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Wifi, WifiOff, Satellite, Loader2, ChevronRight, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
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

interface VehicleInfo {
  id: string;
  registration: string | null;
  make: string | null;
  model: string | null;
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

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-b-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-sm text-right ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

export function GpsDevicesList({ instructorId, refreshKey, onAnyConnected }: Props) {
  const [devices, setDevices] = useState<GpsDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Record<string, VehicleInfo>>({});
  const [selected, setSelected] = useState<GpsDeviceRow | null>(null);

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
      const rows = (data as GpsDeviceRow[] | null) || [];
      setDevices(rows);

      const vehicleIds = Array.from(
        new Set(rows.map((r) => r.vehicle_id).filter((v): v is string => !!v)),
      );
      if (vehicleIds.length > 0) {
        const { data: vehData } = await supabase
          .from("instructor_vehicles")
          .select("id, registration, make, model")
          .in("id", vehicleIds);
        const map: Record<string, VehicleInfo> = {};
        (vehData as VehicleInfo[] | null)?.forEach((v) => (map[v.id] = v));
        setVehicles(map);
      } else {
        setVehicles({});
      }
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

  const vehicleLabel = (vehicleId: string | null): string | null => {
    if (!vehicleId) return null;
    const v = vehicles[vehicleId];
    if (!v) return null;
    const parts = [v.make, v.model].filter(Boolean).join(" ");
    return [parts, v.registration].filter(Boolean).join(" · ") || null;
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return null;
    const d = new Date(ts);
    return `${format(d, "d MMM yyyy, HH:mm")} (${formatDistanceToNow(d, { addSuffix: true })})`;
  };

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

  const selectedStatus = selected
    ? getDeviceStatus(selected.last_seen_at, selected.last_heartbeat_at)
    : null;

  return (
    <>
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
              <button
                type="button"
                onClick={() => setSelected(d)}
                className="w-full text-left hover:bg-muted/40 transition rounded-xl"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Satellite className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
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
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
              </button>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selected && selectedStatus && (
            <>
              <SheetHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <Satellite className="h-5 w-5 text-muted-foreground" />
                  <SheetTitle className="text-left">
                    {selected.device_name || selected.device_identifier || "Tracker"}
                  </SheetTitle>
                </div>
                <SheetDescription className="flex items-center gap-2">
                  <ProviderBadge provider={selected.tracking_provider} />
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium"
                    style={{ color: STATUS_COLOR[selectedStatus] }}
                  >
                    {isDeviceConnected(selectedStatus) ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {STATUS_LABEL[selectedStatus]}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-1">
                <DetailRow label="Device name" value={selected.device_name} />
                <DetailRow
                  label="Device identifier"
                  value={selected.device_identifier}
                  mono
                />
                <DetailRow
                  label="Provider"
                  value={selected.tracking_provider?.toUpperCase() || null}
                />
                <DetailRow
                  label="Active"
                  value={selected.is_active ? "Yes" : "No (disabled by admin)"}
                />
                <DetailRow
                  label="Last position"
                  value={formatTimestamp(selected.last_seen_at)}
                />
                <DetailRow
                  label="Last heartbeat"
                  value={formatTimestamp(selected.last_heartbeat_at)}
                />
                <DetailRow
                  label="Assigned vehicle"
                  value={
                    vehicleLabel(selected.vehicle_id) ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5" />
                        {vehicleLabel(selected.vehicle_id)}
                      </span>
                    ) : null
                  }
                />
              </div>

              {selectedStatus === "stationary" && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Vehicle is parked but the tracker is still online.
                </p>
              )}
              {selectedStatus === "offline" && selected.is_active && (
                <p className="mt-4 text-xs text-muted-foreground">
                  No recent signal — the vehicle may be parked out of range or the
                  ignition is off. Tap "Test Connection" to refresh.
                </p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
