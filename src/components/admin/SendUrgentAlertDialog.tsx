import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Instructor {
  id: string;
  name: string;
}

interface SendUrgentAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendUrgentAlertDialog({ open, onOpenChange }: SendUrgentAlertDialogProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      supabase
        .from("instructors")
        .select("id, name")
        .eq("is_active", true)
        .eq("is_network_placeholder", false)
        .order("name")
        .then(({ data }) => setInstructors(data || []));
    }
  }, [open]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!isBroadcast && !selectedInstructorId) {
      toast.error("Please select an instructor");
      return;
    }

    setSending(true);
    try {
      if (isBroadcast) {
        // Insert one alert per active instructor
        const inserts = instructors.map((i) => ({
          instructor_id: i.id,
          title: title.trim(),
          message: message.trim(),
          severity: "urgent",
          is_broadcast: true,
        }));

        const { error } = await supabase.from("urgent_alerts").insert(inserts);
        if (error) throw error;
        toast.success(`Urgent alert sent to ${instructors.length} instructors`);
      } else {
        const { error } = await supabase.from("urgent_alerts").insert({
          instructor_id: selectedInstructorId,
          title: title.trim(),
          message: message.trim(),
          severity: "urgent",
          is_broadcast: false,
        });
        if (error) throw error;
        const name = instructors.find((i) => i.id === selectedInstructorId)?.name;
        toast.success(`Urgent alert sent to ${name}`);
      }

      setTitle("");
      setMessage("");
      setSelectedInstructorId("");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send alert");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Send Urgent Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <Label>Broadcast to all instructors</Label>
            <Switch checked={isBroadcast} onCheckedChange={setIsBroadcast} />
          </div>

          {!isBroadcast && (
            <div className="space-y-1.5">
              <Label>Select Instructor</Label>
              <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose instructor..." />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Road Closure Alert"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the urgent message..."
              rows={4}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-destructive hover:bg-destructive/90 text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Urgent Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
