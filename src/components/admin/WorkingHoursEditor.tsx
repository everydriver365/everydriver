import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

interface WorkingHoursEditorProps {
  instructorId: string;
}

export function WorkingHoursEditor({ instructorId }: WorkingHoursEditorProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [newOverride, setNewOverride] = useState<Partial<DateOverride>>({
    is_available: true,
    start_time: "09:00",
    end_time: "17:00",
  });

  useEffect(() => {
    fetchData();
  }, [instructorId]);

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

      // Initialize with default hours if none exist
      if (!hours || hours.length === 0) {
        const defaultHours = DAYS_OF_WEEK.map((day) => ({
          day_of_week: day.value,
          start_time: "09:00",
          end_time: "17:00",
          is_active: day.value >= 1 && day.value <= 5, // Mon-Fri active by default
        }));
        setWorkingHours(defaultHours);
      } else {
        setWorkingHours(
          hours.map((h) => ({
            id: h.id,
            day_of_week: h.day_of_week,
            start_time: h.start_time.slice(0, 5),
            end_time: h.end_time.slice(0, 5),
            is_active: h.is_active,
          }))
        );
      }

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
      for (const hour of workingHours) {
        if (hour.id) {
          // Update existing
          await supabase
            .from("instructor_working_hours")
            .update({
              start_time: hour.start_time,
              end_time: hour.end_time,
              is_active: hour.is_active,
            })
            .eq("id", hour.id);
        } else {
          // Insert new
          await supabase.from("instructor_working_hours").insert({
            instructor_id: instructorId,
            day_of_week: hour.day_of_week,
            start_time: hour.start_time,
            end_time: hour.end_time,
            is_active: hour.is_active,
          });
        }
      }
      toast.success("Working hours saved");
      fetchData();
    } catch (error) {
      console.error("Error saving working hours:", error);
      toast.error("Failed to save working hours");
    }
  };

  const addDateOverride = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    try {
      const overrideData = {
        instructor_id: instructorId,
        override_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: newOverride.is_available ? newOverride.start_time : null,
        end_time: newOverride.is_available ? newOverride.end_time : null,
        is_available: newOverride.is_available,
      };

      const { error } = await supabase
        .from("instructor_date_overrides")
        .upsert(overrideData, { onConflict: "instructor_id,override_date" });

      if (error) throw error;

      toast.success("Date override added");
      setSelectedDate(undefined);
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

  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Loading working hours...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <div>
        <h4 className="mb-4 flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4" />
          Weekly Schedule
        </h4>
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const hour = workingHours.find((h) => h.day_of_week === day.value);
            if (!hour) return null;

            return (
              <div
                key={day.value}
                className={cn(
                  "flex items-center gap-4 rounded-lg border p-3",
                  !hour.is_active && "bg-muted/50 opacity-60"
                )}
              >
                <div className="flex w-28 items-center gap-2">
                  <Switch
                    checked={hour.is_active}
                    onCheckedChange={(checked) =>
                      handleWorkingHourChange(day.value, "is_active", checked)
                    }
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </div>

                {hour.is_active && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hour.start_time}
                      onChange={(e) =>
                        handleWorkingHourChange(day.value, "start_time", e.target.value)
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={hour.end_time}
                      onChange={(e) =>
                        handleWorkingHourChange(day.value, "end_time", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button onClick={saveWorkingHours} className="mt-4">
          Save Weekly Schedule
        </Button>
      </div>

      {/* Date Overrides */}
      <div>
        <h4 className="mb-4 flex items-center gap-2 font-medium">
          <Calendar className="h-4 w-4" />
          Date-Specific Overrides
        </h4>
        <p className="mb-4 text-sm text-muted-foreground">
          Set custom hours or mark specific dates as unavailable
        </p>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <div>
            <Label className="mb-2 block text-sm">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40 justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="override-available"
              checked={newOverride.is_available}
              onCheckedChange={(checked) =>
                setNewOverride((prev) => ({ ...prev, is_available: checked }))
              }
            />
            <Label htmlFor="override-available" className="text-sm">
              Available
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
                className="w-32"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                value={newOverride.end_time}
                onChange={(e) =>
                  setNewOverride((prev) => ({ ...prev, end_time: e.target.value }))
                }
                className="w-32"
              />
            </div>
          )}

          <Button onClick={addDateOverride} size="sm">
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
                  "flex items-center justify-between rounded-lg border p-3",
                  !override.is_available && "bg-destructive/10 border-destructive/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {format(new Date(override.override_date), "EEE, dd MMM yyyy")}
                  </span>
                  {override.is_available ? (
                    <span className="text-sm text-muted-foreground">
                      {override.start_time} - {override.end_time}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-destructive">Unavailable</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => override.id && deleteDateOverride(override.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No date overrides set</p>
        )}
      </div>
    </div>
  );
}