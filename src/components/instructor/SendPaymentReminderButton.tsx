import { useState } from "react";
import { Bell, Loader2, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendPaymentReminderButtonProps {
  pupilId: string;
  pupilName: string;
  pupilPhone?: string | null;
  pupilEmail?: string | null;
  instructorId: string;
  instructorName: string;
  outstandingAmount: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SendPaymentReminderButton({
  pupilId,
  pupilName,
  pupilPhone,
  pupilEmail,
  instructorId,
  instructorName,
  outstandingAmount,
  variant = "outline",
  size = "sm",
  className,
}: SendPaymentReminderButtonProps) {
  const [sending, setSending] = useState(false);

  const handleSendReminder = async (method: "sms" | "email") => {
    if (method === "sms" && !pupilPhone) {
      toast.error("No phone number available for this pupil");
      return;
    }
    if (method === "email" && !pupilEmail) {
      toast.error("No email available for this pupil");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
        body: {
          instructorId,
          instructorName,
          pupilIds: [pupilId],
        },
      });

      if (error) throw error;

      if (data.sent > 0) {
        toast.success(`Payment reminder sent to ${pupilName}`);
      } else if (data.skipped > 0) {
        toast.error("Pupil has no phone number");
      } else if (data.failed > 0) {
        toast.error("Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send payment reminder");
    } finally {
      setSending(false);
    }
  };

  // Only show if there's an outstanding balance
  if (outstandingAmount >= 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={sending}>
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          <span className="ml-1.5 text-xs">Remind</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleSendReminder("sms")}
          disabled={!pupilPhone}
          className="cursor-pointer"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Send SMS
          {!pupilPhone && <span className="text-xs text-muted-foreground ml-auto">(no phone)</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
