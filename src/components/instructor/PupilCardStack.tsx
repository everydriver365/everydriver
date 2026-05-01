import { useState, useEffect } from "react";
import { pupilAvatarColor } from "@/lib/pupilAvatarColor";
import { titleCaseName } from "@/lib/titleCase";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
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
import { PupilNoteSheet } from "@/components/instructor/PupilNoteSheet";
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [changingStatus, setChangingStatus] = useState(false);
  const currentStatus = (pupil.status || 'active') as PupilStatus;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // Sync with prop changes — allows route-driven expansion (e.g. tapping a
  // schedule row that deep-links to /instructor/pupils/:pupilId) to open
  // already-mounted cards.
  useEffect(() => {
    if (defaultExpanded) setIsExpanded(true);
  }, [defaultExpanded]);
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

  // Note sheet state
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [noteOverride, setNoteOverride] = useState<string | null>(null);
  const effectiveNotes = noteOverride !== null ? noteOverride : (pupil.notes ?? "");

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
  const [lessonSummary, setLessonSummary] = useState<{ type: "next" | "last"; date: string } | null>(null);

  // Fetch test stats on mount
  useEffect(() => {
    fetchTestStats();
    fetchLessonSummary();
  }, [pupil.id]);

  const fetchLessonSummary = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: next } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date")
        .eq("pupil_id", pupil.id)
        .gte("lesson_date", today)
        .neq("status", "cancelled")
        .is("deleted_at", null)
        .order("lesson_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (next?.lesson_date) {
        setLessonSummary({ type: "next", date: next.lesson_date });
        return;
      }
      const { data: last } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date")
        .eq("pupil_id", pupil.id)
        .lt("lesson_date", today)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last?.lesson_date) {
        setLessonSummary({ type: "last", date: last.lesson_date });
      }
    } catch (err) {
      // silent
    }
  };

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
    navigate(`/instructor/pupils/${pupil.id}`);
  };

  // Calculate balance state from real-time account_balance
  const balance = pupil.account_balance || 0;
  const hasDebt = balance < 0;
  const hasCredit = balance > 0;

  // Get avatar ring color based on status (legacy desktop ring)
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

  // Premium-tile-system avatar palette (deterministic per pupil id/name).
  // Sourced from the shared helper so Tracking + other surfaces match.
  const avatarBg = pupilAvatarColor(pupil.id || pupil.name || "");

  // Status dot in the bottom-right of the avatar (mapped to system palette).
  const pupilStatusKey = (pupil.status as string | undefined) || "active";
  const statusDotColor: string | null = isTracking
    ? "#C8434F"
    : pupilStatusKey === "on_hold"
      ? "#B8801F"
      : pupilStatusKey === "inactive"
        ? "#6E6E73"
        : pupilStatusKey === "active"
          ? "#3B8B3B"
          : null;

  // Calculate total hours from lessons_completed (approximate 2h per lesson if no better data)
  const totalHours = (pupil.lessons_completed || 0) * 2;

  const isOverdue = hasDebt && !!pupil.balance_due_date && new Date(pupil.balance_due_date) < new Date();

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Overdue corner ribbon */}
        {isOverdue && (
          <div
            aria-label="Payment overdue"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div
              style={{
                position: "absolute",
                transform: "rotate(45deg)",
                background: "#C8434F",
                color: "#FFFFFF",
                fontSize: 8,
                fontWeight: 500,
                letterSpacing: 0.3,
                textAlign: "center",
                lineHeight: "16px",
                width: 88,
                top: 12,
                right: -28,
                fontFamily: "Inter, sans-serif",
              }}
            >
              OVERDUE
            </div>
          </div>
        )}
        {/* Collapsed Card — premium tile system */}
        <button
          onClick={handleCardClick}
          className="w-full text-left flex items-center"
          style={{ padding: 14, gap: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif' }}
        >
          {/* Deterministic avatar */}
          <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
            {pupil.profile_image_url ? (
              <img
                src={pupil.profile_image_url}
                alt={titleCaseName(pupil.name)}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: avatarBg,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
                aria-label={titleCaseName(pupil.name)}
              >
                {getInitials(pupil.name)}
              </div>
            )}
            {statusDotColor && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: statusDotColor,
                  border: "2px solid #FFFFFF",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
              <h3
                className="truncate"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#000000",
                  letterSpacing: "-0.2px",
                  lineHeight: 1.25,
                  margin: 0,
                  minWidth: 0,
                }}
              >
                {titleCaseName(pupil.name)}
              </h3>
              {isTracking && (
                <span
                  style={{
                    background: "#FBEAEC",
                    color: "#C8434F",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.4px",
                    padding: "2px 6px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                    flexShrink: 0,
                  }}
                >
                  LIVE
                </span>
              )}
            </div>

            {/* Meta row: lessons · hours · next/last lesson */}
            <div
              className="flex items-center"
              style={{
                gap: 10,
                fontSize: 12,
                color: "#6E6E73",
                lineHeight: 1.35,
                flexWrap: "wrap",
                rowGap: 2,
              }}
            >
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {pupil.lessons_completed || 0} {pupil.lessons_completed === 1 ? "lesson" : "lessons"}
              </span>
              <span style={{ width: 2, height: 2, borderRadius: "50%", background: "#C7C7CC" }} aria-hidden="true" />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{totalHours}h</span>
              {lessonSummary && (
                <>
                  <span style={{ width: 2, height: 2, borderRadius: "50%", background: "#C7C7CC" }} aria-hidden="true" />
                  <span className="flex items-center" style={{ gap: 4 }}>
                    <Calendar size={11} strokeWidth={1.6} aria-hidden="true" />
                    {lessonSummary.type === "next" ? "Next" : "Last"}: {format(parseISO(lessonSummary.date), "d MMM")}
                  </span>
                </>
              )}
            </div>

            {pupil.phone && (
              <p
                className="flex items-center truncate"
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#8E8E93",
                  gap: 5,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                <Phone size={11} strokeWidth={1.6} aria-hidden="true" />
                {formatPhoneNumber(pupil.phone)}
              </p>
            )}
          </div>

          {/* Right column: balance + chevron */}
          <div className="shrink-0 flex items-center" style={{ gap: 8 }}>
            {(hasDebt || hasCredit) && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontVariantNumeric: "tabular-nums",
                  background: hasDebt ? "#FBEAEC" : "#E8F3E8",
                  color: hasDebt ? "#C8434F" : "#3B8B3B",
                }}
              >
                {hasDebt ? "−" : "+"}£{Math.abs(balance).toFixed(0)}
              </span>
            )}
            <ChevronRight size={14} strokeWidth={1.6} color="#C7C7CC" />
          </div>
        </button>

        {/* Subtle divider */}

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
              <div className="border-t border-border p-4">
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
            </motion.div>
          )}
        </AnimatePresence>
        
      </motion.div>

      {/* Mobile: Full-screen pupil workspace */}
      {isMobile && (() => {
        const displayName = titleCaseName(pupil.name) || pupil.name;
        const hasEmail = !!pupil.email;
        const hasPhone = !!pupil.phone;
        const formattedPhone = formatPhoneNumber(pupil.phone);
        const lessonsCount = pupil.lessons_completed || 0;
        // Empty-state aware: zero/null hours & progress render as "—"
        const hoursDisplay = pupil.prepaid_hours && pupil.prepaid_hours > 0 ? `${pupil.prepaid_hours}h` : "—";
        const progressDisplay = pupil.progress && pupil.progress > 0 ? `${pupil.progress}%` : "—";
        const balanceAbs = Math.abs(balance);
        const balanceDisplay = `£${balanceAbs.toFixed(0)}`;
        const balanceLabel = hasDebt ? "Owed" : hasCredit ? "Credit" : "Balance";

        const hasRecentLessons = recentLessons.length > 0;
        const hasNotes = !!(effectiveNotes && effectiveNotes.trim());
        const hasTestJourney = !!pupil.test_date;
        const SECTION_LABEL_STYLE: React.CSSProperties = {
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 0.3,
          color: "#6E6E73",
          textTransform: "uppercase",
        };
        return (
          <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
            <SheetContent
              side="bottom"
              className="h-[100dvh] max-h-[100dvh] rounded-none p-0 overflow-y-auto border-0"
              style={{ background: "#F2F2F4" }}
            >
              <div className="pb-10" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif" }}>
                {/* ── Top bar: back / favourite / more ── */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <button
                    onClick={() => setIsExpanded(false)}
                    aria-label="Back"
                    className="flex items-center justify-center h-9 w-9 rounded-full active:scale-95 transition-transform"
                  >
                    <ChevronLeft size={22} strokeWidth={2.2} color="#2B7BC8" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Favourite"
                      className="flex items-center justify-center h-9 w-9 rounded-full active:scale-95 transition-transform"
                      style={{ background: "#E9ECF1" }}
                    >
                      <Star size={16} strokeWidth={1.8} color="#6E6E73" />
                    </button>
                    <button
                      aria-label="More"
                      onClick={() => onEdit(pupil)}
                      className="flex items-center justify-center h-9 w-9 rounded-full active:scale-95 transition-transform"
                      style={{ background: "#E9ECF1" }}
                    >
                      <MoreHorizontal size={16} strokeWidth={1.8} color="#6E6E73" />
                    </button>
                  </div>
                </div>

                {/* ── Identity card ── */}
                <div className="mx-4 mt-2 rounded-2xl bg-white border border-[#E9ECF1] p-5 flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-[72px] w-[72px]">
                      <AvatarImage src={pupil.profile_image_url || undefined} alt={displayName} />
                      <AvatarFallback
                        className="text-white font-semibold"
                        style={{ backgroundColor: avatarBg, fontSize: 26 }}
                      >
                        {getInitials(pupil.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isTracking && (
                      <span
                        className="absolute -bottom-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                        style={{ background: "#C8434F", boxShadow: "0 0 0 2px #FFFFFF" }}
                        aria-label="Live tracking"
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                        <span className="text-white" style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4 }}>
                          LIVE
                        </span>
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3" style={{ fontSize: 18, fontWeight: 500, color: "#000000", letterSpacing: -0.3 }}>
                    {displayName}
                  </h2>
                  <p className="mt-1" style={{ fontSize: 12, color: "#6E6E73" }}>
                    Pupil since {format(parseISO(pupil.created_at), "MMMM yyyy")}
                  </p>

                  {/* Communication actions */}
                  <div className="flex items-center justify-center gap-3 mt-5 w-full">
                    {[
                      { icon: Phone, label: "Call", action: () => hasPhone && window.open(`tel:${pupil.phone}`), disabled: !hasPhone },
                      { icon: MessageSquare, label: "Message", action: () => onStartChat?.(pupil), disabled: false },
                      { icon: Mail, label: "Email", action: () => hasEmail ? window.open(`mailto:${pupil.email}`) : onEdit(pupil), disabled: !hasEmail },
                      { icon: Navigation, label: "Navigate", action: handleNavigate, disabled: false },
                    ].map(({ icon: Icon, label, action, disabled }) => (
                      <button
                        key={label}
                        onClick={(e) => { e.stopPropagation(); action?.(); }}
                        className="flex flex-col items-center gap-1.5 flex-1 active:scale-95 transition-transform"
                        style={{ opacity: disabled ? 0.5 : 1 }}
                      >
                        <div
                          className="h-12 w-12 rounded-2xl flex items-center justify-center"
                          style={{ background: "#E9ECF1" }}
                        >
                          <Icon size={20} strokeWidth={1.8} color={disabled ? "#9AA3B0" : "#0F1B2D"} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, color: disabled ? "#9AA3B0" : "#6E6E73" }}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── At a glance ── */}
                <div className="mx-4 mt-3">
                  <p
                    className="px-1 mb-2"
                    style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.3, color: "#6E6E73", textTransform: "uppercase" }}
                  >
                    At a glance
                  </p>
                  <div className="rounded-2xl bg-white border border-[#E9ECF1] grid grid-cols-4 gap-2 p-3">
                    {[
                      { value: lessonsCount > 0 ? String(lessonsCount) : "—", label: "Lessons", muted: lessonsCount === 0 },
                      { value: hoursDisplay, label: "Hours", muted: hoursDisplay === "—" },
                      { value: progressDisplay, label: "Progress", muted: progressDisplay === "—" },
                      { value: balanceDisplay, label: balanceLabel, debt: hasDebt },
                    ].map(({ value, label, muted, debt }) => (
                      <div key={label} className="text-center">
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 500,
                            color: debt ? "#C8434F" : muted ? "#6E6E73" : "#000000",
                            letterSpacing: -0.3,
                          }}
                        >
                          {value}
                        </div>
                        <div style={{ fontSize: 11, color: "#6E6E73", marginTop: 2 }}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Next lesson ── */}
                <div className="mx-4 mt-3">
                  <p
                    className="px-1 mb-2"
                    style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.3, color: "#6E6E73", textTransform: "uppercase" }}
                  >
                    Next lesson
                  </p>
                  <div className="rounded-2xl bg-white border border-[#E9ECF1] p-4 flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "#E6F1FB" }}
                    >
                      <Calendar size={20} strokeWidth={1.8} color="#2B7BC8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {lessonSummary?.type === "next" ? (
                        <>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#000000" }}>
                            {format(parseISO(lessonSummary.date), "EEE d MMM")}
                          </p>
                          <p style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>Scheduled</p>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#000000" }}>Not yet booked</p>
                          <p style={{ fontSize: 12, color: "#6E6E73", marginTop: 2 }}>
                            Schedule the {lessonsCount === 0 ? "first" : "next"} lesson
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/instructor/course-planner?pupilId=${pupil.id}`);
                      }}
                      className="active:scale-95 transition-transform"
                      style={{
                        background: "#2B7BC8",
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "8px 16px",
                        borderRadius: 12,
                      }}
                    >
                      Book
                    </button>
                  </div>
                </div>

                {/* ── Test date banner (preserved) ── */}
                {pupil.test_date && (() => {
                  const testDate = new Date(pupil.test_date);
                  const daysUntilTest = Math.ceil((testDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntilTest <= 7 && daysUntilTest >= 0;
                  return (
                    <div
                      className="mx-4 mt-3 rounded-2xl p-4 flex items-center gap-3 border"
                      style={{
                        background: isUrgent ? "#FBF1DE" : "#FFFFFF",
                        borderColor: isUrgent ? "#EBD9B2" : "#E9ECF1",
                      }}
                    >
                      <div
                        className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: isUrgent ? "#F4E4BF" : "#F2F4F7" }}
                      >
                        <Calendar size={20} strokeWidth={1.8} color={isUrgent ? "#B8801F" : "#6E6E73"} />
                      </div>
                      <div className="flex-1">
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#000000" }}>
                          {format(testDate, "EEE, d MMM yyyy")}
                        </p>
                        <p style={{ fontSize: 12, color: isUrgent ? "#B8801F" : "#6E6E73", fontWeight: 500, marginTop: 2 }}>
                          {daysUntilTest === 0 ? "Test is today" : daysUntilTest === 1 ? "Test is tomorrow" : `${daysUntilTest} days until test`}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Recent lessons (only when there's history) ── */}
                {hasRecentLessons && (
                  <div className="mx-4 mt-3">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p style={SECTION_LABEL_STYLE}>Recent lessons</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewHistory(pupil); }}
                        style={{ fontSize: 12, fontWeight: 500, color: "#2B7BC8" }}
                      >
                        View all
                      </button>
                    </div>
                    <div className="rounded-2xl bg-white border border-[#E9ECF1] p-3 flex flex-col gap-2">
                      {recentLessons.slice(0, 3).map((l) => {
                        const firstSentence = (l.notes || "").split(/(?<=[.!?])\s/)[0]?.trim() || "";
                        const durationLabel = `${Math.round((l.duration_minutes || 60) / 60 * 10) / 10}h`;
                        const meta = [durationLabel, firstSentence].filter(Boolean).join(" · ");
                        return (
                          <div key={l.id} className="rounded-xl px-3 py-2.5" style={{ background: "#E6F1FB" }}>
                            <div className="flex items-center justify-between gap-2">
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#000000" }} className="truncate">
                                {(l.lesson_type || "Lesson").replace(/_/g, " ")}
                              </span>
                              <span style={{ fontSize: 11, color: "#6E6E73" }} className="shrink-0 tabular-nums">
                                {format(parseISO(l.lesson_date), "d MMM")}
                              </span>
                            </div>
                            {meta && (
                              <p style={{ fontSize: 11, color: "#6E6E73", marginTop: 2 }} className="truncate">
                                {meta}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Notes (full card when present, inline row when empty) ── */}
                {hasNotes ? (
                  <div className="mx-4 mt-3">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p style={SECTION_LABEL_STYLE}>Notes</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowNoteSheet(true); }}
                        style={{ fontSize: 12, fontWeight: 500, color: "#2B7BC8" }}
                      >
                        Edit
                      </button>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowNoteSheet(true); }}
                      className="w-full text-left rounded-2xl bg-white border border-[#E9ECF1] p-3"
                    >
                      <div className="rounded-xl px-3 py-2.5" style={{ background: "#F2F2F4" }}>
                        <p style={{ fontSize: 13, color: "#000000", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                          {effectiveNotes}
                        </p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowNoteSheet(true); }}
                    className="mx-4 mt-3 rounded-2xl bg-white border border-[#E9ECF1] px-4 py-3 flex items-center gap-3 active:bg-[#F2F4F7] transition-colors"
                    style={{ width: "calc(100% - 2rem)" }}
                  >
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#F2F2F4" }}
                    >
                      <FileText size={14} strokeWidth={1.8} color="#6E6E73" />
                    </div>
                    <span className="flex-1 text-left" style={{ fontSize: 14, color: "#6E6E73" }}>
                      Add note about {(displayName.split(" ")[0] || displayName)}
                    </span>
                    <span style={{ fontSize: 18, color: "#6E6E73", lineHeight: 1 }}>+</span>
                  </button>
                )}

                {/* ── Test journey (only when test data exists) ── */}
                {hasTestJourney && (
                  <div className="mx-4 mt-3">
                    <p className="px-1 mb-2" style={SECTION_LABEL_STYLE}>Test journey</p>
                    <div className="rounded-2xl bg-white border border-[#E9ECF1] p-4">
                      {(() => {
                        const testDate = new Date(pupil.test_date as string);
                        const daysUntil = Math.ceil((testDate.getTime() - Date.now()) / 86400000);
                        const milestones = [
                          { title: "Theory test", subtitle: "Status not recorded", status: "pending" as const },
                          {
                            title: "Practical test",
                            subtitle: `${format(testDate, "EEE d MMM yyyy")}${daysUntil >= 0 ? ` · ${daysUntil} day${daysUntil === 1 ? "" : "s"} away` : " · past"}`,
                            status: "active" as const,
                          },
                          { title: "Test readiness", subtitle: "Track via syllabus progress", status: "pending" as const },
                        ];
                        return (
                          <div className="flex flex-col gap-3">
                            {milestones.map((m) => (
                              <div key={m.title} className="flex items-start gap-3">
                                <div
                                  className="mt-0.5 flex items-center justify-center shrink-0"
                                  style={{
                                    width: 18, height: 18, borderRadius: "50%",
                                    border: `1.5px solid ${m.status === "active" ? "#B8801F" : "#D6D9DE"}`,
                                  }}
                                >
                                  {m.status === "active" && (
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#B8801F" }} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p style={{ fontSize: 13, fontWeight: 500, color: "#000000" }}>{m.title}</p>
                                  <p style={{ fontSize: 11, color: "#6E6E73", marginTop: 2 }}>{m.subtitle}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <button
                        onClick={(e) => { e.stopPropagation(); onRecordTestResult?.(pupil, false); }}
                        className="mt-3 w-full rounded-xl py-2.5 active:scale-95 transition-transform"
                        style={{ background: "#F2F2F4", fontSize: 13, fontWeight: 500, color: "#2B7BC8" }}
                      >
                        Record test result
                      </button>
                    </div>
                  </div>
                )}

                {/* ── More actions (list with tinted icon containers) ── */}
                <div className="mx-4 mt-3">
                  <p className="px-1 mb-2" style={SECTION_LABEL_STYLE}>More actions</p>
                  <div className="rounded-2xl bg-white border border-[#E9ECF1] overflow-hidden">
                    {[
                      { icon: ClipboardList, label: "Syllabus", tintBg: "#E6F1FB", tintFg: "#2B7BC8", action: () => setShowSyllabusSheet(true) },
                      { icon: Gauge, label: "Progress report", tintBg: "#E8F3E8", tintFg: "#3B8B3B", action: () => onViewReport(pupil) },
                      {
                        icon: PoundSterling,
                        label: "Payment",
                        tintBg: "#FBF1DE",
                        tintFg: "#B8801F",
                        action: () => setShowRecordPaymentModal(true),
                        meta: hasDebt ? `£${balanceAbs.toFixed(0)} due` : hasCredit ? `£${balanceAbs.toFixed(0)} credit` : "£0 due",
                        metaDebt: hasDebt,
                      },
                      ...(!hasTestJourney
                        ? [{ icon: Award, label: "Record test result", tintBg: "#FBF1DE", tintFg: "#B8801F", action: () => onRecordTestResult?.(pupil, false) }]
                        : []),
                      { icon: Share2, label: "Share progress", tintBg: "#F1ECFA", tintFg: "#8A5BC9", action: () => {} },
                    ].map(({ icon: Icon, label, tintBg, tintFg, action, meta, metaDebt }, idx, arr) => (
                      <button
                        key={label}
                        onClick={(e) => { e.stopPropagation(); action?.(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#F2F4F7] transition-colors"
                        style={{ borderBottom: idx < arr.length - 1 ? "1px solid #F0F2F5" : "none" }}
                      >
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tintBg }}>
                          <Icon size={18} strokeWidth={1.8} color={tintFg} />
                        </div>
                        <span className="flex-1 text-left" style={{ fontSize: 14, fontWeight: 500, color: "#000000" }}>
                          {label}
                        </span>
                        {meta && (
                          <span style={{ fontSize: 12, fontWeight: 500, color: metaDebt ? "#C8434F" : "#6E6E73" }}>
                            {meta}
                          </span>
                        )}
                        <ChevronRight size={14} strokeWidth={1.6} color="#9AA3B0" className="shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Details (contact info — preserved) ── */}
                {(hasPhone || hasEmail || pupil.postcode) && (
                  <div className="mx-4 mt-3">
                    <p className="px-1 mb-2" style={SECTION_LABEL_STYLE}>Details</p>
                    <div className="rounded-2xl bg-white border border-[#E9ECF1] overflow-hidden">
                      {hasPhone && (
                        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: (hasEmail || pupil.postcode) ? "1px solid #F0F2F5" : "none" }}>
                          <Phone size={16} strokeWidth={1.8} color="#6E6E73" className="shrink-0" />
                          <span style={{ fontSize: 14, color: "#000000" }}>{formattedPhone}</span>
                        </div>
                      )}
                      {hasEmail && (
                        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: pupil.postcode ? "1px solid #F0F2F5" : "none" }}>
                          <Mail size={16} strokeWidth={1.8} color="#6E6E73" className="shrink-0" />
                          <span style={{ fontSize: 14, color: "#000000" }} className="truncate">{pupil.email}</span>
                        </div>
                      )}
                      {pupil.postcode && (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <MapPin size={16} strokeWidth={1.8} color="#6E6E73" className="shrink-0" />
                          <span style={{ fontSize: 14, color: "#000000" }}>{pupil.postcode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── T&Cs (preserved) ── */}
                {onViewTerms && (
                  <div className="mx-4 mt-3">
                    <Button
                      variant={hasSignedTerms ? "outline" : "default"}
                      size="sm"
                      className={cn("w-full rounded-2xl h-11", hasSignedTerms && "border-emerald-500 text-emerald-600")}
                      onClick={(e) => { e.stopPropagation(); onViewTerms(pupil); }}
                    >
                      {hasSignedTerms ? (<><CheckCircle2 className="h-4 w-4 mr-2" />T&Cs signed</>) : (<><FileSignature className="h-4 w-4 mr-2" />Sign T&Cs</>)}
                    </Button>
                  </div>
                )}

                {/* ── Archive (destructive, separated) ── */}
                <div className="mx-4 mt-3 rounded-2xl bg-white border border-[#E9ECF1] p-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(pupil); }}
                    className="w-full flex items-center gap-3 px-1 py-1 active:opacity-70 transition-opacity"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "#FBEAEC" }}
                    >
                      <Trash2 size={18} strokeWidth={1.8} color="#C8434F" />
                    </div>
                    <span className="flex-1 text-left" style={{ fontSize: 14, fontWeight: 500, color: "#C8434F" }}>
                      Archive pupil
                    </span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        );
      })()}

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
        <SheetContent
          side="bottom"
          className="h-[100dvh] max-h-[100dvh] rounded-none p-0 overflow-y-auto border-0"
          style={{ background: "#F2F2F4" }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Driving syllabus — {pupil.name}</SheetTitle>
          </SheetHeader>
          <DrivingSyllabus 
            pupilId={pupil.id} 
            pupilName={pupil.name}
            onClose={() => setShowSyllabusSheet(false)}
          />
        </SheetContent>
      </Sheet>

      <PupilNoteSheet
        open={showNoteSheet}
        onOpenChange={setShowNoteSheet}
        pupilId={pupil.id}
        pupilName={pupil.name}
        initialNote={effectiveNotes}
        onSaved={(newNote) => setNoteOverride(newNote)}
      />
    </>
  );
}
