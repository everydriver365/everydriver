import { Battery, BatteryLow, BatteryMedium, BatteryFull, Key, Wifi, WifiOff, Car, Link } from "lucide-react";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GPSDeviceHealth } from "@/hooks/useVehicleHealth";
import { formatDistanceToNow } from "date-fns";

interface DeviceStatusCardProps {
  device: GPSDeviceHealth;
  onLinkClick: () => void;
}

export function DeviceStatusCard({ device, onLinkClick }: DeviceStatusCardProps) {
  const batteryLevel = device.last_battery_percent;
  const isIgnitionOn = device.last_ignition_status === true;
  const isOnline = device.is_connected;

  const getBatteryColor = (level: number | null) => {
    if (level === null) return "text-muted-foreground";
    if (level <= 20) return "text-destructive";
    if (level <= 50) return "text-orange-500";
    return "text-primary";
  };

  const getBatteryIcon = (level: number | null) => {
    if (level === null) return Battery;
    if (level <= 20) return BatteryLow;
    if (level <= 50) return BatteryMedium;
    return BatteryFull;
  };

  const BatteryIcon = getBatteryIcon(batteryLevel);

  return (
    <InstructorCard className="overflow-hidden">
      <div className="space-y-2 sm:space-y-3">
        {/* Device header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">
                {device.device_name || device.device_identifier}
              </h3>
              <Badge
                variant={isOnline ? "default" : "secondary"}
                className="text-[10px] sm:text-xs shrink-0"
              >
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            {device.vehicle ? (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                <Car className="h-3 w-3 inline mr-1" />
                {device.vehicle.registration} • {device.vehicle.make} {device.vehicle.model}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Not linked to a vehicle
              </p>
            )}
          </div>
          {isOnline ? (
            <Wifi className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>

        {/* Battery indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <BatteryIcon className={cn("h-4 w-4", getBatteryColor(batteryLevel))} />
              <span>Battery</span>
            </div>
            <span className={cn("font-medium", getBatteryColor(batteryLevel))}>
              {batteryLevel !== null ? `${batteryLevel}%` : "Unknown"}
            </span>
          </div>
          {batteryLevel !== null && (
            <Progress 
              value={batteryLevel} 
              className={cn(
                "h-1.5",
                batteryLevel <= 20 ? "[&>div]:bg-destructive" :
                batteryLevel <= 50 ? "[&>div]:bg-orange-500" :
                "[&>div]:bg-primary"
              )}
            />
          )}
        </div>

        {/* Ignition and status row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Key className={cn(
                "h-3.5 w-3.5",
                isIgnitionOn ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                isIgnitionOn ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {isIgnitionOn ? "Ignition ON" : "Ignition OFF"}
              </span>
            </div>
          </div>

          {!device.vehicle && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onLinkClick}
            >
              <Link className="h-3 w-3 mr-1" />
              Link Vehicle
            </Button>
          )}
        </div>

        {/* Last seen */}
        {device.last_seen_at && (
          <p className="text-xs text-muted-foreground">
            Last seen: {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
          </p>
        )}
      </div>
    </InstructorCard>
  );
}
