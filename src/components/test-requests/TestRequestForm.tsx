import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

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
  editData?: TestRequestData;
}

interface TestCentre {
  id: string;
  name: string;
}

interface PupilOption {
  id: string;
  name: string;
}

export function TestRequestForm({ instructorId, pupilId, mode, onSuccess, editData }: TestRequestFormProps) {
  const queryClient = useQueryClient();
  const [requestType, setRequestType] = useState<"have_test" | "want_test">(editData?.request_type || "have_test");
  const [testCentreSearch, setTestCentreSearch] = useState(editData?.test_centre_name || "");
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(editData?.test_centre_id || null);
  const [manualCentreName, setManualCentreName] = useState(editData?.test_centre_name || "");
  const [testDate, setTestDate] = useState<Date | undefined>(editData?.test_date ? parseISO(editData.test_date) : undefined);
  const [testTime, setTestTime] = useState(editData?.test_time?.slice(0, 5) || "");
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(editData?.date_range_end ? parseISO(editData.date_range_end) : undefined);
  const [timeRangeEnd, setTimeRangeEnd] = useState(editData?.time_range_end?.slice(0, 5) || "");
  const [willingToPayFee, setWillingToPayFee] = useState(editData?.willing_to_pay_swap_fee || false);
  const [notes, setNotes] = useState(editData?.notes || "");
  const [selectedPupilId, setSelectedPupilId] = useState<string>(editData?.pupil_id || "");
  const [pupils, setPupils] = useState<PupilOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCentreDropdown, setShowCentreDropdown] = useState(false);

  // Fetch test centres
  useEffect(() => {
    const fetchCentres = async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name")
        .order("name");
      if (data) setTestCentres(data);
    };
    fetchCentres();
  }, []);

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

  const filteredCentres = testCentres.filter(c =>
    c.name.toLowerCase().includes(testCentreSearch.toLowerCase())
  );

  const handleSelectCentre = (centre: TestCentre) => {
    setSelectedCentreId(centre.id);
    setTestCentreSearch(centre.name);
    setManualCentreName(centre.name);
    setShowCentreDropdown(false);
  };

  const handleSubmit = async () => {
    if (!testDate || !testTime) {
      toast({ title: "Please enter a date and time", variant: "destructive" });
      return;
    }
    if (!selectedCentreId && !manualCentreName && !testCentreSearch) {
      toast({ title: "Please enter a test centre", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const centreName = manualCentreName || testCentreSearch;
      const payload = {
        request_type: requestType,
        test_centre_id: selectedCentreId,
        test_centre_name: centreName,
        test_date: format(testDate, "yyyy-MM-dd"),
        test_time: testTime,
        date_range_end: dateRangeEnd ? format(dateRangeEnd, "yyyy-MM-dd") : null,
        time_range_end: timeRangeEnd || null,
        willing_to_pay_swap_fee: willingToPayFee,
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
          pupil_id: mode === "pupil" ? pupilId : (selectedPupilId || null),
          created_by_type: mode,
        });
        if (error) throw error;
        toast({ title: "Test request created!" });
      }

      queryClient.invalidateQueries({ queryKey: ["test-requests"] });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Request Type */}
      <div className="space-y-2">
        <Label>What do you need?</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={requestType === "have_test" ? "default" : "outline"}
            onClick={() => setRequestType("have_test")}
            className="text-sm"
          >
            I have a test booked
          </Button>
          <Button
            type="button"
            variant={requestType === "want_test" ? "default" : "outline"}
            onClick={() => setRequestType("want_test")}
            className="text-sm"
          >
            I need a test
          </Button>
        </div>
      </div>

      {/* Pupil Selector (instructor mode, only for new requests) */}
      {mode === "instructor" && pupils.length > 0 && !editData && (
        <div className="space-y-2">
          <Label>Pupil (optional)</Label>
          <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a pupil..." />
            </SelectTrigger>
            <SelectContent>
              {pupils.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Test Centre Search */}
      <div className="space-y-2">
        <Label>Test Centre</Label>
        <div className="relative">
          <Input
            placeholder="Search test centres..."
            value={testCentreSearch}
            onChange={(e) => {
              setTestCentreSearch(e.target.value);
              setSelectedCentreId(null);
              setShowCentreDropdown(true);
            }}
            onFocus={() => setShowCentreDropdown(true)}
          />
          {showCentreDropdown && testCentreSearch && filteredCentres.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredCentres.slice(0, 8).map(c => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => handleSelectCentre(c)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {!selectedCentreId && testCentreSearch && (
          <p className="text-xs text-muted-foreground">
            Can't find it? The name you typed will be used.
          </p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{requestType === "have_test" ? "Test Date" : "From Date"}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !testDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {testDate ? format(testDate, "dd/MM/yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={testDate} onSelect={setTestDate} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>{requestType === "have_test" ? "Test Time" : "From Time"}</Label>
          <Input type="time" value={testTime} onChange={e => setTestTime(e.target.value)} />
        </div>
      </div>

      {/* Date/Time range end (for want_test) */}
      {requestType === "want_test" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRangeEnd && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRangeEnd ? format(dateRangeEnd, "dd/MM/yyyy") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRangeEnd} onSelect={setDateRangeEnd} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>To Time</Label>
            <Input type="time" value={timeRangeEnd} onChange={e => setTimeRangeEnd(e.target.value)} />
          </div>
        </div>
      )}

      {/* Swap Fee Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div>
          <p className="text-sm font-medium">Happy to pay £150 swap fee?</p>
          <p className="text-xs text-muted-foreground">This helps prioritise your request</p>
        </div>
        <Switch checked={willingToPayFee} onCheckedChange={setWillingToPayFee} />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          placeholder="Any additional details..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? "Saving..." : editData ? "Update Request" : "Submit Request"}
      </Button>
    </div>
  );
}