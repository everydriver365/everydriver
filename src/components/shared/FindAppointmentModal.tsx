import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Loader2, Search, CalendarSearch } from "lucide-react";
import { useInstructorAvailabilitySearch, AvailableSlot, TimeOfDay } from "@/hooks/useInstructorAvailabilitySearch";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  instructorIds: string[];
  mode: "admin" | "school";
  onSelectSlot: (slot: AvailableSlot) => void;
}

export function FindAppointmentModal({ open, onClose, instructorIds, mode, onSelectSlot }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [fromDate, setFromDate] = useState(today);
  const [duration, setDuration] = useState("60");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("any");
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("all");
  const [postcode, setPostcode] = useState("");
  const [days, setDays] = useState(14);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data: instructorOptions = [] } = useQuery({
    queryKey: ["find-appt-instructors", instructorIds.join(",")],
    enabled: open && instructorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds)
        .order("name");
      return data || [];
    },
  });

  const { data: slots = [], isFetching } = useInstructorAvailabilitySearch({
    instructorIds,
    selectedInstructorId,
    fromDate,
    days,
    durationMinutes: parseInt(duration, 10),
    timeOfDay,
    postcodePrefix: postcode.trim() || undefined,
    enabled: open,
  });

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || null,
    [slots, selectedSlotId],
  );

  const handleClear = () => {
    setFromDate(today);
    setDuration("60");
    setTimeOfDay("any");
    setSelectedInstructorId("all");
    setPostcode("");
    setDays(14);
    setSelectedSlotId(null);
  };

  const handleBook = () => {
    if (selectedSlot) {
      onSelectSlot(selectedSlot);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSearch className="h-5 w-5 text-primary" />
            Find appointment
          </DialogTitle>
          <DialogDescription>
            Search across {mode === "admin" ? "all instructors" : "your school's instructors"} for the next available slot.
          </DialogDescription>
        </DialogHeader>

        {/* Criteria */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-lg border bg-muted/30">
          <div className="space-y-1.5">
            <Label className="text-xs">Search from</Label>
            <Input
              type="date"
              value={fromDate}
              min={today}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Instructor</Label>
            <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instructors</SelectItem>
                {instructorOptions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Time of day</Label>
            <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="morning">Morning (6am–12pm)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                <SelectItem value="evening">Evening (5pm–10pm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Postcode area</Label>
            <Input
              placeholder="e.g. SO22"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Search window</Label>
            <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v, 10))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="14">Next 14 days</SelectItem>
                <SelectItem value="28">Next 28 days</SelectItem>
                <SelectItem value="60">Next 60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">At</th>
                <th className="px-3 py-2 font-medium">Duration</th>
                <th className="px-3 py-2 font-medium">Instructor</th>
                <th className="px-3 py-2 font-medium">Car type</th>
                <th className="px-3 py-2 font-medium">Postcode area</th>
              </tr>
            </thead>
            <tbody>
              {isFetching && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Searching availability…
                  </td>
                </tr>
              )}
              {!isFetching && slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    <Search className="h-5 w-5 inline mr-2 opacity-50" />
                    No available slots match these criteria. Try widening the search window or removing filters.
                  </td>
                </tr>
              )}
              {!isFetching && slots.map((slot, idx) => {
                const isSelected = slot.id === selectedSlotId;
                return (
                  <tr
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    onDoubleClick={() => { setSelectedSlotId(slot.id); onSelectSlot(slot); onClose(); }}
                    className={cn(
                      "cursor-pointer border-t transition-colors h-10",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "hover:bg-primary/10",
                      isSelected && "bg-primary/15 hover:bg-primary/20",
                    )}
                  >
                    <td className="px-3 py-2">{format(parseISO(slot.date), "EEE d MMM")}</td>
                    <td className="px-3 py-2 font-medium">{slot.startTime}</td>
                    <td className="px-3 py-2">{slot.durationMinutes} min</td>
                    <td className="px-3 py-2">{slot.instructorName}</td>
                    <td className="px-3 py-2 capitalize">{slot.carType || "—"}</td>
                    <td className="px-3 py-2">{slot.postcodeArea || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <p className="text-xs text-muted-foreground">
            {slots.length > 0 && `${slots.length} slot${slots.length === 1 ? "" : "s"} found`}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClear}>Clear criteria</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleBook} disabled={!selectedSlot}>Book appointment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
