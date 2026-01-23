import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Award,
  Car,
  FileText,
  Loader2,
  Save,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
  User,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { FaultRow } from "./FaultRow";
import { CompetencySection, SectionHeader } from "./CompetencySection";
import {
  DrivingTestFaults,
  FaultEntry,
  Examiner,
  createDefaultFaults,
} from "./types";
import { ExaminerSelector } from "./ExaminerSelector";

interface DrivingTestReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  existingResultId?: string;
  defaultIsMock?: boolean;
  onSaved?: () => void;
}

export function DrivingTestReportForm({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  existingResultId,
  defaultIsMock = false,
  onSaved,
}: DrivingTestReportFormProps) {
  const { instructor } = useInstructorAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [isMock, setIsMock] = useState(defaultIsMock);
  const [testDate, setTestDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [testTime, setTestTime] = useState("");
  const [testCentreId, setTestCentreId] = useState<string>("");
  const [examinerId, setExaminerId] = useState<string>("");
  const [applicationRef, setApplicationRef] = useState("");
  const [catType, setCatType] = useState("Manual");
  const [adiCertNo, setAdiCertNo] = useState("");
  const [faults, setFaults] = useState<DrivingTestFaults>(createDefaultFaults());
  const [examinerTookAction, setExaminerTookAction] = useState(false);
  const [etaCode, setEtaCode] = useState("");
  const [debriefCode, setDebriefCode] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<"pass" | "fail" | null>(null);

  // Test centres
  const [testCentres, setTestCentres] = useState<Array<{ id: string; name: string }>>([]);

  // Calculate totals
  const totals = useMemo(() => {
    let minor = 0;
    let serious = 0;
    let dangerous = 0;

    const countFaults = (entry: FaultEntry) => {
      minor += entry.total;
      if (entry.serious) serious++;
      if (entry.dangerous) dangerous++;
    };

    const processFaultObject = (obj: Record<string, unknown>) => {
      Object.values(obj).forEach((value) => {
        if (value && typeof value === "object") {
          if ("total" in value && "serious" in value && "dangerous" in value) {
            countFaults(value as FaultEntry);
          } else if (!("pass" in value && "fail" in value)) {
            processFaultObject(value as Record<string, unknown>);
          }
        }
      });
    };

    processFaultObject(faults as unknown as Record<string, unknown>);

    return { minor, serious, dangerous };
  }, [faults]);

  // Auto-fail if any serious or dangerous
  const autoResult = totals.serious > 0 || totals.dangerous > 0 ? "fail" : null;

  useEffect(() => {
    if (open) {
      fetchTestCentres();
      if (existingResultId) {
        loadExistingResult();
      } else {
        resetForm();
      }
    }
  }, [open, existingResultId]);

  const resetForm = () => {
    setIsMock(defaultIsMock);
    setTestDate(format(new Date(), "yyyy-MM-dd"));
    setTestTime("");
    setTestCentreId("");
    setExaminerId("");
    setApplicationRef("");
    setCatType("Manual");
    setAdiCertNo("");
    setFaults(createDefaultFaults());
    setExaminerTookAction(false);
    setEtaCode("");
    setDebriefCode("");
    setNotes("");
    setResult(null);
  };

  const fetchTestCentres = async () => {
    if (!instructor?.id) return;
    // @ts-ignore - Supabase type depth issue
    const result = await supabase
      .from("test_centres")
      .select("id, name")
      .eq("instructor_id", instructor.id)
      .order("name");
    if (result.data) setTestCentres(result.data as Array<{ id: string; name: string }>);
  };

  const loadExistingResult = async () => {
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
        setFaults((data.faults as unknown as DrivingTestFaults) || createDefaultFaults());
        setExaminerTookAction(data.examiner_took_action);
        setEtaCode(data.eta_code || "");
        setDebriefCode(data.debrief_activity_code || "");
        setNotes(data.notes || "");
        setResult(data.result as "pass" | "fail");
      }
    } catch (error) {
      console.error("Error loading result:", error);
      toast({ title: "Error loading test result", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!instructor?.id) return;

    const finalResult = autoResult || result;
    if (!finalResult) {
      toast({ title: "Please select Pass or Fail", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const testData = {
        pupil_id: pupilId,
        instructor_id: instructor.id,
        examiner_id: examinerId || null,
        test_date: testDate,
        test_time: testTime || null,
        test_centre_id: testCentreId || null,
        is_mock: isMock,
        result: finalResult,
        application_ref: applicationRef || null,
        cat_type: catType,
        adi_cert_no: adiCertNo || null,
        faults: JSON.parse(JSON.stringify(faults)),
        total_minor_faults: totals.minor,
        total_serious_faults: totals.serious,
        total_dangerous_faults: totals.dangerous,
        examiner_took_action: examinerTookAction,
        eta_code: etaCode || null,
        debrief_activity_code: debriefCode || null,
        notes: notes || null,
      };

      if (existingResultId) {
        const { error } = await supabase
          .from("driving_test_results")
          .update(testData as any)
          .eq("id", existingResultId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("driving_test_results")
          .insert(testData as any);
        if (error) throw error;

        // Update pupil record if this is a real test
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
        title: isMock ? "Mock test recorded" : finalResult === "pass" ? "Congratulations!" : "Result recorded",
        description: isMock
          ? `Mock test result saved for ${pupilName}`
          : finalResult === "pass"
          ? `${pupilName} has passed their driving test!`
          : `Test result recorded for ${pupilName}`,
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving test result:", error);
      toast({ title: "Error", description: "Failed to save result", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateFault = (path: string[], value: FaultEntry) => {
    setFaults((prev) => {
      const newFaults = { ...prev };
      let current: Record<string, unknown> = newFaults;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...(current[path[i]] as Record<string, unknown>) };
        current = current[path[i]] as Record<string, unknown>;
      }
      current[path[path.length - 1]] = value;
      return newFaults as DrivingTestFaults;
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isMock ? "bg-blue-100 dark:bg-blue-900" : "bg-primary/10"}`}>
                {isMock ? (
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <DialogHeader className="p-0 space-y-1">
                  <DialogTitle className="text-lg">
                    {isMock ? "Mock Test" : "Driving Test Report"} - DL25A
                  </DialogTitle>
                  <DialogDescription>{pupilName}</DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="mock-toggle" className="text-sm font-medium">
                Mock Test
              </Label>
              <Switch
                id="mock-toggle"
                checked={isMock}
                onCheckedChange={setIsMock}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* Test Info Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Test Date
                </Label>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Time
                </Label>
                <Input
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Test Centre
                </Label>
                <Select value={testCentreId} onValueChange={setTestCentreId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {testCentres.map((tc) => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <User className="h-3 w-3" /> Examiner
                </Label>
                <ExaminerSelector
                  value={examinerId}
                  onChange={setExaminerId}
                  instructorId={instructor?.id || ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Application Ref.</Label>
                <Input
                  value={applicationRef}
                  onChange={(e) => setApplicationRef(e.target.value)}
                  placeholder="DTC Code"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category Type</Label>
                <Select value={catType} onValueChange={setCatType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Auto">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ADI Cert. No.</Label>
                <Input
                  value={adiCertNo}
                  onChange={(e) => setAdiCertNo(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="examiner-action"
                    checked={examinerTookAction}
                    onCheckedChange={(c) => setExaminerTookAction(!!c)}
                  />
                  <Label htmlFor="examiner-action" className="text-xs">
                    Examiner took physical action
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Competency Grid - Two Columns */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <CompetencySection title="Eyesight & Safety" number="1">
                  <SectionHeader />
                  <FaultRow
                    label="1a. Eyesight"
                    value={faults.eyesight}
                    onChange={(v) => updateFault(["eyesight"], v)}
                  />
                  <FaultRow
                    label="1b. H/Code / Safety"
                    value={faults.highway_code_safety}
                    onChange={(v) => updateFault(["highway_code_safety"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Controlled Stop" number="2">
                  <SectionHeader />
                  <FaultRow
                    label="Promptness"
                    value={faults.controlled_stop.promptness}
                    onChange={(v) => updateFault(["controlled_stop", "promptness"], v)}
                  />
                  <FaultRow
                    label="Control"
                    value={faults.controlled_stop.control}
                    onChange={(v) => updateFault(["controlled_stop", "control"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Manoeuvres" number="3-6">
                  <SectionHeader />
                  <FaultRow
                    label="3. Reverse/Left - Control"
                    value={faults.reverse_left.control}
                    onChange={(v) => updateFault(["reverse_left", "control"], v)}
                  />
                  <FaultRow
                    label="Observation"
                    value={faults.reverse_left.observation}
                    onChange={(v) => updateFault(["reverse_left", "observation"], v)}
                    indent
                  />
                  <FaultRow
                    label="4. Reverse/Right - Control"
                    value={faults.reverse_right.control}
                    onChange={(v) => updateFault(["reverse_right", "control"], v)}
                  />
                  <FaultRow
                    label="Observation"
                    value={faults.reverse_right.observation}
                    onChange={(v) => updateFault(["reverse_right", "observation"], v)}
                    indent
                  />
                  <FaultRow
                    label="5. Reverse Park - Control"
                    value={faults.reverse_park.control}
                    onChange={(v) => updateFault(["reverse_park", "control"], v)}
                  />
                  <FaultRow
                    label="Observation"
                    value={faults.reverse_park.observation}
                    onChange={(v) => updateFault(["reverse_park", "observation"], v)}
                    indent
                  />
                  <FaultRow
                    label="6. Turn in Road - Control"
                    value={faults.turn_in_road.control}
                    onChange={(v) => updateFault(["turn_in_road", "control"], v)}
                  />
                  <FaultRow
                    label="Observation"
                    value={faults.turn_in_road.observation}
                    onChange={(v) => updateFault(["turn_in_road", "observation"], v)}
                    indent
                  />
                </CompetencySection>

                <CompetencySection title="Vehicle Checks & Taxi" number="7-10">
                  <SectionHeader />
                  <FaultRow
                    label="7. Vehicle Checks"
                    value={faults.vehicle_checks}
                    onChange={(v) => updateFault(["vehicle_checks"], v)}
                  />
                  <FaultRow
                    label="8. Taxi Manoeuvre - Control"
                    value={faults.taxi_manoeuvre.control}
                    onChange={(v) => updateFault(["taxi_manoeuvre", "control"], v)}
                  />
                  <FaultRow
                    label="Observation"
                    value={faults.taxi_manoeuvre.observation}
                    onChange={(v) => updateFault(["taxi_manoeuvre", "observation"], v)}
                    indent
                  />
                  <FaultRow
                    label="9. Taxi Wheelchair"
                    value={faults.taxi_wheelchair}
                    onChange={(v) => updateFault(["taxi_wheelchair"], v)}
                  />
                  <FaultRow
                    label="10. Uncouple/Recouple"
                    value={faults.uncouple_recouple}
                    onChange={(v) => updateFault(["uncouple_recouple"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Control" number="11-12">
                  <SectionHeader />
                  <FaultRow
                    label="11. Precautions"
                    value={faults.precautions}
                    onChange={(v) => updateFault(["precautions"], v)}
                  />
                  <FaultRow
                    label="12. Accelerator"
                    value={faults.control.accelerator}
                    onChange={(v) => updateFault(["control", "accelerator"], v)}
                  />
                  <FaultRow
                    label="Clutch"
                    value={faults.control.clutch}
                    onChange={(v) => updateFault(["control", "clutch"], v)}
                    indent
                  />
                  <FaultRow
                    label="Gears"
                    value={faults.control.gears}
                    onChange={(v) => updateFault(["control", "gears"], v)}
                    indent
                  />
                  <FaultRow
                    label="Footbrake"
                    value={faults.control.footbrake}
                    onChange={(v) => updateFault(["control", "footbrake"], v)}
                    indent
                  />
                  <FaultRow
                    label="Parking Brake"
                    value={faults.control.parking_brake}
                    onChange={(v) => updateFault(["control", "parking_brake"], v)}
                    indent
                  />
                  <FaultRow
                    label="Steering"
                    value={faults.control.steering}
                    onChange={(v) => updateFault(["control", "steering"], v)}
                    indent
                  />
                </CompetencySection>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <CompetencySection title="Move Off" number="13">
                  <SectionHeader />
                  <FaultRow
                    label="Safety"
                    value={faults.move_off.safety}
                    onChange={(v) => updateFault(["move_off", "safety"], v)}
                  />
                  <FaultRow
                    label="Control"
                    value={faults.move_off.control}
                    onChange={(v) => updateFault(["move_off", "control"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Use of Mirrors" number="14">
                  <SectionHeader />
                  <FaultRow
                    label="Rear Observation"
                    value={faults.mirrors_mc.rear_obs}
                    onChange={(v) => updateFault(["mirrors_mc", "rear_obs"], v)}
                  />
                  <FaultRow
                    label="Signalling"
                    value={faults.mirrors_mc.signalling}
                    onChange={(v) => updateFault(["mirrors_mc", "signalling"], v)}
                  />
                  <FaultRow
                    label="Change Direction"
                    value={faults.mirrors_mc.change_direction}
                    onChange={(v) => updateFault(["mirrors_mc", "change_direction"], v)}
                  />
                  <FaultRow
                    label="Change Speed"
                    value={faults.mirrors_mc.change_speed}
                    onChange={(v) => updateFault(["mirrors_mc", "change_speed"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Signals" number="15">
                  <SectionHeader />
                  <FaultRow
                    label="Necessary"
                    value={faults.signals.necessary}
                    onChange={(v) => updateFault(["signals", "necessary"], v)}
                  />
                  <FaultRow
                    label="Correctly"
                    value={faults.signals.correctly}
                    onChange={(v) => updateFault(["signals", "correctly"], v)}
                  />
                  <FaultRow
                    label="Timed"
                    value={faults.signals.timed}
                    onChange={(v) => updateFault(["signals", "timed"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Response to Signs/Signals" number="16-17">
                  <SectionHeader />
                  <FaultRow
                    label="16. Clearance/Obstructions"
                    value={faults.clearance_obstructions}
                    onChange={(v) => updateFault(["clearance_obstructions"], v)}
                  />
                  <FaultRow
                    label="17. Traffic Signs"
                    value={faults.response.traffic_signs}
                    onChange={(v) => updateFault(["response", "traffic_signs"], v)}
                  />
                  <FaultRow
                    label="Road Markings"
                    value={faults.response.road_markings}
                    onChange={(v) => updateFault(["response", "road_markings"], v)}
                    indent
                  />
                  <FaultRow
                    label="Traffic Lights"
                    value={faults.response.traffic_lights}
                    onChange={(v) => updateFault(["response", "traffic_lights"], v)}
                    indent
                  />
                  <FaultRow
                    label="Traffic Controllers"
                    value={faults.response.traffic_controllers}
                    onChange={(v) => updateFault(["response", "traffic_controllers"], v)}
                    indent
                  />
                  <FaultRow
                    label="Other Road Users"
                    value={faults.response.other_road_users}
                    onChange={(v) => updateFault(["response", "other_road_users"], v)}
                    indent
                  />
                </CompetencySection>

                <CompetencySection title="Speed & Progress" number="18-20">
                  <SectionHeader />
                  <FaultRow
                    label="18. Use of Speed"
                    value={faults.use_of_speed}
                    onChange={(v) => updateFault(["use_of_speed"], v)}
                  />
                  <FaultRow
                    label="19. Following Distance"
                    value={faults.following_distance}
                    onChange={(v) => updateFault(["following_distance"], v)}
                  />
                  <FaultRow
                    label="20. Appropriate Speed"
                    value={faults.progress.appropriate_speed}
                    onChange={(v) => updateFault(["progress", "appropriate_speed"], v)}
                  />
                  <FaultRow
                    label="Undue Hesitation"
                    value={faults.progress.undue_hesitation}
                    onChange={(v) => updateFault(["progress", "undue_hesitation"], v)}
                    indent
                  />
                </CompetencySection>

                <CompetencySection title="Junctions" number="21">
                  <SectionHeader />
                  <FaultRow
                    label="Approach Speed"
                    value={faults.junctions.approach_speed}
                    onChange={(v) => updateFault(["junctions", "approach_speed"], v)}
                  />
                  <FaultRow
                    label="Observation"
                    value={faults.junctions.observation}
                    onChange={(v) => updateFault(["junctions", "observation"], v)}
                  />
                  <FaultRow
                    label="Turning Right"
                    value={faults.junctions.turning_right}
                    onChange={(v) => updateFault(["junctions", "turning_right"], v)}
                  />
                  <FaultRow
                    label="Turning Left"
                    value={faults.junctions.turning_left}
                    onChange={(v) => updateFault(["junctions", "turning_left"], v)}
                  />
                  <FaultRow
                    label="Cutting Corners"
                    value={faults.junctions.cutting_corners}
                    onChange={(v) => updateFault(["junctions", "cutting_corners"], v)}
                  />
                </CompetencySection>

                <CompetencySection title="Judgement & Positioning" number="22-23">
                  <SectionHeader />
                  <FaultRow
                    label="22. Overtaking"
                    value={faults.judgement.overtaking}
                    onChange={(v) => updateFault(["judgement", "overtaking"], v)}
                  />
                  <FaultRow
                    label="Meeting"
                    value={faults.judgement.meeting}
                    onChange={(v) => updateFault(["judgement", "meeting"], v)}
                    indent
                  />
                  <FaultRow
                    label="Crossing"
                    value={faults.judgement.crossing}
                    onChange={(v) => updateFault(["judgement", "crossing"], v)}
                    indent
                  />
                  <FaultRow
                    label="23. Normal Driving"
                    value={faults.positioning.normal_driving}
                    onChange={(v) => updateFault(["positioning", "normal_driving"], v)}
                  />
                  <FaultRow
                    label="Lane Discipline"
                    value={faults.positioning.lane_discipline}
                    onChange={(v) => updateFault(["positioning", "lane_discipline"], v)}
                    indent
                  />
                </CompetencySection>

                <CompetencySection title="Additional" number="24-28">
                  <SectionHeader />
                  <FaultRow
                    label="24. Pedestrian Crossings"
                    value={faults.pedestrian_crossings}
                    onChange={(v) => updateFault(["pedestrian_crossings"], v)}
                  />
                  <FaultRow
                    label="25. Position/Normal Stops"
                    value={faults.position_normal_stops}
                    onChange={(v) => updateFault(["position_normal_stops"], v)}
                  />
                  <FaultRow
                    label="26. Awareness/Planning"
                    value={faults.awareness_planning}
                    onChange={(v) => updateFault(["awareness_planning"], v)}
                  />
                  <FaultRow
                    label="27. Ancillary Controls"
                    value={faults.ancillary_controls}
                    onChange={(v) => updateFault(["ancillary_controls"], v)}
                  />
                  <FaultRow
                    label="28. Eco Safe Driving"
                    value={faults.eco_safe_driving}
                    onChange={(v) => updateFault(["eco_safe_driving"], v)}
                  />
                </CompetencySection>
              </div>
            </div>

            <Separator />

            {/* ETA & Debrief */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">ETA Code</Label>
                <Select value={etaCode} onValueChange={setEtaCode}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="V">V - Verbal</SelectItem>
                    <SelectItem value="P">P - Physical</SelectItem>
                    <SelectItem value="D255">D255</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Debrief/Activity Code</Label>
                <Input
                  value={debriefCode}
                  onChange={(e) => setDebriefCode(e.target.value)}
                  className="h-9"
                  placeholder="Code"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer with Totals and Result */}
        <div className="px-6 py-4 border-t bg-muted/30 space-y-4 flex-shrink-0">
          {/* Fault Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{totals.minor}</div>
                <div className="text-xs text-muted-foreground">Minor</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{totals.serious}</div>
                <div className="text-xs text-muted-foreground">Serious</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{totals.dangerous}</div>
                <div className="text-xs text-muted-foreground">Dangerous</div>
              </div>
            </div>

            {autoResult && (
              <Badge variant="destructive" className="text-sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Auto-fail: {totals.serious > 0 ? "Serious" : "Dangerous"} fault recorded
              </Badge>
            )}
          </div>

          {/* Result Selection & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Result:</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={result === "pass" ? "default" : "outline"}
                  size="sm"
                  disabled={!!autoResult}
                  onClick={() => setResult("pass")}
                  className={result === "pass" && !autoResult ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Pass
                </Button>
                <Button
                  type="button"
                  variant={result === "fail" || autoResult ? "default" : "outline"}
                  size="sm"
                  disabled={!!autoResult}
                  onClick={() => setResult("fail")}
                  className={result === "fail" || autoResult ? "bg-destructive hover:bg-destructive/90" : ""}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Fail
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || (!result && !autoResult)}
                className={result === "pass" && !autoResult ? "bg-emerald-500 hover:bg-emerald-600" : ""}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Result
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
