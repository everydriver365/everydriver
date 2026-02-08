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

  // Pick the device linked to the primary vehicle, or fall back to first device
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
    <Link
      to="/instructor/vehicle-health"
      className="block mt-4"
    >
      <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(20,37,66,0.12)] px-3.5 py-2.5 flex items-center justify-between gap-2">
        {/* Left: metrics */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Battery */}
          <div className="flex items-center gap-1">
            <BatteryIcon className={cn("h-4 w-4", getBatteryColor(battery))} />
            <span className={cn("text-xs font-medium", getBatteryColor(battery))}>
              {battery !== null ? `${battery}%` : "—"}
            </span>
          </div>

          {/* Ignition */}
          <div className="flex items-center gap-1">
            <Key className={cn("h-3.5 w-3.5", isIgnitionOn ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs", isIgnitionOn ? "text-primary font-medium" : "text-muted-foreground")}>
              {isIgnitionOn ? "ON" : "OFF"}
            </span>
          </div>

          {/* Connectivity */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-primary" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>

          {/* Registration / last seen */}
          <div className="flex items-center gap-1 min-w-0 text-xs text-muted-foreground truncate">
            {registration && (
              <>
                <Car className="h-3 w-3 shrink-0" />
                <span className="font-medium truncate">{registration}</span>
                <span className="mx-0.5">·</span>
              </>
            )}
            {device.last_seen_at && (
              <span className="truncate">
                {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Right: chevron */}
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
