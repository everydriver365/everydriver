import { Link } from "react-router-dom";
import { BatteryLow, BatteryMedium, BatteryFull, Battery, Key, Wifi, WifiOff, ChevronRight, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { formatDistanceToNow } from "date-fns";

interface VehicleHealthStripProps {
  instructorId: string;
}

export function VehicleHealthStrip({ instructorId }: VehicleHealthStripProps) {
  const { devices, vehicles, isLoading } = useVehicleHealth();

  if (isLoading || devices.length === 0) return null;

  const primaryVehicle = vehicles.find(v => v.is_primary);
  const device = primaryVehicle?.linked_device_id
    ? devices.find(d => d.id === primaryVehicle.linked_device_id) || devices[0]
    : devices[0];

  if (!device) return null;

  const battery = device.last_battery_percent;
  const isIgnitionOn = device.last_ignition_status === true;
  const isOnline = device.is_connected;
  const registration = device.vehicle?.registration;

  const getBatteryColor = (level: number | null) => {
    if (level === null) return "text-muted-foreground";
    if (level <= 20) return "text-destructive";
    if (level <= 50) return "text-orange-500";
    return "text-primary";
  };

  const BatteryIcon = battery === null ? Battery
    : battery <= 20 ? BatteryLow
    : battery <= 50 ? BatteryMedium
    : BatteryFull;

  return (
    <Link to="/instructor/vehicle-health" className="block mt-4">
      <div className="bg-card rounded-2xl shadow-[0_2px_12px_rgba(20,37,66,0.10)] border border-border/40 p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Vehicle Health</span>
            {registration && (
              <span className="text-xs font-medium bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                {registration}
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Metrics row */}
        <div className="flex items-center justify-between gap-2">
          {/* Battery */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <BatteryIcon className={cn("h-5 w-5", getBatteryColor(battery))} />
            <span className={cn("text-sm font-semibold", getBatteryColor(battery))}>
              {battery !== null ? `${battery}%` : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Battery</span>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-border" />

          {/* Ignition */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <Key className={cn("h-5 w-5", isIgnitionOn ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-sm font-semibold", isIgnitionOn ? "text-primary" : "text-muted-foreground")}>
              {isIgnitionOn ? "ON" : "OFF"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Ignition</span>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-border" />

          {/* Connection */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-primary" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={cn("text-sm font-semibold", isOnline ? "text-primary" : "text-muted-foreground")}>
              {isOnline ? "Online" : "Offline"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</span>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-border" />

          {/* Last Seen */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {device.last_seen_at
                ? formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })
                : "Unknown"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Last Seen</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
