import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CompetencyPicker } from "./CompetencyPicker";

interface LessonSlot {
  id: string;
  date: Date;
  startTime: string;
  duration: number; // in hours
}

interface ScheduleLessonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupil: {
    id: string;
    name: string;
    address: string;
    postcode: string;
    prepaid_hours: number;
    scheduled_hours: number;
  };
  instructorId: string;
  onSuccess: () => void;
}

const TIME_OPTIONS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00"
];

const DURATION_OPTIONS = [
  { value: "1", label: "1 hour" },
  { value: "1.5", label: "1.5 hours" },
  { value: "2", label: "2 hours" },
  { value: "2.5", label: "2.5 hours" },
  { value: "3", label: "3 hours" },
];

export function ScheduleLessonsDialog({
  open,
  onOpenChange,
  pupil,
  instructorId,
  onSuccess,
}: ScheduleLessonsDialogProps) {
  const remainingHours = (pupil.prepaid_hours || 0) - (pupil.scheduled_hours || 0);
  
  const [slots, setSlots] = useState<LessonSlot[]>([
    { id: crypto.randomUUID(), date: addDays(new Date(), 1), startTime: "09:00", duration: 2 }
  ]);
  const [pickupLocation, setPickupLocation] = useState(
    (pupil as any).pickup_address || pupil.address || ""
  );
  const [plannedCompetencies, setPlannedCompetencies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const totalScheduledHours = slots.reduce((sum, s) => sum + s.duration, 0);
  const isOverBooked = totalScheduledHours > remainingHours;

  const addSlot = () => {
    const lastSlot = slots[slots.length - 1];
    const newDate = lastSlot ? addDays(lastSlot.date, 7) : addDays(new Date(), 1);
    
    setSlots([
      ...slots,
      { 
        id: crypto.randomUUID(), 
        date: newDate, 
        startTime: "09:00", 
        duration: 2 
      }
    ]);
  };

  const removeSlot = (id: string) => {
    if (slots.length > 1) {
      setSlots(slots.filter(s => s.id !== id));
    }
  };

  const updateSlot = (id: string, field: keyof LessonSlot, value: Date | string | number) => {
    setSlots(slots.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    if (slots.length === 0) {
      toast.error("Please add at least one lesson slot");
      return;
    }

    setIsSaving(true);
    try {
      // Create all lessons
      const lessonInserts = slots.map(slot => ({
        instructor_id: instructorId,
        pupil_id: pupil.id,
        lesson_date: format(slot.date, 'yyyy-MM-dd'),
        start_time: slot.startTime,
        duration_minutes: slot.duration * 60,
        pickup_location: pickupLocation,
        pickup_postcode: pupil.postcode,
        status: 'scheduled',
        payment_status: 'pending',
        planned_competencies: plannedCompetencies.length > 0 ? plannedCompetencies : null,
      }));

      const { error: lessonsError } = await supabase
        .from('scheduled_lessons')
        .insert(lessonInserts);

      if (lessonsError) throw lessonsError;

      // Update pupil scheduling status if fully scheduled
      const newTotalScheduled = (pupil.scheduled_hours || 0) + totalScheduledHours;
      if (newTotalScheduled >= (pupil.prepaid_hours || 0)) {
        await supabase
          .from('pupils')
          .update({ 
            scheduling_status: 'scheduled',
            next_lesson: format(slots[0].date, 'yyyy-MM-dd')
          })
          .eq('id', pupil.id);
      } else {
        // Just update next lesson date
        const sortedSlots = [...slots].sort((a, b) => a.date.getTime() - b.date.getTime());
        await supabase
          .from('pupils')
          .update({ next_lesson: format(sortedSlots[0].date, 'yyyy-MM-dd') })
          .eq('id', pupil.id);
      }

      // Trigger notification to pupil
      try {
        await supabase.functions.invoke('notify-lessons-scheduled', {
          body: {
            pupilId: pupil.id,
            instructorId,
            lessons: slots.map(s => ({
              date: format(s.date, 'yyyy-MM-dd'),
              time: s.startTime,
              duration: s.duration,
            })),
          },
        });
      } catch (notifyError) {
        console.error("Notification error (non-fatal):", notifyError);
      }

      onSuccess();
    } catch (error) {
      console.error("Error scheduling lessons:", error);
      toast.error("Failed to schedule lessons");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Lessons for {pupil.name}</DialogTitle>
          <DialogDescription>
            Add lesson times to schedule {remainingHours} hours of prepaid lessons
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Hours Summary */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted">
            <div className="text-sm">
              <span className="text-muted-foreground">Remaining to schedule:</span>
              <span className="ml-2 font-semibold">{remainingHours} hours</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Currently adding:</span>
              <span className={cn(
                "ml-2 font-semibold",
                isOverBooked ? "text-destructive" : "text-primary"
              )}>
                {totalScheduledHours} hours
              </span>
            </div>
          </div>

          {isOverBooked && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              You're scheduling more hours than the pupil has prepaid. This will add extra lessons beyond their package.
            </div>
          )}

          {/* Pickup Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pickup Location
            </Label>
            <Input
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Enter pickup address"
            />
          </div>

          {/* Planned Competencies */}
          <div className="space-y-2">
            <Label>Skills to Practice (optional)</Label>
            <CompetencyPicker
              selected={plannedCompetencies}
              onChange={setPlannedCompetencies}
            />
          </div>

          {/* Lesson Slots */}
          <div className="space-y-3">
            <Label>Lesson Slots</Label>
            
            {slots.map((slot, index) => (
              <div 
                key={slot.id} 
                className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border bg-card"
              >
                <Badge variant="secondary" className="mr-2">
                  Lesson {index + 1}
                </Badge>
                
                {/* Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[140px] justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(slot.date, "MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={slot.date}
                      onSelect={(date) => date && updateSlot(slot.id, 'date', date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Time Select */}
                <Select 
                  value={slot.startTime} 
                  onValueChange={(v) => updateSlot(slot.id, 'startTime', v)}
                >
                  <SelectTrigger className="w-[100px]">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Duration Select */}
                <Select 
                  value={String(slot.duration)} 
                  onValueChange={(v) => updateSlot(slot.id, 'duration', parseFloat(v))}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Remove Button */}
                {slots.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeSlot(slot.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button 
              variant="outline" 
              onClick={addSlot}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Lesson
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || slots.length === 0}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  Schedule {slots.length} Lesson{slots.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
