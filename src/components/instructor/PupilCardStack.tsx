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
  Share2,
  Gauge
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
  defaultExpanded?: boolean;
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
  driving_test: "Driving Test",
};

export function PupilCardStack({
  pupil,
  defaultExpanded = false,
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
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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

  // Inline lesson history & driving sessions for profile view
  interface RecentLesson {
    id: string;
    lesson_date: string;
    start_time: string;
    duration_minutes: number;
    lesson_type: string;
    amount_due: number | null;
    payment_status: string;
    status: string;
    notes: string | null;
  }
  interface RecentDrivingSession {
    id: string;
    started_at: string;
    ended_at: string | null;
    total_distance_km: number | null;
    max_speed_kmh: number | null;
    speeding_count: number;
    feedback_notes: string | null;
  }
  const [recentLessons, setRecentLessons] = useState<RecentLesson[]>([]);
  const [recentDrivingSessions, setRecentDrivingSessions] = useState<RecentDrivingSession[]>([]);

  // Fetch test stats on mount
  useEffect(() => {
    fetchTestStats();
  }, [pupil.id]);

  // Fetch data when card expands
  useEffect(() => {
    if (isExpanded) {
      fetchLatestFeedback();
      fetchRecentLessons();
      fetchRecentDrivingSessions();
    }
  }, [isExpanded, pupil.id]);

  const fetchRecentLessons = async () => {
    try {
      const { data } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, lesson_type, amount_due, payment_status, status, notes")
        .eq("pupil_id", pupil.id)
        .in("status", ["completed", "scheduled"])
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })
        .limit(5);
      if (data) setRecentLessons(data);
    } catch (err) {
      console.error("Error fetching recent lessons:", err);
    }
  };

  const fetchRecentDrivingSessions = async () => {
    try {
      const { data: sessions } = await supabase
        .from("lesson_telematics")
        .select("id, started_at, ended_at, total_distance_km, max_speed_kmh")
        .eq("pupil_id", pupil.id)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(5);

      if (sessions) {
        const withCounts = await Promise.all(sessions.map(async (s) => {
          const [speedRes, feedbackRes] = await Promise.all([
            supabase.from("driving_behavior_events").select("*", { count: "exact", head: true }).eq("telematics_id", s.id).eq("event_type", "speeding"),
            supabase.from("lesson_history").select("notes").eq("telematics_session_id", s.id).limit(1).maybeSingle()
          ]);
          return { ...s, speeding_count: speedRes.count || 0, feedback_notes: feedbackRes.data?.notes || null };
        }));
        setRecentDrivingSessions(withCounts);
      }
    } catch (err) {
      console.error("Error fetching driving sessions:", err);
    }
  };

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
    if (isMobile) {
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
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

  // Avatar color palette based on name
  const avatarColors = [
    '#D4A843', // gold
    '#2BA67C', // emerald
    '#E85D75', // pink
    '#7C6FD4', // purple
    '#3B8DD4', // blue
    '#E08A3A', // orange
    '#5BBFB0', // teal
    '#C74D4D', // red
  ];
  const avatarColorIndex = pupil.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % avatarColors.length;
  const avatarBg = avatarColors[avatarColorIndex];

  // Calculate total hours from lessons_completed (approximate 2h per lesson if no better data)
  const totalHours = (pupil.lessons_completed || 0) * 2;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        {/* Collapsed Card */}
        <button
          onClick={handleCardClick}
          className="w-full text-left px-4 py-4 flex items-center gap-3.5"
        >
          {/* Circular Avatar */}
          <div className="relative">
            <Avatar className={cn("h-14 w-14 shrink-0", getAvatarRingColor())}>
              <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
              <AvatarFallback className="text-white text-base font-bold" style={{ backgroundColor: avatarBg }}>
                {getInitials(pupil.name)}
              </AvatarFallback>
            </Avatar>
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

          {/* Name + Phone + Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[15px] text-foreground truncate">{pupil.name}</h3>
              {isTracking && (
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 py-0">
                  LIVE
                </Badge>
              )}
            </div>
            {pupil.phone && (
              <p className="text-[13px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {pupil.phone}
              </p>
            )}
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {pupil.lessons_completed || 0} lessons · {totalHours}h
              {pupil.test_date && ` · Test: ${format(parseISO(pupil.test_date), "yyyy-MM-dd")}`}
            </p>
          </div>

          {/* Balance badge */}
          {(hasDebt || hasCredit) && (
            <span className={cn(
              "text-[13px] font-semibold px-2.5 py-1 rounded-lg shrink-0",
              hasDebt ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
            )}>
              £{Math.abs(balance).toFixed(0)}
            </span>
          )}

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Expanded Content - Desktop only (inline) */}
        <AnimatePresence>
          {isExpanded && !isMobile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">
                {/* Desktop: Combined Layout */}
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
                <div className="pb-6">
                  {/* ── iOS Contact Hero ── */}
                  <div className="bg-gradient-to-b from-[#1C2A3A] to-[#2C3E50] px-6 pt-8 pb-6 flex flex-col items-center">
                    <Avatar className={cn("h-24 w-24 mb-3 ring-4 ring-white/20 ring-offset-2 ring-offset-[#1C2A3A]", isTracking && "ring-primary")}>
                      <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
                      <AvatarFallback className="text-white text-2xl font-bold" style={{ backgroundColor: avatarBg }}>
                        {getInitials(pupil.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isTracking && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-2 py-0.5 mb-1 -mt-1">
                        <span className="relative flex h-1.5 w-1.5 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" /></span>
                        LIVE TRACKING
                      </Badge>
                    )}
                    <h2 className="text-xl font-bold text-white mt-1">{pupil.name}</h2>
                    <p className="text-sm text-white/60 mt-0.5">
                      Pupil since {format(parseISO(pupil.created_at), "MMM yyyy")}
                      {pupil.course_type && ` · ${courseTypeLabels[pupil.course_type] || pupil.course_type}`}
                    </p>

                    {/* Circular Action Buttons */}
                    <div className="flex items-center gap-5 mt-5">
                      {[
                        { icon: Phone, label: "Call", action: () => pupil.phone && window.open(`tel:${pupil.phone}`), disabled: !pupil.phone },
                        { icon: MessageSquare, label: "Message", action: () => onStartChat?.(pupil) },
                        { icon: Mail, label: "Email", action: () => pupil.email && window.open(`mailto:${pupil.email}`), disabled: !pupil.email },
                        { icon: Navigation, label: "Navigate", action: handleNavigate },
                      ].map(({ icon: Icon, label, action, disabled }) => (
                        <button
                          key={label}
                          onClick={(e) => { e.stopPropagation(); action?.(); }}
                          disabled={disabled}
                          className="flex flex-col items-center gap-1.5 disabled:opacity-30"
                        >
                          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-[10px] font-medium text-white/70">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Stats Strip ── */}
                  <div className="mx-4 -mt-4 bg-card rounded-2xl border border-border shadow-md">
                    <div className="grid grid-cols-4 divide-x divide-border py-4">
                      {[
                        { value: pupil.lessons_completed || 0, label: "Lessons" },
                        { value: `${pupil.prepaid_hours || 0}h`, label: "Hours" },
                        { value: `${pupil.progress || 0}%`, label: "Progress" },
                        { value: pupil.account_balance ? `£${Math.abs(Number(pupil.account_balance)).toFixed(0)}` : "£0", label: hasDebt ? "Owed" : hasCredit ? "Credit" : "Balance", highlight: hasDebt },
                      ].map(({ value, label, highlight }) => (
                        <div key={label} className="text-center">
                          <div className={cn("text-lg font-bold", highlight ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>{value}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Test Date Banner ── */}
                  {pupil.test_date && (() => {
                    const testDate = new Date(pupil.test_date);
                    const daysUntilTest = Math.ceil((testDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysUntilTest <= 7 && daysUntilTest >= 0;
                    return (
                      <div className={cn(
                        "mx-4 mt-3 rounded-2xl p-4 flex items-center gap-3",
                        isUrgent
                          ? "bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-300/30 dark:border-amber-600/30"
                          : "bg-card border border-border"
                      )}>
                        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", isUrgent ? "bg-amber-500/20" : "bg-muted")}>
                          <Calendar className={cn("h-5 w-5", isUrgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{format(testDate, "EEE, d MMM yyyy")}</p>
                          <p className={cn("text-xs font-medium", isUrgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                            {daysUntilTest === 0 ? "Test is today!" : daysUntilTest === 1 ? "Test is tomorrow" : `${daysUntilTest} days until test`}
                          </p>
                        </div>
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

                  {/* ── Colorful Quick Actions Grid ── */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { icon: History, label: "Lessons", bg: "bg-blue-500/10", color: "text-blue-600 dark:text-blue-400", action: () => onViewHistory(pupil) },
                        { icon: GraduationCap, label: "Syllabus", bg: "bg-purple-500/10", color: "text-purple-600 dark:text-purple-400", action: () => setShowSyllabusSheet(true) },
                        { icon: Car, label: "Report", bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400", action: () => onViewReport(pupil) },
                        ...(onRecordTestResult ? [{ icon: Award, label: "Test", bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400", action: () => onRecordTestResult(pupil, false) }] : []),
                        { icon: PoundSterling, label: "Record £", bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400", action: () => setShowRecordPaymentModal(true) },
                        { icon: QrCode, label: "QR Pay", bg: "bg-indigo-500/10", color: "text-indigo-600 dark:text-indigo-400", action: () => setShowQRModal(true) },
                        { icon: Share2, label: "Share", bg: "bg-pink-500/10", color: "text-pink-600 dark:text-pink-400", action: null },
                      ].map(({ icon: Icon, label, bg, color, action }) => (
                        label === "Share" ? (
                          <SharePupilDetailsDialog key={label} pupil={pupil} instructorName={instructorName} trigger={
                            <button className="flex flex-col items-center gap-1.5">
                              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", bg)}>
                                <Icon className={cn("h-6 w-6", color)} />
                              </div>
                              <span className="text-[10px] font-medium text-foreground">{label}</span>
                            </button>
                          } />
                        ) : (
                          <button key={label} className="flex flex-col items-center gap-1.5" onClick={(e) => { e.stopPropagation(); action?.(); }}>
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", bg)}>
                              <Icon className={cn("h-6 w-6", color)} />
                            </div>
                            <span className="text-[10px] font-medium text-foreground">{label}</span>
                          </button>
                        )
                      ))}
                    </div>
                  </div>

                  {/* ── Details Card ── */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-foreground text-sm">Details</h3>
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
                  </div>

                  {/* ── Notes Card ── */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-sm">Notes</h3>
                      {!isAddingNote && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setIsAddingNote(true); }}>+ Add</Button>
                      )}
                    </div>
                    {pupil.notes ? (
                      <div className="bg-muted/30 rounded-xl p-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pupil.notes}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No notes yet</p>
                    )}
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

                  {/* ── Lesson History Card ── */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-foreground text-sm">
                      Lesson History {recentLessons.length > 0 && <span className="text-muted-foreground font-normal">({recentLessons.length})</span>}
                    </h3>
                    {recentLessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No lessons recorded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {recentLessons.map((lesson) => {
                          const lessonTypeColors: Record<string, string> = {
                            'test_prep': 'border-l-amber-500',
                            'standard': 'border-l-blue-500',
                            'intensive': 'border-l-purple-500',
                            'motorway': 'border-l-emerald-500',
                            'mock_test': 'border-l-rose-500',
                            'refresher': 'border-l-cyan-500',
                            'driving_test': 'border-l-orange-500',
                          };
                          const lessonTypeBadgeColors: Record<string, string> = {
                            'test_prep': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                            'standard': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
                            'intensive': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
                            'motorway': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                            'mock_test': 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
                            'refresher': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
                            'driving_test': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
                          };
                          const borderColor = lessonTypeColors[lesson.lesson_type] || 'border-l-border';
                          const badgeColor = lessonTypeBadgeColors[lesson.lesson_type] || 'bg-muted text-muted-foreground';
                          const endTime = (() => {
                            const [h, m] = lesson.start_time.split(':').map(Number);
                            const endMinutes = h * 60 + m + lesson.duration_minutes;
                            return `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
                          })();
                          const paymentColor = lesson.payment_status === 'paid' ? 'text-emerald-600' : lesson.payment_status === 'unpaid' ? 'text-amber-600' : 'text-muted-foreground';

                          return (
                            <div key={lesson.id} className={cn("border-l-4 rounded-r-xl bg-muted/20 p-3", borderColor)}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-foreground">{format(parseISO(lesson.lesson_date), "EEE, d MMM")}</span>
                                <Badge className={cn("text-[10px] px-2 py-0 font-medium border-0", badgeColor)}>
                                  {courseTypeLabels[lesson.lesson_type] || lesson.lesson_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{lesson.start_time.slice(0, 5)} - {endTime}</span>
                              </div>
                              {lesson.amount_due != null && (
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <PoundSterling className="h-3 w-3" />
                                    <span>£{lesson.amount_due}</span>
                                  </div>
                                  <span className={cn("text-[10px] font-medium capitalize", paymentColor)}>
                                    {lesson.payment_status === 'paid' ? 'Paid' : lesson.payment_status === 'unpaid' ? 'Unpaid' : lesson.payment_status}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {recentLessons.length >= 5 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs text-primary" onClick={(e) => { e.stopPropagation(); onViewHistory(pupil); }}>
                            View all lessons
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Driving Sessions Card ── */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground text-sm">
                        Driving Sessions {recentDrivingSessions.length > 0 && <span className="text-muted-foreground font-normal">({recentDrivingSessions.length})</span>}
                      </h3>
                    </div>
                    {recentDrivingSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No driving sessions recorded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {recentDrivingSessions.map((session) => {
                          const started = new Date(session.started_at);
                          const ended = session.ended_at ? new Date(session.ended_at) : null;
                          const durationMin = ended ? Math.round((ended.getTime() - started.getTime()) / 60000) : 0;
                          const maxMph = session.max_speed_kmh ? Math.round(session.max_speed_kmh * 0.621371) : null;
                          const distKm = session.total_distance_km || 0;

                          return (
                            <div key={session.id} className="rounded-xl bg-muted/20 p-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm text-foreground">{format(started, "EEE, d MMM yyyy")}</span>
                                {session.speeding_count > 0 && (
                                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-0 text-[10px] px-2 py-0">
                                    {session.speeding_count} overspeed{session.speeding_count !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(started, "HH:mm")} — {ended ? format(ended, "HH:mm") : "ongoing"}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {maxMph && <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> Max {maxMph} mph</span>}
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {durationMin} min</span>
                                <span className="flex items-center gap-1"><Route className="h-3 w-3" /> {distKm.toFixed(1)} km</span>
                              </div>
                              {session.feedback_notes && (
                                <p className="text-xs text-muted-foreground italic mt-1 truncate">{session.feedback_notes}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Payments Card ── */}
                  <div className="mx-4 mt-3 bg-card rounded-2xl border border-border p-4 space-y-3">
                    <h3 className="font-semibold text-foreground text-sm">Payments</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); setShowRecordPaymentModal(true); }}><PoundSterling className="h-4 w-4 mr-1" /> Record</Button>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); setShowQRModal(true); }}><QrCode className="h-4 w-4 mr-1" /> QR</Button>
                      {instructorId && instructorName && hasDebt && (
                        <SendPaymentReminderButton pupilId={pupil.id} pupilName={pupil.name} pupilPhone={pupil.phone} pupilEmail={pupil.email} instructorId={instructorId} instructorName={instructorName} outstandingAmount={pupil.account_balance || 0} />
                      )}
                    </div>
                    <PupilPaymentHistory pupilId={pupil.id} pupilName={pupil.name} refreshTrigger={paymentRefreshTrigger} />
                    <PupilCreditBreakdown pupilId={pupil.id} prepaidHours={pupil.prepaid_hours || 0} depositPaid={pupil.deposit_paid || 0} paymentType={pupil.payment_type} />
                  </div>

                  {/* ── Status & Admin ── */}
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
                          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
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
                      <Button variant={hasSignedTerms ? "outline" : "default"} size="sm" className={cn("w-full rounded-xl", hasSignedTerms && "border-emerald-500 text-emerald-600")} onClick={(e) => { e.stopPropagation(); onViewTerms(pupil); }}>
                        {hasSignedTerms ? (<><CheckCircle2 className="h-4 w-4 mr-2" />T&Cs Signed</>) : (<><FileSignature className="h-4 w-4 mr-2" />Sign T&Cs</>)}
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); onEdit(pupil); }}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                      <Button variant="ghost" size="sm" className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete(pupil); }}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
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
