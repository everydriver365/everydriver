import { useState } from "react";
import { Phone, PhoneCall, AlertTriangle, X, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SOSEmergencySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string | undefined;
  instructorName: string | undefined;
}

type AlertLevel = "call_me" | "help" | "sos";

export const SOSEmergencySheet: React.FC<SOSEmergencySheetProps> = ({
  open,
  onOpenChange,
  instructorId,
  instructorName,
}) => {
  const [sending, setSending] = useState<AlertLevel | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const getLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const getWhat3Words = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("convert-to-what3words", {
        body: { latitude: lat, longitude: lng },
      });
      if (error) return null;
      return data?.what3words || null;
    } catch {
      return null;
    }
  };

  const handleAlert = async (level: AlertLevel) => {
    if (!instructorId) return;
    setSending(level);

    try {
      const coords = await getLocation();

      let what3words: string | null = null;
      if (coords) {
        what3words = await getWhat3Words(coords.latitude, coords.longitude);
      }

      const messages: Record<AlertLevel, string> = {
        call_me: `${instructorName || "An instructor"} is requesting a callback.`,
        help: `${instructorName || "An instructor"} needs urgent assistance.`,
        sos: `${instructorName || "An instructor"} has triggered an SOS emergency.`,
      };

      const { error } = await (supabase.from as any)("sos_alerts").insert({
        instructor_id: instructorId,
        alert_level: level,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        what3words,
        message: messages[level],
      });

      if (error) {
        console.error("SOS insert error:", JSON.stringify(error));
        throw error;
      }

      // For SOS level, also broadcast via urgent_alerts
      if (level === "sos") {
        await (supabase.from as any)("urgent_alerts").insert({
          instructor_id: instructorId,
          is_broadcast: true,
          title: "🚨 SOS Emergency",
          message: `${messages[level]}${coords ? ` Location: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : ""}${what3words ? ` (///${what3words})` : ""}`,
          severity: "critical",
        });
      }

      setConfirmed(true);
    } catch (err) {
      console.error("SOS alert error:", err);
      toast.error("Failed to send alert. Please call emergency services directly.");
    } finally {
      setSending(null);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    onOpenChange(false);
  };

  if (confirmed) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Help is on the way</DialogTitle>
            <DialogDescription className="text-center">
              Your alert has been sent. Someone will contact you shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your location has been shared with the response team.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-center text-lg">Emergency Alert</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Select the level of help you need. Your location will be shared automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 p-4">
          {/* Call Me */}
          <button
            onClick={() => handleAlert("call_me")}
            disabled={!!sending}
            className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-left disabled:opacity-60"
          >
            <div className="h-12 w-12 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
              {sending === "call_me" ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Phone className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <p className="font-bold text-amber-900">Please Call Me</p>
              <p className="text-xs text-amber-700">Alerts admin &amp; your driving school</p>
            </div>
          </button>

          {/* Help */}
          <button
            onClick={() => handleAlert("help")}
            disabled={!!sending}
            className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-orange-400 bg-orange-50 hover:bg-orange-100 transition-colors text-left disabled:opacity-60"
          >
            <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
              {sending === "help" ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <PhoneCall className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <p className="font-bold text-orange-900">Help — Call Me ASAP</p>
              <p className="text-xs text-orange-700">Urgent alert to school owner &amp; admin</p>
            </div>
          </button>

          {/* SOS */}
          <button
            onClick={() => handleAlert("sos")}
            disabled={!!sending}
            className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-destructive bg-red-50 hover:bg-red-100 transition-colors text-left disabled:opacity-60"
          >
            <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center shrink-0 animate-pulse">
              {sending === "sos" ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <p className="font-bold text-red-900">SOS — Emergency</p>
              <p className="text-xs text-red-700">Alerts all local instructors, school &amp; admin</p>
            </div>
          </button>
        </div>

        <div className="px-4 pb-4">
          <p className="text-[10px] text-muted-foreground text-center">
            For life-threatening emergencies, always call 999 first.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
