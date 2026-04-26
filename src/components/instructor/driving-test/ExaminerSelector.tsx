import { useEffect, useMemo, useState } from "react";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Examiner } from "./types";

interface ExaminerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  instructorId: string;
  /** When provided, only examiners assigned to this centre (or with no centre) are listed. */
  testCentreId?: string | null;
}

export function ExaminerSelector({
  value,
  onChange,
  instructorId,
  testCentreId,
}: ExaminerSelectorProps) {
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExaminerName, setNewExaminerName] = useState("");
  const [newExaminerNumber, setNewExaminerNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (instructorId) fetchExaminers();
  }, [instructorId]);

  const fetchExaminers = async () => {
    const { data } = await supabase
      .from("examiners")
      .select("*")
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .order("name");
    if (data) setExaminers(data as Examiner[]);
  };

  // Filter & sort: examiners at this centre first, then unassigned, then others.
  const filtered = useMemo(() => {
    if (!testCentreId) return examiners;
    const atCentre = examiners.filter((e) => e.test_centre_id === testCentreId);
    const unassigned = examiners.filter((e) => !e.test_centre_id);
    return [...atCentre, ...unassigned];
  }, [examiners, testCentreId]);

  // If currently-selected examiner is no longer in the filtered list, clear it.
  useEffect(() => {
    if (value && !filtered.some((e) => e.id === value)) {
      onChange("");
    }
  }, [filtered, value, onChange]);

  const handleAddExaminer = async () => {
    if (!newExaminerName.trim()) {
      toast({ title: "Please enter examiner name", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("examiners")
        .insert({
          instructor_id: instructorId,
          name: newExaminerName.trim(),
          dvsa_staff_number: newExaminerNumber.trim() || null,
          test_centre_id: testCentreId || null,
        })
        .select()
        .single();
      if (error) throw error;
      setExaminers((prev) => [...prev, data as Examiner]);
      onChange(data.id);
      setShowAddDialog(false);
      setNewExaminerName("");
      setNewExaminerNumber("");
      toast({ title: "Examiner added" });
    } catch (error) {
      console.error("Error adding examiner:", error);
      toast({ title: "Failed to add examiner", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex gap-1">
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className="h-12 flex-1 rounded-xl bg-white">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-4 w-4 shrink-0 text-[#2A394F]" />
              <SelectValue placeholder={testCentreId ? "Select examiner..." : "Select test centre first"} />
            </div>
          </SelectTrigger>
          <SelectContent className="z-50">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                {testCentreId
                  ? "No examiners for this centre yet"
                  : "No examiners saved"}
              </div>
            ) : (
              filtered.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{ex.name}</span>
                    {ex.dvsa_staff_number && (
                      <span className="text-xs text-muted-foreground">
                        ({ex.dvsa_staff_number})
                      </span>
                    )}
                    {testCentreId && ex.test_centre_id !== testCentreId && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground ml-1">
                        unassigned
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0 rounded-xl"
          onClick={() => setShowAddDialog(true)}
          aria-label="Add examiner"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Examiner</DialogTitle>
            <DialogDescription>
              {testCentreId
                ? "This examiner will be linked to the selected test centre."
                : "Add a new driving test examiner to your list."}
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
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-number">DVSA Staff Number (optional)</Label>
              <Input
                id="staff-number"
                value={newExaminerNumber}
                onChange={(e) => setNewExaminerNumber(e.target.value)}
                placeholder="e.g., 12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExaminer} disabled={saving}>
              Add Examiner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
