import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Car, AlertCircle, CheckCircle, Gauge, Calendar, Wrench } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

interface Vehicle {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
  current_odometer_km: number | null;
  mot_expiry: string | null;
  insurance_expiry: string | null;
  tax_expiry: string | null;
  next_service_due_km: number | null;
}

function ExpiryBadge({ label, date }: { label: string; date: string | null }) {
  if (!date) return null;
  const d = new Date(date);
  const days = differenceInDays(d, new Date());
  const expired = isPast(d);

  const color = expired
    ? "bg-red-500/10 text-red-500"
    : days <= 30
      ? "bg-amber-500/10 text-amber-500"
      : "bg-emerald-500/10 text-emerald-500";

  const Icon = expired || days <= 30 ? AlertCircle : CheckCircle;

  return (
    <div className={`rounded-none p-2.5 ${color} flex items-center gap-2`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-[12px] font-semibold">
          {expired ? "Expired" : days <= 30 ? `${days}d left` : format(d, "dd MMM yy")}
        </p>
      </div>
    </div>
  );
}

export function VehicleHealthCard({ instructorId, className = "" }: { instructorId: string; className?: string }) {
  const { data: vehicle } = useQuery({
    queryKey: ["vehicle-health-card", instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_vehicles")
        .select("id, registration, make, model, current_odometer_km, mot_expiry, insurance_expiry, tax_expiry, next_service_due_km")
        .eq("instructor_id", instructorId)
        .eq("is_primary", true)
        .maybeSingle();
      return data as Vehicle | null;
    },
  });

  if (!vehicle) return null;

  const odometerMiles = vehicle.current_odometer_km
    ? Math.round(vehicle.current_odometer_km * 0.621371)
    : null;

  const serviceNeeded = vehicle.next_service_due_km && vehicle.current_odometer_km
    ? vehicle.current_odometer_km >= vehicle.next_service_due_km
    : false;

  // Count issues
  const issues = [
    vehicle.mot_expiry && isPast(new Date(vehicle.mot_expiry)),
    vehicle.tax_expiry && isPast(new Date(vehicle.tax_expiry)),
    vehicle.insurance_expiry && isPast(new Date(vehicle.insurance_expiry)),
    serviceNeeded,
  ].filter(Boolean).length;

  const warnings = [
    vehicle.mot_expiry && differenceInDays(new Date(vehicle.mot_expiry), new Date()) <= 30 && !isPast(new Date(vehicle.mot_expiry)),
    vehicle.tax_expiry && differenceInDays(new Date(vehicle.tax_expiry), new Date()) <= 30 && !isPast(new Date(vehicle.tax_expiry)),
    vehicle.insurance_expiry && differenceInDays(new Date(vehicle.insurance_expiry), new Date()) <= 30 && !isPast(new Date(vehicle.insurance_expiry)),
  ].filter(Boolean).length;

  const statusColor = issues > 0 ? "text-red-500" : warnings > 0 ? "text-amber-500" : "text-emerald-500";
  const statusLabel = issues > 0 ? `${issues} issue${issues > 1 ? "s" : ""}` : warnings > 0 ? `${warnings} warning${warnings > 1 ? "s" : ""}` : "All good";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-none border border-border bg-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-none bg-primary/10 flex items-center justify-center">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {vehicle.registration}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${issues > 0 ? "bg-red-500" : warnings > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
          <span className={`text-[11px] font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-3 grid grid-cols-3 gap-2">
        <ExpiryBadge label="MOT" date={vehicle.mot_expiry} />
        <ExpiryBadge label="Tax" date={vehicle.tax_expiry} />
        <ExpiryBadge label="Insurance" date={vehicle.insurance_expiry} />
      </div>

      {/* Footer stats */}
      <div className="px-4 pb-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        {odometerMiles && (
          <span className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            {odometerMiles.toLocaleString()} mi
          </span>
        )}
        {serviceNeeded && (
          <span className="flex items-center gap-1 text-amber-500 font-semibold">
            <Wrench className="h-3 w-3" />
            Service due
          </span>
        )}
      </div>
    </motion.div>
  );
}
