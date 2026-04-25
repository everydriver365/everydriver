import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity, ChevronRight, ChevronDown, ChevronUp, Fuel, Thermometer, Gauge, AlertTriangle, CheckCircle2, WifiOff, Camera, ShieldAlert } from "lucide-react";
import telematicsIcon from "@/assets/telematics-tile-icon.png";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { formatDistanceToNow } from "date-fns";

export function TelematicsTile() {
  const navigate = useNavigate();
  const { devices, vehicles } = useVehicleHealth();
  const [expanded, setExpanded] = useState(false);

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
  const engineHours = primaryDevice?.last_engine_hours;
  const speedKmh = primaryDevice?.last_speed_kmh;
  const hasFaults = faultCodes && faultCodes.length > 0;
  const hasOBDData = fuelPercent != null || coolantTemp != null;
  const dashcamActive = primaryDevice?.last_dashcam_active;
  const panicPressed = primaryDevice?.last_panic_pressed;

  const vehicleLabel = primaryVehicle
    ? `${primaryVehicle.registration || ""}${primaryVehicle.make ? ` · ${primaryVehicle.make}` : ""}${primaryVehicle.model ? ` ${primaryVehicle.model}` : ""}`.trim()
    : "No vehicle linked";

  return (
    <div className="px-4 mt-3">
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          boxShadow:
            "0 2px 4px rgba(15, 23, 42, 0.08), 0 12px 24px rgba(15, 23, 42, 0.18), 0 28px 52px rgba(15, 23, 42, 0.22)",
          borderRadius: 14,
          overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-[14px] text-left"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#F1ECFA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity
                size={20}
                strokeWidth={1.8}
                color="#8A5BC9"
              />
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: 15, fontWeight: 500, color: "#000000", letterSpacing: "-0.1px", fontFamily: "Inter, sans-serif" }}>Telematics</p>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#6E6E73", fontFamily: "Inter, sans-serif" }} className="truncate">{vehicleLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isConnected ? (
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#3B8B3B" }} />
            ) : (
              <WifiOff className="h-3.5 w-3.5" style={{ color: "#6E6E73" }} />
            )}
            <span style={{ fontSize: 11, color: "#6E6E73", fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
              {isConnected ? "Online" : "Offline"}
            </span>
            <svg
              aria-hidden="true"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              style={{ color: "#6E6E73" }}
            >
              <path d="M3.5 1.5 L7 5 L3.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
              <div style={{ borderTop: "0.5px solid #E5E5EA" }} className="px-4 pb-3 pt-3 space-y-2">
                {hasData ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {hasOBDData ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <MetricCard
                            icon={<Gauge className="h-3.5 w-3.5" />}
                            label="Battery"
                            value={batteryVoltage != null ? `${batteryVoltage.toFixed(1)}V` : "—"}
                            warning={batteryVoltage != null && batteryVoltage < 11.8}
                          />
                          <MetricCard
                            icon={<Activity className="h-3.5 w-3.5" />}
                            label="Speed"
                            value={speedKmh != null ? `${Math.round(speedKmh * 0.621371)} mph` : "—"}
                            warning={false}
                          />
                          <MetricCard
                            icon={<Fuel className="h-3.5 w-3.5" />}
                            label="Engine Hrs"
                            value={engineHours != null ? `${Math.round(engineHours)}h` : "—"}
                            warning={false}
                          />
                        </>
                      )}
                    </div>

                    {hasFaults && (
                      <div style={{ backgroundColor: "#FBF1DE", borderRadius: 10, padding: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 500, color: "#000000", marginBottom: 4 }}>Active Faults</p>
                        {faultCodes.slice(0, 3).map((fault, i) => (
                          <p key={i} style={{ fontSize: 10, color: "#6E6E73" }} className="truncate">
                            {fault.code}: {fault.description}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Dashcam & Panic indicators */}
                    {(dashcamActive != null || panicPressed != null) && (
                      <div className="flex items-center gap-2">
                        {dashcamActive != null && (
                          <div className="flex items-center gap-1" style={{ fontSize: 10 }}>
                            <Camera className="h-3 w-3" style={{ color: dashcamActive ? "#3B8B3B" : "#6E6E73" }} />
                            <span style={{ color: dashcamActive ? "#3B8B3B" : "#6E6E73", fontWeight: 500 }}>
                              {dashcamActive ? "Cam On" : "Cam Off"}
                            </span>
                          </div>
                        )}
                        {panicPressed && (
                          <div className="flex items-center gap-1" style={{ fontSize: 10 }}>
                            <ShieldAlert className="h-3 w-3 animate-pulse" style={{ color: "#C8434F" }} />
                            <span style={{ color: "#C8434F", fontWeight: 500 }}>PANIC</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <p style={{ fontSize: 10, color: "#6E6E73" }}>
                        {odometerKm != null && `${Math.round(odometerKm).toLocaleString()} km`}
                        {lastSeen && ` · ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/instructor/fleet-dashboard"); }}
                        style={{ fontSize: 11, fontWeight: 500, color: "#2B7BC8" }}
                      >
                        Full Dashboard →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <p style={{ fontSize: 12, color: "#6E6E73" }}>No telematics device connected</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate("/instructor/gps-setup"); }}
                      style={{ fontSize: 12, fontWeight: 500, color: "#2B7BC8", marginTop: 4 }}
                    >
                      Set up tracking →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, warning }: { icon: React.ReactNode; label: string; value: string; warning: boolean }) {
  return (
    <div
      className="text-center"
      style={{
        borderRadius: 10, padding: 8,
        backgroundColor: warning ? "#FBEAEC" : "#F2F2F4",
      }}
    >
      <div className="flex justify-center mb-1" style={{ color: warning ? "#C8434F" : "#6E6E73" }}>
        {icon}
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: warning ? "#C8434F" : "#000000" }}>{value}</p>
      <p style={{ fontSize: 9, color: "#6E6E73", marginTop: 2 }}>{label}</p>
    </div>
  );
}
