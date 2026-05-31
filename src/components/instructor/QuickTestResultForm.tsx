import { useState, useEffect } from "react";
import { Award, Loader2, Plus, User, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface QuickTestResultFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  onSaved?: () => void;
}

interface Pupil {
  id: string;
  name: string;
}

interface Examiner {
  id: string;
  name: string;
  dvsa_staff_number: string | null;
}

export function QuickTestResultForm({
  open,
  onOpenChange,
  instructorId,
  onSaved,
}: QuickTestResultFormProps) {
  const [saving, setSaving] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [pupilId, setPupilId] = useState("");
  const [examinerId, setExaminerId] = useState("");
  const [result, setResult] = useState<"pass" | "fail" | null>(null);
  const [minorFaults, setMinorFaults] = useState<number>(0);
  const [seriousFaults, setSeriousFaults] = useState<number>(0);
  const [dangerousFaults, setDangerousFaults] = useState<number>(0);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // New examiner dialog
  const [showAddExaminer, setShowAddExaminer] = useState(false);
  const [newExaminerName, setNewExaminerName] = useState("");
  const [newExaminerNumber, setNewExaminerNumber] = useState("");
  const [addingExaminer, setAddingExaminer] = useState(false);

  useEffect(() => {
    if (open && instructorId) {
      fetchData();
    }
  }, [open, instructorId]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [pupilsRes, examinersRes] = await Promise.all([
        supabase
          .from("pupils")
          .select("id, name")
          .eq("instructor_id", instructorId)
          .eq("status", "active")
          .is("deleted_at", null)
          .order("name"),
        supabase
          .from("examiners")
          .select("id, name, dvsa_staff_number")
          .eq("instructor_id", instructorId)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (pupilsRes.data) setPupils(pupilsRes.data);
      if (examinersRes.data) setExaminers(examinersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setPupilId("");
    setExaminerId("");
    setResult(null);
    setMinorFaults(0);
    setSeriousFaults(0);
    setDangerousFaults(0);
    setTestDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  };

  const handleAddExaminer = async () => {
    if (!newExaminerName.trim()) {
      toast({ title: "Please enter examiner name", variant: "destructive" });
      return;
    }

    setAddingExaminer(true);
    try {
      const { data, error } = await supabase
        .from("examiners")
        .insert({
          instructor_id: instructorId,
          name: newExaminerName.trim(),
          dvsa_staff_number: newExaminerNumber.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setExaminers((prev) => [...prev, data as Examiner]);
      setExaminerId(data.id);
      setShowAddExaminer(false);
      setNewExaminerName("");
      setNewExaminerNumber("");
      toast({ title: "Examiner added" });
    } catch (error) {
      console.error("Error adding examiner:", error);
      toast({ title: "Failed to add examiner", variant: "destructive" });
    } finally {
      setAddingExaminer(false);
    }
  };

  const handleSave = async () => {
    if (!pupilId) {
      toast({ title: "Please select a pupil", variant: "destructive" });
      return;
    }
    if (!result) {
      toast({ title: "Please select Pass or Fail", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Create basic faults structure
      const faults = {
        quick_entry: {
          minors: minorFaults,
          serious: seriousFaults,
          dangerous: dangerousFaults,
        },
      };

      // Insert into driving_test_results
      const { error } = await supabase.from("driving_test_results").insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        examiner_id: examinerId || null,
        test_date: testDate,
        is_mock: false,
        result: result,
        faults: faults,
        total_minor_faults: minorFaults,
        total_serious_faults: seriousFaults,
        total_dangerous_faults: dangerousFaults,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      // Update pupil record
      const { data: pupilData } = await supabase
        .from("pupils")
        .select("test_attempts")
        .eq("id", pupilId)
        .single();

      await supabase
        .from("pupils")
        .update({
          test_passed: result === "pass",
          test_result_date: testDate,
          test_attempts: (pupilData?.test_attempts || 0) + 1,
          progress: result === "pass" ? 100 : undefined,
        })
        .eq("id", pupilId);

      const pupilName = pupils.find((p) => p.id === pupilId)?.name || "Pupil";
      toast({
        title: result === "pass" ? "Congratulations! 🎉" : "Result recorded",
        description:
          result === "pass"
            ? `${pupilName} has passed their driving test!`
            : `Test result recorded for ${pupilName}`,
      });

      resetForm();
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving test result:", error);
      toast({
        title: "Error",
        description: "Failed to save test result",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Log Test Result
            </DialogTitle>
            <DialogDescription>
              Quickly record a driving test result with fault counts
            </DialogDescription>
          </DialogHeader>

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Pupil Selection */}
              <div className="space-y-2">
                <Label>Pupil *</Label>
                <Select value={pupilId} onValueChange={setPupilId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pupil..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pupils.map((pupil) => (
                      <SelectItem key={pupil.id} value={pupil.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {pupil.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Examiner Selection */}
              <div className="space-y-2">
                <Label>Examiner</Label>
                <div className="flex gap-2">
                  <Select value={examinerId} onValueChange={setExaminerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select examiner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {examiners.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {ex.name}
                            {ex.dvsa_staff_number && (
                              <span className="text-xs text-muted-foreground">
                                ({ex.dvsa_staff_number})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAddExaminer(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Test Date */}
              <div className="space-y-2">
                <Label>Test Date</Label>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                />
              </div>

              {/* Pass/Fail Selection */}
              <div className="space-y-2">
                <Label>Result *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={result === "pass" ? "default" : "outline"}
                    className={`h-16 flex-col gap-2 ${
                      result === "pass" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                    }`}
                    onClick={() => setResult("pass")}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Passed</span>
                  </Button>
                  <Button
                    type="button"
                    variant={result === "fail" ? "default" : "outline"}
                    className={`h-16 flex-col gap-2 ${
                      result === "fail" ? "bg-destructive hover:bg-destructive/90" : ""
                    }`}
                    onClick={() => setResult("fail")}
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Failed</span>
                  </Button>
                </div>
              </div>

              {/* Fault Counts */}
              <div className="space-y-2">
                <Label>Faults</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Minor</Label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={minorFaults}
                      onChange={(e) =>
                        setMinorFaults(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-amber-600 font-medium">Serious</Label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={seriousFaults}
                      onChange={(e) =>
                        setSeriousFaults(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="text-center border-amber-300 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-destructive font-medium">
                      Dangerous
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={dangerousFaults}
                      onChange={(e) =>
                        setDangerousFaults(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="text-center border-destructive/50 focus:ring-destructive"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., First time pass! Only 3 minor faults."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !pupilId || !result}
              className={result === "pass" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Examiner Dialog */}
      <Dialog open={showAddExaminer} onOpenChange={setShowAddExaminer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Examiner</DialogTitle>
            <DialogDescription>
              Add a new driving test examiner to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="examiner-name">Examiner Name *</Label>
              <Input
                id="examiner-name"
                value={newExaminerName}
                onChange={(e) => setNewExaminerName(e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examiner-number">DVSA Staff Number</Label>
              <Input
                id="examiner-number"
                value={newExaminerNumber}
                onChange={(e) => setNewExaminerNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExaminer(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExaminer} disabled={addingExaminer}>
              {addingExaminer ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Examiner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
