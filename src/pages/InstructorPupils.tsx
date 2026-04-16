import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IOSLargeTitle } from "@/components/ui/IOSLargeTitle";
import { IOSSearchBar } from "@/components/ui/IOSSearchBar";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
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
  Globe,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { LessonHistory } from "@/components/instructor/LessonHistory";
import { PupilListSkeleton } from "@/components/ui/skeletons/PupilListSkeleton";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PupilSplitPane } from "@/components/instructor/PupilSplitPane";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import PupilDrivingReport from "@/components/instructor/PupilDrivingReport";
import { PupilCardStack } from "@/components/instructor/PupilCardStack";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { TermsSignatureModal } from "@/components/instructor/TermsSignatureModal";
import { PupilPickerDialog } from "@/components/instructor/PupilPickerDialog";
import { TestResultsHistory, DrivingTestReportForm } from "@/components/instructor/driving-test";
import { useActiveTrackingPupils } from "@/hooks/useActiveTrackingPupils";
import { NextLessonTile } from "@/components/instructor/NextLessonTile";
import { PupilAvatarUpload } from "@/components/instructor/PupilAvatarUpload";
import { PupilProgressReportGenerator } from "@/components/instructor/PupilProgressReportGenerator";
import { PupilPackageCard } from "@/components/instructor/PupilPackageCard";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";

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
  parent_phone?: string | null;
  parent_name?: string | null;
  date_of_birth?: string | null;
  status?: string;
  profile_image_url?: string | null;
}

type PupilStatus = 'active' | 'passed' | 'inactive' | 'on_hold' | 'cancelled';

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
  const { instructor, refreshInstructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { pupilId } = useParams<{ pupilId?: string }>();
  const instructorId = instructor?.id;
  const isMobile = useIsMobile();
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  const handleVisibilityToggle = async (isVisible: boolean) => {
    if (!instructorId) return;
    setUpdatingVisibility(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: isVisible })
        .eq("id", instructorId);

      if (error) throw error;
      await refreshInstructor();
      toast.success(isVisible ? "You're now visible online" : "You're now hidden online");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setUpdatingVisibility(false);
    }
  };
  
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [expandedPupilId, setExpandedPupilId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDrivingReportOpen, setIsDrivingReportOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [pupilSignatures, setPupilSignatures] = useState<Record<string, boolean>>({});
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
    parent_phone: "",
    parent_name: "",
    date_of_birth: "",
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | PupilStatus>("all");
  const [isLookingUpW3W, setIsLookingUpW3W] = useState(false);
  const [isPupilPickerOpen, setIsPupilPickerOpen] = useState(false);
  const [pendingPupilAction, setPendingPupilAction] = useState<"terms" | null>(null);
  
  // Test result states
  const [isTestFormOpen, setIsTestFormOpen] = useState(false);
  const [isTestHistoryOpen, setIsTestHistoryOpen] = useState(false);
  const [testFormIsMock, setTestFormIsMock] = useState(false);
  
  // Active tracking state
  const { isTracking } = useActiveTrackingPupils(instructorId || null);

  useEffect(() => {
    if (instructorId) {
      fetchPupils();
      fetchSignatureStatus();
    }
  }, [instructorId]);

  // Auto-open add pupil dialog when navigated with ?action=add
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "add") {
      setIsAddOpen(true);
      // Clean up the URL
      navigate("/instructor/pupils", { replace: true });
    }
  }, [location.search]);

  // Auto-open pupil profile when navigated with /instructor/pupils/:pupilId or ?pupil=ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deepLinkPupilId = pupilId || params.get("pupil");

    if (deepLinkPupilId && pupils.length > 0) {
      const pupil = pupils.find((p) => p.id === deepLinkPupilId);
      if (pupil) {
        setExpandedPupilId(deepLinkPupilId);

        if (params.get("pupil")) {
          navigate(`/instructor/pupils/${deepLinkPupilId}`, { replace: true });
        }

        setTimeout(() => {
          const el = document.getElementById(`pupil-card-${deepLinkPupilId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 250);
      }
    }
  }, [location.search, pupilId, pupils, navigate]);

  const requestOpenTerms = () => {
    if (selectedPupil) {
      setIsTermsModalOpen(true);
      return;
    }

    setPendingPupilAction("terms");
    setIsPupilPickerOpen(true);
  };

  const handlePupilPicked = (pupil: Pupil) => {
    setSelectedPupil(pupil);
    setIsPupilPickerOpen(false);

    if (pendingPupilAction === "terms") {
      setIsTermsModalOpen(true);
    }

    setPendingPupilAction(null);
  };

  // Handle navigation state for opening modals
  useEffect(() => {
    const state = location.state as { openTermsModal?: boolean; openAddPupil?: boolean } | null;

    if (state?.openTermsModal) {
      requestOpenTerms();
      navigate(location.pathname, { replace: true, state: null });
    }

    if (state?.openAddPupil) {
      setIsAddOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, selectedPupil]);

  const fetchPupils = async () => {
    if (!instructorId) return;
    try {
      const { data, error } = await supabase
        .from("pupils")
        .select("*")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
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

  const fetchSignatureStatus = async () => {
    if (!instructorId) return;
    try {
      // Get active terms
      const { data: activeTerms } = await supabase
        .from("instructor_terms_conditions")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .single();

      if (!activeTerms) return;

      // Get all signatures for this terms version
      const { data: signatures } = await supabase
        .from("pupil_signatures")
        .select("pupil_id")
        .eq("terms_id", activeTerms.id);

      if (signatures) {
        const signatureMap: Record<string, boolean> = {};
        signatures.forEach((sig) => {
          signatureMap[sig.pupil_id] = true;
        });
        setPupilSignatures(signatureMap);
      }
    } catch (error) {
      console.error("Error fetching signature status:", error);
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
          parent_phone: editForm.parent_phone,
          parent_name: editForm.parent_name,
          date_of_birth: editForm.date_of_birth,
          profile_image_url: editForm.profile_image_url,
        })
        .eq("id", selectedPupil.id);

      if (error) throw error;

      toast.success("Pupil updated successfully");
      setIsEditOpen(false);
      fetchPupils();
      queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
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
        parent_phone: addForm.parent_phone || null,
        parent_name: addForm.parent_name || null,
        date_of_birth: addForm.date_of_birth || null,
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
        parent_phone: "",
        parent_name: "",
        date_of_birth: "",
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
      const { softDelete } = await import("@/lib/auditLogger");
      await softDelete("pupils", pupil.id, instructorId || "", { name: pupil.name });

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

    if (activeTab === "all") {
      const pupilStatus = pupil.status || 'active';
      return matchesSearch && pupilStatus !== 'inactive' && pupilStatus !== 'archived';
    }
    // Filter by the status field
    const pupilStatus = pupil.status || 'active';
    return matchesSearch && pupilStatus === activeTab;
  });

  const displayedPupils = pupilId ? filteredPupils.filter((p) => p.id === pupilId) : filteredPupils;

  const statusCounts = {
    active: pupils.filter((p) => (p.status || 'active') === 'active').length,
    passed: pupils.filter((p) => (p.status || 'active') === 'passed').length,
    inactive: pupils.filter((p) => (p.status || 'active') === 'inactive').length,
    on_hold: pupils.filter((p) => (p.status || 'active') === 'on_hold').length,
    cancelled: pupils.filter((p) => (p.status || 'active') === 'cancelled').length,
  };

  const stats = {
    total: pupils.length,
    active: statusCounts.active,
    passed: statusCounts.passed,
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
        <PupilListSkeleton />
      </InstructorPortalLayout>
    );
  }

  // Desktop: Split-pane master-detail view
  if (!isMobile && instructorId) {
    return (
      <InstructorPortalLayout>
        <PupilSplitPane instructorId={instructorId} />
      </InstructorPortalLayout>
    );
  }

  const cardClass = "bg-white rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)] border-[0.5px] border-black/[0.06]";
  const GradientLine = () => <div className="h-[2px] w-full bg-gradient-to-r from-[#0d4fa0] to-[#56a8f5]" />;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <InstructorPortalLayout>
      <div className="space-y-3 pb-6" style={{ fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1c1c1e]">Pupils</h1>
            <p className="text-[13px] text-[#8e8e93]">{stats.total} total · {stats.active} active</p>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-[#0d4fa0] to-[#1a6fd4] text-white rounded-xl h-9 px-3 shadow-[0_4px_12px_rgba(13,79,160,0.3)]" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* 4-column stat row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Active", value: stats.active, emoji: "🟢", bg: "#eef4fd" },
            { label: "Passed", value: stats.passed, emoji: "🎓", bg: "#eaf3de" },
            { label: "Lessons", value: stats.totalLessons, emoji: "📚", bg: "#faeeda" },
            { label: "On Hold", value: statusCounts.on_hold + statusCounts.inactive, emoji: "⏸️", bg: "#f0ebfd" },
          ].map((stat) => (
            <div key={stat.label} className={cardClass}>
              <div className="p-[12px_8px_10px] text-center">
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center mx-auto mb-1.5"
                  style={{ backgroundColor: stat.bg }}
                >
                  <span className="text-[16px]">{stat.emoji}</span>
                </div>
                <p className="text-[18px] font-bold text-[#1c1c1e]">{stat.value}</p>
                <p className="text-[11px] text-[#8e8e93]">{stat.label}</p>
              </div>
              <GradientLine />
            </div>
          ))}
        </div>

        {/* Search bar card */}
        <div className={cardClass}>
          <div className="p-[10px_16px] flex items-center gap-[10px]">
            <Search className="h-4 w-4 text-[#8e8e93] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pupils..."
              className="flex-1 bg-transparent outline-none text-[14px] text-[#1c1c1e] placeholder:text-[#c7c7cc]"
            />
          </div>
          <GradientLine />
        </div>

        {/* All / Active / Passed toggle card */}
        <div className={cn(cardClass, "!shadow-none !border-0")}>
          <div className="p-1.5 flex gap-1 bg-white rounded-[20px]">
            {[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "passed", label: "Passed" },
              ...(statusCounts.on_hold > 0 ? [{ value: "on_hold", label: "On Hold" }] : []),
              ...(statusCounts.inactive > 0 ? [{ value: "inactive", label: "Inactive" }] : []),
            ].map((seg) => (
              <button
                key={seg.value}
                onClick={() => setActiveTab(seg.value as any)}
                className={cn(
                  "flex-1 py-[7px] px-3 rounded-[14px] text-[13px] font-semibold transition-all",
                  activeTab === seg.value
                    ? "bg-gradient-to-r from-[#0d4fa0] to-[#1a6fd4] text-white font-bold shadow-sm"
                    : "text-[#8e8e93] bg-transparent"
                )}
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pupils List */}
        {displayedPupils.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#eef4fd] flex items-center justify-center mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="font-bold text-[14px] text-[#1c1c1e] mb-1">No pupils found</h3>
            <p className="text-[12px] text-[#8e8e93] max-w-xs">
              {searchQuery
                ? "No pupils match your search."
                : "Add your first pupil to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-[10px]">
            {displayedPupils.map((pupil, idx) => (
              <motion.div
                key={pupil.id}
                id={`pupil-card-${pupil.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: idx * 0.03 }}
              >
                <PupilCardStack
                  pupil={pupil}
                  defaultExpanded={expandedPupilId === pupil.id}
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
                  onViewTerms={(p) => {
                    setSelectedPupil(p);
                    setIsTermsModalOpen(true);
                  }}
                  onStartChat={(p) => {
                    navigate(`/instructor/messages?pupilId=${p.id}`);
                  }}
                  onRecordTestResult={(p, isMock) => {
                    setSelectedPupil(p);
                    setTestFormIsMock(isMock);
                    setIsTestFormOpen(true);
                  }}
                  onViewTestHistory={(p) => {
                    setSelectedPupil(p);
                    setIsTestHistoryOpen(true);
                  }}
                  onStatusChange={(pupilId, newStatus) => {
                    setPupils(prevPupils => 
                      prevPupils.map(p => 
                        p.id === pupilId ? { ...p, status: newStatus } : p
                      )
                    );
                  }}
                  hasSignedTerms={pupilSignatures[pupil.id] || false}
                  instructorId={instructorId}
                  instructorName={instructor?.name}
                  isTracking={isTracking(pupil.id)}
                  paymentQrUrl={getActivePaymentQrUrl(instructor)}
                  commissionPayer={instructor?.commission_payer}
                />
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Progress Reports */}
        <PupilProgressReportGenerator 
          instructorId={instructorId} 
          pupils={pupils.map(p => ({ id: p.id, name: p.name }))} 
        />
      </div>

      {/* Add Pupil Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90dvh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Add New Pupil</DialogTitle>
            <DialogDescription>
              Enter the pupil's details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 -mr-1">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <GoogleAddressAutocomplete
                value={addForm.address}
                onChange={(address) => setAddForm({ ...addForm, address })}
                onPostcodeChange={async (postcode) => {
                  setAddForm(prev => ({ ...prev, postcode }));
                  // Lookup What3Words when postcode is auto-filled
                  setIsLookingUpW3W(true);
                  try {
                    const { data } = await supabase.functions.invoke('convert-to-what3words', {
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
                placeholder="Start typing an address..."
              />
              <p className="text-xs text-muted-foreground">
                Type to search – postcode auto-fills when you select
              </p>
            </div>
            <div className="space-y-2">
              <Label>Postcode *</Label>
              <Input
                value={addForm.postcode}
                onChange={(e) => setAddForm({ ...addForm, postcode: e.target.value })}
                placeholder="Auto-filled from address"
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
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Parent/Guardian (for Parent Portal access)
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={addForm.date_of_birth}
                    onChange={(e) => setAddForm({ ...addForm, date_of_birth: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Parent signature required on T&Cs for pupils under 18
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parent Name</Label>
                    <Input
                      value={addForm.parent_name}
                      onChange={(e) => setAddForm({ ...addForm, parent_name: e.target.value })}
                      placeholder="Parent's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Phone</Label>
                    <Input
                      value={addForm.parent_phone}
                      onChange={(e) => setAddForm({ ...addForm, parent_phone: e.target.value })}
                      placeholder="07XXX XXXXXX"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Parent can use this phone to access the Parent Portal
              </p>
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
            {/* Profile Photo Upload */}
            {selectedPupil && (
              <div className="flex justify-center pb-2 border-b">
                <PupilAvatarUpload
                  pupilId={selectedPupil.id}
                  pupilName={editForm.name || selectedPupil.name}
                  currentImageUrl={editForm.profile_image_url}
                  onImageUploaded={(url) => setEditForm({ ...editForm, profile_image_url: url })}
                  onImageRemoved={() => setEditForm({ ...editForm, profile_image_url: null })}
                />
              </div>
            )}
            
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
              <GoogleAddressAutocomplete
                value={editForm.address || ""}
                onChange={(address) => setEditForm({ ...editForm, address })}
                onPostcodeChange={async (postcode) => {
                  setEditForm(prev => ({ ...prev, postcode }));
                  // Lookup What3Words when postcode is auto-filled
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
                placeholder="Start typing an address..."
              />
              <p className="text-xs text-muted-foreground">
                Type to search – postcode auto-fills when you select
              </p>
            </div>
            <div className="space-y-2">
              <Label>Postcode</Label>
              <Input
                value={editForm.postcode || ""}
                onChange={(e) => setEditForm({ ...editForm, postcode: e.target.value })}
                placeholder="Auto-filled from address"
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
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Parent/Guardian (for Parent Portal access)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parent Name</Label>
                  <Input
                    value={editForm.parent_name || ""}
                    onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
                    placeholder="Parent's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Phone</Label>
                  <Input
                    value={editForm.parent_phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, parent_phone: e.target.value })}
                    placeholder="07XXX XXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={editForm.date_of_birth || ""}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Parent signature required on T&Cs for pupils under 18
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Parent can use this phone to access the Parent Portal
              </p>
            </div>

            {/* Lesson Packages */}
            {selectedPupil && instructorId && (
              <div className="border-t pt-4 mt-4">
                <PupilPackageCard pupilId={selectedPupil.id} instructorId={instructorId} />
              </div>
            )}

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
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
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

      <PupilPickerDialog
        open={isPupilPickerOpen}
        onOpenChange={(open) => {
          setIsPupilPickerOpen(open);
          if (!open) setPendingPupilAction(null);
        }}
        pupils={pupils}
        onSelect={(p) => handlePupilPicked(p as Pupil)}
        title="Select a pupil"
        description="Choose which pupil should sign the terms & conditions."
      />

      {/* Terms & Conditions Signature Modal */}
      {selectedPupil && instructorId && (
        <TermsSignatureModal
          open={isTermsModalOpen}
          onOpenChange={setIsTermsModalOpen}
          pupilId={selectedPupil.id}
          pupilName={selectedPupil.name}
          instructorId={instructorId}
          pupilDateOfBirth={selectedPupil.date_of_birth}
          parentName={selectedPupil.parent_name}
          onSignatureComplete={() => {
            fetchSignatureStatus();
          }}
        />
      )}

      {/* Record Test Result Dialog (DL25A) */}
      {selectedPupil && (
        <DrivingTestReportForm
          open={isTestFormOpen}
          onOpenChange={setIsTestFormOpen}
          pupilId={selectedPupil.id}
          pupilName={selectedPupil.name}
          defaultIsMock={testFormIsMock}
          onSaved={() => {
            fetchPupils();
          }}
        />
      )}

      {/* Test Results History */}
      {selectedPupil && instructorId && (
        <TestResultsHistory
          open={isTestHistoryOpen}
          onOpenChange={setIsTestHistoryOpen}
          pupilId={selectedPupil.id}
          pupilName={selectedPupil.name}
          instructorId={instructorId}
        />
      )}
    </InstructorPortalLayout>
  );
}
