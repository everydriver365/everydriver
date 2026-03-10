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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Instructor {
  id: string;
  name: string;
  is_active: boolean;
}

interface PupilRecord {
  id: string;
  name: string;
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
  const [pupils, setPupils] = useState<PupilRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReassigning, setIsReassigning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sourceInstructor) {
      fetchPupils();
      setSelectedIds(new Set());
      setTargetInstructorId("");
    }
  }, [open, sourceInstructor]);

  const fetchPupils = async () => {
    if (!sourceInstructor) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", sourceInstructor.id)
        .is("deleted_at", null)
        .order("name");

      if (error) throw error;
      setPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pupils.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pupils.map((p) => p.id)));
    }
  };

  const togglePupil = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReassign = async () => {
    if (!sourceInstructor || !targetInstructorId || selectedIds.size === 0) return;

    setIsReassigning(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ instructor_id: targetInstructorId })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      const targetInstructor = allInstructors.find(
        (i) => i.id === targetInstructorId
      );
      toast.success(
        `${selectedIds.size} pupil${selectedIds.size !== 1 ? "s" : ""} reassigned to ${targetInstructor?.name || "new instructor"}`
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

  const allSelected = pupils.length > 0 && selectedIds.size === pupils.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reassign Pupils
          </DialogTitle>
          <DialogDescription>
            Select pupils from {sourceInstructor?.name} to move to another instructor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : pupils.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
              This instructor has no pupils to reassign.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size} of {pupils.length} selected
                </p>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <ScrollArea className="h-48 rounded-lg border">
                <div className="p-2 space-y-1">
                  {pupils.map((pupil) => (
                    <label
                      key={pupil.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIds.has(pupil.id)}
                        onCheckedChange={() => togglePupil(pupil.id)}
                      />
                      <span className="text-sm">{pupil.name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>

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
              selectedIds.size === 0 ||
              loading
            }
          >
            {isReassigning
              ? "Reassigning..."
              : `Reassign ${selectedIds.size} Pupil${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
