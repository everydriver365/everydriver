import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AvailabilityCalendarProps {
  instructorId: string;
  onClose?: () => void;
}

const WEEKDAYS = ["SUN", "MON", "TUES", "WED", "THURS", "FRI", "SAT"];

export function AvailabilityCalendar({ instructorId, onClose }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [existingAvailability, setExistingAvailability] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding for first week
  const firstDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  useEffect(() => {
    fetchExistingAvailability();
  }, [instructorId, currentMonth]);

  const fetchExistingAvailability = async () => {
    setLoading(true);
    try {
      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");

      // Fetch working hours and overrides
      const [workingHoursRes, overridesRes] = await Promise.all([
        supabase
          .from("instructor_working_hours")
          .select("*")
          .eq("instructor_id", instructorId),
        supabase
          .from("instructor_date_overrides")
          .select("*")
          .eq("instructor_id", instructorId)
          .gte("override_date", startDate)
          .lte("override_date", endDate),
      ]);

      const availableDates = new Set<string>();
      const workingHours = workingHoursRes.data || [];
      const overrides = overridesRes.data || [];

      // Build availability map
      daysInMonth.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayOfWeek = getDay(date);
        
        // Check for overrides first
        const dateOverrides = overrides.filter(o => o.override_date === dateStr);
        if (dateOverrides.length > 0) {
          const isAvailable = dateOverrides.some(o => o.is_available);
          if (isAvailable) {
            availableDates.add(dateStr);
          }
        } else {
          // Fall back to working hours
          const defaultHours = workingHours.find(w => w.day_of_week === dayOfWeek);
          if (defaultHours?.is_active) {
            availableDates.add(dateStr);
          }
        }
      });

      setExistingAvailability(availableDates);
      setSelectedDates(new Set(availableDates));
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const today = startOfDay(new Date());
    
    // Don't allow toggling past dates
    if (isBefore(date, today)) return;

    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = startOfDay(new Date());
      
      // Get all dates that changed
      const addedDates: string[] = [];
      const removedDates: string[] = [];

      daysInMonth.forEach(date => {
        if (isBefore(date, today)) return; // Skip past dates
        
        const dateStr = format(date, "yyyy-MM-dd");
        const wasAvailable = existingAvailability.has(dateStr);
        const isNowSelected = selectedDates.has(dateStr);

        if (!wasAvailable && isNowSelected) {
          addedDates.push(dateStr);
        } else if (wasAvailable && !isNowSelected) {
          removedDates.push(dateStr);
        }
      });

      // Delete existing overrides for changed dates
      const allChangedDates = [...addedDates, ...removedDates];
      if (allChangedDates.length > 0) {
        await supabase
          .from("instructor_date_overrides")
          .delete()
          .eq("instructor_id", instructorId)
          .in("override_date", allChangedDates);
      }

      // Insert new overrides for added dates (mark as available)
      if (addedDates.length > 0) {
        const inserts = addedDates.map(dateStr => ({
          instructor_id: instructorId,
          override_date: dateStr,
          is_available: true,
          start_time: "09:00",
          end_time: "17:00",
        }));
        await supabase.from("instructor_date_overrides").insert(inserts);
      }

      // Insert new overrides for removed dates (mark as unavailable)
      if (removedDates.length > 0) {
        const inserts = removedDates.map(dateStr => ({
          instructor_id: instructorId,
          override_date: dateStr,
          is_available: false,
          start_time: null,
          end_time: null,
        }));
        await supabase.from("instructor_date_overrides").insert(inserts);
      }

      toast.success("Availability updated successfully");
      setExistingAvailability(new Set(selectedDates));
      onClose?.();
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (selectedDates.size !== existingAvailability.size) return true;
    for (const date of selectedDates) {
      if (!existingAvailability.has(date)) return true;
    }
    return false;
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), i, 1);
    return { value: i.toString(), label: format(date, "MMMM") };
  });

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Select Month</span>
        <Select
          value={currentMonth.getMonth().toString()}
          onValueChange={(value) => {
            const newMonth = new Date(currentMonth.getFullYear(), parseInt(value), 1);
            setCurrentMonth(newMonth);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month Title */}
      <h3 className="text-xl font-semibold text-center text-muted-foreground">
        {format(currentMonth, "MMM yyyy").toUpperCase()}
      </h3>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Padding for first week */}
            {paddingDays.map((_, index) => (
              <div key={`pad-${index}`} className="aspect-square" />
            ))}
            
            {/* Calendar Days */}
            {daysInMonth.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const isSelected = selectedDates.has(dateStr);
              const isToday = isSameDay(date, new Date());
              const isPast = isBefore(date, startOfDay(new Date()));

              return (
                <button
                  key={dateStr}
                  onClick={() => toggleDate(date)}
                  disabled={isPast}
                  className={cn(
                    "aspect-square rounded-lg border-2 flex flex-col items-start justify-start p-2 transition-all duration-200 relative",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted/50 border-border text-foreground hover:border-muted-foreground/40",
                    isToday && !isSelected && "ring-2 ring-primary ring-offset-2",
                    isPast && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className={cn(
                    "text-lg font-semibold",
                    isToday && !isSelected && "text-primary"
                  )}>
                    {format(date, "d")}
                  </span>
                  {isSelected && (
                    <Check className="absolute bottom-2 right-2 h-4 w-4 text-primary-foreground/80" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted border border-border" />
          <span>Unavailable</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSave} 
          disabled={saving || !hasChanges()}
          className="min-w-[120px]"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
