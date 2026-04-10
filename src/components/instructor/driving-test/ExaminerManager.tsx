import { useState, useEffect } from "react";
import {
  Edit,
  Loader2,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Examiner } from "./types";

interface ExaminerManagerProps {
  instructorId: string;
}

interface TestCentre {
  id: string;
  name: string;
}

export function ExaminerManager({ instructorId }: ExaminerManagerProps) {
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExaminer, setEditingExaminer] = useState<Examiner | null>(null);
  const [deletingExaminerId, setDeletingExaminerId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [testCentreId, setTestCentreId] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (instructorId) {
      fetchData();
    }
  }, [instructorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // @ts-ignore - Supabase type depth issue
      const examinersRes = await supabase
        .from("examiners")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("name");
      
      // @ts-ignore - Supabase type depth issue
      const centresRes = await supabase
        .from("test_centres")
        .select("id, name")
        .eq("instructor_id", instructorId)
        .order("name");

      if (examinersRes.data) setExaminers(examinersRes.data as Examiner[]);
      if (centresRes.data) setTestCentres(centresRes.data as TestCentre[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setStaffNumber("");
    setTestCentreId("");
    setNotes("");
    setIsActive(true);
    setEditingExaminer(null);
  };

  const openEditDialog = (examiner: Examiner) => {
    setEditingExaminer(examiner);
    setName(examiner.name);
    setStaffNumber(examiner.dvsa_staff_number || "");
    setTestCentreId(examiner.test_centre_id || "");
    setNotes(examiner.notes || "");
    setIsActive(examiner.is_active);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter examiner name", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const examinerData: any = {
        instructor_id: instructorId,
        name: name.trim(),
        dvsa_staff_number: staffNumber.trim() || null,
        test_centre_id: testCentreId || null,
        notes: notes.trim() || null,
        is_active: isActive,
      };

      if (editingExaminer) {
        const { error } = await supabase
          .from("examiners")
          .update(examinerData)
          .eq("id", editingExaminer.id);
        if (error) throw error;
        toast({ title: "Examiner updated" });
      } else {
        const { error } = await supabase
          .from("examiners")
          .insert(examinerData);
        if (error) throw error;
        toast({ title: "Examiner added" });
      }

      fetchData();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving examiner:", error);
      toast({ title: "Failed to save examiner", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExaminerId) return;

    try {
      const { error } = await supabase
        .from("examiners")
        .delete()
        .eq("id", deletingExaminerId);

      if (error) throw error;

      setExaminers((prev) => prev.filter((e) => e.id !== deletingExaminerId));
      toast({ title: "Examiner deleted" });
    } catch (error) {
      console.error("Error deleting examiner:", error);
      toast({ title: "Failed to delete examiner", variant: "destructive" });
    } finally {
      setDeletingExaminerId(null);
    }
  };

  const getTestCentreName = (id: string | null) => {
    if (!id) return null;
    return testCentres.find((tc) => tc.id === id)?.name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Examiners</h3>
          <p className="text-sm text-muted-foreground">
            Manage driving test examiners for your records.
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Examiner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExaminer ? "Edit Examiner" : "Add Examiner"}
              </DialogTitle>
              <DialogDescription>
                {editingExaminer
                  ? "Update examiner details."
                  : "Add a new driving test examiner."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-number">DVSA Staff Number</Label>
                <Input
                  id="staff-number"
                  value={staffNumber}
                  onChange={(e) => setStaffNumber(e.target.value)}
                  placeholder="e.g., 12345"
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Test Centre</Label>
                <Select value={testCentreId} onValueChange={setTestCentreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test centre..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {testCentres.map((tc) => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingExaminer ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {examiners.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-none">
          <User className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No examiners added yet.</p>
          <p className="text-sm">Add examiners to track who conducted each test.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Staff Number</TableHead>
              <TableHead>Test Centre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examiners.map((examiner) => (
              <TableRow key={examiner.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {examiner.name}
                  </div>
                </TableCell>
                <TableCell>
                  {examiner.dvsa_staff_number || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {getTestCentreName(examiner.test_centre_id) || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {examiner.is_active ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditDialog(examiner)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingExaminerId(examiner.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog
        open={!!deletingExaminerId}
        onOpenChange={() => setDeletingExaminerId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Examiner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the examiner from your list. Test results linked to this
              examiner will not be deleted but will no longer show the examiner name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
