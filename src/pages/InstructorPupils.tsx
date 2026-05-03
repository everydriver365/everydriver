import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IOSLargeTitle } from "@/components/ui/IOSLargeTitle";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
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
  CreditCard,
  Banknote,
  Send,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { LessonHistory } from "@/components/instructor/LessonHistory";
import { PupilListSkeleton } from "@/components/ui/skeletons/PupilListSkeleton";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { AddPupilSheet } from "@/components/instructor/pupils/AddPupilSheet";
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
import { EditPupilSheet } from "@/components/instructor/EditPupilSheet";
import { PupilProgressReportGenerator } from "@/components/instructor/PupilProgressReportGenerator";
import { PupilPackageCard } from "@/components/instructor/PupilPackageCard";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { SegmentedControl } from "@/components/instructor/ui/SegmentedControl";
import { StatCard } from "@/components/instructor/ui/StatCard";
import { SearchInput } from "@/components/instructor/ui/SearchInput";

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
    payment_method: "tbc",
  });
  const [newPupilId, setNewPupilId] = useState<string | null>(null);
  const [showPostAddPayment, setShowPostAddPayment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "needs_lesson" | "upcoming" | PupilStatus>("all");
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

  // Auto-open pupil profile when navigated with /instructor/pupils/:pupilId or ?pupil=ID.
  // Re-fires for repeated taps on the same pupilId by briefly clearing
  // expandedPupilId so the prop transitions false → true and child cards
  // re-expand even if the user previously collapsed them manually.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deepLinkPupilId = pupilId || params.get("pupil");

    if (deepLinkPupilId && pupils.length > 0) {
      const pupil = pupils.find((p) => p.id === deepLinkPupilId);
      if (pupil) {
        setExpandedPupilId(null);
        requestAnimationFrame(() => {
          setExpandedPupilId(deepLinkPupilId);
        });

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
        payment_method: addForm.payment_method || 'tbc',
        lessons_completed: 0,
        progress: 0,
      }).select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Pupil added successfully:", data);
      const createdPupil = data?.[0];
      
      // If payment method requires action, show post-add options
      if (addForm.payment_method === 'send_link' || addForm.payment_method === 'take_payment') {
        setNewPupilId(createdPupil?.id || null);
        setShowPostAddPayment(true);
      }
      
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
        payment_method: "tbc",
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

  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const isUpcoming = (p: Pupil) => {
    if (!p.next_lesson) return false;
    const t = new Date(p.next_lesson).getTime();
    return !isNaN(t) && t >= now && t - now <= SEVEN_DAYS_MS;
  };
  const needsLesson = (p: Pupil) => {
    const status = p.status || 'active';
    if (status !== 'active') return false;
    if (!p.next_lesson) return true;
    const t = new Date(p.next_lesson).getTime();
    return isNaN(t) || t < now;
  };

  const filteredPupils = pupils.filter((pupil) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      pupil.name.toLowerCase().includes(q) ||
      pupil.postcode.toLowerCase().includes(q) ||
      (pupil.email?.toLowerCase().includes(q) ?? false) ||
      (pupil.phone?.toLowerCase().includes(q) ?? false) ||
      (pupil.parent_phone?.toLowerCase().includes(q) ?? false) ||
      (pupil.parent_name?.toLowerCase().includes(q) ?? false) ||
      (pupil.address?.toLowerCase().includes(q) ?? false) ||
      (pupil.what3words?.toLowerCase().includes(q) ?? false) ||
      (pupil.notes?.toLowerCase().includes(q) ?? false)
    );

    if (!matchesSearch) return false;

    if (activeTab === "all") {
      const pupilStatus = pupil.status || 'active';
      return pupilStatus !== 'inactive' && pupilStatus !== 'archived';
    }
    if (activeTab === "needs_lesson") return needsLesson(pupil);
    if (activeTab === "upcoming") return isUpcoming(pupil);
    const pupilStatus = pupil.status || 'active';
    return pupilStatus === activeTab;
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
        <PageSkeleton />
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

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const needsLessonCount = pupils.filter(needsLesson).length;
  const upcomingCount = pupils.filter(isUpcoming).length;

  const segmentOptions = [
    { value: "all" as const, label: "All" },
    { value: "active" as const, label: "Active" },
    ...(needsLessonCount > 0 ? [{ value: "needs_lesson" as const, label: "Needs lesson" }] : []),
    ...(upcomingCount > 0 ? [{ value: "upcoming" as const, label: "Upcoming" }] : []),
    { value: "passed" as const, label: "Passed" },
    ...(statusCounts.on_hold > 0 ? [{ value: "on_hold" as const, label: "Hold" }] : []),
    ...(statusCounts.inactive > 0 ? [{ value: "inactive" as const, label: "Inactive" }] : []),
  ];

  // Count lessons today (next_lesson within today)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const lessonsToday = pupils.filter((p) => {
    if (!p.next_lesson) return false;
    const t = new Date(p.next_lesson).getTime();
    return t >= todayStart.getTime() && t <= todayEnd.getTime();
  }).length;

  const filterChipColor: Record<string, string> = {
    active: "#1A52A0",
    needs_lesson: "#B45309",
    upcoming: "#1A52A0",
    passed: "#1A7A3C",
    on_hold: "#B45309",
    inactive: "#8E8E93",
  };

  return (
    <InstructorPortalLayout>
      <div
        style={{
          background: "#F2F4F8",
          margin: "-16px -16px 0",
          padding: "0 0 24px",
          minHeight: "calc(100dvh - 56px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "12px 16px",
            borderBottom: "0.5px solid #F0F3F8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.4px", lineHeight: 1.15 }}>
              Pupils
            </h1>
            <p style={{ fontSize: 10, color: "#8E8E93", marginTop: 2 }}>
              {stats.active} active · {stats.passed} passed · {lessonsToday} lessons today
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            style={{
              background: "#1A52A0",
              borderRadius: 20,
              padding: "7px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={11} color="#FFF" strokeWidth={2.2} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>Add</span>
          </button>
        </div>

        <div style={{ padding: "14px 15px 0" }}>
          {/* Search */}
          <div style={{ marginBottom: 10 }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search name, phone, location..."
            />
          </div>

          {/* Filter pills — horizontally scrollable */}
          <div
            role="tablist"
            aria-label="Filter pupils"
            className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", marginBottom: 14 }}
          >
            {segmentOptions.map((opt) => {
              const active = opt.value === activeTab;
              const count =
                opt.value === "all" ? stats.total :
                opt.value === "active" ? stats.active :
                opt.value === "passed" ? stats.passed :
                opt.value === "needs_lesson" ? needsLessonCount :
                opt.value === "upcoming" ? upcomingCount :
                opt.value === "on_hold" ? statusCounts.on_hold :
                opt.value === "inactive" ? statusCounts.inactive : null;
              const countColor = filterChipColor[opt.value] || "#8E8E93";
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(opt.value as any)}
                  className="shrink-0 transition-all"
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    background: active ? "#1A52A0" : "#FFF",
                    border: active ? "none" : "0.5px solid rgba(26,82,160,0.15)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#FFF" : "#5B6B8A" }}>
                    {opt.label}
                  </span>
                  {count != null && (
                    <span style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.7)" : countColor }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pupils List */}
        {displayedPupils.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-[12px] bg-[#E8ECF1] flex items-center justify-center mb-3">
              <Users className="h-7 w-7" style={{ color: "#2A394F" }} />
            </div>
            <h3 className="font-bold text-[14px] text-[#1c1c1e] mb-1">No pupils found</h3>
            <p className="text-[12px] text-[#8e8e93] max-w-xs">
              {searchQuery
                ? "No pupils match your search."
                : "Add your first pupil to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              // Detect duplicate display names so cards can show a small disambiguator.
              const nameCount = new Map<string, number>();
              displayedPupils.forEach((p) => {
                const k = (p.name || "").trim().toLowerCase();
                nameCount.set(k, (nameCount.get(k) || 0) + 1);
              });
              return displayedPupils.map((pupil, idx) => {
                const dupKey = (pupil.name || "").trim().toLowerCase();
                const isDup = (nameCount.get(dupKey) || 0) > 1;
                const suffix = isDup
                  ? (pupil.address?.split(",")[0]?.trim() || pupil.postcode || null)
                  : null;
                const priority = isUpcoming(pupil) || needsLesson(pupil) || (pupil.account_balance ?? 0) < 0;
                return (
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
                      nameSuffix={suffix}
                      priority={priority}
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
                );
              });
            })()}
          </div>
        )}
        
        {/* Progress Reports */}
        <PupilProgressReportGenerator 
          instructorId={instructorId} 
          pupils={pupils.map(p => ({ id: p.id, name: p.name }))} 
        />
      </div>

      {/* Add Pupil Sheet (premium iOS design) */}
      <AddPupilSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        form={addForm}
        setForm={setAddForm}
        saving={saving}
        onSave={handleAddPupil}
        isLookingUpW3W={isLookingUpW3W}
        setIsLookingUpW3W={setIsLookingUpW3W}
      />

      {/* Post-Add Payment Action Dialog */}
      <Dialog open={showPostAddPayment} onOpenChange={setShowPostAddPayment}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Action
            </DialogTitle>
            <DialogDescription>
              What would you like to do now?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {addForm.payment_method === 'send_link' && newPupilId && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    if (!instructorId || !newPupilId) return;
                    try {
                      const { data: pupilData } = await supabase.from("pupils").select("name, email, phone").eq("id", newPupilId).single();
                      if (pupilData?.email) {
                        await supabase.functions.invoke("send-payment-link", {
                          body: { instructorId, pupilId: newPupilId, method: "email" },
                        });
                        toast.success(`Payment link sent to ${pupilData.email}`);
                      } else {
                        toast.error("No email address on file");
                      }
                    } catch { toast.error("Failed to send payment link"); }
                    setShowPostAddPayment(false);
                  }}
                >
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Send via Email</p>
                    <p className="text-xs text-muted-foreground">Email a payment link to the pupil</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    if (!instructorId || !newPupilId) return;
                    try {
                      const { data: pupilData } = await supabase.from("pupils").select("name, phone").eq("id", newPupilId).single();
                      if (pupilData?.phone) {
                        await supabase.functions.invoke("send-payment-link", {
                          body: { instructorId, pupilId: newPupilId, method: "sms" },
                        });
                        toast.success(`Payment link sent to ${pupilData.phone}`);
                      } else {
                        toast.error("No phone number on file");
                      }
                    } catch { toast.error("Failed to send payment link"); }
                    setShowPostAddPayment(false);
                  }}
                >
                  <Send className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Send via SMS</p>
                    <p className="text-xs text-muted-foreground">Text a payment link to the pupil</p>
                  </div>
                </Button>
              </>
            )}
            {addForm.payment_method === 'take_payment' && (
              <Button
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  setShowPostAddPayment(false);
                  // Navigate to the payment page or open QR
                  if (instructor?.app_slug) {
                    window.open(`/pay/${instructor.app_slug}`, '_blank');
                  } else {
                    toast.info("Payment QR not configured yet");
                  }
                }}
              >
                <Banknote className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Open Payment Page</p>
                  <p className="text-xs opacity-80">Show QR code or payment page</p>
                </div>
              </Button>
            )}
            <Button variant="ghost" className="w-full" onClick={() => setShowPostAddPayment(false)}>
              Skip for now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EditPupilSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        pupil={selectedPupil}
        instructorId={instructorId}
        onSaved={fetchPupils}
      />

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
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 h-[100dvh] rounded-none overflow-y-auto"
          style={{ background: '#F2F2F4' }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Driving report</SheetTitle>
            <SheetDescription>
              {selectedPupil?.name} driving performance
            </SheetDescription>
          </SheetHeader>
          {selectedPupil && instructorId && (
            <PupilDrivingReport pupilId={selectedPupil.id} instructorId={instructorId} pupilName={selectedPupil.name} />
          )}
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
