import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarClock, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { mirrorAwToIwh } from "@/lib/syncWeeklyHours";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AvailabilityWindowsManager({ instructorId }: { instructorId: string }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [label, setLabel] = useState("");

  const { data: windows = [] } = useQuery({
    queryKey: ["availability-windows", instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("availability_windows")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("day_of_week")
        .order("start_time");
      return data || [];
    },
  });

  const syncPartner = async () => {
    try {
      await mirrorAwToIwh(instructorId);
    } catch (e) {
      console.error("Failed to mirror availability_windows to instructor_working_hours", e);
    }
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("availability_windows").insert({
        instructor_id: instructorId,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        label: label || null,
      });
      if (error) throw error;
      await syncPartner();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
      setShowAdd(false);
      setLabel("");
      toast.success("Availability window added");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from("availability_windows").update({ is_active: active }).eq("id", id);
      await syncPartner();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability-windows"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("availability_windows").delete().eq("id", id);
      await syncPartner();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-windows"] });
      toast.success("Window removed");
    },
  });

  // Group by day
  const grouped = DAYS.map((dayName, i) => ({
    day: i,
    dayName,
    shortDay: SHORT_DAYS[i],
    slots: windows.filter((w: any) => w.day_of_week === i),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Availability Windows
        </h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Window
        </Button>
      </div>

      {/* Weekly visual */}
      <div className="grid grid-cols-7 gap-1">
        {SHORT_DAYS.map((d, i) => {
          const daySlots = windows.filter((w: any) => w.day_of_week === i && w.is_active);
          return (
            <div key={i} className="text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">{d}</p>
              <div className={`h-8 rounded-2xl flex items-center justify-center text-xs font-medium ${daySlots.length > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {daySlots.length > 0 ? `${daySlots.length}` : "–"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grouped slots */}
      <div className="space-y-3">
        {grouped.map((g) => (
          <div key={g.day}>
            <p className="text-sm font-semibold text-muted-foreground mb-1.5">{g.dayName}</p>
            <div className="space-y-1.5">
              {g.slots.map((slot: any) => (
                <Card key={slot.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                      </p>
                      {slot.label && <p className="text-xs text-muted-foreground">{slot.label}</p>}
                    </div>
                    <Switch checked={slot.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: slot.id, active: v })} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(slot.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No availability windows set. Add your recurring weekly hours.</p>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Window</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Day</label>
              <select className="w-full rounded-2xl border p-2 text-sm bg-background" value={day} onChange={(e) => setDay(+e.target.value)}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Start</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <Input placeholder="Label (e.g. Morning slot)" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={() => addMutation.mutate()}>Add Window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
