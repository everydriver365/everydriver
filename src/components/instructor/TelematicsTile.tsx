import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity, ChevronDown, ChevronUp, Fuel, Thermometer, Gauge, AlertTriangle, CheckCircle2, Wifi, WifiOff } from "lucide-react";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { formatDistanceToNow } from "date-fns";

export function TelematicsTile() {
  const navigate = useNavigate();
  const { devices, vehicles } = useVehicleHealth();
  const [expanded, setExpanded] = useState(false);

  // preferredDevice is already sorted first by the hook
  const primaryDevice = devices?.[0];
  const primaryVehicle = primaryDevice?.vehicle || vehicles?.[0];

  const isConnected = primaryDevice?.is_connected ?? false;
  const hasData = !!primaryDevice;

  const fuelPercent = primaryDevice?.last_fuel_percent;
  const coolantTemp = primaryDevice?.last_coolant_temp_c;
  const batteryVoltage = primaryDevice?.last_battery_voltage;
  const faultCodes = primaryDevice?.last_fault_codes;
  const lastSeen = primaryDevice?.last_seen_at;
  const odometerKm = primaryDevice?.last_ecu_odometer_km;

  const hasFaults = faultCodes && faultCodes.length > 0;
  const healthStatus = hasFaults ? "warning" : isConnected ? "good" : "offline";

  const statusConfig = {
    good: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2, label: "Healthy" },
    warning: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle, label: `${faultCodes?.length} fault${(faultCodes?.length || 0) !== 1 ? "s" : ""}` },
    offline: { color: "text-muted-foreground", bg: "bg-muted/50", icon: WifiOff, label: "Offline" },
  };

  const status = statusConfig[healthStatus];
  const StatusIcon = status.icon;

  const vehicleLabel = primaryVehicle
    ? `${primaryVehicle.registration || ""}${primaryVehicle.make ? ` · ${primaryVehicle.make}` : ""}${primaryVehicle.model ? ` ${primaryVehicle.model}` : ""}`.trim()
    : "No vehicle linked";

  return (
    <div className="px-4 mt-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden bg-card dark:bg-[#1C1C1E]"
        style={{
          borderRadius: 16,
          boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.6), 0px 4px 12px rgba(0,0,0,0.06), 0px 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Main row — always visible */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 p-3 text-left rounded-2xl"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${status.bg}`}>
            <Activity className={`h-4.5 w-4.5 ${status.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground leading-tight">Telematics</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
              {vehicleLabel}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[11px] font-semibold ${status.color} flex items-center gap-1`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expandable details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                {/* Health metrics grid */}
                {hasData ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <MetricCard
                        icon={<Fuel className="h-3.5 w-3.5" />}
                        label="Fuel"
                        value={fuelPercent != null ? `${Math.round(fuelPercent)}%` : "—"}
                        warning={fuelPercent != null && fuelPercent < 15}
                      />
                      <MetricCard
                        icon={<Thermometer className="h-3.5 w-3.5" />}
                        label="Coolant"
                        value={coolantTemp != null ? `${Math.round(coolantTemp)}°C` : "—"}
                        warning={coolantTemp != null && coolantTemp > 110}
                      />
                      <MetricCard
                        icon={<Gauge className="h-3.5 w-3.5" />}
                        label="Battery"
                        value={batteryVoltage != null ? `${batteryVoltage.toFixed(1)}V` : "—"}
                        warning={batteryVoltage != null && batteryVoltage < 11.8}
                      />
                    </div>

                    {/* Fault codes */}
                    {hasFaults && (
                      <div className="bg-amber-500/10 rounded-xl p-2.5">
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">Active Faults</p>
                        {faultCodes.slice(0, 3).map((fault, i) => (
                          <p key={i} className="text-[10px] text-amber-600 dark:text-amber-300 truncate">
                            {fault.code}: {fault.description}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Footer info */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-muted-foreground">
                        {odometerKm != null && `${Math.round(odometerKm).toLocaleString()} km`}
                        {lastSeen && ` · ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/instructor/fleet-dashboard");
                        }}
                        className="text-[11px] font-bold text-primary"
                      >
                        Full Dashboard →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-[12px] text-muted-foreground">No telematics device connected</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/instructor/gps-setup");
                      }}
                      className="text-[12px] font-semibold text-primary mt-1"
                    >
                      Set up tracking →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MetricCard({ icon, label, value, warning }: { icon: React.ReactNode; label: string; value: string; warning: boolean }) {
  return (
    <div className={`rounded-xl p-2 text-center ${warning ? "bg-red-500/10" : "bg-white/60 dark:bg-white/5"}`}>
      <div className={`flex justify-center mb-1 ${warning ? "text-red-500" : "text-muted-foreground"}`}>
        {icon}
      </div>
      <p className={`text-[14px] font-bold leading-none ${warning ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
