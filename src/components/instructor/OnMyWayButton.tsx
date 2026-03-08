import { useState } from "react";
import { Send, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMinutes } from "date-fns";

interface OnMyWayButtonProps {
  instructorId: string;
  pupilName: string;
  pupilPhone: string | null;
  pupilId?: string;
  lessonId?: string;
  etaMinutes?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function OnMyWayButton({
  instructorId,
  pupilName,
  pupilPhone,
  pupilId,
  lessonId,
  etaMinutes = 15,
  variant = "outline",
  size = "sm",
}: OnMyWayButtonProps) {
  const [sent, setSent] = useState(false);
  const firstName = pupilName.split(" ")[0];
  const arrivalTime = format(addMinutes(new Date(), etaMinutes), "HH:mm");
  const message = `Hi ${firstName}, I'm on my way! ETA: ${arrivalTime}. See you soon! 🚗`;

  const handleSend = async () => {
    if (!pupilPhone) {
      toast.error("No phone number for this pupil");
      return;
    }

    // Log the notification
    try {
      await supabase.from("on_my_way_notifications").insert({
        instructor_id: instructorId,
        pupil_id: pupilId || null,
        lesson_id: lessonId || null,
        eta_minutes: etaMinutes,
      });
    } catch (e) {
      console.error("Failed to log notification:", e);
    }

    // Open native SMS
    const a = document.createElement("a");
    a.href = `sms:${pupilPhone}?body=${encodeURIComponent(message)}`;
    a.click();

    setSent(true);
    toast.success("SMS opened!");
  };

  return (
    <Button
      variant={sent ? "secondary" : variant}
      size={size}
      onClick={(e) => { e.stopPropagation(); handleSend(); }}
      disabled={!pupilPhone}
      className="gap-1.5"
    >
      {sent ? (
        <>
          <Send className="h-3.5 w-3.5" />
          Sent
        </>
      ) : (
        <>
          <Navigation className="h-3.5 w-3.5" />
          On My Way
        </>
      )}
    </Button>
  );
}
