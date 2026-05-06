import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { CalendarEvent } from "@/hooks/useInstructorCalendar";

interface Props {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240];
const BLOCK_TYPES = ["personal", "break", "holiday", "admin", "other"];

export function EditScheduleEntryDialog({ event, open, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [pickup, setPickup] = useState("");
  const [notes, setNotes] = useState("");
  const [blockType, setBlockType] = useState("personal");
  const [saving, setSaving] = useState(false);

  const isEditable = event?.type === "lesson" || event?.type === "block";

  useEffect(() => {
    if (!event || !open) return;
    setDate(format(event.start, "yyyy-MM-dd"));
    setStartTime(format(event.start, "HH:mm"));
    const mins = Math.round((event.end.getTime() - event.start.getTime()) / 60000);
    setDuration(mins);
    setTitle(event.title || "");
    if (event.type === "lesson") {
      setPickup(event.data?.pickup_address || event.data?.pickup_location || "");
      setNotes(event.data?.notes || "");
    } else if (event.type === "block") {
      setNotes(event.data?.notes || "");
      setBlockType(event.data?.block_type || "personal");
    }
  }, [event, open]);

  const endTimePreview = useMemo(() => {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + duration;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  }, [startTime, duration]);

  if (!event || !isEditable) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (event.type === "lesson") {
        const { error } = await supabase
          .from("scheduled_lessons")
          .update({
            lesson_date: date,
            start_time: `${startTime}:00`,
            duration_minutes: duration,
            pickup_location: pickup || null,
            notes: notes || null,
          })
          .eq("id", event.id);
        if (error) throw error;
      } else {
        const start = new Date(`${date}T${startTime}:00`);
        const end = new Date(start.getTime() + duration * 60000);
        const { error } = await supabase
          .from("instructor_manual_blocks")
          .update({
            title,
            start_datetime: start.toISOString(),
            end_datetime: end.toISOString(),
            block_type: blockType,
            notes: notes || null,
          })
          .eq("id", event.id);
        if (error) throw error;
      }
      toast.success("Updated");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.includes("Lesson clash") ? "Time clashes with another lesson" : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Edit {event.type === "lesson" ? "lesson" : "block"}</DialogTitle>
          <DialogDescription>
            Update the details below. Ends at {endTimePreview || "—"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {event.type === "block" && (
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Start time</Label>
              <Input id="time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m < 60 ? `${m} min` : `${(m / 60).toString().replace(/\.0$/, "")} hr${m >= 120 ? "s" : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {event.type === "lesson" && (
            <div className="space-y-1.5">
              <Label htmlFor="pickup">Pickup location</Label>
              <Input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Address or postcode" />
            </div>
          )}

          {event.type === "block" && (
            <div className="space-y-1.5">
              <Label>Block type</Label>
              <Select value={blockType} onValueChange={setBlockType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !date || !startTime}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
