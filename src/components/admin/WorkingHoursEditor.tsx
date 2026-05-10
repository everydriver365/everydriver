import { useState, useEffect, useCallback, useContext } from "react";
import { Clock, Plus, Trash2, Calendar, Zap, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOptionalSettingsDirty } from "@/components/instructor/settings/useOptionalSettingsDirty";

// Availability presets
const AVAILABILITY_PRESETS = [
  { id: "standard", label: "Standard", description: "Mon-Fri 9-5", icon: "📅" },
  { id: "early", label: "Early Bird", description: "Mon-Fri 7-3", icon: "🌅" },
  { id: "late", label: "Late Hours", description: "Mon-Fri 12-8", icon: "🌙" },
  { id: "weekend", label: "Weekends Only", description: "Sat-Sun 9-5", icon: "🎉" },
  { id: "fullweek", label: "Full Week", description: "All days 9-5", icon: "💪" },
];

// Day off quick actions
const DAY_OFF_ACTIONS = [
  { id: "today", label: "Today Off", description: "Mark today as unavailable" },
  { id: "tomorrow", label: "Tomorrow Off", description: "Mark tomorrow as unavailable" },
  { id: "thisWeek", label: "Rest of Week", description: "Off until Sunday" },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

interface WorkingHour {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DateOverride {
  id?: string;
  override_date: string;
  override_end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

interface WorkingHoursEditorProps {
  instructorId: string;
}

export function WorkingHoursEditor({ instructorId }: WorkingHoursEditorProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [originalHours, setOriginalHours] = useState<WorkingHour[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
  const [isForever, setIsForever] = useState(false);
  const [newOverride, setNewOverride] = useState<Partial<DateOverride>>({
    is_available: true,
    start_time: "09:00",
    end_time: "17:00",
  });

  const { register, setDirty } = useOptionalSettingsDirty();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const dirty =
    originalHours.length > 0 &&
    JSON.stringify(workingHours) !== JSON.stringify(originalHours);

  // Always-mounted hooks (run regardless of loading state) so hook order is stable.
  useEffect(() => {
    setDirty("working-hours", dirty);
    return () => setDirty("working-hours", false);
  }, [dirty, setDirty]);

  useEffect(() => {
    register("working-hours", {
      save: saveWorkingHours,
      reset: () => setWorkingHours(originalHours),
    });
    return () => register("working-hours", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingHours, originalHours, register]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch working hours
      const { data: hours, error: hoursError } = await supabase
        .from("instructor_working_hours")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("day_of_week");

      if (hoursError) throw hoursError;

      let mapped: WorkingHour[];
      // Initialize with default hours if none exist
      if (!hours || hours.length === 0) {
        mapped = DAYS_OF_WEEK.map((day) => ({
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_active: day.value >= 1 && day.value <= 5, // Mon-Fri active by default
        }));
      } else {
        mapped = hours.map((h) => ({
          id: h.id,
          day_of_week: h.day_of_week,
          start_time: h.start_time.slice(0, 5),
          end_time: h.end_time.slice(0, 5),
          is_active: h.is_active,
        }));
      }
      setWorkingHours(mapped);
      setOriginalHours(mapped);

      // Fetch date overrides
      const { data: overrides, error: overridesError } = await supabase
        .from("instructor_date_overrides")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("override_date", new Date().toISOString().split("T")[0])
        .order("override_date");

      if (overridesError) throw overridesError;

      setDateOverrides(
        (overrides || []).map((o) => ({
          id: o.id,
          override_date: o.override_date,
          override_end_date: o.override_end_date || null,
          start_time: o.start_time?.slice(0, 5) || null,
          end_time: o.end_time?.slice(0, 5) || null,
          is_available: o.is_available,
        }))
      );
    } catch (error) {
      console.error("Error fetching working hours:", error);
      toast.error("Failed to load working hours");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkingHourChange = (
    dayOfWeek: number,
    field: keyof WorkingHour,
    value: string | boolean
  ) => {
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
  };

  const saveWorkingHours = async () => {
    try {
      const rows = workingHours.map((h) => ({
        ...(h.id ? { id: h.id } : {}),
        instructor_id: instructorId,
        day_of_week: h.day_of_week,
        start_time: `${h.start_time}:00`,
        end_time: `${h.end_time}:00`,
        is_active: h.is_active,
      }));

      const { error } = await supabase
        .from("instructor_working_hours")
        .upsert(rows, { onConflict: "instructor_id,day_of_week" });

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Error saving working hours:", error);
      toast.error("Failed to save working hours");
      throw error;
    }
  };

  const addDateOverride = async () => {
    if (!selectedStartDate) {
      toast.error("Please select a start date");
      return;
    }

    if (!isForever && selectedEndDate && selectedEndDate < selectedStartDate) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      const overrideData = {
        instructor_id: instructorId,
        override_date: format(selectedStartDate, "yyyy-MM-dd"),
        override_end_date: isForever ? null : (selectedEndDate ? format(selectedEndDate, "yyyy-MM-dd") : format(selectedStartDate, "yyyy-MM-dd")),
        start_time: newOverride.is_available ? newOverride.start_time : null,
        end_time: newOverride.is_available ? newOverride.end_time : null,
        is_available: newOverride.is_available,
      };

      const { error } = await supabase
        .from("instructor_date_overrides")
        .insert(overrideData);

      if (error) throw error;

      toast.success("Date override added");
      setSelectedStartDate(undefined);
      setSelectedEndDate(undefined);
      setIsForever(false);
      setNewOverride({
        is_available: true,
        start_time: "09:00",
        end_time: "17:00",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding date override:", error);
      toast.error("Failed to add date override");
    }
  };

  const deleteDateOverride = async (id: string) => {
    try {
      const { error } = await supabase
        .from("instructor_date_overrides")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Date override removed");
      fetchData();
    } catch (error) {
      console.error("Error deleting date override:", error);
      toast.error("Failed to remove date override");
    }
  };

  const applyPreset = (presetId: string) => {
    let newHours: WorkingHour[] = [];
    
    switch (presetId) {
      case "standard":
        newHours = DAYS_OF_WEEK.map((day) => ({
          ...workingHours.find((h) => h.day_of_week === day.value),
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_active: day.value >= 1 && day.value <= 5,
        }));
        break;
      case "early":
        newHours = DAYS_OF_WEEK.map((day) => ({
          ...workingHours.find((h) => h.day_of_week === day.value),
          day_of_week: day.value,
          start_time: "07:00",
          end_time: "15:00",
          is_active: day.value >= 1 && day.value <= 5,
        }));
        break;
      case "late":
        newHours = DAYS_OF_WEEK.map((day) => ({
          ...workingHours.find((h) => h.day_of_week === day.value),
          day_of_week: day.value,
          start_time: "12:00",
          end_time: "20:00",
          is_active: day.value >= 1 && day.value <= 5,
        }));
        break;
      case "weekend":
        newHours = DAYS_OF_WEEK.map((day) => ({
          ...workingHours.find((h) => h.day_of_week === day.value),
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_active: day.value === 0 || day.value === 6,
        }));
        break;
      case "fullweek":
        newHours = DAYS_OF_WEEK.map((day) => ({
          ...workingHours.find((h) => h.day_of_week === day.value),
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_active: true,
        }));
        break;
      default:
        return;
    }
    
    setWorkingHours(newHours);
    toast.success("Preset applied");
  };

  const addDayOff = async (actionId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate: Date | null = null;

    switch (actionId) {
      case "today":
        startDate = today;
        break;
      case "tomorrow":
        startDate = new Date(today);
        startDate.setDate(today.getDate() + 1);
        break;
      case "thisWeek":
        startDate = today;
        const daysUntilSunday = 7 - today.getDay();
        endDate = new Date(today);
        endDate.setDate(today.getDate() + daysUntilSunday);
        break;
      default:
        return;
    }

    try {
      const overrideData = {
        instructor_id: instructorId,
        override_date: format(startDate, "yyyy-MM-dd"),
        override_end_date: endDate ? format(endDate, "yyyy-MM-dd") : format(startDate, "yyyy-MM-dd"),
        start_time: null,
        end_time: null,
        is_available: false,
      };

      const { error } = await supabase
        .from("instructor_date_overrides")
        .insert(overrideData);

      if (error) throw error;

      toast.success("Day off added successfully");
      fetchData();
    } catch (error) {
      console.error("Error adding day off:", error);
      toast.error("Failed to add day off");
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Loading working hours...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
          <Zap className="h-4 w-4" />
          Quick Presets
        </h4>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.id)}
              className="h-auto py-1.5 px-2.5"
            >
              <span className="mr-1">{preset.icon}</span>
              <span className="text-xs">{preset.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div>
        <h4 className="mb-3 flex items-center gap-2 font-medium text-sm">
          <Clock className="h-4 w-4" />
          Weekly Schedule
        </h4>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const hour = workingHours.find((h) => h.day_of_week === day.value);
            if (!hour) return null;

            return (
              <div
                key={day.value}
                className={cn(
                  "rounded-lg border p-3",
                  !hour.is_active && "bg-muted/50 opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={hour.is_active}
                      onCheckedChange={(checked) =>
                        handleWorkingHourChange(day.value, "is_active", checked)
                      }
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </div>
                </div>

                {hour.is_active && (
                  <div className="flex items-center gap-2 pl-8">
                    <Input
                      type="time"
                      value={hour.start_time}
                      onChange={(e) =>
                        handleWorkingHourChange(day.value, "start_time", e.target.value)
                      }
                      className="flex-1 text-sm"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <Input
                      type="time"
                      value={hour.end_time}
                      onChange={(e) =>
                        handleWorkingHourChange(day.value, "end_time", e.target.value)
                      }
                      className="flex-1 text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Overrides */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
          <Calendar className="h-4 w-4" />
          Date Overrides
        </h4>
        
        {/* Day Off Quick Actions */}
        <div className="mb-3">
          <p className="mb-2 text-xs text-muted-foreground">Quick day off:</p>
          <div className="flex flex-wrap gap-2">
            {DAY_OFF_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => addDayOff(action.id)}
                className="h-auto py-1.5 px-2.5 gap-1.5 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <CalendarOff className="h-3 w-3" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          Or set custom hours for specific dates:
        </p>

        <div className="mb-4 space-y-3 rounded-lg border p-3">
          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1.5 block text-xs">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Calendar className="mr-1.5 h-3 w-3" />
                    {selectedStartDate ? format(selectedStartDate, "dd MMM") : "Pick"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedStartDate}
                    onSelect={setSelectedStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn("w-full justify-start text-xs", isForever && "opacity-50")}
                    disabled={isForever}
                  >
                    <Calendar className="mr-1.5 h-3 w-3" />
                    {isForever ? "Forever" : (selectedEndDate ? format(selectedEndDate, "dd MMM") : "Pick")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={setSelectedEndDate}
                    disabled={(date) => date < (selectedStartDate || new Date())}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="override-forever"
              checked={isForever}
              onCheckedChange={(checked) => {
                setIsForever(checked);
                if (checked) setSelectedEndDate(undefined);
              }}
            />
            <Label htmlFor="override-forever" className="text-xs">
              Ongoing (no end date)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="override-available"
              checked={newOverride.is_available}
              onCheckedChange={(checked) =>
                setNewOverride((prev) => ({ ...prev, is_available: checked }))
              }
            />
            <Label htmlFor="override-available" className="text-xs">
              Available on this date
            </Label>
          </div>

          {newOverride.is_available && (
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={newOverride.start_time}
                onChange={(e) =>
                  setNewOverride((prev) => ({ ...prev, start_time: e.target.value }))
                }
                className="flex-1 text-sm"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="time"
                value={newOverride.end_time}
                onChange={(e) =>
                  setNewOverride((prev) => ({ ...prev, end_time: e.target.value }))
                }
                className="flex-1 text-sm"
              />
            </div>
          )}

          <Button onClick={addDateOverride} size="sm" className="w-full">
            <Plus className="mr-1 h-4 w-4" />
            Add Override
          </Button>
        </div>

        {dateOverrides.length > 0 ? (
          <div className="space-y-2">
            {dateOverrides.map((override) => (
              <div
                key={override.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-2.5",
                  !override.is_available && "bg-destructive/10 border-destructive/30"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {format(new Date(override.override_date), "dd MMM")}
                    {override.override_end_date ? (
                      <span> → {format(new Date(override.override_end_date), "dd MMM")}</span>
                    ) : (
                      <span className="text-muted-foreground"> → Ongoing</span>
                    )}
                  </p>
                  {override.is_available ? (
                    <p className="text-xs text-muted-foreground">
                      {override.start_time} - {override.end_time}
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-destructive">Unavailable</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => override.id && deleteDateOverride(override.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No date overrides set</p>
        )}
      </div>
    </div>
  );
}