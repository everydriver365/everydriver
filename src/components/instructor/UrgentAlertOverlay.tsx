import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UrgentAlert } from "@/hooks/useUrgentAlerts";

interface UrgentAlertOverlayProps {
  alerts: UrgentAlert[];
  onDismiss: (id: string) => void;
}

export function UrgentAlertOverlay({ alerts, onDismiss }: UrgentAlertOverlayProps) {
  if (alerts.length === 0) return null;

  const alert = alerts[0]; // Show one at a time

  return (
    <AnimatePresence>
      <motion.div
        key={alert.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-full max-w-sm bg-background rounded-2xl shadow-2xl border-2 border-destructive overflow-hidden"
        >
          {/* Red header band */}
          <div className="bg-destructive px-5 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Urgent Alert</p>
              <h3 className="text-lg font-bold text-white leading-tight">{alert.title}</h3>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {alert.message}
            </p>
            <p className="text-[11px] text-muted-foreground mt-3">
              {new Date(alert.created_at).toLocaleString()}
            </p>
          </div>

          {/* Dismiss button */}
          <div className="px-5 pb-5">
            <Button
              onClick={() => onDismiss(alert.id)}
              className="w-full bg-destructive hover:bg-destructive/90 text-white font-semibold h-12 text-base"
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
