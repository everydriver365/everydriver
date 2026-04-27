import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";
import { SectionLabel } from "@/components/instructor/ui/SectionLabel";
import { FormInputCard } from "@/components/instructor/ui/FormInputCard";
import { TestCentrePicker } from "@/components/instructor/ui/TestCentrePicker";
import { formatShortDate, formatShortTime } from "./shared/formatSwap";

export interface TestRequestData {
  id: string;
  request_type: "have_test" | "want_test";
  test_centre_id: string | null;
  test_centre_name: string | null;
  test_date: string;
  test_time: string;
  date_range_end: string | null;
  time_range_end: string | null;
  willing_to_pay_swap_fee: boolean;
  notes: string | null;
  pupil_id: string | null;
}

interface TestRequestFormProps {
  instructorId?: string;
  pupilId?: string;
  mode: "instructor" | "pupil";
  onSuccess?: () => void;
  onCancel?: () => void;
  editData?: TestRequestData;
}

interface PupilOption {
  id: string;
  name: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const HEADER_LINK = "#2B7BC8";

const DEFAULT_EARLIEST = "09:00";
const DEFAULT_LATEST = "17:00";

export function TestRequestForm({
  instructorId,
  pupilId,
  mode,
  onSuccess,
  onCancel,
  editData,
}: TestRequestFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const [requestType, setRequestType] = useState<"have_test" | "want_test">(
    editData?.request_type || "have_test",
  );
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(
    editData?.test_centre_id || null,
  );
  const [centreName, setCentreName] = useState<string>(editData?.test_centre_name || "");
  const [testDate, setTestDate] = useState<Date | undefined>(
    editData?.test_date ? parseISO(editData.test_date) : undefined,
  );
  const [testTime, setTestTime] = useState<string>(
    editData?.test_time?.slice(0, 5) || (isEdit ? "" : DEFAULT_EARLIEST),
  );
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(
    editData?.date_range_end ? parseISO(editData.date_range_end) : undefined,
  );
  const [timeRangeEnd, setTimeRangeEnd] = useState<string>(
    editData?.time_range_end?.slice(0, 5) || (isEdit ? "" : DEFAULT_LATEST),
  );
  const [notes, setNotes] = useState(editData?.notes || "");
  const [selectedPupilId, setSelectedPupilId] = useState<string>(editData?.pupil_id || "");
  const [pupils, setPupils] = useState<PupilOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Snapshot initial state to detect dirty changes for cancel confirm
  const initialSnapshot = useMemo(() => JSON.stringify({
    requestType: editData?.request_type || "have_test",
    selectedCentreId: editData?.test_centre_id || null,
    centreName: editData?.test_centre_name || "",
    testDate: editData?.test_date || null,
    testTime: editData?.test_time?.slice(0, 5) || (isEdit ? "" : DEFAULT_EARLIEST),
    dateRangeEnd: editData?.date_range_end || null,
    timeRangeEnd: editData?.time_range_end?.slice(0, 5) || (isEdit ? "" : DEFAULT_LATEST),
    notes: editData?.notes || "",
    selectedPupilId: editData?.pupil_id || "",
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSnapshot = JSON.stringify({
    requestType,
    selectedCentreId,
    centreName,
    testDate: testDate ? format(testDate, "yyyy-MM-dd") : null,
    testTime,
    dateRangeEnd: dateRangeEnd ? format(dateRangeEnd, "yyyy-MM-dd") : null,
    timeRangeEnd,
    notes,
    selectedPupilId,
  });

  const isDirty = currentSnapshot !== initialSnapshot;

  // Fetch pupils for instructor mode
  useEffect(() => {
    if (mode !== "instructor" || !instructorId) return;
    const fetchPupils = async () => {
      const { data } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("name");
      if (data) setPupils(data);
    };
    fetchPupils();
  }, [instructorId, mode]);

  // Validation
  const dateInvalid = !!(dateRangeEnd && testDate && dateRangeEnd < testDate);
  const timeInvalid = !!(
    requestType === "want_test" &&
    timeRangeEnd &&
    testTime &&
    timeRangeEnd <= testTime
  );

  const isValid = (() => {
    if (!centreName) return false;
    if (!testDate) return false;
    if (!testTime) return false;
    if (requestType === "want_test") {
      if (!dateRangeEnd) return false;
      if (!timeRangeEnd) return false;
    }
    if (dateInvalid || timeInvalid) return false;
    return true;
  })();

  const saveDisabled = !isValid || submitting;

  const handleCancel = () => {
    if (isDirty) {
      const ok = window.confirm("Discard changes?");
      if (!ok) return;
    }
    onCancel?.();
  };

  const handleSubmit = async () => {
    if (saveDisabled) return;
    setSubmitting(true);
    try {
      const payload = {
        request_type: requestType,
        test_centre_id: selectedCentreId,
        test_centre_name: centreName,
        test_date: format(testDate!, "yyyy-MM-dd"),
        test_time: testTime,
        date_range_end: dateRangeEnd ? format(dateRangeEnd, "yyyy-MM-dd") : null,
        time_range_end: timeRangeEnd || null,
        willing_to_pay_swap_fee: false,
        notes: notes || null,
      };

      if (editData) {
        const { error } = await supabase
          .from("test_requests")
          .update(payload)
          .eq("id", editData.id);
        if (error) throw error;
        toast({ title: "Request updated!" });
      } else {
        const { error } = await supabase.from("test_requests").insert({
          ...payload,
          instructor_id: instructorId!,
          pupil_id: mode === "pupil" ? pupilId : selectedPupilId || null,
          created_by_type: mode,
        });
        if (error) throw error;
        toast({ title: "Test request created!" });
      }

      queryClient.invalidateQueries({ queryKey: ["test-requests"] });
      queryClient.invalidateQueries({ queryKey: ["test-requests-board"] });
      queryClient.invalidateQueries({ queryKey: ["matched-slots"] });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const fromDateLabel = testDate
    ? formatShortDate(testDate, dateRangeEnd?.getFullYear())
    : null;
  const toDateLabel = dateRangeEnd
    ? formatShortDate(dateRangeEnd, testDate?.getFullYear())
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "85vh", fontFamily: FONT_STACK }}>
      {/* Sticky header bar */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "0.5px solid #E5E5EA",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: "transparent",
            border: "none",
            padding: 4,
            flexShrink: 0,
            fontSize: 14,
            fontWeight: 500,
            color: HEADER_LINK,
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
        >
          Cancel
        </button>
        <h2
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 15,
            fontWeight: 500,
            color: "#000000",
            letterSpacing: -0.2,
            margin: 0,
          }}
        >
          {isEdit ? "Edit test request" : "New test request"}
        </h2>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saveDisabled}
          aria-disabled={saveDisabled}
          style={{
            background: "transparent",
            border: "none",
            padding: 4,
            flexShrink: 0,
            fontSize: 14,
            fontWeight: 500,
            color: HEADER_LINK,
            cursor: saveDisabled ? (submitting ? "wait" : "not-allowed") : "pointer",
            opacity: saveDisabled ? (submitting ? 0.6 : 0.4) : 1,
            fontFamily: FONT_STACK,
          }}
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Type toggle */}
        <section>
          <SectionLabel>What do you need?</SectionLabel>
          <SegmentedControl
            value={requestType}
            onChange={(v) => setRequestType(v as "have_test" | "want_test")}
            options={[
              { value: "have_test", label: "Have one" },
              { value: "want_test", label: "Need one" },
            ]}
            ariaLabel="Request type"
          />
        </section>

        {/* Pupil selector – instructor mode, new requests only */}
        {mode === "instructor" && pupils.length > 0 && !editData && (
          <section>
            <SectionLabel>Pupil (optional)</SectionLabel>
            <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
              <SelectTrigger
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E5EA",
                  borderRadius: 10,
                  padding: "12px 14px",
                  height: "auto",
                  fontSize: 15,
                }}
              >
                <SelectValue placeholder="Select a pupil…" />
              </SelectTrigger>
              <SelectContent>
                {pupils.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        )}

        {/* Test centre */}
        <section>
          <SectionLabel>Test centre</SectionLabel>
          <TestCentrePicker
            selectedId={selectedCentreId}
            selectedName={centreName || null}
            onSelect={(c) => {
              setSelectedCentreId(c.id);
              setCentreName(c.name);
            }}
            invalid={!centreName && submitting}
          />
        </section>

        {/* Date range */}
        <section>
          <SectionLabel>Date range</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <Popover>
              <PopoverTrigger asChild>
                <div>
                  <FormInputCard
                    asDiv
                    topLabel="From"
                    icon={<CalendarIcon size={16} strokeWidth={1.8} />}
                    placeholder="Pick date"
                    value={fromDateLabel ?? ""}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={testDate}
                  onSelect={setTestDate}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {requestType === "want_test" && (
              <Popover>
                <PopoverTrigger asChild>
                  <div>
                    <FormInputCard
                      asDiv
                      topLabel="To"
                      icon={<CalendarIcon size={16} strokeWidth={1.8} />}
                      placeholder="Pick date"
                      value={toDateLabel ?? ""}
                      invalid={dateInvalid}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRangeEnd}
                    onSelect={setDateRangeEnd}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </section>

        {/* Time window */}
        <section>
          <SectionLabel>Time window</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <TimeInputCard
              label={requestType === "want_test" ? "Earliest" : "Time"}
              value={testTime}
              onChange={setTestTime}
            />
            {requestType === "want_test" && (
              <TimeInputCard
                label="Latest"
                value={timeRangeEnd}
                onChange={setTimeRangeEnd}
                invalid={timeInvalid}
              />
            )}
          </div>
        </section>

        {/* Notes */}
        <section>
          <SectionLabel>Notes (optional)</SectionLabel>
          <Textarea
            placeholder="Any additional details…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{
              background: "#FFFFFF",
              border: "0.5px solid #E5E5EA",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 15,
              fontFamily: FONT_STACK,
              resize: "none",
            }}
          />
        </section>
      </div>
    </div>
  );
}

/**
 * Time input wrapping the native picker inside the premium card chrome.
 * Keeps the existing `<input type="time">` UX (taps open the native picker)
 * but renders the formatted display value on top.
 */
function TimeInputCard({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const display = value ? formatShortTime(value) : null;
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "#6E6E73",
          margin: "0 0 4px",
          paddingLeft: 2,
          fontFamily: FONT_STACK,
        }}
      >
        {label}
      </div>
      <label
        style={{
          background: "#FFFFFF",
          border: `0.5px solid ${invalid ? "#C8434F" : "#E5E5EA"}`,
          borderRadius: 10,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          cursor: "pointer",
          position: "relative",
          fontFamily: FONT_STACK,
        }}
      >
        <Clock size={16} strokeWidth={1.8} color="#6E6E73" />
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: display ? 500 : 400,
            color: display ? "#000000" : "#6E6E73",
          }}
        >
          {display ?? "Set time"}
        </span>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        />
      </label>
    </div>
  );
}
