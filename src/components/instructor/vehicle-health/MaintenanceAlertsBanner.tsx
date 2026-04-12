import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Wrench, ChevronRight, Clock, Gauge } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useVehicleService, SERVICE_TYPE_LABELS, ServiceReminder } from "@/hooks/useVehicleService";
import { kmToMiles } from "@/lib/utils";

interface MaintenanceAlertsBannerProps {
  className?: string;
}

function getAlertInfo(reminder: ServiceReminder): {
  severity: "critical" | "warning";
  message: string;
  detail: string;
} {
  const serviceName = reminder.service_type === "other"
    ? reminder.custom_name || "Service"
    : SERVICE_TYPE_LABELS[reminder.service_type];

  const reg = reminder.vehicle?.registration || "Vehicle";

  // Check date
  if (reminder.next_due_date) {
    const days = differenceInDays(new Date(reminder.next_due_date), new Date());
    if (days < 0) {
      return {
        severity: "critical",
        message: `${serviceName} overdue — ${reg}`,
        detail: `${Math.abs(days)} days overdue (was due ${format(new Date(reminder.next_due_date), "d MMM")})`,
      };
    }
    if (days <= reminder.reminder_days_before) {
      return {
        severity: "warning",
        message: `${serviceName} due soon — ${reg}`,
        detail: `Due in ${days} days (${format(new Date(reminder.next_due_date), "d MMM")})`,
      };
    }
  }

  // Check mileage
  if (reminder.next_due_km && reminder.vehicle?.current_odometer_km) {
    const kmLeft = reminder.next_due_km - reminder.vehicle.current_odometer_km;
    const milesLeft = Math.round(kmToMiles(kmLeft));
    if (kmLeft <= 0) {
      return {
        severity: "critical",
        message: `${serviceName} overdue — ${reg}`,
        detail: `${Math.abs(milesLeft).toLocaleString()} miles past due`,
      };
    }
    if (kmLeft <= 800) { // ~500 miles
      return {
        severity: "warning",
        message: `${serviceName} due soon — ${reg}`,
        detail: `${milesLeft.toLocaleString()} miles remaining`,
      };
    }
  }

  return {
    severity: "warning",
    message: `${serviceName} — ${reg}`,
    detail: "Due soon",
  };
}

export function MaintenanceAlertsBanner({ className = "" }: MaintenanceAlertsBannerProps) {
  const { upcomingReminders } = useVehicleService();

  if (upcomingReminders.length === 0) return null;

  const alerts = upcomingReminders.map((r) => ({
    ...getAlertInfo(r),
    id: r.id,
  }));

  const hasCritical = alerts.some((a) => a.severity === "critical");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={className}
      >
        <div
          className={`rounded-2xl border p-3 space-y-2 ${
            hasCritical
              ? "border-destructive/30 bg-destructive/5"
              : "border-orange-500/30 bg-orange-500/5"
          }`}
        >
          <div className="flex items-center gap-2">
            {hasCritical ? (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <Wrench className="h-4 w-4 text-orange-500 shrink-0" />
            )}
            <span
              className={`text-sm font-semibold ${
                hasCritical ? "text-destructive" : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {alerts.length} maintenance {alerts.length === 1 ? "alert" : "alerts"}
            </span>
          </div>

          <div className="space-y-1.5">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-2 text-xs"
              >
                <div
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                    alert.severity === "critical" ? "bg-destructive" : "bg-orange-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className={`font-medium ${
                    alert.severity === "critical" ? "text-destructive" : "text-foreground"
                  }`}>
                    {alert.message}
                  </p>
                  <p className="text-muted-foreground">{alert.detail}</p>
                </div>
              </div>
            ))}
            {alerts.length > 3 && (
              <p className="text-xs text-muted-foreground pl-3.5">
                +{alerts.length - 3} more
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
