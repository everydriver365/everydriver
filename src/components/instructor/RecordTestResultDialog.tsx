import { useState } from "react";
import { Award, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RecordTestResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  pupilName: string;
  onResultRecorded: () => void;
}

export function RecordTestResultDialog({
  open,
  onOpenChange,
  pupilId,
  pupilName,
  onResultRecorded,
}: RecordTestResultDialogProps) {
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<"pass" | "fail" | null>(null);

  const handleSave = async () => {
    if (!result) {
      toast({ title: "Please select Pass or Fail", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Get current test attempts
      const { data: pupilData } = await supabase
        .from("pupils")
        .select("test_attempts")
        .eq("id", pupilId)
        .single();

      const currentAttempts = pupilData?.test_attempts || 0;

      // Update pupil with test result
      const { error } = await supabase
        .from("pupils")
        .update({
          test_passed: result === "pass",
          test_result_date: new Date().toISOString().split("T")[0],
          test_attempts: currentAttempts + 1,
          progress: result === "pass" ? 100 : undefined,
        })
        .eq("id", pupilId);

      if (error) throw error;

      // Add a note to lesson history if notes were provided
      if (notes.trim()) {
        // Find instructor_id from existing records
        const { data: existingLesson } = await supabase
          .from("lesson_history")
          .select("instructor_id")
          .eq("pupil_id", pupilId)
          .limit(1)
          .single();

        if (existingLesson?.instructor_id) {
          await supabase.from("lesson_history").insert({
            pupil_id: pupilId,
            instructor_id: existingLesson.instructor_id,
            lesson_date: new Date().toISOString().split("T")[0],
            duration_minutes: 0,
            notes: `Test Result: ${result === "pass" ? "PASSED" : "FAILED"} 🎉\n${notes}`,
          });
        }
      }

      toast({
        title: result === "pass" ? "Congratulations!" : "Result recorded",
        description: result === "pass" 
          ? `${pupilName} has passed their driving test!` 
          : `Test result recorded for ${pupilName}`,
      });

      onResultRecorded();
      onOpenChange(false);
      setNotes("");
      setResult(null);
    } catch (error) {
      console.error("Error recording test result:", error);
      toast({ title: "Error", description: "Failed to record result", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Record Test Result
          </DialogTitle>
          <DialogDescription>
            Record the driving test result for {pupilName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pass/Fail Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={result === "pass" ? "default" : "outline"}
              className={`h-20 flex-col gap-2 ${result === "pass" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
              onClick={() => setResult("pass")}
            >
              <CheckCircle2 className="h-6 w-6" />
              <span>Passed</span>
            </Button>
            <Button
              type="button"
              variant={result === "fail" ? "default" : "outline"}
              className={`h-20 flex-col gap-2 ${result === "fail" ? "bg-destructive hover:bg-destructive/90" : ""}`}
              onClick={() => setResult("fail")}
            >
              <XCircle className="h-6 w-6" />
              <span>Failed</span>
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={result === "pass" 
                ? "e.g., First time pass! Only 3 minor faults." 
                : "e.g., Failed on parallel parking. Book more practice."}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !result}
            className={result === "pass" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Record Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
