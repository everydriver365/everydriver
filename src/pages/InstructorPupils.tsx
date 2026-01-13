import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  Edit,
  Trash2,
  GraduationCap,
  Phone,
  Mail,
  ChevronRight,
  TrendingUp,
  Target,
  BookOpen,
  Loader2,
  ArrowLeft,
  User,
  History,
  Navigation,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { LessonHistory } from "@/components/instructor/LessonHistory";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import PupilDrivingReport from "@/components/instructor/PupilDrivingReport";
import { useIsMobile } from "@/hooks/use-mobile";

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
}

// Mock instructor ID - in production this would come from auth
const MOCK_INSTRUCTOR_ID = "00000000-0000-0000-0000-000000000001";

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
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDrivingReportOpen, setIsDrivingReportOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Pupil>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchPupils();
  }, []);

  const fetchPupils = async () => {
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("*")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
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
    if (!selectedPupil) return;
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

  const loadingContent = (
    <div className="px-3 md:container py-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  const mainContent = (
    <div className="px-2 sm:px-3 md:container py-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Link to="/instructor/diary">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            View All History
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Pupils</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active Learners</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <GraduationCap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <BookOpen className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalLessons}</div>
                  <div className="text-sm text-muted-foreground">Total Lessons</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, postcode, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="completed">Passed ({stats.completed})</TabsTrigger>
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
          <AnimatePresence>
            {filteredPupils.map((pupil, index) => (
              <motion.div
                key={pupil.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="flex items-start justify-between p-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                          {pupil.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <h3 className="font-semibold">{pupil.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {pupil.postcode}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPupil(pupil)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPupil(pupil);
                              setIsHistoryOpen(true);
                            }}
                          >
                            <History className="mr-2 h-4 w-4" />
                            Lesson History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPupil(pupil);
                              setIsDrivingReportOpen(true);
                            }}
                          >
                            <Navigation className="mr-2 h-4 w-4" />
                            Driving Report
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePupil(pupil)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Pupil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Course Badge */}
                    {pupil.course_type && (
                      <div className="px-4 pb-3">
                        <Badge variant="secondary">
                          {courseTypeLabels[pupil.course_type] || pupil.course_type}
                        </Badge>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="px-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {pupil.progress || 0}%
                        </span>
                      </div>
                      <Progress value={pupil.progress || 0} className="h-2" />
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{pupil.lessons_completed || 0} lessons</span>
                      </div>
                      {pupil.next_lesson && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(pupil.next_lesson), "d MMM")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contact Row */}
                    <div className="border-t p-4 flex gap-2">
                      {pupil.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={`tel:${pupil.phone}`}>
                            <Phone className="mr-1 h-3 w-3" />
                            Call
                          </a>
                        </Button>
                      )}
                      {pupil.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={`mailto:${pupil.email}`}>
                            <Mail className="mr-1 h-3 w-3" />
                            Email
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUpdateProgress(pupil, 1)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Lesson
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Pupil Sheet */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Pupil</SheetTitle>
            <SheetDescription>Update pupil information</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editForm.phone || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editForm.address || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-postcode">Postcode</Label>
              <Input
                id="edit-postcode"
                value={editForm.postcode || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, postcode: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-lessons">Lessons Completed</Label>
                <Input
                  id="edit-lessons"
                  type="number"
                  value={editForm.lessons_completed || 0}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      lessons_completed: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-progress">Progress %</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.progress || 0}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      progress: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSavePupil}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Lesson History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lesson History - {selectedPupil?.name}
            </DialogTitle>
            <DialogDescription>
              View all completed lessons for this pupil
            </DialogDescription>
          </DialogHeader>
          {selectedPupil && (
            <LessonHistory
              instructorId={MOCK_INSTRUCTOR_ID}
              pupilId={selectedPupil.id}
              pupilName={selectedPupil.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Driving Report Dialog */}
      <Dialog open={isDrivingReportOpen} onOpenChange={setIsDrivingReportOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Driving Report - {selectedPupil?.name}
            </DialogTitle>
            <DialogDescription>
              View driving skills assessment and telematics data
            </DialogDescription>
          </DialogHeader>
          {selectedPupil && (
            <PupilDrivingReport
              pupilId={selectedPupil.id}
              pupilName={selectedPupil.name}
              instructorId={MOCK_INSTRUCTOR_ID}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // Loading state
  if (loading) {
    if (isMobile) {
      return (
        <>
          {loadingContent}
          <InstructorBottomNav />
        </>
      );
    }
    return (
      <MainLayout>
        {loadingContent}
        <InstructorBottomNav />
      </MainLayout>
    );
  }

  // Mobile Layout - No header
  if (isMobile) {
    return (
      <>
        {mainContent}
        <InstructorBottomNav />
      </>
    );
  }

  // Desktop Layout
  return (
    <MainLayout>
      {mainContent}
      <InstructorBottomNav />
    </MainLayout>
  );
}
