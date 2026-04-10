import { Construction, Ban, ChevronRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { DrivingAlert } from "@/hooks/useDrivingAlerts";

interface RoadAlertsRowProps {
  alerts: DrivingAlert[];
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Construction,
  Ban,
  AlertTriangle,
};

const severityColor: Record<string, string> = {
  severe: "text-red-600 bg-red-50 border-red-100",
  moderate: "text-amber-600 bg-amber-50 border-amber-100",
  low: "text-slate-500 bg-slate-50 border-slate-100",
};

export function RoadAlertsRow({ alerts, className = "" }: RoadAlertsRowProps) {
  const roadAlerts = alerts.filter(a => a.type === "road");
  if (roadAlerts.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {roadAlerts.map((alert, i) => {
        const Icon = iconMap[alert.icon] || AlertTriangle;
        const colors = severityColor[alert.severity] || severityColor.low;
        return (
          <motion.div
            key={`road-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-2.5 py-2 px-3 rounded-none border ${colors}`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{alert.title}</p>
              <p className="text-[10px] opacity-80 truncate">{alert.description}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />
          </motion.div>
        );
      })}
    </div>
  );
}
