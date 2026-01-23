import { useState, useEffect } from "react";
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Plus, X, Clock } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
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
    startTime: "09:00",
    endTime: "17:00",
    additionalSlots: [] as { start: string; end: string }[],
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
    const override = overrides.find(o => o.override_date === dateStr);
    
    if (override) {
      return {
        hasOverride: true,
        isAvailable: override.is_available,
        startTime: override.start_time,
        endTime: override.end_time,
        override,
      };
    }

    const dayOfWeek = date.getDay();
    const defaultHours = workingHours.find(w => w.day_of_week === dayOfWeek);
    
    if (defaultHours && defaultHours.is_active) {
      return {
        hasOverride: false,
        isAvailable: true,
        startTime: defaultHours.start_time,
        endTime: defaultHours.end_time,
      };
    }

    return {
      hasOverride: false,
      isAvailable: false,
      startTime: null,
      endTime: null,
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
      startTime: availability.startTime?.slice(0, 5) || "09:00",
      endTime: availability.endTime?.slice(0, 5) || "17:00",
      additionalSlots: [],
    });
  };

  const saveOverride = async () => {
    if (!instructorId || !editingDate) return;

    const dateStr = format(editingDate, "yyyy-MM-dd");
    
    try {
      // Check if override exists
      const existingOverride = overrides.find(o => o.override_date === dateStr);

      if (existingOverride) {
        // Update existing
        const { error } = await supabase
          .from("instructor_date_overrides")
          .update({
            is_available: editForm.isAvailable,
            start_time: editForm.isAvailable ? editForm.startTime : null,
            end_time: editForm.isAvailable ? editForm.endTime : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOverride.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("instructor_date_overrides")
          .insert({
            instructor_id: instructorId,
            override_date: dateStr,
            is_available: editForm.isAvailable,
            start_time: editForm.isAvailable ? editForm.startTime : null,
            end_time: editForm.isAvailable ? editForm.endTime : null,
          });

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
    if (!editingDate) return;
    
    const dateStr = format(editingDate, "yyyy-MM-dd");
    const existingOverride = overrides.find(o => o.override_date === dateStr);
    
    if (!existingOverride) {
      toast.info("No override to remove");
      setEditingDate(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("id", existingOverride.id);

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
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                    "flex items-center gap-3 p-4 rounded-lg border bg-card",
                    isToday && "border-primary/50 bg-primary/5",
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
                  <div className="flex-1">
                    {availability.isAvailable ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                          Available
                        </span>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
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
                    className="text-primary"
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
        <SheetContent side="bottom" className="rounded-t-xl">
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

            {/* Time Inputs */}
            {editForm.isAvailable && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time" className="text-sm text-muted-foreground">
                      Start Time
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => 
                        setEditForm({ ...editForm, startTime: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-sm text-muted-foreground">
                      End Time
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => 
                        setEditForm({ ...editForm, endTime: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
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
    </InstructorPortalLayout>
  );
}
