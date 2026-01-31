import { motion, AnimatePresence } from "framer-motion";
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog,
  Wind, 
  Snowflake, 
  Eye,
  AlertTriangle,
  AlertCircle,
  Car,
  Ban,
  Construction,
  X,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrivingAlert, getAlertId } from "@/hooks/useDrivingAlerts";

interface DrivingAlertsStripProps {
  alerts: DrivingAlert[];
  onDismiss: (alertId: string) => void;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cloud,
  CloudRain,
  CloudDrizzle: CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Snowflake,
  Eye,
  AlertTriangle,
  AlertCircle,
  Car,
  Ban,
  Construction,
};

function AlertIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = iconMap[iconName] || AlertCircle;
  return <Icon className={className} />;
}

export function DrivingAlertsStrip({ alerts, onDismiss, className }: DrivingAlertsStripProps) {
  if (alerts.length === 0) return null;

  return (
    <div className={cn("px-4 mt-4 space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {alerts.map((alert, index) => {
          const alertId = getAlertId(alert);
          const isWeather = alert.type === "weather";
          const isSevere = alert.severity === "severe";
          
          return (
            <motion.div
              key={alertId}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.95 }}
              transition={{ 
                duration: 0.2, 
                delay: index * 0.05,
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
              className={cn(
                "relative overflow-hidden rounded-xl border shadow-sm",
                isSevere
                  ? "bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/30 dark:from-destructive/20 dark:to-destructive/10"
                  : "bg-gradient-to-r from-warning/10 to-warning/5 border-warning/30 dark:from-warning/20 dark:to-warning/10"
              )}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-lg",
                  isSevere 
                    ? "bg-destructive/20 text-destructive" 
                    : "bg-warning/20 text-warning-foreground"
                )}>
                  <AlertIcon iconName={alert.icon} className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-medium uppercase tracking-wide",
                      isSevere ? "text-destructive" : "text-warning-foreground"
                    )}>
                      {isWeather ? "Weather" : "Traffic"}
                    </span>
                    {isSevere && (
                      <span className="text-[10px] font-bold text-destructive bg-destructive/20 px-1.5 py-0.5 rounded">
                        SEVERE
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mt-0.5 truncate">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {alert.description}
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => onDismiss(alertId)}
                  className={cn(
                    "flex-shrink-0 p-1.5 rounded-full transition-colors",
                    isSevere 
                      ? "hover:bg-destructive/20 text-destructive/60 hover:text-destructive" 
                      : "hover:bg-warning/20 text-warning-foreground/60 hover:text-warning-foreground"
                  )}
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Subtle gradient accent at bottom */}
              <div className={cn(
                "h-0.5",
                isSevere 
                  ? "bg-gradient-to-r from-transparent via-destructive/50 to-transparent"
                  : "bg-gradient-to-r from-transparent via-warning/50 to-transparent"
              )} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
