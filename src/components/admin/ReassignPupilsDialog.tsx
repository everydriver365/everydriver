import { useState, useEffect } from "react";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

interface Instructor {
  id: string;
  name: string;
  is_active: boolean;
}

interface ReassignPupilsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceInstructor: Instructor | null;
  allInstructors: Instructor[];
  onComplete: () => void;
}

export function ReassignPupilsDialog({
  open,
  onOpenChange,
  sourceInstructor,
  allInstructors,
  onComplete,
}: ReassignPupilsDialogProps) {
  const [targetInstructorId, setTargetInstructorId] = useState<string>("");
  const [pupilCount, setPupilCount] = useState(0);
  const [isReassigning, setIsReassigning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sourceInstructor) {
      fetchPupilCount();
    }
  }, [open, sourceInstructor]);

  const fetchPupilCount = async () => {
    if (!sourceInstructor) return;
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from("pupils")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", sourceInstructor.id);

      if (error) throw error;
      setPupilCount(count || 0);
    } catch (error) {
      console.error("Error fetching pupil count:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!sourceInstructor || !targetInstructorId) return;

    setIsReassigning(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ instructor_id: targetInstructorId })
        .eq("instructor_id", sourceInstructor.id);

      if (error) throw error;

      const targetInstructor = allInstructors.find(
        (i) => i.id === targetInstructorId
      );
      toast.success(
        `${pupilCount} pupil${pupilCount !== 1 ? "s" : ""} reassigned to ${targetInstructor?.name || "new instructor"}`
      );
      onComplete();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error reassigning pupils:", error);
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to reassign pupils";
      toast.error(message);
    } finally {
      setIsReassigning(false);
    }
  };

  const availableInstructors = allInstructors.filter(
    (i) => i.id !== sourceInstructor?.id && i.is_active
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reassign Pupils
          </DialogTitle>
          <DialogDescription>
            Move all pupils from {sourceInstructor?.name} to another instructor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : pupilCount === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
              This instructor has no pupils to reassign.
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Pupils to reassign:
                </p>
                <p className="text-2xl font-bold">{pupilCount}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-lg border bg-background p-3 text-center">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-medium truncate">
                    {sourceInstructor?.name}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <Select
                    value={targetInstructorId}
                    onValueChange={setTargetInstructorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInstructors.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {availableInstructors.length === 0 && (
                <p className="text-sm text-destructive">
                  No other active instructors available.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReassign}
            disabled={
              isReassigning ||
              !targetInstructorId ||
              pupilCount === 0 ||
              loading
            }
          >
            {isReassigning ? "Reassigning..." : "Reassign Pupils"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
