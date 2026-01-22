import { useState } from "react";
import { Bell, Calendar, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  pupilId: string;
  selectedDate?: Date;
  onSuccess?: () => void;
}

const DAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const TIMES = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

export function WaitlistDialog({
  open,
  onOpenChange,
  instructorId,
  pupilId,
  selectedDate,
  onSuccess,
}: WaitlistDialogProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (selectedDate) {
      const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      return [dayMap[selectedDate.getDay()]];
    }
    return [];
  });
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleJoinWaitlist = async () => {
    if (selectedDays.length === 0 || selectedTimes.length === 0) {
      toast({
        title: "Select preferences",
        description: "Choose at least one day and time slot",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("lesson_waitlist").upsert(
        {
          pupil_id: pupilId,
          instructor_id: instructorId,
          preferred_days: selectedDays,
          preferred_times: selectedTimes,
          min_duration_mins: 60,
          max_duration_mins: 120,
          is_active: true,
        },
        { onConflict: "pupil_id,instructor_id" }
      );

      if (error) throw error;

      toast({
        title: "Joined waitlist!",
        description: "You'll be notified when matching slots open up",
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error joining waitlist:", error);
      toast({
        title: "Error",
        description: "Failed to join waitlist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Join the Waitlist
          </DialogTitle>
          <DialogDescription>
            Get notified when matching lesson slots become available
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Days */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Preferred Days
            </Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label
                  key={day.value}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedDays.includes(day.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                    className="sr-only"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Preferred Times
            </Label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((time) => (
                <label
                  key={time.value}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedTimes.includes(time.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Checkbox
                    checked={selectedTimes.includes(time.value)}
                    onCheckedChange={() => toggleTime(time.value)}
                    className="sr-only"
                  />
                  {time.label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>When a lesson is cancelled that matches your preferences, you'll receive a notification to book the slot.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleJoinWaitlist} disabled={saving} className="flex-1">
            {saving ? "Joining..." : "Join Waitlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
