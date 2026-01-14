import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  GraduationCap,
  Phone,
  Mail,
  TrendingUp,
  Target,
  BookOpen,
  Loader2,
  ArrowLeft,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { LessonHistory } from "@/components/instructor/LessonHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import PupilDrivingReport from "@/components/instructor/PupilDrivingReport";
import { ExpandablePupilCard } from "@/components/instructor/ExpandablePupilCard";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";

interface Pupil {
  id: string;
  name: string;
  address: string;
  postcode: string;
  email: string | null;
  phone: string | null;
  course_type: string | null;
  lessons_completed: number | null;
  next_lesson: string | null;
  progress: number | null;
  notes: string | null;
  created_at: string;
  what3words?: string | null;
  account_balance?: number | null;
  prepaid_hours?: number | null;
  test_date?: string | null;
}

const courseTypeLabels: Record<string, string> = {
  intensive: "Intensive",
  "semi-intensive": "Semi-Intensive",
  weekly: "Weekly",
  refresher: "Refresher",
  "pass-plus": "Pass Plus",
  motorway: "Motorway",
  other: "Custom",
};

export default function InstructorPupils() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDrivingReportOpen, setIsDrivingReportOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Pupil>>({});
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    postcode: "",
    course_type: "",
    notes: "",
    what3words: "",
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isLookingUpW3W, setIsLookingUpW3W] = useState(false);

  useEffect(() => {
    if (instructorId) {
      fetchPupils();
    }
  }, [instructorId]);

  const fetchPupils = async () => {
    if (!instructorId) return;
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPupils(data || []);
    } catch (error) {
      console.error("Error fetching pupils:", error);
      toast.error("Failed to load pupils");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPupil = (pupil: Pupil) => {
    setSelectedPupil(pupil);
    setEditForm(pupil);
    setIsEditOpen(true);
  };

  const handleSavePupil = async () => {
    if (!selectedPupil || !instructorId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          postcode: editForm.postcode,
          lessons_completed: editForm.lessons_completed,
          progress: editForm.progress,
          notes: editForm.notes,
          what3words: editForm.what3words,
        })
        .eq("id", selectedPupil.id);

      if (error) throw error;

      toast.success("Pupil updated successfully");
      setIsEditOpen(false);
      fetchPupils();
    } catch (error) {
      console.error("Error updating pupil:", error);
      toast.error("Failed to update pupil");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPupil = async () => {
    if (!instructorId) {
      console.error("No instructor ID available");
      toast.error("Not logged in. Please refresh and try again.");
      return;
    }
    if (!addForm.name || !addForm.address || !addForm.postcode) {
      toast.error("Please fill in name, address and postcode");
      return;
    }
    setSaving(true);
    try {
      console.log("Adding pupil for instructor:", instructorId);
      const { data, error } = await supabase.from("pupils").insert({
        instructor_id: instructorId,
        name: addForm.name,
        email: addForm.email || null,
        phone: addForm.phone || null,
        address: addForm.address,
        postcode: addForm.postcode,
        course_type: addForm.course_type || null,
        notes: addForm.notes || null,
        what3words: addForm.what3words || null,
        lessons_completed: 0,
        progress: 0,
      }).select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Pupil added successfully:", data);
      toast.success("Pupil added successfully");
      setIsAddOpen(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        postcode: "",
        course_type: "",
        notes: "",
        what3words: "",
      });
      fetchPupils();
    } catch (error: any) {
      console.error("Error adding pupil:", error);
      toast.error(error?.message || "Failed to add pupil");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePupil = async (pupil: Pupil) => {
    if (!confirm(`Are you sure you want to remove ${pupil.name}?`)) return;

    try {
      const { error } = await supabase
        .from("pupils")
        .delete()
        .eq("id", pupil.id);

      if (error) throw error;

      toast.success("Pupil removed");
      fetchPupils();
    } catch (error) {
      console.error("Error deleting pupil:", error);
      toast.error("Failed to remove pupil");
    }
  };

  const handleUpdateProgress = async (pupil: Pupil, increment: number) => {
    const newLessons = (pupil.lessons_completed || 0) + increment;
    const newProgress = Math.min(100, (pupil.progress || 0) + 5);

    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          lessons_completed: newLessons,
          progress: newProgress,
        })
        .eq("id", pupil.id);

      if (error) throw error;

      toast.success("Progress updated");
      fetchPupils();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const filteredPupils = pupils.filter((pupil) => {
    const matchesSearch =
      pupil.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pupil.postcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pupil.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && (pupil.progress || 0) < 100;
    if (activeTab === "completed") return matchesSearch && (pupil.progress || 0) >= 100;
    return matchesSearch;
  });

  const stats = {
    total: pupils.length,
    active: pupils.filter((p) => (p.progress || 0) < 100).length,
    completed: pupils.filter((p) => (p.progress || 0) >= 100).length,
    totalLessons: pupils.reduce((acc, p) => acc + (p.lessons_completed || 0), 0),
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  if (loading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/instructor">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Pupil Management</h1>
              <p className="text-muted-foreground">
                Track progress and manage your pupils
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Pupil
            </Button>
            <Link to="/instructor/diary">
              <Button variant="outline" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">View All History</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row - Compact Tabs */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-card rounded-lg border">
            <span className="text-lg font-bold">{stats.total}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Pupils</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-card rounded-lg border">
            <span className="text-lg font-bold text-emerald-600">{stats.active}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Active</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-card rounded-lg border">
            <span className="text-lg font-bold text-amber-600">{stats.completed}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Passed</span>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-2 bg-card rounded-lg border">
            <span className="text-lg font-bold text-blue-600">{stats.totalLessons}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Lessons</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, postcode, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Passed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pupils List */}
        {filteredPupils.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pupils found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery
                  ? "No pupils match your search criteria."
                  : "You don't have any pupils yet. Accept a bespoke course request to add your first pupil."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredPupils.map((pupil, index) => (
              <ExpandablePupilCard
                key={pupil.id}
                pupil={pupil}
                onEdit={handleEditPupil}
                onDelete={handleDeletePupil}
                onViewHistory={(p) => {
                  setSelectedPupil(p);
                  setIsHistoryOpen(true);
                }}
                onViewReport={(p) => {
                  setSelectedPupil(p);
                  setIsDrivingReportOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Pupil Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Pupil</DialogTitle>
            <DialogDescription>
              Enter the pupil's details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input
                value={addForm.address}
                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-2">
              <Label>Postcode *</Label>
              <PostcodeAutocomplete
                value={addForm.postcode}
                onChange={(value) => setAddForm({ ...addForm, postcode: value })}
                onSelect={async (postcode) => {
                  setAddForm(prev => ({ ...prev, postcode }));
                  // Lookup What3Words
                  setIsLookingUpW3W(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('convert-to-what3words', {
                      body: { postcode }
                    });
                    if (data?.what3words) {
                      setAddForm(prev => ({ ...prev, what3words: data.what3words }));
                      toast.success(`What3Words: ///${data.what3words}`);
                    }
                  } catch (err) {
                    console.error("What3Words lookup failed:", err);
                  } finally {
                    setIsLookingUpW3W(false);
                  }
                }}
                placeholder="Start typing postcode..."
                showGeolocation={true}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                What3Words
                {isLookingUpW3W && <Loader2 className="h-3 w-3 animate-spin" />}
              </Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 text-muted-foreground text-sm">///</span>
                <Input
                  value={addForm.what3words}
                  onChange={(e) => setAddForm({ ...addForm, what3words: e.target.value })}
                  placeholder="word.word.word"
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically looked up from postcode, or enter manually
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
            <Button onClick={handleAddPupil} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Pupil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Pupil Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pupil</DialogTitle>
            <DialogDescription>
              Update {selectedPupil?.name}'s details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Postcode</Label>
              <PostcodeAutocomplete
                value={editForm.postcode || ""}
                onChange={(value) => setEditForm({ ...editForm, postcode: value })}
                onSelect={async (postcode) => {
                  setEditForm(prev => ({ ...prev, postcode }));
                  // Lookup What3Words
                  try {
                    const { data } = await supabase.functions.invoke('convert-to-what3words', {
                      body: { postcode }
                    });
                    if (data?.what3words) {
                      setEditForm(prev => ({ ...prev, what3words: data.what3words }));
                      toast.success(`What3Words: ///${data.what3words}`);
                    }
                  } catch (err) {
                    console.error("What3Words lookup failed:", err);
                  }
                }}
                placeholder="Start typing postcode..."
                showGeolocation={true}
              />
            </div>
            <div className="space-y-2">
              <Label>What3Words</Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 text-muted-foreground text-sm">///</span>
                <Input
                  value={editForm.what3words || ""}
                  onChange={(e) => setEditForm({ ...editForm, what3words: e.target.value })}
                  placeholder="word.word.word"
                  className="rounded-l-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleSavePupil} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Lesson History</SheetTitle>
            <SheetDescription>
              {selectedPupil?.name}'s completed lessons
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {selectedPupil && instructorId && (
              <LessonHistory pupilId={selectedPupil.id} instructorId={instructorId} pupilName={selectedPupil.name} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Driving Report Sheet */}
      <Sheet open={isDrivingReportOpen} onOpenChange={setIsDrivingReportOpen}>
        <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Driving Report</SheetTitle>
            <SheetDescription>
              {selectedPupil?.name}'s driving performance
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {selectedPupil && instructorId && (
              <PupilDrivingReport pupilId={selectedPupil.id} instructorId={instructorId} pupilName={selectedPupil.name} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </InstructorPortalLayout>
  );
}
