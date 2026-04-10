import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AvailabilityCalendarProps {
  instructorId: string;
  onClose?: () => void;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DateAvailability {
  timeSlots: TimeSlot[];
  hasOverride: boolean;
}

const WEEKDAYS = ["SUN", "MON", "TUES", "WED", "THURS", "FRI", "SAT"];

const PRESET_TIME_SLOTS = [
  { label: "Morning (09:00 - 12:00)", start: "09:00", end: "12:00" },
  { label: "Afternoon (12:00 - 17:00)", start: "12:00", end: "17:00" },
  { label: "Full Day (09:00 - 17:00)", start: "09:00", end: "17:00" },
  { label: "Extended (09:00 - 18:00)", start: "09:00", end: "18:00" },
  { label: "Early Morning (07:00 - 12:00)", start: "07:00", end: "12:00" },
  { label: "Evening (17:00 - 20:00)", start: "17:00", end: "20:00" },
];

export function AvailabilityCalendar({ instructorId, onClose }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, DateAvailability>>(new Map());
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDatePopover, setOpenDatePopover] = useState<string | null>(null);
  const [editingSlots, setEditingSlots] = useState<TimeSlot[]>([]);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const firstDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  useEffect(() => {
    fetchAvailability();
  }, [instructorId, currentMonth]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const startDate = format(monthStart, "yyyy-MM-dd");
      const endDate = format(monthEnd, "yyyy-MM-dd");

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

      const workingHoursData = workingHoursRes.data || [];
      const overrides = overridesRes.data || [];
      setWorkingHours(workingHoursData);

      const newMap = new Map<string, DateAvailability>();

      daysInMonth.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayOfWeek = getDay(date);
        
        const dateOverrides = overrides.filter(o => o.override_date === dateStr);
        
        if (dateOverrides.length > 0) {
          const unavailableOverride = dateOverrides.find(o => !o.is_available);
          if (unavailableOverride) {
            newMap.set(dateStr, { timeSlots: [], hasOverride: true });
          } else {
            const timeSlots = dateOverrides
              .filter(o => o.is_available && o.start_time && o.end_time)
              .map(o => ({
                start: o.start_time!.slice(0, 5),
                end: o.end_time!.slice(0, 5),
              }));
            newMap.set(dateStr, { timeSlots, hasOverride: true });
          }
        } else {
          const defaultHours = workingHoursData.find(w => w.day_of_week === dayOfWeek);
          if (defaultHours?.is_active) {
            newMap.set(dateStr, {
              timeSlots: [{
                start: defaultHours.start_time.slice(0, 5),
                end: defaultHours.end_time.slice(0, 5),
              }],
              hasOverride: false,
            });
          } else {
            newMap.set(dateStr, { timeSlots: [], hasOverride: false });
          }
        }
      });

      setAvailabilityMap(newMap);
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const openDateEditor = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const availability = availabilityMap.get(dateStr);
    
    if (availability && availability.timeSlots.length > 0) {
      setEditingSlots([...availability.timeSlots]);
    } else {
      setEditingSlots([{ start: "09:00", end: "17:00" }]);
    }
    setSelectedPreset("");
    setOpenDatePopover(dateStr);
  };

  const addPresetSlot = () => {
    if (!selectedPreset) return;
    const preset = PRESET_TIME_SLOTS.find(p => `${p.start}-${p.end}` === selectedPreset);
    if (preset) {
      setEditingSlots([...editingSlots, { start: preset.start, end: preset.end }]);
      setSelectedPreset("");
    }
  };

  const addCustomSlot = () => {
    setEditingSlots([...editingSlots, { start: "12:00", end: "14:00" }]);
  };

  const removeSlot = (index: number) => {
    setEditingSlots(editingSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...editingSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setEditingSlots(newSlots);
  };

  const saveDate = async (dateStr: string) => {
    setSavingDate(dateStr);
    try {
      // Delete existing overrides
      await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("override_date", dateStr);

      if (editingSlots.length === 0) {
        // Mark as unavailable
        await supabase.from("instructor_date_overrides").insert({
          instructor_id: instructorId,
          override_date: dateStr,
          is_available: false,
          start_time: null,
          end_time: null,
        });
      } else {
        // Insert all time slots
        const inserts = editingSlots.map(slot => ({
          instructor_id: instructorId,
          override_date: dateStr,
          is_available: true,
          start_time: slot.start,
          end_time: slot.end,
        }));
        await supabase.from("instructor_date_overrides").insert(inserts);
      }

      // Update local state
      setAvailabilityMap(prev => {
        const newMap = new Map(prev);
        newMap.set(dateStr, {
          timeSlots: [...editingSlots],
          hasOverride: true,
        });
        return newMap;
      });

      toast.success("Availability saved");
      setOpenDatePopover(null);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setSavingDate(null);
    }
  };

  const resetToDefault = async (dateStr: string) => {
    setSavingDate(dateStr);
    try {
      await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("override_date", dateStr);

      // Recalculate from working hours
      const date = new Date(dateStr);
      const dayOfWeek = getDay(date);
      const defaultHours = workingHours.find(w => w.day_of_week === dayOfWeek);

      setAvailabilityMap(prev => {
        const newMap = new Map(prev);
        if (defaultHours?.is_active) {
          newMap.set(dateStr, {
            timeSlots: [{
              start: defaultHours.start_time.slice(0, 5),
              end: defaultHours.end_time.slice(0, 5),
            }],
            hasOverride: false,
          });
        } else {
          newMap.set(dateStr, { timeSlots: [], hasOverride: false });
        }
        return newMap;
      });

      toast.success("Reset to default hours");
      setOpenDatePopover(null);
    } catch (error) {
      console.error("Error resetting:", error);
      toast.error("Failed to reset");
    } finally {
      setSavingDate(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
            {paddingDays.map((_, index) => (
              <div key={`pad-${index}`} className="aspect-square" />
            ))}
            
            {daysInMonth.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const availability = availabilityMap.get(dateStr);
              const hasSlots = availability && availability.timeSlots.length > 0;
              const isToday = isSameDay(date, new Date());
              const isPast = isBefore(date, startOfDay(new Date()));

              return (
                <Popover 
                  key={dateStr} 
                  open={openDatePopover === dateStr}
                  onOpenChange={(open) => {
                    if (open && !isPast) {
                      openDateEditor(date);
                    } else {
                      setOpenDatePopover(null);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      disabled={isPast}
                      className={cn(
                        "aspect-square rounded-none border-2 flex flex-col items-start justify-start p-2 transition-all duration-200 relative",
                        hasSlots
                          ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted/50 border-border text-foreground hover:border-muted-foreground/40",
                        isToday && !hasSlots && "ring-2 ring-primary ring-offset-2",
                        isPast && "opacity-50 cursor-not-allowed",
                        availability?.hasOverride && "ring-1 ring-offset-1 ring-accent"
                      )}
                    >
                      <span className={cn(
                        "text-lg font-semibold",
                        isToday && !hasSlots && "text-primary"
                      )}>
                        {format(date, "d")}
                      </span>
                      {hasSlots && (
                        <Check className="absolute bottom-2 right-2 h-4 w-4 text-primary-foreground/80" />
                      )}
                    </button>
                  </PopoverTrigger>
                  
                  <PopoverContent className="w-80 p-0" align="start">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-primary text-primary-foreground px-4 py-3 rounded-none">
                      <span className="font-medium">
                        {format(date, "EEE MMM dd yyyy")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                        onClick={() => setOpenDatePopover(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Current Slots */}
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Availability Specified:
                        </Label>
                        {editingSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            No availability set (marked as unavailable)
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {editingSlots.map((slot, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateSlot(index, 'start', e.target.value)}
                                  className="flex-1"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateSlot(index, 'end', e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSlot(index)}
                                  className="text-destructive shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Preset Slot */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Select Availability:
                        </Label>
                        <div className="flex gap-2">
                          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Choose a preset..." />
                            </SelectTrigger>
                            <SelectContent>
                              {PRESET_TIME_SLOTS.map((preset) => (
                                <SelectItem 
                                  key={`${preset.start}-${preset.end}`} 
                                  value={`${preset.start}-${preset.end}`}
                                >
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={addPresetSlot} disabled={!selectedPreset}>
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Custom Time */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addCustomSlot}
                        className="w-full gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Custom Time
                      </Button>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        {availability?.hasOverride && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetToDefault(dateStr)}
                            disabled={savingDate === dateStr}
                            className="flex-1"
                          >
                            Reset to Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenDatePopover(null)}
                          className={availability?.hasOverride ? "" : "flex-1"}
                        >
                          Close
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveDate(dateStr)}
                          disabled={savingDate === dateStr}
                          className="flex-1"
                        >
                          {savingDate === dateStr ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
