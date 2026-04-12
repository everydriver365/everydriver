import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  MapPin,
  Check,
  ChevronsUpDown,
  X,
  Search,
  User,
  Plus,
  Save,
  Edit,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
  pass_rate: number | null;
}

interface Examiner {
  id: string;
  name: string;
  dvsa_staff_number: string | null;
  test_centre_id: string | null;
  notes: string | null;
  is_active: boolean;
}

interface Props {
  instructorId: string;
}

export function TestCentresAndExaminersManager({ instructorId }: Props) {
  const [activeTab, setActiveTab] = useState("centres");
  
  // Test Centres state
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [centresLoading, setCentresLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Examiners state
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [examinersLoading, setExaminersLoading] = useState(true);
  const [showExaminerDialog, setShowExaminerDialog] = useState(false);
  const [editingExaminer, setEditingExaminer] = useState<Examiner | null>(null);
  const [deletingExaminerId, setDeletingExaminerId] = useState<string | null>(null);
  const [examinerSaving, setExaminerSaving] = useState(false);

  // Examiner form state
  const [examinerName, setExaminerName] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [examinerTestCentreId, setExaminerTestCentreId] = useState("");
  const [examinerNotes, setExaminerNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchTestCentres();
    fetchExaminers();
  }, [instructorId]);

  const fetchTestCentres = async () => {
    setCentresLoading(true);
    try {
      const { data: centresData, error: centresError } = await supabase
        .from("test_centres")
        .select("id, name, address, postcode, pass_rate")
        .eq("is_active", true)
        .order("name");

      if (centresError) throw centresError;
      setTestCentres(centresData || []);

      const { data: assignedData, error: assignedError } = await supabase
        .from("instructor_test_centres")
        .select("test_centre_id")
        .eq("instructor_id", instructorId);

      if (assignedError) throw assignedError;
      setSelectedIds((assignedData || []).map((a) => a.test_centre_id));
    } catch (error) {
      console.error("Error fetching test centres:", error);
      toast.error("Failed to load test centres");
    } finally {
      setCentresLoading(false);
    }
  };

  const fetchExaminers = async () => {
    setExaminersLoading(true);
    try {
      const { data, error } = await supabase
        .from("examiners")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("name");

      if (error) throw error;
      setExaminers((data as Examiner[]) || []);
    } catch (error) {
      console.error("Error fetching examiners:", error);
    } finally {
      setExaminersLoading(false);
    }
  };

  const filteredCentres = useMemo(() => {
    if (!searchValue) return testCentres;
    const search = searchValue.toLowerCase();
    return testCentres.filter(
      (centre) =>
        centre.name.toLowerCase().includes(search) ||
        centre.postcode?.toLowerCase().includes(search) ||
        centre.address?.toLowerCase().includes(search)
    );
  }, [testCentres, searchValue]);

  const selectedCentres = useMemo(() => {
    return testCentres.filter((c) => selectedIds.includes(c.id));
  }, [testCentres, selectedIds]);

  const toggleCentre = async (id: string) => {
    const isSelected = selectedIds.includes(id);
    const newSelectedIds = isSelected
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];

    setSelectedIds(newSelectedIds);
    setSaving(true);

    try {
      if (isSelected) {
        const { error } = await supabase
          .from("instructor_test_centres")
          .delete()
          .eq("instructor_id", instructorId)
          .eq("test_centre_id", id);

        if (error) throw error;
        toast.success("Test centre removed");
      } else {
        const { error } = await supabase
          .from("instructor_test_centres")
          .insert({
            instructor_id: instructorId,
            test_centre_id: id,
          });

        if (error) throw error;
        toast.success("Test centre added");
      }
    } catch (error) {
      console.error("Error updating test centres:", error);
      setSelectedIds(
        isSelected ? [...newSelectedIds, id] : newSelectedIds.filter((i) => i !== id)
      );
      toast.error("Failed to update test centres");
    } finally {
      setSaving(false);
    }
  };

  // Examiner functions
  const resetExaminerForm = () => {
    setExaminerName("");
    setStaffNumber("");
    setExaminerTestCentreId("");
    setExaminerNotes("");
    setIsActive(true);
    setEditingExaminer(null);
  };

  const openEditExaminer = (examiner: Examiner) => {
    setEditingExaminer(examiner);
    setExaminerName(examiner.name);
    setStaffNumber(examiner.dvsa_staff_number || "");
    setExaminerTestCentreId(examiner.test_centre_id || "");
    setExaminerNotes(examiner.notes || "");
    setIsActive(examiner.is_active);
    setShowExaminerDialog(true);
  };

  const handleSaveExaminer = async () => {
    if (!examinerName.trim()) {
      toast.error("Please enter examiner name");
      return;
    }

    setExaminerSaving(true);
    try {
      const examinerData = {
        instructor_id: instructorId,
        name: examinerName.trim(),
        dvsa_staff_number: staffNumber.trim() || null,
        test_centre_id: examinerTestCentreId || null,
        notes: examinerNotes.trim() || null,
        is_active: isActive,
      };

      if (editingExaminer) {
        const { error } = await supabase
          .from("examiners")
          .update(examinerData)
          .eq("id", editingExaminer.id);
        if (error) throw error;
        toast.success("Examiner updated");
      } else {
        const { error } = await supabase.from("examiners").insert(examinerData);
        if (error) throw error;
        toast.success("Examiner added");
      }

      fetchExaminers();
      setShowExaminerDialog(false);
      resetExaminerForm();
    } catch (error: any) {
      console.error("Error saving examiner:", error);
      const message = error?.message || error?.details || "Failed to save examiner";
      toast.error(message);
    } finally {
      setExaminerSaving(false);
    }
  };

  const handleDeleteExaminer = async () => {
    if (!deletingExaminerId) return;

    try {
      const { error } = await supabase
        .from("examiners")
        .delete()
        .eq("id", deletingExaminerId);

      if (error) throw error;
      setExaminers((prev) => prev.filter((e) => e.id !== deletingExaminerId));
      toast.success("Examiner deleted");
    } catch (error) {
      console.error("Error deleting examiner:", error);
      toast.error("Failed to delete examiner");
    } finally {
      setDeletingExaminerId(null);
    }
  };

  const getTestCentreName = (id: string | null) => {
    if (!id) return null;
    return testCentres.find((tc) => tc.id === id)?.name;
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="centres" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Test Centres
            {selectedIds.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedIds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="examiners" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Examiners
            {examiners.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {examiners.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Test Centres Tab */}
        <TabsContent value="centres" className="mt-4 space-y-4">
          {centresLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Saved Indicator */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-2xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {selectedIds.length} test centre{selectedIds.length !== 1 ? "s" : ""} saved to your profile
                  </span>
                </div>
              )}

              {/* Search & Add */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      Search test centres...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0 z-50 bg-popover" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by name, postcode..."
                      value={searchValue}
                      onValueChange={setSearchValue}
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No test centres found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCentres.map((centre) => (
                          <CommandItem
                            key={centre.id}
                            value={centre.id}
                            onSelect={() => toggleCentre(centre.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedIds.includes(centre.id)
                                  ? "opacity-100 text-emerald-600"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{centre.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {centre.postcode}
                                {centre.pass_rate && ` • ${centre.pass_rate}% pass rate`}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected Centres */}
              {selectedCentres.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-2xl border-dashed">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No test centres selected.</p>
                  <p className="text-sm">Search above to add test centres you cover.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCentres.map((centre) => (
                    <Card key={centre.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{centre.name}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{centre.postcode}</span>
                                {centre.pass_rate && (
                                  <Badge variant="secondary" className="text-xs">
                                    {centre.pass_rate}% pass
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => toggleCentre(centre.id)}
                            disabled={saving}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Examiners Tab */}
        <TabsContent value="examiners" className="mt-4 space-y-4">
          {examinersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Saved Indicator */}
              {examiners.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-2xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {examiners.length} examiner{examiners.length !== 1 ? "s" : ""} saved
                  </span>
                </div>
              )}

              {/* Add Examiner Button */}
              <Dialog
                open={showExaminerDialog}
                onOpenChange={(open) => {
                  setShowExaminerDialog(open);
                  if (!open) resetExaminerForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
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
                        : "Add a driving test examiner to link with test routes and reports."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="examiner-name">Name *</Label>
                      <Input
                        id="examiner-name"
                        value={examinerName}
                        onChange={(e) => setExaminerName(e.target.value)}
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
                      <Select
                        value={examinerTestCentreId || "none"}
                        onValueChange={(value) => setExaminerTestCentreId(value === "none" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select test centre..." />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-popover">
                          <SelectItem value="none">None</SelectItem>
                          {selectedCentres.length > 0 ? (
                            selectedCentres.map((tc) => (
                              <SelectItem key={tc.id} value={tc.id}>
                                {tc.name}
                              </SelectItem>
                            ))
                          ) : (
                            testCentres.slice(0, 20).map((tc) => (
                              <SelectItem key={tc.id} value={tc.id}>
                                {tc.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedCentres.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Add test centres first to see them here
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="examiner-notes">Notes</Label>
                      <Textarea
                        id="examiner-notes"
                        value={examinerNotes}
                        onChange={(e) => setExaminerNotes(e.target.value)}
                        placeholder="Any additional notes..."
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="examiner-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <Label htmlFor="examiner-active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowExaminerDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveExaminer} disabled={examinerSaving}>
                      {examinerSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editingExaminer ? "Update" : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Examiners List */}
              {examiners.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-2xl border-dashed">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No examiners added yet.</p>
                  <p className="text-sm">Add examiners to link with test routes and triggers.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {examiners.map((examiner) => (
                    <Card key={examiner.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-2">
                                {examiner.name}
                                {!examiner.is_active && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {examiner.dvsa_staff_number && (
                                  <span>#{examiner.dvsa_staff_number}</span>
                                )}
                                {getTestCentreName(examiner.test_centre_id) && (
                                  <span>• {getTestCentreName(examiner.test_centre_id)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditExaminer(examiner)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeletingExaminerId(examiner.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
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
              onClick={handleDeleteExaminer}
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
