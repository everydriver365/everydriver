import { useState, useEffect } from "react";
import { CalendarPlus, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { useToast } from "@/hooks/use-toast";
import { demoSchoolInstructors, demoSchoolPupils } from "@/data/demoSchoolData";

interface BookingPrefill {
  instructorId?: string;
  date?: string;
  time?: string;
  duration?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  instructorIds: string[];
  prefill?: BookingPrefill;
}

export default function SchoolTakeBookingModal({ open, onClose, instructorIds, prefill }: Props) {
  const { isDemo } = useSchoolDemo();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pupilName: "",
    pupilEmail: "",
    pupilPhone: "",
    instructorId: "",
    date: "",
    time: "",
    duration: "60",
    notes: "",
  });

  // Apply prefill whenever modal opens with prefill values
  useEffect(() => {
    if (open && prefill) {
      setForm(f => ({
        ...f,
        instructorId: prefill.instructorId ?? f.instructorId,
        date: prefill.date ?? f.date,
        time: prefill.time ?? f.time,
        duration: prefill.duration ?? f.duration,
      }));
    }
  }, [open, prefill]);

  const instructors = isDemo
    ? demoSchoolInstructors.map(i => ({ id: i.instructor_id, name: i.instructors.name }))
    : [];

  const pupils = isDemo ? demoSchoolPupils : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pupilName || !form.instructorId || !form.date || !form.time) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);

    if (isDemo) {
      await new Promise(r => setTimeout(r, 800));
      toast({ title: "Demo mode", description: "Booking created (demo — no changes saved)." });
    } else {
      // Real implementation would insert into scheduled_lessons
      toast({ title: "Booking created", description: `Lesson booked for ${form.pupilName}.` });
    }

    setSaving(false);
    setForm({ pupilName: "", pupilEmail: "", pupilPhone: "", instructorId: "", date: "", time: "", duration: "60", notes: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Take a Booking
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Assign Instructor *</Label>
            <Select value={form.instructorId} onValueChange={v => setForm(f => ({ ...f, instructorId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger>
              <SelectContent>
                {instructors.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pupil Name *</Label>
            <Input
              placeholder="Enter pupil name or select existing"
              value={form.pupilName}
              onChange={e => setForm(f => ({ ...f, pupilName: e.target.value }))}
              list="pupil-suggestions"
            />
            <datalist id="pupil-suggestions">
              {pupils.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="pupil@email.com"
                value={form.pupilEmail}
                onChange={e => setForm(f => ({ ...f, pupilEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="07700 000000"
                value={form.pupilPhone}
                onChange={e => setForm(f => ({ ...f, pupilPhone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
