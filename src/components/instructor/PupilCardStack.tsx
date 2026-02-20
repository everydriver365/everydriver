import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  MapPin,
  ChevronRight,
  Clock,
  Edit,
  Trash2,
  History,
  Navigation,
  Calendar,
  GraduationCap,
  FileText,
  ExternalLink,
  MessageSquare,
  Star,
  Send,
  Check,
  X,
  FileSignature,
  CheckCircle2,
  Award,
  ClipboardList,
  Car,
  Radio,
  PoundSterling,
  QrCode,
  UserCheck,
  UserX,
  Pause,
  XCircle,
  Route,
  AlertCircle,
  Share2
} from "lucide-react";
import { PupilTrackingHistory } from "@/components/instructor/PupilTrackingHistory";
import { PupilPaymentHistory } from "@/components/instructor/PupilPaymentHistory";
import { PupilCreditBreakdown } from "@/components/instructor/PupilCreditBreakdown";
import { RecordPaymentModal } from "@/components/instructor/RecordPaymentModal";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { SendPaymentReminderButton } from "@/components/instructor/SendPaymentReminderButton";
import { DrivingSyllabus } from "@/components/instructor/DrivingSyllabus";
import { NewPupilChecklist } from "@/components/instructor/NewPupilChecklist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SendSigningLinkButton } from "@/components/instructor/SendSigningLinkButton";
import { DesktopPupilDetailPanel } from "@/components/instructor/DesktopPupilDetailPanel";
import { InlineEditField } from "@/components/ui/InlineEditField";
import { SharePupilDetailsDialog } from "@/components/instructor/SharePupilDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { SectionPanel } from "@/components/ui/SectionPanel";

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
}

interface TrackingSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number | null;
  avg_speed_kmh: number | null;
}

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
  payment_type?: string | null;
  deposit_paid?: number | null;
  balance_due_date?: string | null;
  deposit_forfeited?: boolean | null;
  status?: string;
  profile_image_url?: string | null;
  pickup_address?: string | null;
  pickup_postcode?: string | null;
}

type PupilStatus = 'active' | 'passed' | 'inactive' | 'on_hold' | 'cancelled';

const statusConfig: Record<PupilStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  active: { label: 'Active', color: 'bg-emerald-500', icon: UserCheck },
  passed: { label: 'Passed', color: 'bg-primary', icon: GraduationCap },
  inactive: { label: 'Inactive', color: 'bg-muted-foreground', icon: UserX },
  on_hold: { label: 'On Hold', color: 'bg-amber-500', icon: Pause },
  cancelled: { label: 'Cancelled', color: 'bg-destructive', icon: XCircle },
};

interface LatestFeedback {
  id: string;
  lesson_date: string;
  notes: string | null;
  rating: number | null;
}

interface PupilCardStackProps {
  pupil: Pupil;
  onEdit: (pupil: Pupil) => void;
  onDelete: (pupil: Pupil) => void;
  onViewHistory: (pupil: Pupil) => void;
  onViewReport: (pupil: Pupil) => void;
  onViewTerms?: (pupil: Pupil) => void;
  onStartChat?: (pupil: Pupil) => void;
  onRecordTestResult?: (pupil: Pupil, isMock: boolean) => void;
  onViewTestHistory?: (pupil: Pupil) => void;
  onStatusChange?: (pupilId: string, newStatus: PupilStatus) => void;
  hasSignedTerms?: boolean;
  instructorId?: string;
  instructorName?: string;
  isTracking?: boolean;
  paymentQrUrl?: string | null;
  commissionPayer?: string | null;
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

export function PupilCardStack({
  pupil,
  onEdit,
  onDelete,
  onViewHistory,
  onViewReport,
  onViewTerms,
  onStartChat,
  onRecordTestResult,
  onViewTestHistory,
  onStatusChange,
  hasSignedTerms,
  instructorId,
  instructorName,
  isTracking = false,
  paymentQrUrl,
  commissionPayer,
}: PupilCardStackProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [changingStatus, setChangingStatus] = useState(false);
  const currentStatus = (pupil.status || 'active') as PupilStatus;
  const [isExpanded, setIsExpanded] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<LatestFeedback | null>(null);
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [availableLessons, setAvailableLessons] = useState<ScheduledLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [availableTrackingSessions, setAvailableTrackingSessions] = useState<TrackingSession[]>([]);
  const [selectedTrackingSessionId, setSelectedTrackingSessionId] = useState<string>("");
  const [testStats, setTestStats] = useState<{ 
    realTests: number; 
    mockTests: number; 
    lastResult: 'pass' | 'fail' | null;
    lastTestDate: string | null;
  }>({ realTests: 0, mockTests: 0, lastResult: null, lastTestDate: null });
  
  // Payment modal states
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [paymentRefreshTrigger, setPaymentRefreshTrigger] = useState(0);
  
  // Syllabus sheet state
  const [showSyllabusSheet, setShowSyllabusSheet] = useState(false);

  // Notes with lesson linking
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteLessonId, setNoteLessonId] = useState<string>("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteLessons, setNoteLessons] = useState<ScheduledLesson[]>([]);

  // Fetch test stats on mount
  useEffect(() => {
    fetchTestStats();
  }, [pupil.id]);

  // Fetch latest feedback when card expands
  useEffect(() => {
    if (isExpanded) {
      fetchLatestFeedback();
    }
  }, [isExpanded, pupil.id]);

  // Fetch available lessons and tracking sessions when adding feedback
  useEffect(() => {
    if (isAddingFeedback) {
      fetchAvailableLessons();
      fetchAvailableTrackingSessions();
    }
  }, [isAddingFeedback, pupil.id]);

  // Fetch lessons when adding a note
  useEffect(() => {
    if (isAddingNote) {
      fetchNoteLessons();
    }
  }, [isAddingNote, pupil.id]);

  const fetchNoteLessons = async () => {
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes")
        .eq("pupil_id", pupil.id)
        .gte("lesson_date", format(sixtyDaysAgo, "yyyy-MM-dd"))
        .order("lesson_date", { ascending: false });
      if (!error && data) setNoteLessons(data);
    } catch (err) {
      console.error("Error fetching note lessons:", err);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      if (noteLessonId) {
        // Save to lesson_history linked to the scheduled lesson
        const selectedLesson = noteLessons.find(l => l.id === noteLessonId);
        const { error } = await supabase.from("lesson_history").insert({
          instructor_id: instructorId!,
          pupil_id: pupil.id,
          lesson_date: selectedLesson?.lesson_date || format(new Date(), "yyyy-MM-dd"),
          start_time: selectedLesson?.start_time || null,
          duration_minutes: selectedLesson?.duration_minutes || 60,
          notes: noteText,
          scheduled_lesson_id: noteLessonId,
        });
        if (error) throw error;
        toast.success("Note saved to lesson");
      } else {
        // Append to general pupil notes
        const existing = pupil.notes ? pupil.notes + "\n\n" : "";
        const dated = `[${format(new Date(), "dd MMM yyyy")}] ${noteText}`;
        const { error } = await supabase.from("pupils").update({ notes: existing + dated }).eq("id", pupil.id);
        if (error) throw error;
        toast.success("Note saved");
      }
      setNoteText("");
      setNoteLessonId("");
      setIsAddingNote(false);
      queryClient.invalidateQueries({ queryKey: ["pupils"] });
    } catch (err) {
      console.error("Save note error:", err);
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const fetchAvailableLessons = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes")
        .eq("pupil_id", pupil.id)
        .gte("lesson_date", format(thirtyDaysAgo, "yyyy-MM-dd"))
        .lte("lesson_date", format(new Date(), "yyyy-MM-dd"))
        .order("lesson_date", { ascending: false });

      if (!error && data) {
        setAvailableLessons(data);
        if (data.length > 0 && !selectedLessonId) {
          setSelectedLessonId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    }
  };

  const fetchAvailableTrackingSessions = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from("lesson_telematics")
        .select("id, started_at, ended_at, total_distance_km, avg_speed_kmh")
        .eq("pupil_id", pupil.id)
        .not("ended_at", "is", null)
        .gte("started_at", thirtyDaysAgo.toISOString())
        .order("started_at", { ascending: false });

      if (!error && data) {
        setAvailableTrackingSessions(data);
      }
    } catch (error) {
      console.error("Error fetching tracking sessions:", error);
    }
  };

  const fetchTestStats = async () => {
    try {
      const { data, error } = await supabase
        .from("driving_test_results")
        .select("id, is_mock, result, test_date")
        .eq("pupil_id", pupil.id)
        .order("test_date", { ascending: false });

      if (!error && data) {
        const realTests = data.filter(t => !t.is_mock).length;
        const mockTests = data.filter(t => t.is_mock).length;
        const lastTest = data[0];
        setTestStats({
          realTests,
          mockTests,
          lastResult: lastTest?.result as 'pass' | 'fail' | null,
          lastTestDate: lastTest?.test_date || null
        });
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchLatestFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, notes, rating")
        .eq("pupil_id", pupil.id)
        .order("lesson_date", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLatestFeedback(data);
      }
    } catch (error) {
      // No feedback yet is fine
    }
  };

  const handleSaveFeedback = async () => {
    if (!newFeedback.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    setSavingFeedback(true);
    try {
      const selectedLesson = availableLessons.find(l => l.id === selectedLessonId);
      const lessonDate = selectedLesson?.lesson_date || format(new Date(), "yyyy-MM-dd");
      const lessonDuration = selectedLesson?.duration_minutes || 0;

      let instructorIdToUse = instructorId;
      
      if (!instructorIdToUse) {
        const { data: existingLesson } = await supabase
          .from("lesson_history")
          .select("instructor_id")
          .eq("pupil_id", pupil.id)
          .limit(1)
          .maybeSingle();

        instructorIdToUse = existingLesson?.instructor_id;
      }

      if (!instructorIdToUse) {
        const { data: scheduled } = await supabase
          .from("scheduled_lessons")
          .select("instructor_id")
          .eq("pupil_id", pupil.id)
          .limit(1)
          .maybeSingle();

        instructorIdToUse = scheduled?.instructor_id;
      }

      if (!instructorIdToUse) {
        toast.error("Unable to find instructor");
        return;
      }

      const { error } = await supabase
        .from("lesson_history")
        .insert({
          pupil_id: pupil.id,
          instructor_id: instructorIdToUse,
          lesson_date: lessonDate,
          duration_minutes: lessonDuration,
          notes: newFeedback,
          rating: newRating > 0 ? newRating : null,
          scheduled_lesson_id: selectedLessonId || null,
          telematics_session_id: selectedTrackingSessionId || null,
        });

      if (error) throw error;

      toast.success("Feedback saved! Visible to pupil & parents");
      setIsAddingFeedback(false);
      setNewFeedback("");
      setNewRating(0);
      setSelectedLessonId("");
      setSelectedTrackingSessionId("");
      fetchLatestFeedback();
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Failed to save feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleStatusChange = async (newStatus: PupilStatus) => {
    if (newStatus === currentStatus) return;
    
    setChangingStatus(true);
    try {
      const { error } = await supabase
        .from('pupils')
        .update({ status: newStatus })
        .eq('id', pupil.id);

      if (error) throw error;
      
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      onStatusChange?.(pupil.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Inline edit save helper
  const saveField = async (field: string, value: string | null) => {
    const { error } = await supabase.from("pupils").update({ [field]: value }).eq("id", pupil.id);
    if (error) { toast.error("Failed to save"); throw error; }
    toast.success("Updated");
    queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
  };

  const handleNavigate = () => {
    const query = pupil.what3words 
      ? `what3words.com/${pupil.what3words}`
      : `${pupil.address}, ${pupil.postcode}`;
    window.open(`https://maps.google.com/maps?q=${encodeURIComponent(query)}`, "_blank");
  };

  const openWhat3Words = () => {
    if (pupil.what3words) {
      window.open(`https://what3words.com/${pupil.what3words}`, "_blank");
    }
  };

  const handleCardClick = () => {
    haptics.selection();
    setIsExpanded(!isExpanded);
  };

  // Calculate balance state from real-time account_balance
  const balance = pupil.account_balance || 0;
  const hasDebt = balance < 0;
  const hasCredit = balance > 0;

  // Get avatar ring color based on status
  const getAvatarRingColor = () => {
    if (isTracking) return "ring-2 ring-primary ring-offset-2";
    if (hasDebt) return "ring-2 ring-rose-500 ring-offset-2";
    if (pupil.test_date) {
      const testDate = new Date(pupil.test_date);
      const daysUntilTest = Math.ceil((testDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilTest <= 7 && daysUntilTest >= 0) return "ring-2 ring-amber-500 ring-offset-2";
    }
    return "";
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border overflow-hidden"
      >
        {/* Collapsed Card — clean list-style tile */}
        <button
          onClick={handleCardClick}
          className="w-full text-left px-4 py-3.5 flex items-center gap-3.5"
        >
          {/* Circular Avatar */}
          <div className="relative">
            <Avatar className={cn("h-12 w-12 shrink-0", getAvatarRingColor())}>
              <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
              <AvatarFallback className="text-white text-sm font-semibold" style={{ backgroundColor: '#1877F2' }}>
                {getInitials(pupil.name)}
              </AvatarFallback>
            </Avatar>
            {/* Status dot */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
              statusConfig[currentStatus].color
            )} />
            {/* Live tracking indicator */}
            {isTracking && (
              <div className="absolute -top-1 -right-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>
            )}
          </div>

          {/* Name + Next Lesson */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[15px] text-foreground truncate">{pupil.name}</h3>
              {isTracking && (
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 py-0">
                  LIVE
                </Badge>
              )}
            </div>
            
            <p className="text-[13px] text-primary mt-0.5 truncate">
              {pupil.next_lesson
                ? `Lesson ${format(parseISO(pupil.next_lesson), "dd MMM, HH:mm")}`
                : `${pupil.lessons_completed || 0} lessons completed`}
            </p>
          </div>

          {/* Credit / Balance indicator — driven by account_balance */}
          <div className="text-right shrink-0">
            {hasCredit ? (
              <span className="text-[13px] font-semibold text-emerald-600">
                £{balance.toFixed(0)} Credit
              </span>
            ) : hasDebt ? (
              <span className="text-[13px] font-semibold text-rose-600">
                £{Math.abs(balance).toFixed(0)} Due
              </span>
            ) : (
              <span className="text-[13px] font-semibold text-muted-foreground">
                £0
              </span>
            )}
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">
                {/* Desktop: Combined Layout */}
                {!isMobile ? (
                  <div className="p-4">
                    <DesktopPupilDetailPanel
                      pupil={pupil}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewHistory={onViewHistory}
                      onViewReport={onViewReport}
                      onViewTerms={onViewTerms}
                      onStartChat={onStartChat}
                      onRecordTestResult={onRecordTestResult}
                      onViewTestHistory={onViewTestHistory}
                      onStatusChange={onStatusChange}
                      hasSignedTerms={hasSignedTerms}
                      instructorId={instructorId}
                      instructorName={instructorName}
                      isTracking={isTracking}
                      paymentQrUrl={paymentQrUrl}
                      commissionPayer={commissionPayer}
                      onClose={() => setIsExpanded(false)}
                    />
                  </div>
                ) : (
                <div className="pb-4">
                  {/* Profile Hero Card */}
                  <div className="bg-card rounded-2xl border border-border mx-4 mt-4 p-6 flex flex-col items-center">
                    <Avatar className={cn("h-20 w-20 mb-3", getAvatarRingColor())}>
                      <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
                      <AvatarFallback className="text-white text-2xl font-semibold" style={{ backgroundColor: '#2C3E50' }}>
                        {getInitials(pupil.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-foreground">{pupil.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Pupil since {format(parseISO(pupil.created_at), "EEE, d MMM yyyy")}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" size="sm" className="rounded-full px-5 gap-2" onClick={(e) => { e.stopPropagation(); if (pupil.phone) window.open(`tel:${pupil.phone}`); }} disabled={!pupil.phone}>
                        <Phone className="h-4 w-4" /> Call
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full px-5 gap-2" onClick={(e) => { e.stopPropagation(); if (pupil.email) window.open(`mailto:${pupil.email}`); }} disabled={!pupil.email}>
                        <Mail className="h-4 w-4" /> Email
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border">
                    <div className="grid grid-cols-3 divide-x divide-border py-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{pupil.lessons_completed || 0}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Lessons</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{pupil.prepaid_hours || 0}h</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className={cn("text-2xl font-bold", hasDebt ? "text-rose-600" : "text-foreground")}>
                          {pupil.account_balance ? (pupil.account_balance < 0 ? `£${Math.abs(pupil.account_balance).toFixed(2)}` : `£${Number(pupil.account_balance).toFixed(2)}`) : "£0.00"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{hasDebt ? "Owed" : hasCredit ? "Credit" : "Balance"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Test Date Card */}
                  {pupil.test_date && (() => {
                    const testDate = new Date(pupil.test_date);
                    const daysUntilTest = Math.ceil((testDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div className="mx-4 mt-3 bg-card rounded-2xl border-l-4 border-l-primary border border-border p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">Driving Test</span>
                        </div>
                        <p className="text-base font-bold text-foreground">{format(testDate, "EEE, d MMM yyyy")}</p>
                        <Badge className={cn("mt-2 text-xs font-medium", daysUntilTest <= 7 ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-100" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-100")}>
                          {daysUntilTest === 0 ? "Test is today!" : daysUntilTest === 1 ? "Test is tomorrow" : `${daysUntilTest} days until test`}
                        </Badge>
                      </div>
                    );
                  })()}

                  {/* Payment Due Warning */}
                  {pupil.payment_type === "deposit" && hasDebt && pupil.balance_due_date && !pupil.deposit_forfeited && (() => {
                    const dueDate = new Date(pupil.balance_due_date);
                    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isOverdue = daysUntilDue < 0;
                    const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;
                    return (
                      <div className={cn("mx-4 mt-3 flex items-center gap-2 text-sm rounded-2xl p-4 border", isOverdue ? "bg-destructive/10 text-destructive border-destructive/20" : isUrgent ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" : "bg-muted/50 text-muted-foreground border-border")}>
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{isOverdue ? "OVERDUE: " : ""}£{Math.abs(pupil.account_balance || 0)} due {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    );
                  })()}

                  {/* Details Card */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">Details</h3>
                    {pupil.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{pupil.phone}</span>
                      </div>
                    )}
                    {pupil.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">{pupil.email}</span>
                      </div>
                    )}
                    <InlineEditField value={pupil.address || ""} onSave={(v) => saveField("address", v)} icon={<MapPin className="h-4 w-4 text-muted-foreground" />} placeholder="Address" emptyText="Add address" />
                    {pupil.postcode && (
                      <div className="flex items-center gap-3 text-sm ml-7">
                        <span className="text-muted-foreground">{pupil.postcode}</span>
                      </div>
                    )}
                    <InlineEditField value={pupil.pickup_address || ""} onSave={(v) => saveField("pickup_address", v || null)} icon={<Navigation className="h-4 w-4 text-muted-foreground" />} placeholder="Pickup address" emptyText="Add pickup address" />
                    {pupil.what3words && (
                      <button onClick={(e) => { e.stopPropagation(); openWhat3Words(); }} className="flex items-center gap-3 text-sm text-primary hover:underline">
                        <span className="font-medium text-muted-foreground">///</span>
                        <span>{pupil.what3words}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                    {pupil.course_type && (
                      <div className="flex items-center gap-3 text-sm">
                        <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{courseTypeLabels[pupil.course_type] || pupil.course_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes Card */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Notes</h3>
                      {!isAddingNote && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setIsAddingNote(true); }}>+ Add Note</Button>
                      )}
                    </div>
                    {pupil.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pupil.notes}</p>}
                    {isAddingNote && (
                      <div className="space-y-2 pt-1">
                        <Select value={noteLessonId} onValueChange={setNoteLessonId}>
                          <SelectTrigger className="w-full" onClick={(e) => e.stopPropagation()}>
                            <SelectValue placeholder="Link to lesson (optional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="general">General note (no lesson)</SelectItem>
                            {noteLessons.map((lesson) => (
                              <SelectItem key={lesson.id} value={lesson.id}>{format(parseISO(lesson.lesson_date), 'EEE, d MMM')} at {lesson.start_time.slice(0, 5)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Enter note..." className="min-h-[80px]" onClick={(e) => e.stopPropagation()} />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setIsAddingNote(false); setNoteText(""); setNoteLessonId(""); }}>Cancel</Button>
                          <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleSaveNote(); }} disabled={savingNote || !noteText.trim()}>{savingNote ? "Saving..." : "Save"}</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lesson Feedback */}
                  <div className="mx-4 mt-3">
                    <SectionPanel title="Lesson Feedback" icon={<Star className="h-4 w-4 text-primary" />} headerGradient>
                      <div className="px-4 pb-2 space-y-3">
                        {latestFeedback?.notes && !isAddingFeedback && (
                          <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{format(parseISO(latestFeedback.lesson_date), 'EEE, d MMM')}</span>
                              {latestFeedback.rating && (
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={cn("h-3 w-3", star <= latestFeedback.rating! ? "fill-amber-400 text-amber-400" : "text-muted")} />))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm">{latestFeedback.notes}</p>
                          </div>
                        )}
                        {!isAddingFeedback ? (
                          <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); setIsAddingFeedback(true); }}>
                            <Send className="h-4 w-4 mr-2" /> Add Feedback
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            {availableLessons.length > 0 && (
                              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                                <SelectTrigger className="w-full" onClick={(e) => e.stopPropagation()}><SelectValue placeholder="Link to lesson..." /></SelectTrigger>
                                <SelectContent className="bg-background z-50">
                                  {availableLessons.map((lesson) => (<SelectItem key={lesson.id} value={lesson.id}>{format(parseISO(lesson.lesson_date), 'EEE, d MMM')} at {lesson.start_time.slice(0, 5)}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            )}
                            <div className="flex items-center gap-1 justify-center">
                              {[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={(e) => { e.stopPropagation(); setNewRating(star); }} className="p-1"><Star className={cn("h-6 w-6", star <= newRating ? "fill-amber-400 text-amber-400" : "text-muted")} /></button>))}
                            </div>
                            <Textarea value={newFeedback} onChange={(e) => setNewFeedback(e.target.value)} placeholder="Enter lesson feedback..." className="min-h-[80px]" onClick={(e) => e.stopPropagation()} />
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setIsAddingFeedback(false); setNewFeedback(""); setNewRating(0); }}>Cancel</Button>
                              <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleSaveFeedback(); }} disabled={savingFeedback}>{savingFeedback ? "Saving..." : "Save"}</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionPanel>
                  </div>

                  {/* Tracking History */}
                  <div className="mx-4 mt-3">
                    <SectionPanel title="Tracking History" icon={<Route className="h-4 w-4 text-primary" />} headerGradient>
                      <div className="px-4 pb-2"><PupilTrackingHistory pupilId={pupil.id} pupilName={pupil.name} /></div>
                    </SectionPanel>
                  </div>

                  {/* Payments */}
                  <div className="mx-4 mt-3">
                    <SectionPanel title="Payments" icon={<PoundSterling className="h-4 w-4 text-primary" />} headerGradient>
                      <div className="px-4 pb-2 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setShowRecordPaymentModal(true); }}><PoundSterling className="h-4 w-4 mr-1" /> Record</Button>
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setShowQRModal(true); }}><QrCode className="h-4 w-4 mr-1" /> QR</Button>
                          {instructorId && instructorName && hasDebt && (
                            <SendPaymentReminderButton pupilId={pupil.id} pupilName={pupil.name} pupilPhone={pupil.phone} pupilEmail={pupil.email} instructorId={instructorId} instructorName={instructorName} outstandingAmount={pupil.account_balance || 0} />
                          )}
                        </div>
                        <PupilPaymentHistory pupilId={pupil.id} pupilName={pupil.name} refreshTrigger={paymentRefreshTrigger} />
                        <PupilCreditBreakdown pupilId={pupil.id} prepaidHours={pupil.prepaid_hours || 0} depositPaid={pupil.deposit_paid || 0} paymentType={pupil.payment_type} />
                      </div>
                    </SectionPanel>
                  </div>

                  {/* Tools Grid */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4">
                    <div className="grid grid-cols-4 gap-x-4 gap-y-4">
                      <button className="flex flex-col items-center gap-1.5" onClick={(e) => { e.stopPropagation(); onViewHistory(pupil); }}>
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center"><History className="h-6 w-6 text-primary" /></div>
                        <span className="text-[10px] font-medium text-foreground">Lessons</span>
                      </button>
                      <button className="flex flex-col items-center gap-1.5" onClick={(e) => { e.stopPropagation(); setShowSyllabusSheet(true); }}>
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center"><GraduationCap className="h-6 w-6 text-primary" /></div>
                        <span className="text-[10px] font-medium text-foreground">Syllabus</span>
                      </button>
                      <button className="flex flex-col items-center gap-1.5" onClick={(e) => { e.stopPropagation(); onViewReport(pupil); }}>
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center"><Car className="h-6 w-6 text-primary" /></div>
                        <span className="text-[10px] font-medium text-foreground">Report</span>
                      </button>
                      {onRecordTestResult && (
                        <button className="flex flex-col items-center gap-1.5" onClick={(e) => { e.stopPropagation(); onRecordTestResult(pupil, false); }}>
                          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center"><Award className="h-6 w-6 text-primary" /></div>
                          <span className="text-[10px] font-medium text-foreground">Test</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-around mt-4 pt-4 border-t border-border">
                      <button onClick={(e) => { e.stopPropagation(); handleNavigate(); }} className="flex flex-col items-center gap-1.5">
                        <Navigation className="h-5 w-5 text-primary" /><span className="text-[10px] font-medium text-foreground">Navigate</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onStartChat?.(pupil); }} className="flex flex-col items-center gap-1.5">
                        <MessageSquare className="h-5 w-5 text-primary" /><span className="text-[10px] font-medium text-foreground">Chat</span>
                      </button>
                      <SharePupilDetailsDialog pupil={pupil} instructorName={instructorName} trigger={
                        <button className="flex flex-col items-center gap-1.5">
                          <Share2 className="h-5 w-5 text-primary" /><span className="text-[10px] font-medium text-foreground">Share</span>
                        </button>
                      } />
                    </div>
                  </div>

                  {/* Status & Admin */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{pupil.progress || 0}%</span>
                      </div>
                      <Progress value={pupil.progress || 0} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="gap-2">
                            {(() => { const StatusIcon = statusConfig[currentStatus].icon; return <StatusIcon className="h-4 w-4" />; })()}
                            {statusConfig[currentStatus].label}
                            {changingStatus && <Clock className="h-3 w-3 animate-spin" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-background z-50" onClick={(e) => e.stopPropagation()}>
                          {(Object.keys(statusConfig) as PupilStatus[]).map((status) => {
                            const config = statusConfig[status]; const Icon = config.icon;
                            return (<DropdownMenuItem key={status} onClick={(e) => { e.stopPropagation(); handleStatusChange(status); }} className={status === currentStatus ? "bg-muted" : ""}><Icon className="h-4 w-4 mr-2" />{config.label}{status === currentStatus && <Check className="h-4 w-4 ml-auto" />}</DropdownMenuItem>);
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <NewPupilChecklist pupilId={pupil.id} pupilName={pupil.name} />
                    {onViewTerms && (
                      <Button variant={hasSignedTerms ? "outline" : "default"} size="sm" className={cn("w-full", hasSignedTerms && "border-emerald-500 text-emerald-600")} onClick={(e) => { e.stopPropagation(); onViewTerms(pupil); }}>
                        {hasSignedTerms ? (<><CheckCircle2 className="h-4 w-4 mr-2" />T&Cs Signed</>) : (<><FileSignature className="h-4 w-4 mr-2" />Sign T&Cs</>)}
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(pupil); }}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete(pupil); }}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals */}
      {instructorId && (
        <RecordPaymentModal
          open={showRecordPaymentModal}
          onOpenChange={setShowRecordPaymentModal}
          pupilId={pupil.id}
          pupilName={pupil.name}
          instructorId={instructorId}
          currentBalance={pupil.account_balance || 0}
          onPaymentRecorded={() => setPaymentRefreshTrigger(prev => prev + 1)}
        />
      )}

      <PaymentQRModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        paymentQrUrl={paymentQrUrl}
        commissionPayer={commissionPayer}
        instructorName={instructorName}
      />

      <Sheet open={showSyllabusSheet} onOpenChange={setShowSyllabusSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Driving Syllabus - {pupil.name}</SheetTitle>
          </SheetHeader>
          <DrivingSyllabus 
            pupilId={pupil.id} 
            pupilName={pupil.name}
            onClose={() => setShowSyllabusSheet(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
