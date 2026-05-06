import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Loader2, Search, X, Calendar as CalendarIcon, ChevronDown, Filter, CalendarSearch } from "lucide-react";
import { useInstructorAvailabilitySearch, AvailableSlot, TimeOfDay } from "@/hooks/useInstructorAvailabilitySearch";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface FindAppointmentBodyProps {
  instructorIds: string[];
  mode: "admin" | "school" | "instructor";
  onSelectSlot: (slot: AvailableSlot) => void;
  onCancel?: () => void;
  variant?: "modal" | "page";
}

type Urgency = "include" | "exclude" | "only";

// ---- Visual primitives ----
const SectionLabel = ({ label }: { label: string }) => (
  <div
    className="text-[10px] font-bold uppercase pl-0.5 mb-2"
    style={{ color: "var(--d2-text-2)", letterSpacing: "1.2px" }}
  >
    {label}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-semibold mb-1" style={{ color: "var(--d2-text-3)" }}>
    {children}
  </div>
);

const triggerCls =
  "flex items-center justify-between w-full rounded-[10px] bg-white px-3 py-[9px] text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A52A0]/30 data-[placeholder]:text-[#C7C7CC]";

const triggerStyle: React.CSSProperties = {
  border: "0.5px solid var(--d2-border)",
};

const cardStyle: React.CSSProperties = {
  border: "0.5px solid var(--d2-border)",
};

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

  const { data: searchResult, isFetching } = useInstructorAvailabilitySearch({
    instructorIds,
    selectedInstructorId,
    fromDate,
    days,
    durationMinutes: parseInt(duration, 10),
    timeOfDay,
    postcodePrefix: postcode.trim() || undefined,
    enabled: true,
  });

  const slots = searchResult?.slots ?? [];
  const rejection = searchResult?.rejection;

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

  const selectedInstructorLabel =
    selectedInstructorId === "all"
      ? "All instructors"
      : instructorOptions.find((i) => i.id === selectedInstructorId)?.name || "All instructors";

  const Divider = () => (
    <div style={{ height: "0.5px", backgroundColor: "var(--d2-border)", margin: "0 14px" }} />
  );

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      style={{ backgroundColor: "var(--d2-bg)", borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3.5">
        <div
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ borderRadius: 10, backgroundColor: "var(--d2-indigo-bg)" }}
        >
          <CalendarSearch size={16} color="var(--d2-indigo)" strokeWidth={1.6} />
        </div>
        <div>
          <div className="text-[17px] font-bold leading-tight" style={{ color: "var(--d2-text-1)", letterSpacing: "-0.3px" }}>
            Find appointments
          </div>
          <div className="text-[10px] mt-px" style={{ color: "var(--d2-text-2)" }}>
            Search your diary for the next available slot
          </div>
        </div>
      </div>

      {/* Scroll content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-[15px] pb-3">
        {/* Search criteria */}
        <SectionLabel label="Search criteria" />
        <div className="bg-white rounded-[14px] overflow-hidden mb-3" style={cardStyle}>
          {/* Search from */}
          <div className="px-3 py-2.5">
            <FieldLabel>Search from</FieldLabel>
            <div className="relative">
              <Input
                type="date"
                value={fromDate}
                min={today}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-[34px] rounded-[10px] text-xs font-semibold text-[#1A1A1A] pr-9"
                style={triggerStyle}
              />
              <CalendarIcon
                size={13}
                color="var(--d2-text-2)"
                strokeWidth={1.6}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
          <Divider />

          {/* Time of day */}
          <div className="px-3 py-2.5">
            <FieldLabel>Time of day</FieldLabel>
            <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}>
              <SelectTrigger className={triggerCls} style={triggerStyle}>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="morning">Morning (6am–12pm)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                <SelectItem value="evening">Evening (5pm–10pm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Divider />

          {/* Slot type */}
          <div className="px-3 py-2.5">
            <FieldLabel>Slot type</FieldLabel>
            <Select value={slotType} onValueChange={setSlotType}>
              <SelectTrigger className={triggerCls} style={triggerStyle}>
                <SelectValue placeholder="All slot types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All slot types</SelectItem>
                <SelectItem value="standard">Standard lesson</SelectItem>
                <SelectItem value="test">Driving test</SelectItem>
                <SelectItem value="mock">Mock test</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Divider />

          {/* Duration */}
          <div className="px-3 py-2.5">
            <FieldLabel>Duration</FieldLabel>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className={triggerCls} style={triggerStyle}>
                <SelectValue placeholder="1 hour" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Divider />

          {/* Languages */}
          <div className="px-3 py-2.5">
            <FieldLabel>Languages</FieldLabel>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className={triggerCls} style={triggerStyle}>
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pl">Polish</SelectItem>
                <SelectItem value="ur">Urdu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Divider />

          {/* Location */}
          <div className="px-3 py-2.5">
            <FieldLabel>Location</FieldLabel>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className={triggerCls} style={triggerStyle}>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                <SelectItem value="winchester">Winchester</SelectItem>
                <SelectItem value="southampton">Southampton</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Two-column row */}
        <div className="flex gap-2 mb-3">
          {/* Urgents */}
          <div className="flex-1">
            <SectionLabel label="Urgents" />
            <div
              className="bg-white rounded-[14px] overflow-hidden px-3 pt-1 pb-2"
              style={cardStyle}
            >
              {(["include", "exclude", "only"] as Urgency[]).map((mode) => {
                const active = urgents === mode;
                const labelText =
                  mode === "include" ? "Include" : mode === "exclude" ? "Exclude" : "Urgent only";
                return (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setUrgents(mode)}
                    className="flex items-center gap-[7px] py-[7px] w-full text-left"
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        border: `1.5px solid ${active ? "var(--d2-indigo)" : "var(--d2-border)"}`,
                        backgroundColor: active ? "var(--d2-indigo)" : "transparent",
                      }}
                    >
                      {active && (
                        <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFF" }} />
                      )}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "var(--d2-text-1)" }}>
                      {labelText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* For */}
          <div className="flex-1 flex flex-col">
            <SectionLabel label="For" />
            <div
              className="bg-white rounded-[14px] overflow-hidden p-2.5 mb-2"
              style={cardStyle}
            >
              <FieldLabel>Instructor</FieldLabel>
              <Select
                value={selectedInstructorId}
                onValueChange={setSelectedInstructorId}
              >
                <SelectTrigger className={triggerCls} style={triggerStyle}>
                  <SelectValue placeholder="All instructors">{selectedInstructorLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All instructors</SelectItem>
                  {instructorOptions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center justify-center gap-1.5 rounded-[12px] py-[9px] px-3"
              style={{
                backgroundColor: "var(--d2-indigo-bg)",
                border: "0.5px solid var(--d2-border)",
              }}
            >
              <Filter size={11} color="var(--d2-indigo)" strokeWidth={1.8} />
              <span className="text-[11px] font-semibold" style={{ color: "var(--d2-indigo)" }}>
                {showAdvanced ? "Hide advanced" : "Advanced"}
              </span>
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="bg-white rounded-[14px] overflow-hidden mb-3" style={cardStyle}>
            <div className="px-3 py-2.5">
              <FieldLabel>Postcode</FieldLabel>
              <Input
                placeholder="e.g. SO22"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="h-[34px] rounded-[10px] text-xs font-semibold text-[#1A1A1A]"
                style={triggerStyle}
              />
            </div>
            <Divider />
            <div className="px-3 py-2.5">
              <FieldLabel>Search window</FieldLabel>
              <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v, 10))}>
                <SelectTrigger className={triggerCls} style={triggerStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Next 7 days</SelectItem>
                  <SelectItem value="14">Next 14 days</SelectItem>
                  <SelectItem value="28">Next 28 days</SelectItem>
                  <SelectItem value="60">Next 60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Available appointments */}
        <SectionLabel label="Available appointments" />
        <div className="bg-white rounded-[14px] overflow-hidden mb-3" style={cardStyle}>
          {isFetching && (
            <div className="px-3 py-8 text-center text-xs" style={{ color: "var(--d2-text-2)" }}>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Searching availability…
            </div>
          )}
          {!isFetching && slots.length === 0 && (
            <div className="px-3 py-8 text-center text-xs" style={{ color: "var(--d2-text-2)" }}>
              <Search className="h-4 w-4 inline mr-2 opacity-50" />
              No available slots match these criteria.
              {rejection && rejection.total > 0 && (
                <div className="mt-3 mx-auto max-w-xs text-left rounded-lg bg-white/70 border border-black/5 p-3 space-y-1">
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-[#1A52A0]">
                    Why slots were skipped
                  </div>
                  {(Object.entries(rejection.byReason) as [import("@/lib/availabilityCore").RejectReason, number][])
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([reason, count]) => (
                      <div key={reason} className="flex items-start justify-between gap-2 text-[11px] text-[#3C3C43]">
                        <span>{rejection.describe(reason)}</span>
                        <span className="font-semibold tabular-nums">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {!isFetching && slots.map((slot, idx) => {
            const isSelected = slot.id === selectedSlotId;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotId(slot.id)}
                onDoubleClick={() => { setSelectedSlotId(slot.id); onSelectSlot(slot); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  idx > 0 && "border-t",
                )}
                style={{
                  borderColor: "var(--d2-border)",
                  backgroundColor: isSelected ? "var(--d2-indigo-bg)" : "transparent",
                }}
              >
                <div className="text-xs font-semibold w-24 shrink-0" style={{ color: "var(--d2-text-1)" }}>
                  {format(parseISO(slot.date), "EEE d MMM")}
                </div>
                <div className="text-xs font-bold w-12 shrink-0" style={{ color: "var(--d2-indigo)" }}>
                  {slot.startTime}
                </div>
                <div className="text-[11px]" style={{ color: "var(--d2-text-3)" }}>
                  {slot.durationMinutes} mins
                </div>
                <div className="text-[11px] truncate flex-1 text-right" style={{ color: "var(--d2-text-2)" }}>
                  {slot.instructorName}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-2 bg-white"
        style={{
          borderTop: "0.5px solid rgba(0,0,0,0.06)",
          paddingLeft: 15,
          paddingRight: 15,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 px-2"
        >
          <X size={11} color="var(--d2-text-2)" strokeWidth={2} />
          <span className="text-xs font-semibold" style={{ color: "var(--d2-text-2)" }}>Clear</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[12px] py-2.5 text-center"
            style={{
              backgroundColor: "var(--d2-bg)",
              border: "0.5px solid var(--d2-border)",
            }}
          >
            <span className="text-xs font-bold" style={{ color: "var(--d2-text-3)" }}>Close</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleBook}
          disabled={!selectedSlot}
          className="flex-[2] rounded-[12px] py-2.5 text-center disabled:opacity-50"
          style={{ backgroundColor: "var(--d2-indigo)" }}
        >
          <span className="text-[13px] font-bold text-white">Book appointment</span>
        </button>
      </div>
    </div>
  );
}
