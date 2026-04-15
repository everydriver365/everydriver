import { Battery, BatteryLow, BatteryMedium, BatteryFull, Key, Wifi, WifiOff, Car, Link, Gauge, MapPin, Navigation, Timer, Fuel, Thermometer, AlertTriangle, Zap, Camera, ShieldAlert } from "lucide-react";
import { enrichFaultCode, isGenericDescription } from "@/lib/obdCodeLookup";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GPSDeviceHealth } from "@/hooks/useVehicleHealth";
import { formatDistanceToNow } from "date-fns";
import { formatMph, kmToMiles } from "@/lib/utils";

interface EnhancedDeviceStatusCardProps {
  device: GPSDeviceHealth;
  onLinkClick: () => void;
}

export function EnhancedDeviceStatusCard({ device, onLinkClick }: EnhancedDeviceStatusCardProps) {
  const batteryLevel = device.last_battery_percent;
  const isIgnitionOn = device.last_ignition_status === true;
  const isOnline = device.is_connected;
  const speedKmh = device.last_speed_kmh;
  const speedLimitKmh = device.last_speed_limit_kmh;
  const roadName = device.last_road_name;
  
  const odometerMiles = device.last_ecu_odometer_km != null
    ? Math.round(kmToMiles(device.last_ecu_odometer_km))
    : null;
  
  const today = new Date().toISOString().split("T")[0];
  const todayDistanceMiles = device.daily_start_date === today
    ? (device.daily_start_ecu_odometer_km != null && device.last_ecu_odometer_km != null)
      ? Math.round(kmToMiles(device.last_ecu_odometer_km - device.daily_start_ecu_odometer_km) * 10) / 10
        : null
    : null;
  
  const engineHoursFormatted = device.last_engine_hours != null
    ? `${Math.floor(device.last_engine_hours)}h ${Math.round((device.last_engine_hours % 1) * 60)}m`
    : null;

  const fuelPercent = device.last_fuel_percent;
  const getFuelColor = (level: number | null) => {
    if (level === null) return "text-muted-foreground";
    if (level <= 15) return "text-destructive";
    if (level <= 30) return "text-orange-500";
    return "text-primary";
  };

  const batteryVoltage = device.last_battery_voltage;
  const getVoltageColor = (v: number | null) => {
    if (v === null) return "text-muted-foreground";
    if (v < 12.0) return "text-destructive";
    if (v < 12.4) return "text-orange-500";
    return "text-primary";
  };

  const coolantTemp = device.last_coolant_temp_c;
  const getCoolantColor = (t: number | null) => {
    if (t === null) return "text-muted-foreground";
    if (t > 105) return "text-destructive";
    if (t > 95) return "text-orange-500";
    return "text-primary";
  };

  const faultCodes = device.last_fault_codes;
  const hasFaults = faultCodes && faultCodes.length > 0;

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
    <InstructorCard className={cn(
      "overflow-hidden",
      isOnline && "ring-primary/20",
      hasFaults && "ring-destructive/30"
    )}>
      <div className="space-y-3">
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

        {/* Live speed panel */}
        {isOnline && speedKmh !== null && (
          <div className={cn(
            "p-3 rounded-2xl border",
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

        {/* Stats row - Battery & Ignition */}
        <div className="grid grid-cols-2 gap-2">
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

          <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-muted/50">
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

        {/* Engine Diagnostics row */}
        {(fuelPercent != null || batteryVoltage != null || coolantTemp != null) && (
          <div className="grid grid-cols-3 gap-2">
            {fuelPercent != null && (
              <div className="p-2 rounded-2xl bg-muted/50 space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <Fuel className={cn("h-3.5 w-3.5", getFuelColor(fuelPercent))} />
                  <span className="text-muted-foreground">Fuel</span>
                </div>
                <p className={cn("text-sm font-bold", getFuelColor(fuelPercent))}>
                  {Math.round(fuelPercent)}%
                </p>
                <Progress 
                  value={fuelPercent} 
                  className={cn(
                    "h-1",
                    fuelPercent <= 15 ? "[&>div]:bg-destructive" :
                    fuelPercent <= 30 ? "[&>div]:bg-orange-500" :
                    "[&>div]:bg-primary"
                  )}
                />
              </div>
            )}
            {batteryVoltage != null && (
              <div className="p-2 rounded-2xl bg-muted/50">
                <div className="flex items-center gap-1 text-xs">
                  <Zap className={cn("h-3.5 w-3.5", getVoltageColor(batteryVoltage))} />
                  <span className="text-muted-foreground">12V</span>
                </div>
                <p className={cn("text-sm font-bold", getVoltageColor(batteryVoltage))}>
                  {batteryVoltage.toFixed(1)}V
                </p>
                {batteryVoltage < 12.0 && (
                  <p className="text-[10px] text-destructive mt-0.5">Low!</p>
                )}
              </div>
            )}
            {coolantTemp != null && (
              <div className="p-2 rounded-2xl bg-muted/50">
                <div className="flex items-center gap-1 text-xs">
                  <Thermometer className={cn("h-3.5 w-3.5", getCoolantColor(coolantTemp))} />
                  <span className="text-muted-foreground">Coolant</span>
                </div>
                <p className={cn("text-sm font-bold", getCoolantColor(coolantTemp))}>
                  {Math.round(coolantTemp)}°C
                </p>
                {coolantTemp > 105 && (
                  <p className="text-[10px] text-destructive mt-0.5">Overheat!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Odometer & Engine Hours row */}
        {(odometerMiles !== null || engineHoursFormatted !== null) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {odometerMiles !== null && (
              <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-muted/50">
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
              <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-muted/50">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{engineHoursFormatted}</span>
              </div>
            )}
          </div>
        )}

        {/* Tire Pressure */}
        {device.last_tire_pressure_json && Object.keys(device.last_tire_pressure_json).length > 0 && (
          <div className="p-2 rounded-2xl bg-muted/50 text-xs">
            <p className="font-medium text-muted-foreground mb-1">Tire Pressure (PSI)</p>
            <div className="grid grid-cols-2 gap-1">
              {device.last_tire_pressure_json.frontLeft != null && (
                <span>FL: <strong>{Math.round(device.last_tire_pressure_json.frontLeft / 6.895)}</strong></span>
              )}
              {device.last_tire_pressure_json.frontRight != null && (
                <span>FR: <strong>{Math.round(device.last_tire_pressure_json.frontRight / 6.895)}</strong></span>
              )}
              {device.last_tire_pressure_json.rearLeft != null && (
                <span>RL: <strong>{Math.round(device.last_tire_pressure_json.rearLeft / 6.895)}</strong></span>
              )}
              {device.last_tire_pressure_json.rearRight != null && (
                <span>RR: <strong>{Math.round(device.last_tire_pressure_json.rearRight / 6.895)}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Active Fault Codes */}
        {hasFaults && (
          <div className="p-2 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                {faultCodes!.length} Active Fault{faultCodes!.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1">
              {faultCodes!.slice(0, 5).map((fault, i) => {
                const enriched = enrichFaultCode(fault);
                return (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] px-1 py-0 shrink-0 mt-0.5",
                        enriched.severity.toLowerCase().includes("red") || enriched.severity.toLowerCase().includes("critical")
                          ? "border-destructive text-destructive"
                          : enriched.severity.toLowerCase().includes("amber") || enriched.severity.toLowerCase().includes("warning")
                          ? "border-orange-500 text-orange-500"
                          : "border-muted-foreground text-muted-foreground"
                      )}
                    >
                      {enriched.code}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground leading-tight font-medium">{enriched.description}</span>
                      {enriched.enrichedDescription && isGenericDescription(fault.description) && (
                        <span className="block text-muted-foreground text-[10px] mt-0.5">Source: {enriched.source}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {faultCodes!.length > 5 && (
                <p className="text-[10px] text-muted-foreground">+{faultCodes!.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {/* Dashcam & Panic Button status */}
        {(device.last_dashcam_active != null || device.last_panic_pressed != null) && (
          <div className="flex items-center gap-3 text-xs">
            {device.last_dashcam_active != null && (
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl",
                device.last_dashcam_active ? "bg-emerald-500/10" : "bg-muted/50"
              )}>
                <Camera className={cn("h-3.5 w-3.5", device.last_dashcam_active ? "text-emerald-500" : "text-muted-foreground")} />
                <span className={cn("font-medium", device.last_dashcam_active ? "text-emerald-500" : "text-muted-foreground")}>
                  {device.last_dashcam_active ? "Recording" : "Cam Off"}
                </span>
              </div>
            )}
            {device.last_panic_pressed != null && (
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl",
                device.last_panic_pressed ? "bg-destructive/10" : "bg-muted/50"
              )}>
                <ShieldAlert className={cn("h-3.5 w-3.5", device.last_panic_pressed ? "text-destructive animate-pulse" : "text-muted-foreground")} />
                <span className={cn("font-medium", device.last_panic_pressed ? "text-destructive" : "text-muted-foreground")}>
                  {device.last_panic_pressed ? "PANIC!" : "Panic OK"}
                </span>
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
            {device.last_diagnostics_at && (
              <span className="ml-1">• Diag: {formatDistanceToNow(new Date(device.last_diagnostics_at), { addSuffix: true })}</span>
            )}
          </p>
        )}
      </div>
    </InstructorCard>
  );
}