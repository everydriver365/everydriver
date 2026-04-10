import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResetStatsDialogProps {
  instructorId: string;
  instructorName?: string;
  onReset?: () => void;
}

const CONFIRMATION_WORD = "RESET";

export function ResetStatsDialog({ instructorId, instructorName, onReset }: ResetStatsDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmWord, setConfirmWord] = useState("");
  const [resetting, setResetting] = useState(false);
  const [options, setOptions] = useState({
    lessonHistory: false,
    paymentHistory: false,
    scheduledLessons: false,
    pupilProgress: false,
  });

  const hasSelection = Object.values(options).some(Boolean);
  const isConfirmWordValid = confirmWord.toUpperCase() === CONFIRMATION_WORD;

  const handleOpenConfirmation = () => {
    if (!hasSelection) {
      toast.error("Please select at least one option to reset");
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleReset = async () => {
    if (!isConfirmWordValid) {
      toast.error(`Please type "${CONFIRMATION_WORD}" to confirm`);
      return;
    }

    setResetting(true);
    try {
      // Reset selected data
      if (options.lessonHistory) {
        const { error } = await supabase
          .from("lesson_history")
          .delete()
          .eq("instructor_id", instructorId);
        if (error) throw error;
      }

      if (options.paymentHistory) {
        const { error } = await supabase
          .from("payment_history")
          .delete()
          .eq("instructor_id", instructorId);
        if (error) throw error;
      }

      if (options.scheduledLessons) {
        const { error } = await supabase
          .from("scheduled_lessons")
          .delete()
          .eq("instructor_id", instructorId);
        if (error) throw error;
      }

      if (options.pupilProgress) {
        const { error } = await supabase
          .from("pupils")
          .update({
            lessons_completed: 0,
            progress: 0,
            reward_points: 0,
            total_lessons_for_rewards: 0,
            free_lessons_earned: 0,
            test_passed: false,
            test_result_date: null,
          })
          .eq("instructor_id", instructorId);
        if (error) throw error;
      }

      toast.success("Stats have been reset successfully");
      setDialogOpen(false);
      setConfirmDialogOpen(false);
      setConfirmWord("");
      setOptions({
        lessonHistory: false,
        paymentHistory: false,
        scheduledLessons: false,
        pupilProgress: false,
      });
      onReset?.();
    } catch (error) {
      console.error("Error resetting stats:", error);
      toast.error("Failed to reset stats. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" />
            Reset Stats
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reset Statistics
            </DialogTitle>
            <DialogDescription>
              {instructorName ? `Reset stats for ${instructorName}.` : "Reset your statistics."} This action cannot be undone. Select what you want to reset:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 rounded-none border hover:bg-muted/50">
              <Checkbox
                id="lessonHistory"
                checked={options.lessonHistory}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, lessonHistory: checked as boolean })
                }
              />
              <div className="space-y-0.5">
                <Label htmlFor="lessonHistory" className="text-sm font-medium cursor-pointer">
                  Lesson History
                </Label>
                <p className="text-xs text-muted-foreground">
                  Delete all completed lesson records and notes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-none border hover:bg-muted/50">
              <Checkbox
                id="paymentHistory"
                checked={options.paymentHistory}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, paymentHistory: checked as boolean })
                }
              />
              <div className="space-y-0.5">
                <Label htmlFor="paymentHistory" className="text-sm font-medium cursor-pointer">
                  Payment History
                </Label>
                <p className="text-xs text-muted-foreground">
                  Delete all payment records and earnings data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-none border hover:bg-muted/50">
              <Checkbox
                id="scheduledLessons"
                checked={options.scheduledLessons}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, scheduledLessons: checked as boolean })
                }
              />
              <div className="space-y-0.5">
                <Label htmlFor="scheduledLessons" className="text-sm font-medium cursor-pointer">
                  Scheduled Lessons
                </Label>
                <p className="text-xs text-muted-foreground">
                  Delete all upcoming and past scheduled lessons
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-none border hover:bg-muted/50">
              <Checkbox
                id="pupilProgress"
                checked={options.pupilProgress}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, pupilProgress: checked as boolean })
                }
              />
              <div className="space-y-0.5">
                <Label htmlFor="pupilProgress" className="text-sm font-medium cursor-pointer">
                  Pupil Progress
                </Label>
                <p className="text-xs text-muted-foreground">
                  Reset all pupil lesson counts, points, and progress to zero
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleOpenConfirmation}
            disabled={!hasSelection}
          >
            Continue to Reset
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation Required
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to permanently delete the following data:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {options.lessonHistory && <li>All lesson history records</li>}
                  {options.paymentHistory && <li>All payment history records</li>}
                  {options.scheduledLessons && <li>All scheduled lessons</li>}
                  {options.pupilProgress && <li>All pupil progress data</li>}
                </ul>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="confirmWord" className="text-sm font-medium">
                    Type <span className="font-bold text-destructive">{CONFIRMATION_WORD}</span> to confirm:
                  </Label>
                  <Input
                    id="confirmWord"
                    value={confirmWord}
                    onChange={(e) => setConfirmWord(e.target.value)}
                    placeholder={CONFIRMATION_WORD}
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmWord("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={!isConfirmWordValid || resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Data Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
