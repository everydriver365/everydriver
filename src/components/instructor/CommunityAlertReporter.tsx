import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Camera, Construction, Car, X, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CommunityAlertReporterProps {
  instructorId: string | undefined;
}

const ALERT_TYPES = [
  { id: "roadworks", icon: Construction, label: "Roadworks", color: "text-amber-500" },
  { id: "accident", icon: Car, label: "Accident", color: "text-red-500" },
  { id: "speed_camera", icon: Camera, label: "Speed Camera", color: "text-blue-500" },
  { id: "hazard", icon: AlertTriangle, label: "Hazard", color: "text-orange-500" },
];

export function CommunityAlertReporter({ instructorId }: CommunityAlertReporterProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");

  const handleReport = async (alertType: string) => {
    if (!instructorId) return;
    setSubmitting(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      await (supabase.from("community_road_alerts") as any).insert({
        reporter_id: instructorId,
        alert_type: alertType,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        description: description || null,
      });

      toast({ title: "Alert reported", description: "Thanks! Other instructors will be notified." });
      setOpen(false);
      setDescription("");
    } catch (err: any) {
      if (err?.code === 1) {
        toast({ title: "Location required", description: "Please enable location to report alerts.", variant: "destructive" });
      } else {
        toast({ title: "Failed to report", description: "Please try again.", variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating report button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <AlertTriangle className="h-5 w-5" />
      </motion.button>

      {/* Report sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-none p-5 pb-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Report Road Alert</h3>
                </div>
                <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {ALERT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleReport(type.id)}
                    disabled={submitting}
                    className="flex flex-col items-center gap-2 p-4 rounded-none bg-muted/50 border border-border active:scale-95 transition-all hover:bg-muted"
                  >
                    {submitting ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <type.icon className={`h-8 w-8 ${type.color}`} />
                    )}
                    <span className="text-xs font-medium text-foreground">{type.label}</span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-none bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Alerts expire automatically after 2 hours
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
