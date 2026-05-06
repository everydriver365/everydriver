import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Loader2, Search, X } from "lucide-react";
import { useInstructorAvailabilitySearch, AvailableSlot, TimeOfDay } from "@/hooks/useInstructorAvailabilitySearch";
import { cn } from "@/lib/utils";

export interface FindAppointmentBodyProps {
  instructorIds: string[];
  mode: "admin" | "school" | "instructor";
  onSelectSlot: (slot: AvailableSlot) => void;
  onCancel?: () => void;
  variant?: "modal" | "page";
}

type Urgency = "include" | "exclude" | "only";

export function FindAppointmentBody({
  instructorIds,
  mode,
  onSelectSlot,
  onCancel,
  variant = "page",
}: FindAppointmentBodyProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [fromDate, setFromDate] = useState(today);
  const [duration, setDuration] = useState("60");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("any");
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("all");
  const [urgents, setUrgents] = useState<Urgency>("include");
  const [slotType, setSlotType] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [postcode, setPostcode] = useState("");
  const [days, setDays] = useState(14);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data: instructorOptions = [] } = useQuery({
    queryKey: ["find-appt-instructors", instructorIds.join(",")],
    enabled: instructorIds.length > 0,
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
    enabled: true,
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
    setUrgents("include");
    setSlotType("all");
    setLanguage("all");
    setLocation("all");
    setPostcode("");
    setDays(14);
    setSelectedSlotId(null);
  };

  const handleBook = () => {
    if (selectedSlot) onSelectSlot(selectedSlot);
  };

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Appointment criteria */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <header className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 border-b text-center">
          Appointment criteria
        </header>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {/* Left column */}
          <div className="space-y-3">
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs text-muted-foreground">Search from</Label>
              <Input type="date" value={fromDate} min={today} onChange={(e) => setFromDate(e.target.value)} className="h-8" />
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs text-muted-foreground">Time of day</Label>
              <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="morning">Morning (6am–12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm–10pm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs text-muted-foreground">Slot type</Label>
              <Select value={slotType} onValueChange={setSlotType}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All slot types</SelectItem>
                  <SelectItem value="standard">Standard lesson</SelectItem>
                  <SelectItem value="test">Driving test</SelectItem>
                  <SelectItem value="mock">Mock test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs text-muted-foreground">Languages</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pl">Polish</SelectItem>
                  <SelectItem value="ur">Urdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  <SelectItem value="winchester">Winchester</SelectItem>
                  <SelectItem value="southampton">Southampton</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <div className="grid grid-cols-[100px_1fr] items-start gap-3">
              <Label className="text-xs text-muted-foreground pt-1.5">Urgents</Label>
              <RadioGroup value={urgents} onValueChange={(v) => setUrgents(v as Urgency)} className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <RadioGroupItem value="include" /> Include
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <RadioGroupItem value="exclude" /> Exclude
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <RadioGroupItem value="only" /> Urgent only
                </label>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-start gap-3">
              <Label className="text-xs text-muted-foreground pt-1.5">For</Label>
              <div className="space-y-2">
                <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All instructors</SelectItem>
                    {instructorOptions.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Hide advanced" : "Advanced criteria"}
              </Button>
            </div>
            {showAdvanced && (
              <>
                <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                  <Label className="text-xs text-muted-foreground">Postcode</Label>
                  <Input
                    placeholder="e.g. SO22"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                  <Label className="text-xs text-muted-foreground">Search window</Label>
                  <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v, 10))}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Next 7 days</SelectItem>
                      <SelectItem value="14">Next 14 days</SelectItem>
                      <SelectItem value="28">Next 28 days</SelectItem>
                      <SelectItem value="60">Next 60 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Available appointments */}
      <section className="flex-1 min-h-0 rounded-2xl border bg-card overflow-hidden flex flex-col">
        <header className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 border-b text-center">
          Available appointments
        </header>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 text-muted-foreground text-xs">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">At</th>
                <th className="px-3 py-2 font-medium">Duration</th>
                <th className="px-3 py-2 font-medium">Instructor(s)</th>
                <th className="px-3 py-2 font-medium">Slot type</th>
                <th className="px-3 py-2 font-medium">Location</th>
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
                    No available slots match these criteria.
                  </td>
                </tr>
              )}
              {!isFetching && slots.map((slot, idx) => {
                const isSelected = slot.id === selectedSlotId;
                return (
                  <tr
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    onDoubleClick={() => { setSelectedSlotId(slot.id); onSelectSlot(slot); }}
                    className={cn(
                      "cursor-pointer border-t transition-colors h-8",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "hover:bg-primary/10",
                      isSelected && "bg-primary/15 hover:bg-primary/20",
                    )}
                  >
                    <td className="px-3 py-1.5">{format(parseISO(slot.date), "EEE d-MMM-yyyy")}</td>
                    <td className="px-3 py-1.5 font-medium">{slot.startTime}</td>
                    <td className="px-3 py-1.5">{slot.durationMinutes} mins</td>
                    <td className="px-3 py-1.5">{slot.instructorName}</td>
                    <td className="px-3 py-1.5 capitalize">{slot.carType || "Default"}</td>
                    <td className="px-3 py-1.5">{slot.postcodeArea || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-6 border-t py-2 text-xs">
          <button className="text-primary hover:underline">Earlier appointments</button>
          <span className="text-muted-foreground">|</span>
          <button className="text-primary hover:underline">Later appointments</button>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {slots.length > 0 && `${slots.length} slot${slots.length === 1 ? "" : "s"} found`}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>Clear criteria</Button>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              {variant === "modal" ? "Cancel" : <><X className="h-4 w-4 mr-1" />Close</>}
            </Button>
          )}
          <Button size="sm" onClick={handleBook} disabled={!selectedSlot}>Book appointment</Button>
        </div>
      </div>
    </div>
  );
}
