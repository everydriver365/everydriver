import { Battery, BatteryLow, BatteryMedium, BatteryFull, Key, Wifi, WifiOff, Car, Link, Gauge, MapPin, Navigation, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TraccarDeviceHealth } from "@/hooks/useVehicleHealth";
import { formatDistanceToNow } from "date-fns";
import { formatMph, kmToMiles } from "@/lib/utils";

interface EnhancedDeviceStatusCardProps {
  device: TraccarDeviceHealth;
  onLinkClick: () => void;
}

export function EnhancedDeviceStatusCard({ device, onLinkClick }: EnhancedDeviceStatusCardProps) {
  const batteryLevel = device.last_battery_percent;
  const isIgnitionOn = device.last_ignition_status === true;
  const isOnline = device.is_connected;
  const speedKmh = device.last_speed_kmh;
  const speedLimitKmh = device.last_speed_limit_kmh;
  const roadName = device.last_road_name;
  
  // Calculate odometer in miles
  const odometerMiles = device.gpsgate_odometer_m 
    ? Math.round((device.gpsgate_odometer_m / 1000) * 0.621371) 
    : null;
  
  // Calculate today's distance if we have daily tracking
  const today = new Date().toISOString().split("T")[0];
  const todayDistanceMiles = (
    device.daily_start_date === today && 
    device.gpsgate_odometer_m != null && 
    device.daily_start_odometer_m != null
  ) ? Math.round(((device.gpsgate_odometer_m - device.daily_start_odometer_m) / 1000) * 0.621371) 
    : null;
  
  // Format engine hours
  const engineHoursFormatted = device.gpsgate_engine_hours_s 
    ? `${Math.floor(device.gpsgate_engine_hours_s / 3600)}h ${Math.floor((device.gpsgate_engine_hours_s % 3600) / 60)}m`
    : null;

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

  const isSpeeding = speedKmh !== null && speedLimitKmh !== null && speedKmh > speedLimitKmh;

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isOnline && "ring-1 ring-primary/20"
    )}>
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Device header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">
                {device.device_name || device.device_identifier}
              </h3>
              <Badge
                variant={isOnline ? "default" : "secondary"}
                className={cn(
                  "text-[10px] sm:text-xs shrink-0",
                  isOnline && "animate-pulse"
                )}
              >
                {isOnline ? "Live" : "Offline"}
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

        {/* Live speed panel - only show if device is online */}
        {isOnline && speedKmh !== null && (
          <div className={cn(
            "p-3 rounded-lg border",
            isSpeeding ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className={cn("h-5 w-5", isSpeeding ? "text-destructive" : "text-primary")} />
                <div>
                  <span className={cn(
                    "text-2xl font-bold tabular-nums",
                    isSpeeding ? "text-destructive" : "text-foreground"
                  )}>
                    {formatMph(speedKmh).replace(' mph', '')}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">mph</span>
                </div>
              </div>
              {speedLimitKmh !== null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Limit:</span>
                  <Badge 
                    variant={isSpeeding ? "destructive" : "outline"} 
                    className="text-xs font-mono"
                  >
                    {Math.round(speedLimitKmh * 0.621371)} mph
                  </Badge>
                </div>
              )}
            </div>
            {roadName && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{roadName}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Battery indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <BatteryIcon className={cn("h-4 w-4", getBatteryColor(batteryLevel))} />
                <span>Battery</span>
              </div>
              <span className={cn("font-medium", getBatteryColor(batteryLevel))}>
                {batteryLevel !== null ? `${batteryLevel}%` : "—"}
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

          {/* Ignition status */}
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted/50">
            <Key className={cn(
              "h-4 w-4",
              isIgnitionOn ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium",
              isIgnitionOn ? "text-primary" : "text-muted-foreground"
            )}>
              {isIgnitionOn ? "Engine ON" : "Engine OFF"}
            </span>
          </div>
        </div>

        {/* Odometer & Engine Hours row */}
        {(odometerMiles !== null || engineHoursFormatted !== null) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {odometerMiles !== null && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{odometerMiles.toLocaleString()} mi</span>
                  {todayDistanceMiles !== null && todayDistanceMiles > 0 && (
                    <span className="text-primary ml-1">(+{todayDistanceMiles} today)</span>
                  )}
                </div>
              </div>
            )}
            {engineHoursFormatted !== null && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{engineHoursFormatted}</span>
              </div>
            )}
          </div>
        )}

        {/* Heading indicator */}
        {isOnline && device.last_heading !== undefined && device.last_heading !== null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Navigation 
              className="h-3.5 w-3.5" 
              style={{ transform: `rotate(${device.last_heading}deg)` }}
            />
            <span>Heading: {Math.round(device.last_heading)}°</span>
          </div>
        )}

        {/* Link vehicle button */}
        {!device.vehicle && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={onLinkClick}
          >
            <Link className="h-3 w-3 mr-1" />
            Link to Vehicle
          </Button>
        )}

        {/* Last seen */}
        {device.last_seen_at && (
          <p className="text-xs text-muted-foreground text-center">
            Last update: {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
