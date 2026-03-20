import { BatteryMedium, Fuel, Key, Wifi, WifiOff, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { GPSDeviceHealth, InstructorVehicle } from "@/hooks/useVehicleHealth";
import { motion } from "framer-motion";

interface VehicleHeroCardProps {
  device: GPSDeviceHealth | null;
  vehicle: InstructorVehicle | null;
  isLoading: boolean;
}

export function VehicleHeroCard({ device, vehicle, isLoading }: VehicleHeroCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(210,40%,12%)] h-[180px] animate-pulse" />
    );
  }

  const battery = device?.last_battery_percent ?? null;
  const fuel = device?.last_fuel_percent ?? null;
  const isIgnitionOn = device?.last_ignition_status === true;
  const isOnline = device?.is_connected ?? false;
  const registration = vehicle?.registration || device?.vehicle?.registration;
  const make = vehicle?.make || device?.vehicle?.make || "";
  const model = vehicle?.model || device?.vehicle?.model || "";
  const vehicleName = [make, model].filter(Boolean).join(" ") || "Your Vehicle";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl bg-gradient-to-br from-[hsl(210,50%,10%)] via-[hsl(200,40%,14%)] to-[hsl(160,30%,12%)] overflow-hidden shadow-lg relative"
    >
      {/* Decorative car silhouette */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <Car className="w-64 h-64" strokeWidth={0.5} />
      </div>

      <div className="relative z-10 p-5">
        {/* Top row: vehicle name + connection */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/60 text-[11px] font-medium tracking-wide uppercase">
              {registration || "No Vehicle"}
            </p>
            <h2 className="text-white text-base font-semibold mt-0.5">{vehicleName}</h2>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
            isOnline 
              ? "bg-emerald-500/20 text-emerald-400" 
              : "bg-white/10 text-white/40"
          )}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? "Live" : "Offline"}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Battery */}
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center">
            <BatteryMedium className={cn(
              "h-5 w-5 mx-auto mb-1.5",
              battery !== null && battery <= 20 ? "text-red-400" : 
              battery !== null && battery <= 50 ? "text-orange-400" : "text-emerald-400"
            )} />
            <p className="text-white text-lg font-bold leading-none">
              {battery !== null ? `${battery}%` : "—"}
            </p>
            <p className="text-white/40 text-[10px] mt-1">Battery</p>
          </div>

          {/* Fuel */}
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center">
            <Fuel className={cn(
              "h-5 w-5 mx-auto mb-1.5",
              fuel !== null && fuel <= 15 ? "text-red-400" :
              fuel !== null && fuel <= 30 ? "text-orange-400" : "text-emerald-400"
            )} />
            <p className="text-white text-lg font-bold leading-none">
              {fuel !== null ? `${Math.round(fuel)}%` : "—"}
            </p>
            <p className="text-white/40 text-[10px] mt-1">Fuel</p>
          </div>

          {/* Ignition */}
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 text-center">
            <Key className={cn(
              "h-5 w-5 mx-auto mb-1.5",
              isIgnitionOn ? "text-emerald-400" : "text-white/30"
            )} />
            <p className={cn(
              "text-lg font-bold leading-none",
              isIgnitionOn ? "text-emerald-400" : "text-white/40"
            )}>
              {isIgnitionOn ? "ON" : "OFF"}
            </p>
            <p className="text-white/40 text-[10px] mt-1">Ignition</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
