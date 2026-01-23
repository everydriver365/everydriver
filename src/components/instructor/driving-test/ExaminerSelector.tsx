import { useState, useEffect } from "react";
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
}

export function ExaminerSelector({
  value,
  onChange,
  instructorId,
}: ExaminerSelectorProps) {
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExaminerName, setNewExaminerName] = useState("");
  const [newExaminerNumber, setNewExaminerNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (instructorId) {
      fetchExaminers();
    }
  }, [instructorId]);

  const fetchExaminers = async () => {
    const { data, error } = await supabase
      .from("examiners")
      .select("*")
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .order("name");

    if (data) {
      setExaminers(data as Examiner[]);
    }
  };

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
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9 flex-1">
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
          className="h-9 w-9 shrink-0"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
