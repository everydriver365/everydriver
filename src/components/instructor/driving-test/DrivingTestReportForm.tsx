import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { triggerAutomations } from "@/utils/triggerAutomations";
import { titleCaseName } from "@/lib/titleCase";

import { CompetencySection, SectionHeader } from "./CompetencySection";
import { FaultRow } from "./FaultRow";
import { ExaminerPicker } from "./ExaminerPicker";
import { createDefaultFaults, DrivingTestFaults, FaultEntry } from "./types";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import { FormInputCard } from "@/components/instructor/ui/FormInputCard";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";
import { TestCentrePicker } from "@/components/instructor/ui/TestCentrePicker";
import { ModeBanner } from "@/components/instructor/ui/ModeBanner";

const textSchema = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length <= 255, "Too long");

const saveSchema = z.object({
  applicationRef: textSchema.optional(),
  catType: textSchema.optional(),
  adiCertNo: textSchema.optional(),
  etaCode: textSchema.optional(),
  debriefCode: textSchema.optional(),
  notes: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length <= 4000, "Notes too long")
    .optional(),
});

const isFaultEntry = (value: unknown): value is FaultEntry => {
  return (
    !!value &&
    typeof value === "object" &&
    "total" in value &&
    "serious" in value &&
    "dangerous" in value
  );
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  existingResultId?: string;
  defaultIsMock?: boolean;
  onSaved?: () => void;
};

export function DrivingTestReportForm({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  existingResultId,
  defaultIsMock = false,
  onSaved,
}: Props) {
  const { instructor } = useInstructorAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // meta
  const [isMock, setIsMock] = useState(defaultIsMock);
  const [testDate, setTestDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [testTime, setTestTime] = useState("");
  const [testCentreId, setTestCentreId] = useState<string>("");
  const [examinerId, setExaminerId] = useState<string>("");
  const [applicationRef, setApplicationRef] = useState("");
  const [catType, setCatType] = useState("Manual");
  const [adiCertNo, setAdiCertNo] = useState("");
  const [examinerTookAction, setExaminerTookAction] = useState(false);
  const [etaCode, setEtaCode] = useState("");
  const [debriefCode, setDebriefCode] = useState("");
  const [notes, setNotes] = useState("");

  // faults
  const [faults, setFaults] = useState<DrivingTestFaults>(createDefaultFaults());
  const [result, setResult] = useState<"pass" | "fail" | null>(null);

  const [testCentres, setTestCentres] = useState<Array<{ id: string; name: string }>>([]);

  const totals = useMemo(() => {
    let minor = 0;
    let serious = 0;
    let dangerous = 0;

    const walk = (obj: unknown) => {
      if (!obj) return;
      if (Array.isArray(obj)) return obj.forEach(walk);
      if (typeof obj !== "object") return;

      for (const v of Object.values(obj as Record<string, unknown>)) {
        if (isFaultEntry(v)) {
          minor += v.total || 0;
          if (v.serious) serious += 1;
          if (v.dangerous) dangerous += 1;
        } else if (v && typeof v === "object") {
          walk(v);
        }
      }
    };

    walk(faults);
    return { minor, serious, dangerous };
  }, [faults]);

  const autoResult = totals.serious > 0 || totals.dangerous > 0 ? "fail" : null;

  const resetForm = () => {
    setIsMock(defaultIsMock);
    setTestDate(format(new Date(), "yyyy-MM-dd"));
    setTestTime("");
    setTestCentreId("");
    setExaminerId("");
    setApplicationRef("");
    setCatType("Manual");
    setAdiCertNo("");
    setExaminerTookAction(false);
    setEtaCode("");
    setDebriefCode("");
    setNotes("");
    setFaults(createDefaultFaults());
    setResult(null);
  };

  const updateFault = (path: string[], value: FaultEntry) => {
    setFaults((prev) => {
      const next = { ...(prev as unknown as Record<string, unknown>) };
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        cur[key] = { ...(cur[key] as Record<string, unknown>) };
        cur = cur[key] as Record<string, unknown>;
      }
      cur[path[path.length - 1]] = value;
      return next as unknown as DrivingTestFaults;
    });
  };

  const fetchTestCentres = async () => {
    if (!instructor?.id) return;
    try {
      // Only show centres assigned to this instructor (join table)
      const { data: assigned, error: assignedError } = await supabase
        .from("instructor_test_centres")
        .select("test_centre_id")
        .eq("instructor_id", instructor.id);
      if (assignedError) throw assignedError;

      const ids = (assigned || []).map((x) => x.test_centre_id).filter(Boolean);
      if (ids.length === 0) {
        // fall back: show all active centres
        const { data } = await supabase
          .from("test_centres")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        setTestCentres((data || []) as Array<{ id: string; name: string }>);
        return;
      }

      const { data, error } = await supabase
        .from("test_centres")
        .select("id, name")
        .in("id", ids)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;

      setTestCentres((data || []) as Array<{ id: string; name: string }>);
    } catch (e) {
      console.error("Failed to load test centres", e);
      setTestCentres([]);
    }
  };

  const loadExisting = async () => {
    if (!existingResultId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("driving_test_results")
        .select("*")
        .eq("id", existingResultId)
        .single();
      if (error) throw error;

      if (data) {
        setIsMock(data.is_mock);
        setTestDate(data.test_date);
        setTestTime(data.test_time || "");
        setTestCentreId(data.test_centre_id || "");
        setExaminerId(data.examiner_id || "");
        setApplicationRef(data.application_ref || "");
        setCatType(data.cat_type || "Manual");
        setAdiCertNo(data.adi_cert_no || "");
        setExaminerTookAction(!!data.examiner_took_action);
        setEtaCode(data.eta_code || "");
        setDebriefCode(data.debrief_activity_code || "");
        setNotes(data.notes || "");
        setFaults((data.faults as unknown as DrivingTestFaults) || createDefaultFaults());
        setResult((data.result as "pass" | "fail") || null);
      }
    } catch (e) {
      console.error("Failed to load test result", e);
      toast({ title: "Error", description: "Failed to load test result", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchTestCentres();
    if (existingResultId) {
      loadExisting();
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingResultId]);

  const handleSave = async () => {
    if (!instructor?.id) {
      toast({ title: "Not signed in", description: "Please sign in again", variant: "destructive" });
      return;
    }

    const finalResult = autoResult || result;
    if (!finalResult) {
      toast({ title: "Select a result", description: "Choose Pass or Fail", variant: "destructive" });
      return;
    }

    const parsed = saveSchema.safeParse({
      applicationRef,
      catType,
      adiCertNo,
      etaCode,
      debriefCode,
      notes,
    });
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message || "Please check the form",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pupil_id: pupilId,
        instructor_id: instructor.id,
        examiner_id: examinerId || null,
        test_date: testDate,
        test_time: testTime || null,
        test_centre_id: testCentreId || null,
        is_mock: isMock,
        result: finalResult,
        application_ref: parsed.data.applicationRef || null,
        cat_type: (parsed.data.catType || "Manual") as any,
        adi_cert_no: parsed.data.adiCertNo || null,
        faults: JSON.parse(JSON.stringify(faults)),
        total_minor_faults: totals.minor,
        total_serious_faults: totals.serious,
        total_dangerous_faults: totals.dangerous,
        examiner_took_action: examinerTookAction,
        eta_code: parsed.data.etaCode || null,
        debrief_activity_code: parsed.data.debriefCode || null,
        notes: parsed.data.notes || null,
      };

      if (existingResultId) {
        const { error } = await supabase
          .from("driving_test_results")
          .update(payload as any)
          .eq("id", existingResultId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("driving_test_results").insert(payload as any);
        if (error) throw error;

        // Update pupil record for official tests
        if (!isMock) {
          const { data: pupilData } = await supabase
            .from("pupils")
            .select("test_attempts")
            .eq("id", pupilId)
            .single();

          await supabase
            .from("pupils")
            .update({
              test_passed: finalResult === "pass",
              test_result_date: testDate,
              test_attempts: (pupilData?.test_attempts || 0) + 1,
              progress: finalResult === "pass" ? 100 : undefined,
            })
            .eq("id", pupilId);
        }
      }

      toast({
        title: isMock ? "Mock test saved" : "Test saved",
        description: `${pupilName} — ${finalResult.toUpperCase()}`,
      });

      // Fire automation if test passed (not mock)
      if (!isMock && finalResult === "pass" && instructor?.id) {
        triggerAutomations({
          triggerType: "test_passed",
          instructorId: instructor.id,
          pupilId,
          pupilName,
        });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to save test", e);
      toast({ title: "Error", description: "Failed to save test", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const requiredMissing =
    !testDate || !testCentreId || !catType || (!isMock && (!testTime || !examinerId));
  const headerSaveDisabled = saving || loading || requiredMissing;

  const formattedDate = (() => {
    try {
      return testDate ? format(parseISO(testDate), "d MMM yyyy") : null;
    } catch {
      return testDate || null;
    }
  })();

  const handleModeChange = (next: "real" | "mock") => {
    const wantMock = next === "mock";
    if (wantMock === isMock) return;
    // Preserve any entered data; just confirm the switch when there is data.
    const hasEntries =
      !!testTime ||
      !!testCentreId ||
      !!examinerId ||
      !!applicationRef ||
      !!notes ||
      !!adiCertNo ||
      !!etaCode ||
      !!debriefCode;
    if (hasEntries) {
      const ok = window.confirm(
        wantMock
          ? "Switch to Mock test? Your entries will be kept."
          : "Switch to Real test? Your entries will be kept.",
      );
      if (!ok) return;
    }
    setIsMock(wantMock);
  };

  const centreName =
    testCentres.find((c) => c.id === testCentreId)?.name ?? null;

  const titlePupilName = titleCaseName(pupilName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0 bg-white rounded-2xl">
        {/* Header bar — Cancel / Title block / Save */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "0.5px solid #E5E5EA",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#FFFFFF",
          }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{
              background: "transparent",
              border: 0,
              padding: 4,
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 500,
              color: "#2B7BC8",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 1px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {titlePupilName}
            </p>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#000000",
                letterSpacing: "-0.2px",
                margin: 0,
              }}
            >
              Test report (DL25A)
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={headerSaveDisabled}
            style={{
              background: "transparent",
              border: 0,
              padding: 4,
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 500,
              color: "#2B7BC8",
              cursor: headerSaveDisabled ? "not-allowed" : "pointer",
              opacity: headerSaveDisabled ? 0.4 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Mock vs Real banner */}
        <ModeBanner
          mode={isMock ? "mock" : "real"}
          onChange={handleModeChange}
        />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {/* Meta */}
            <div className="flex flex-col gap-[14px]">
              {/* Test date + Time row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <FormInputCard
                    icon={<CalendarDays size={16} strokeWidth={1.8} />}
                    topLabel="Test date"
                    value={formattedDate}
                    placeholder="Pick date"
                    asDiv
                  />
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    aria-label="Test date"
                    style={{
                      position: "absolute",
                      inset: 0,
                      top: 18,
                      width: "100%",
                      height: "calc(100% - 18px)",
                      opacity: 0,
                      cursor: "pointer",
                      border: 0,
                      padding: 0,
                      background: "transparent",
                    }}
                  />
                </div>
                <div className="relative">
                  <FormInputCard
                    icon={<Clock size={16} strokeWidth={1.8} />}
                    topLabel="Time"
                    value={testTime || null}
                    placeholder="Pick time"
                    asDiv
                  />
                  <input
                    type="time"
                    value={testTime}
                    onChange={(e) => setTestTime(e.target.value)}
                    aria-label="Time"
                    style={{
                      position: "absolute",
                      inset: 0,
                      top: 18,
                      width: "100%",
                      height: "calc(100% - 18px)",
                      opacity: 0,
                      cursor: "pointer",
                      border: 0,
                      padding: 0,
                      background: "transparent",
                    }}
                  />
                </div>
              </div>

              {/* Test centre */}
              <div>
                <EyebrowLabel>Test centre</EyebrowLabel>
                <TestCentrePicker
                  selectedId={testCentreId || null}
                  selectedName={centreName}
                  onSelect={(c) => {
                    if (c.id !== testCentreId && examinerId) {
                      // Cascading reset — examiner may not belong to the new centre.
                      setExaminerId("");
                      toast({
                        title: "Examiner cleared",
                        description: `Pick again for ${c.name}.`,
                      });
                    }
                    setTestCentreId(c.id);
                    setTestCentres((prev) =>
                      prev.some((p) => p.id === c.id)
                        ? prev
                        : [...prev, { id: c.id, name: c.name }],
                    );
                  }}
                />
              </div>

              {/* Examiner — cascades from Test centre */}
              <div>
                <EyebrowLabel>Examiner</EyebrowLabel>
                <ExaminerPicker
                  value={examinerId}
                  onChange={setExaminerId}
                  instructorId={instructor?.id || ""}
                  testCentreId={testCentreId || null}
                />
              </div>

              {/* Application ref */}
              {!isMock && (
                <div>
                  <EyebrowLabel>
                    Application ref
                    <span style={{ color: "#C7C7CC", textTransform: "none", letterSpacing: 0 }}>
                      {" "}— optional
                    </span>
                  </EyebrowLabel>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "0.5px solid #E5E5EA",
                      borderRadius: 10,
                      padding: "11px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <input
                      value={applicationRef}
                      onChange={(e) => setApplicationRef(e.target.value)}
                      placeholder="XXXXXX-XX-XXXXXX"
                      aria-label="Application reference"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: 0,
                        outline: "none",
                        padding: 0,
                        fontSize: 14,
                        fontFamily:
                          'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                        color: "#000000",
                        letterSpacing: 1,
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6E6E73",
                      margin: "6px 0 0",
                      paddingLeft: 2,
                    }}
                  >
                    Find this on the booking confirmation
                  </p>
                </div>
              )}

              {/* Vehicle category — segmented control */}
              <div>
                <EyebrowLabel>Vehicle category</EyebrowLabel>
                <SegmentedControl
                  value={catType}
                  onChange={(v) => setCatType(v)}
                  options={[
                    { value: "Manual", label: "Manual" },
                    { value: "Auto", label: "Automatic" },
                  ]}
                  ariaLabel="Vehicle category"
                />
              </div>

              {!isMock && (
                <div>
                  <EyebrowLabel>ADI cert no.</EyebrowLabel>
                  <Input
                    value={adiCertNo}
                    onChange={(e) => setAdiCertNo(e.target.value)}
                  />
                </div>
              )}
              {!isMock && (
                <div>
                  <EyebrowLabel>ETA code</EyebrowLabel>
                  <Input
                    value={etaCode}
                    onChange={(e) => setEtaCode(e.target.value)}
                  />
                </div>
              )}
              {!isMock && (
                <div>
                  <EyebrowLabel>Debrief / activity code</EyebrowLabel>
                  <Input
                    value={debriefCode}
                    onChange={(e) => setDebriefCode(e.target.value)}
                  />
                </div>
              )}
              <div>
                <EyebrowLabel>Notes</EyebrowLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>


            <Separator />

            {/* Faults grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <CompetencySection title="Eyesight & Safety" number="1">
                  <SectionHeader />
                  <FaultRow
                    label="1a Eyesight"
                    value={faults.eyesight}
                    onChange={(v) => updateFault(["eyesight"], v)}
                  />
                  <FaultRow
                    label="1b Highway code / safety"
                    value={faults.highway_code_safety}
                    onChange={(v) => updateFault(["highway_code_safety"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Controlled stop" number="2">
                  <SectionHeader />
                  <FaultRow
                    label="2 Promptness"
                    value={faults.controlled_stop.promptness}
                    onChange={(v) => updateFault(["controlled_stop", "promptness"], v)}
                  />
                  <FaultRow
                    label="2 Control"
                    value={faults.controlled_stop.control}
                    onChange={(v) => updateFault(["controlled_stop", "control"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Manoeuvres" number="3">
                  <SectionHeader />
                  <FaultRow
                    label="Reverse / left"
                    subLabel="Control"
                    value={faults.reverse_left.control}
                    onChange={(v) => updateFault(["reverse_left", "control"], v)}
                  />
                  <FaultRow
                    label="Reverse / left"
                    subLabel="Observation"
                    indent
                    value={faults.reverse_left.observation}
                    onChange={(v) => updateFault(["reverse_left", "observation"], v)}
                  />
                  <FaultRow
                    label="Reverse / right"
                    subLabel="Control"
                    value={faults.reverse_right.control}
                    onChange={(v) => updateFault(["reverse_right", "control"], v)}
                  />
                  <FaultRow
                    label="Reverse / right"
                    subLabel="Observation"
                    indent
                    value={faults.reverse_right.observation}
                    onChange={(v) => updateFault(["reverse_right", "observation"], v)}
                  />
                  <FaultRow
                    label="Reverse park"
                    subLabel="R/C"
                    value={faults.reverse_park.r_c}
                    onChange={(v) => updateFault(["reverse_park", "r_c"], v)}
                  />
                  <FaultRow
                    label="Reverse park"
                    subLabel="Control"
                    indent
                    value={faults.reverse_park.control}
                    onChange={(v) => updateFault(["reverse_park", "control"], v)}
                  />
                  <FaultRow
                    label="Reverse park"
                    subLabel="Observation"
                    indent
                    value={faults.reverse_park.observation}
                    onChange={(v) => updateFault(["reverse_park", "observation"], v)}
                  />
                  <FaultRow
                    label="Turn in the road"
                    subLabel="Control"
                    value={faults.turn_in_road.control}
                    onChange={(v) => updateFault(["turn_in_road", "control"], v)}
                  />
                  <FaultRow
                    label="Turn in the road"
                    subLabel="Observation"
                    indent
                    value={faults.turn_in_road.observation}
                    onChange={(v) => updateFault(["turn_in_road", "observation"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Controls" number="12">
                  <SectionHeader />
                  <FaultRow
                    label="Accelerator"
                    value={faults.control.accelerator}
                    onChange={(v) => updateFault(["control", "accelerator"], v)}
                  />
                  <FaultRow
                    label="Clutch"
                    value={faults.control.clutch}
                    onChange={(v) => updateFault(["control", "clutch"], v)}
                  />
                  <FaultRow
                    label="Gears"
                    value={faults.control.gears}
                    onChange={(v) => updateFault(["control", "gears"], v)}
                  />
                  <FaultRow
                    label="Footbrake"
                    value={faults.control.footbrake}
                    onChange={(v) => updateFault(["control", "footbrake"], v)}
                  />
                  <FaultRow
                    label="Parking brake"
                    value={faults.control.parking_brake}
                    onChange={(v) => updateFault(["control", "parking_brake"], v)}
                  />
                  <FaultRow
                    label="Steering"
                    value={faults.control.steering}
                    onChange={(v) => updateFault(["control", "steering"], v)}
                  />
                </CompetencySection>
              </div>

              <div className="space-y-4">
                <CompetencySection title="Move off, mirrors & signals" number="13">
                  <SectionHeader />
                  <FaultRow
                    label="Move off"
                    subLabel="Safety"
                    value={faults.move_off.safety}
                    onChange={(v) => updateFault(["move_off", "safety"], v)}
                  />
                  <FaultRow
                    label="Move off"
                    subLabel="Control"
                    indent
                    value={faults.move_off.control}
                    onChange={(v) => updateFault(["move_off", "control"], v)}
                  />
                  <FaultRow
                    label="Mirrors"
                    subLabel="Rear obs"
                    value={faults.mirrors_mc.rear_obs}
                    onChange={(v) => updateFault(["mirrors_mc", "rear_obs"], v)}
                  />
                  <FaultRow
                    label="Mirrors"
                    subLabel="Signalling"
                    indent
                    value={faults.mirrors_mc.signalling}
                    onChange={(v) => updateFault(["mirrors_mc", "signalling"], v)}
                  />
                  <FaultRow
                    label="Signals"
                    subLabel="Necessary"
                    value={faults.signals.necessary}
                    onChange={(v) => updateFault(["signals", "necessary"], v)}
                  />
                  <FaultRow
                    label="Signals"
                    subLabel="Correctly"
                    indent
                    value={faults.signals.correctly}
                    onChange={(v) => updateFault(["signals", "correctly"], v)}
                  />
                  <FaultRow
                    label="Signals"
                    subLabel="Timed"
                    indent
                    value={faults.signals.timed}
                    onChange={(v) => updateFault(["signals", "timed"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Response & progress" number="17">
                  <SectionHeader />
                  <FaultRow
                    label="Traffic signs"
                    value={faults.response.traffic_signs}
                    onChange={(v) => updateFault(["response", "traffic_signs"], v)}
                  />
                  <FaultRow
                    label="Road markings"
                    value={faults.response.road_markings}
                    onChange={(v) => updateFault(["response", "road_markings"], v)}
                  />
                  <FaultRow
                    label="Traffic lights"
                    value={faults.response.traffic_lights}
                    onChange={(v) => updateFault(["response", "traffic_lights"], v)}
                  />
                  <FaultRow
                    label="Other road users"
                    value={faults.response.other_road_users}
                    onChange={(v) => updateFault(["response", "other_road_users"], v)}
                  />
                  <FaultRow
                    label="Use of speed"
                    value={faults.use_of_speed}
                    onChange={(v) => updateFault(["use_of_speed"], v)}
                  />
                  <FaultRow
                    label="Following distance"
                    value={faults.following_distance}
                    onChange={(v) => updateFault(["following_distance"], v)}
                  />
                  <FaultRow
                    label="Progress"
                    subLabel="Appropriate speed"
                    value={faults.progress.appropriate_speed}
                    onChange={(v) => updateFault(["progress", "appropriate_speed"], v)}
                  />
                  <FaultRow
                    label="Progress"
                    subLabel="Undue hesitation"
                    indent
                    value={faults.progress.undue_hesitation}
                    onChange={(v) => updateFault(["progress", "undue_hesitation"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Junctions & positioning" number="21">
                  <SectionHeader />
                  <FaultRow
                    label="Junctions"
                    subLabel="Approach speed"
                    value={faults.junctions.approach_speed}
                    onChange={(v) => updateFault(["junctions", "approach_speed"], v)}
                  />
                  <FaultRow
                    label="Junctions"
                    subLabel="Observation"
                    indent
                    value={faults.junctions.observation}
                    onChange={(v) => updateFault(["junctions", "observation"], v)}
                  />
                  <FaultRow
                    label="Positioning"
                    subLabel="Normal driving"
                    value={faults.positioning.normal_driving}
                    onChange={(v) => updateFault(["positioning", "normal_driving"], v)}
                  />
                  <FaultRow
                    label="Positioning"
                    subLabel="Lane discipline"
                    indent
                    value={faults.positioning.lane_discipline}
                    onChange={(v) => updateFault(["positioning", "lane_discipline"], v)}
                  />
                  <FaultRow
                    label="Awareness / planning"
                    value={faults.awareness_planning}
                    onChange={(v) => updateFault(["awareness_planning"], v)}
                  />
                </CompetencySection>
              </div>
            </div>

            {/* Totals + result */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-2xl p-4 bg-muted/20">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary">Minor: {totals.minor}</Badge>
                <Badge variant={totals.serious ? "destructive" : "outline"}>S: {totals.serious}</Badge>
                <Badge variant={totals.dangerous ? "destructive" : "outline"}>D: {totals.dangerous}</Badge>
                {autoResult && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Auto fail
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={result === "pass" ? "default" : "outline"}
                  disabled={!!autoResult}
                  onClick={() => setResult("pass")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Pass
                </Button>
                <Button
                  type="button"
                  variant={result === "fail" || autoResult ? "destructive" : "outline"}
                  onClick={() => setResult("fail")}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Fail
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky bottom save bar — mirrors the header Save for reach on long forms. */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 16px",
            borderTop: "0.5px solid #E5E5EA",
            background: "#FFFFFF",
          }}
        >
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || requiredMissing}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
