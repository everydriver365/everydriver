import { useState, useEffect } from "react";
import { MessageSquare, Send, Users, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pupil {
  id: string;
  name: string;
  phone: string | null;
}

interface BulkSMSDialogProps {
  instructorId: string;
  trigger?: React.ReactNode;
}

const MESSAGE_TEMPLATES = [
  { label: "Holiday Notice", text: "Hi! Just a reminder that I'm on holiday from [DATE] to [DATE]. I'll be in touch when I'm back to reschedule any lessons. Thanks!" },
  { label: "Schedule Change", text: "Hi! Due to unforeseen circumstances, I need to make some changes to our upcoming lessons. Please check your schedule and let me know if the new times work for you." },
  { label: "Test Reminder", text: "Hi! Just a friendly reminder about your upcoming driving test. Make sure to get a good night's sleep and arrive early. You've got this! 🚗" },
  { label: "Payment Reminder", text: "Hi! This is a friendly reminder about your outstanding lesson balance. Please settle when you can. Thanks!" },
];

export function BulkSMSDialog({ instructorId, trigger }: BulkSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupils, setSelectedPupils] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchPupils();
    }
  }, [open, instructorId]);

  const fetchPupils = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, phone")
        .eq("instructor_id", instructorId)
        .not("phone", "is", null)
        .order("name");

      if (error) throw error;
      setPupils(data || []);
      // Select all by default
      setSelectedPupils((data || []).map(p => p.id));
    } catch (error) {
      console.error("Error fetching pupils:", error);
      toast.error("Failed to load pupils");
    } finally {
      setLoading(false);
    }
  };

  const togglePupil = (pupilId: string) => {
    setSelectedPupils(prev =>
      prev.includes(pupilId)
        ? prev.filter(id => id !== pupilId)
        : [...prev, pupilId]
    );
  };

  const selectAll = () => {
    setSelectedPupils(pupils.map(p => p.id));
  };

  const selectNone = () => {
    setSelectedPupils([]);
  };

  const applyTemplate = (template: string) => {
    setMessage(template);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (selectedPupils.length === 0) {
      toast.error("Please select at least one pupil");
      return;
    }

    setSending(true);
    try {
      // Get selected pupils with phone numbers
      const recipientPupils = pupils.filter(p => selectedPupils.includes(p.id) && p.phone);
      
      // Send SMS to each pupil via edge function
      const results = await Promise.allSettled(
        recipientPupils.map(pupil =>
          supabase.functions.invoke("send-gap-sms", {
            body: {
              to: pupil.phone,
              message: message,
              pupilName: pupil.name,
            },
          })
        )
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`Sent to ${successful} pupil${successful > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.error(`Failed to send to ${failed} pupil${failed > 1 ? 's' : ''}`);
      }

      setOpen(false);
      setMessage("");
    } catch (error) {
      console.error("Error sending bulk SMS:", error);
      toast.error("Failed to send messages");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Bulk SMS
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Bulk SMS
          </DialogTitle>
          <DialogDescription>
            Send a message to multiple pupils at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Templates */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TEMPLATES.map((template) => (
                <Button
                  key={template.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template.text)}
                  className="text-xs"
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/160 characters
            </p>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients ({selectedPupils.length}/{pupils.length})
              </Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={selectNone} className="text-xs h-7">
                  None
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pupils.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pupils with phone numbers found
              </p>
            ) : (
              <div className="border rounded-2xl max-h-48 overflow-y-auto">
                {pupils.map((pupil) => (
                  <div
                    key={pupil.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => togglePupil(pupil.id)}
                  >
                    <Checkbox
                      checked={selectedPupils.includes(pupil.id)}
                      onCheckedChange={() => togglePupil(pupil.id)}
                    />
                    <span className="flex-1 text-sm">{pupil.name}</span>
                    {selectedPupils.includes(pupil.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || selectedPupils.length === 0 || !message.trim()}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send to {selectedPupils.length} Pupil{selectedPupils.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
