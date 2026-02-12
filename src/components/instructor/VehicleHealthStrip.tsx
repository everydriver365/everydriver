import { Link } from "react-router-dom";
import { BatteryLow, BatteryMedium, BatteryFull, Battery, Key, Wifi, WifiOff, ChevronRight, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { formatDistanceToNow } from "date-fns";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";

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
      <div className="bg-card shadow-xl overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={vehicleHealthIcon} alt="Vehicle Health" className="h-10 w-10 object-cover" />
              <div>
                <span className="font-semibold text-sm">Vehicle Health</span>
                <p className="text-white/70 text-[10px]">All systems normal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {registration && (
                <span className="text-xs font-medium bg-white/90 text-primary rounded px-2 py-0.5 shadow-sm">
                  {registration}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-white/60" />
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {/* Battery */}
            <div className={cn("flex items-center gap-2 p-2.5 rounded-xl", 
              battery !== null && battery <= 20 ? "bg-red-500/10" : battery !== null && battery <= 50 ? "bg-amber-500/10" : "bg-[#0075c9]/10"
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
              isOnline ? "bg-emerald-500/10" : "bg-muted/50"
            )}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className={cn("text-sm font-bold leading-none", isOnline ? "text-emerald-500" : "text-muted-foreground")}>
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
      </div>
    </Link>
  );
}
