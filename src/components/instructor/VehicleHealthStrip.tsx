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

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Battery */}
          <div className={cn("flex items-center gap-2 p-2.5 rounded-xl", 
            battery !== null && battery <= 20 ? "bg-red-500/10" : battery !== null && battery <= 50 ? "bg-amber-500/10" : "bg-blue-500/10"
          )}>
            <BatteryIcon className={cn("h-4 w-4", getBatteryColor(battery))} />
            <div>
              <p className={cn("text-sm font-bold leading-none", getBatteryColor(battery))}>
                {battery !== null ? `${battery}%` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Battery</p>
            </div>
          </div>

          {/* Ignition */}
          <div className={cn("flex items-center gap-2 p-2.5 rounded-xl",
            isIgnitionOn ? "bg-emerald-500/10" : "bg-muted/50"
          )}>
            <Key className={cn("h-4 w-4", isIgnitionOn ? "text-emerald-500" : "text-muted-foreground")} />
            <div>
              <p className={cn("text-sm font-bold leading-none", isIgnitionOn ? "text-emerald-500" : "text-muted-foreground")}>
                {isIgnitionOn ? "ON" : "OFF"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Ignition</p>
            </div>
          </div>

          {/* Connection */}
          <div className={cn("flex items-center gap-2 p-2.5 rounded-xl",
            isOnline ? "bg-violet-500/10" : "bg-muted/50"
          )}>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-violet-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className={cn("text-sm font-bold leading-none", isOnline ? "text-violet-500" : "text-muted-foreground")}>
                {isOnline ? "Live" : "Off"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Status</p>
            </div>
          </div>

          {/* Last Seen */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10">
            <Car className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-amber-500 leading-none">
                {device.last_seen_at
                  ? formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: false })
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Seen</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
