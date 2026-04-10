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
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrivingAlert, getAlertId } from "@/hooks/useDrivingAlerts";

interface DrivingAlertsStripProps {
  alerts: DrivingAlert[];
  onDismiss: (alertId: string) => void;
  className?: string;
  location?: string | null;
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

export function DrivingAlertsStrip({ alerts, onDismiss, className, location }: DrivingAlertsStripProps) {
  if (alerts.length === 0) return null;

  return (
    <div className={cn("mt-4 space-y-2", className)}>
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
                "relative overflow-hidden rounded-none border shadow-sm",
                isWeather
                  ? "border-primary/20 dark:border-primary/30"
                  : isSevere
                    ? "bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/30 dark:from-destructive/20 dark:to-destructive/10"
                    : "bg-gradient-to-r from-warning/10 to-warning/5 border-warning/30 dark:from-warning/20 dark:to-warning/10"
              )}
              style={isWeather ? { backgroundColor: 'hsl(var(--primary) / 0.1)' } : undefined}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-none",
                  isWeather
                    ? "bg-primary/20 text-primary"
                    : isSevere 
                      ? "bg-destructive/20 text-destructive" 
                      : "bg-warning/20 text-warning-foreground"
                )}>
                  {isWeather ? (
                    <CloudRain className="h-5 w-5" />
                  ) : (
                    <AlertIcon iconName={alert.icon} className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Location and type header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isWeather && location && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </span>
                    )}
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                      isWeather
                        ? "text-primary bg-primary/20 font-bold text-[11px]"
                        : isSevere 
                          ? "text-destructive bg-destructive/15" 
                          : "text-warning-foreground bg-warning/20"
                    )}>
                      {isWeather ? "Weather" : "Traffic"}
                    </span>
                    {isSevere && (
                      <span className="text-[10px] font-bold text-destructive-foreground bg-destructive px-1.5 py-0.5 rounded">
                        SEVERE
                      </span>
                    )}
                  </div>
                  
                  {/* Title - more prominent */}
                  <h4 className="font-bold text-foreground text-base mt-1 leading-tight">
                    {alert.title}
                  </h4>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">
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
