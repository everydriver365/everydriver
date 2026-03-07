import { useState } from "react";
import { Link } from "react-router-dom";
import { BatteryLow, BatteryMedium, BatteryFull, Battery, Key, Wifi, WifiOff, ChevronDown, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";

interface VehicleHealthStripProps {
  instructorId: string;
}

export function VehicleHealthStrip({ instructorId }: VehicleHealthStripProps) {
  const { devices, vehicles, isLoading } = useVehicleHealth();
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card overflow-hidden mt-4">
      {/* Header — Quick Access tile style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-3.5 flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
          <img src={vehicleHealthIcon} alt="Vehicle Health" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-semibold text-foreground leading-tight">Vehicle Health</p>
        </div>
        <div className="flex items-center gap-2">
          {registration && (
            <span className="text-[10px] font-medium bg-muted text-muted-foreground rounded px-2 py-0.5">
              {registration}
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !isExpanded && "-rotate-90")} />
        </div>
      </button>

      {/* Collapsible metrics grid */}
      {isExpanded && (
        <Link to="/instructor/vehicle-health" className="block">
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2">
              {/* Battery */}
              <div className={cn("flex items-center gap-2 p-2.5 rounded-xl", 
                battery !== null && battery <= 20 ? "bg-red-500/10" : battery !== null && battery <= 50 ? "bg-amber-500/10" : "bg-primary/10"
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

              {/* Fuel Level or Last Seen */}
              {device.last_fuel_percent != null ? (
                <div className={cn("flex items-center gap-2 p-2.5 rounded-xl",
                  device.last_fuel_percent <= 15 ? "bg-red-500/10" : device.last_fuel_percent <= 30 ? "bg-amber-500/10" : "bg-primary/10"
                )}>
                  <Fuel className={cn("h-4 w-4",
                    device.last_fuel_percent <= 15 ? "text-destructive" : device.last_fuel_percent <= 30 ? "text-orange-500" : "text-primary"
                  )} />
                  <div>
                    <p className={cn("text-sm font-bold leading-none",
                      device.last_fuel_percent <= 15 ? "text-destructive" : device.last_fuel_percent <= 30 ? "text-orange-500" : "text-primary"
                    )}>
                      {Math.round(device.last_fuel_percent)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Fuel</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold text-muted-foreground leading-none">—</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Fuel</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
