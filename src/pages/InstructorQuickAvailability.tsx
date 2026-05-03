import { useState, useEffect, useMemo } from "react";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addWeeks, subWeeks, startOfWeek, addDays, subDays, isSameDay, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Pencil, X } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { AvailabilityRulesManager } from "@/components/instructor/AvailabilityRulesManager";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface TimeSlot {
  start: string;
  end: string;
}

interface DateOverride {
  id: string;
  override_date: string;
  override_end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function InstructorQuickAvailability() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [editForm, setEditForm] = useState({
    isAvailable: true,
    timeSlots: [{ start: "09:00", end: "17:00" }] as TimeSlot[],
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    if (instructorId) {
      fetchData();
    }
  }, [instructorId, currentWeekStart]);

  const fetchData = async () => {
    if (!instructorId) return;
    
    setLoading(true);
    try {
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

      const [overridesRes, workingHoursRes] = await Promise.all([
        supabase
          .from("instructor_date_overrides")
          .select("*")
          .eq("instructor_id", instructorId)
          .gte("override_date", startDate)
          .lte("override_date", endDate),
        supabase
          .from("instructor_working_hours")
          .select("*")
          .eq("instructor_id", instructorId),
      ]);

      if (overridesRes.data) {
        setOverrides(overridesRes.data);
      }
      if (workingHoursRes.data) {
        setWorkingHours(workingHoursRes.data);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const getDateAvailability = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    // Get all overrides for this date
    const dateOverrides = overrides.filter(o => o.override_date === dateStr);
    
    if (dateOverrides.length > 0) {
      // Check if any override marks unavailable
      const unavailableOverride = dateOverrides.find(o => !o.is_available);
      if (unavailableOverride) {
        return {
          hasOverride: true,
          isAvailable: false,
          timeSlots: [],
        };
      }
      
      // Get all time slots from overrides
      const timeSlots = dateOverrides
        .filter(o => o.is_available && o.start_time && o.end_time)
        .map(o => ({
          start: o.start_time!,
          end: o.end_time!,
        }));
      
      return {
        hasOverride: true,
        isAvailable: true,
        timeSlots,
      };
    }

    const dayOfWeek = date.getDay();
    const defaultHours = workingHours.find(w => w.day_of_week === dayOfWeek);
    
    if (defaultHours && defaultHours.is_active) {
      return {
        hasOverride: false,
        isAvailable: true,
        timeSlots: [{ start: defaultHours.start_time, end: defaultHours.end_time }],
      };
    }

    return {
      hasOverride: false,
      isAvailable: false,
      timeSlots: [],
    };
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const openEditSheet = (date: Date) => {
    const availability = getDateAvailability(date);
    setEditingDate(date);
    setEditForm({
      isAvailable: availability.isAvailable,
      timeSlots: availability.timeSlots.length > 0 
        ? availability.timeSlots.map(s => ({ start: s.start.slice(0, 5), end: s.end.slice(0, 5) }))
        : [{ start: "09:00", end: "17:00" }],
    });
  };

  const addTimeSlot = () => {
    setEditForm({
      ...editForm,
      timeSlots: [...editForm.timeSlots, { start: "12:00", end: "14:00" }],
    });
  };

  const removeTimeSlot = (index: number) => {
    if (editForm.timeSlots.length <= 1) return;
    setEditForm({
      ...editForm,
      timeSlots: editForm.timeSlots.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...editForm.timeSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setEditForm({ ...editForm, timeSlots: newSlots });
  };

  const saveOverride = async () => {
    if (!instructorId || !editingDate) return;

    const dateStr = format(editingDate, "yyyy-MM-dd");
    
    try {
      // First, delete all existing overrides for this date
      const { error: deleteError } = await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("override_date", dateStr);

      if (deleteError) throw deleteError;

      if (!editForm.isAvailable) {
        // Insert single unavailable override
        const { error } = await supabase
          .from("instructor_date_overrides")
          .insert({
            instructor_id: instructorId,
            override_date: dateStr,
            is_available: false,
            start_time: null,
            end_time: null,
          });

        if (error) throw error;
      } else {
        // Insert multiple time slot overrides
        const inserts = editForm.timeSlots.map(slot => ({
          instructor_id: instructorId,
          override_date: dateStr,
          is_available: true,
          start_time: slot.start,
          end_time: slot.end,
        }));

        const { error } = await supabase
          .from("instructor_date_overrides")
          .insert(inserts);

        if (error) throw error;
      }

      toast.success("Availability updated");
      setEditingDate(null);
      fetchData();
    } catch (error) {
      console.error("Error saving override:", error);
      toast.error("Failed to save changes");
    }
  };

  const removeOverride = async () => {
    if (!editingDate || !instructorId) return;
    
    const dateStr = format(editingDate, "yyyy-MM-dd");
    
    try {
      const { error } = await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("override_date", dateStr);

      if (error) throw error;

      toast.success("Override removed - using default hours");
      setEditingDate(null);
      fetchData();
    } catch (error) {
      console.error("Error removing override:", error);
      toast.error("Failed to remove override");
    }
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <PageSkeleton />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">My Availability</h1>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">
            {format(currentWeekStart, "MMMM yyyy")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Day Cards */}
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            weekDays.map((date) => {
              const availability = getDateAvailability(date);
              const isToday = isSameDay(date, new Date());
              const isPast = date < new Date() && !isToday;

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border bg-white",
                    isToday && "border-primary/50",
                    isPast && "opacity-60"
                  )}
                >
                  {/* Day Circle */}
                  <div className="flex flex-col items-center w-12">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {format(date, "EEE")}
                    </span>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      availability.isAvailable 
                        ? "border-muted-foreground/30" 
                        : "border-muted-foreground/20 bg-muted"
                    )}>
                      <span className="text-lg font-semibold">
                        {format(date, "d")}
                      </span>
                    </div>
                  </div>

                  {/* Availability Info */}
                  <div className="flex-1 min-w-0">
                    {availability.isAvailable ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                          Available
                        </span>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {availability.timeSlots.map((slot, idx) => (
                            <div key={idx}>
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-sm">Unavailable</span>
                        <div className="text-sm text-muted-foreground">All day</div>
                      </>
                    )}
                    {availability.hasOverride && (
                      <span className="text-xs text-primary">
                        (Override)
                      </span>
                    )}
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditSheet(date)}
                    disabled={isPast}
                    className="text-primary shrink-0"
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center px-4">
          Changes made here will override your default working hours and Google Calendar sync.
        </p>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editingDate} onOpenChange={(open) => !open && setEditingDate(null)}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingDate && format(editingDate, "EEEE, MMMM d, yyyy")}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Available Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="available-toggle" className="text-base">
                Available on this day
              </Label>
              <Switch
                id="available-toggle"
                checked={editForm.isAvailable}
                onCheckedChange={(checked) => 
                  setEditForm({ ...editForm, isAvailable: checked })
                }
              />
            </div>

            {/* Time Slots */}
            {editForm.isAvailable && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Time Slots</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTimeSlot}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
                
                {editForm.timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Start
                      </Label>
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        End
                      </Label>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    {editForm.timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                        className="text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={removeOverride}
                className="flex-1"
              >
                Reset to Default
              </Button>
              <Button onClick={saveOverride} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Availability Rules Engine */}
      {instructorId && <AvailabilityRulesManager instructorId={instructorId} />}
    </InstructorPortalLayout>
  );
}
