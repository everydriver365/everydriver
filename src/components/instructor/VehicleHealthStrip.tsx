import { useState } from "react";
import { Link } from "react-router-dom";
import { BatteryLow, BatteryMedium, BatteryFull, Battery, Key, Wifi, WifiOff, ChevronDown, Fuel, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";
import { motion, AnimatePresence } from "framer-motion";

interface VehicleHealthStripProps {
  instructorId: string;
}

export function VehicleHealthStrip({ instructorId }: VehicleHealthStripProps) {
  const { devices, vehicles, isLoading } = useVehicleHealth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isLoading || devices.length === 0) return null;

  const primaryVehicle = vehicles.find(v => v.is_primary);
  const device = primaryVehicle?.linked_device_id
    ? devices.find(d => d.id === primaryVehicle.linked_device_id) || devices[0]
    : devices[0];

  if (!device) return null;

  const battery = device.last_battery_percent;
  const isIgnitionOn = device.last_ignition_status === true;
  const isOnline = device.is_connected;
  const registration = device.vehicle?.registration;

  // Determine if there are warnings
  const hasWarning = (battery !== null && battery <= 20) || 
    (device.last_fuel_percent != null && device.last_fuel_percent <= 15) ||
    !isOnline;

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          "rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border bg-card overflow-hidden mt-4 relative",
          hasWarning ? "border-destructive/30" : "border-border/40"
        )}
      >
        {/* Dismiss button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(true); }}
          className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3.5 py-3.5 flex items-center gap-3 pr-12"
        >
          <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0">
            <img src={vehicleHealthIcon} alt="Vehicle Health" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold text-foreground leading-tight">Vehicle Health</p>
            {hasWarning && (
              <p className="text-[10px] text-destructive font-medium mt-0.5">Attention needed</p>
            )}
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
                <div className={cn("flex items-center gap-2 p-2.5 rounded-2xl", 
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
                <div className={cn("flex items-center gap-2 p-2.5 rounded-2xl",
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
                <div className={cn("flex items-center gap-2 p-2.5 rounded-2xl",
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

                {/* Fuel Level */}
                {device.last_fuel_percent != null ? (
                  <div className={cn("flex items-center gap-2 p-2.5 rounded-2xl",
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
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-muted/50">
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
      </motion.div>
    </AnimatePresence>
  );
}
