import { useState } from "react";
import { Send, Clock, Navigation, AlertCircle, X, Loader2, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface QuickMessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilName: string;
  pupilPhone: string | null;
  onSend?: (message: string) => Promise<void>;
}

interface MessageTemplate {
  id: string;
  icon: typeof Send;
  label: string;
  message: string;
  color: string;
}

const messageTemplates: MessageTemplate[] = [
  {
    id: "on-way",
    icon: Navigation,
    label: "On my way",
    message: "Hi {name}, I'm on my way! See you shortly 🚗",
    color: "text-emerald-500",
  },
  {
    id: "5-late",
    icon: Clock,
    label: "5 mins late",
    message: "Hi {name}, running about 5 minutes late. Apologies, see you soon!",
    color: "text-amber-500",
  },
  {
    id: "10-late",
    icon: Clock,
    label: "10 mins late",
    message: "Hi {name}, sorry but I'm running about 10 minutes late. I'll be there as soon as I can.",
    color: "text-orange-500",
  },
  {
    id: "be-ready",
    icon: AlertCircle,
    label: "Please be ready",
    message: "Hi {name}, just a reminder to be ready for your lesson. I'll be arriving shortly!",
    color: "text-blue-500",
  },
  {
    id: "cancelled",
    icon: X,
    label: "Lesson cancelled",
    message: "Hi {name}, unfortunately I need to cancel today's lesson. I apologise for the inconvenience. Let's reschedule soon.",
    color: "text-destructive",
  },
];

export function QuickMessageSheet({
  open,
  onOpenChange,
  pupilName,
  pupilPhone,
  onSend,
}: QuickMessageSheetProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  const formatMessage = (template: string) => {
    return template.replace("{name}", pupilName.split(" ")[0]);
  };

  const handleSend = async (template: MessageTemplate) => {
    if (!pupilPhone) {
      toast.error("No phone number available");
      return;
    }

    setSending(template.id);
    const message = formatMessage(template.message);

    try {
      if (onSend) {
        await onSend(message);
      } else {
        // Default: open SMS app
        const encodedMessage = encodeURIComponent(message);
        window.location.href = `sms:${pupilPhone}?body=${encodedMessage}`;
      }
      toast.success("Message ready to send");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(null);
    }
  };

  const handleCustomSend = () => {
    if (!pupilPhone || !customMessage.trim()) return;

    const encodedMessage = encodeURIComponent(customMessage);
    window.location.href = `sms:${pupilPhone}?body=${encodedMessage}`;
    setCustomMessage("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quick Message to {pupilName.split(" ")[0]}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pb-4">
          {/* Template buttons */}
          <div className="grid grid-cols-2 gap-2">
            {messageTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="flex items-center justify-start gap-2 h-auto py-3 px-3"
                onClick={() => handleSend(template)}
                disabled={sending !== null || !pupilPhone}
              >
                {sending === template.id ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <template.icon className={`h-4 w-4 shrink-0 ${template.color}`} />
                )}
                <span className="text-sm truncate">{template.label}</span>
              </Button>
            ))}
          </div>

          {/* Custom message */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Or type a custom message:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleCustomSend}
                disabled={!customMessage.trim() || !pupilPhone}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!pupilPhone && (
            <p className="text-xs text-destructive text-center">
              No phone number on file for this pupil
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
