import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInHours } from "date-fns";

interface RescheduleRequestFormProps {
  lessonId: string;
  pupilId: string;
  instructorId: string;
  originalDate: string;
  originalTime: string;
}

export function RescheduleRequestForm({
  lessonId, pupilId, instructorId, originalDate, originalTime
}: RescheduleRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Only allow reschedule 48h+ before lesson
  const lessonDateTime = new Date(`${originalDate}T${originalTime}`);
  const hoursUntil = differenceInHours(lessonDateTime, new Date());
  const canReschedule = hoursUntil >= 48;

  const handleSubmit = async () => {
    if (!date) { toast.error("Please select a new date"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("reschedule_requests").insert({
        lesson_id: lessonId,
        pupil_id: pupilId,
        instructor_id: instructorId,
        requested_date: date,
        requested_time: time || null,
        original_date: originalDate,
        original_time: originalTime,
        reason: reason || null,
      });
      if (error) throw error;
      toast.success("Reschedule request sent to your instructor");
      setOpen(false);
      setDate(""); setTime(""); setReason("");
    } catch {
      toast.error("Failed to send request");
    } finally {
      setSaving(false);
    }
  };

  if (!canReschedule) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-xs opacity-50">
        <CalendarClock className="h-3 w-3 mr-1" />
        Too late to reschedule
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <CalendarClock className="h-3 w-3 mr-1" />
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Reschedule</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Current: {format(parseISO(originalDate), "EEE d MMM")} at {originalTime}
        </p>
        <div className="space-y-3">
          <div>
            <Label>Preferred new date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={format(new Date(), "yyyy-MM-dd")} />
          </div>
          <div>
            <Label>Preferred time (optional)</Label>
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why do you need to reschedule?" rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={saving || !date} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />}
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
