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
        {/* Collapsed Card */}
        <button
          onClick={handleCardClick}
          className="w-full text-left flex items-center gap-3"
          style={{ padding: 14 }}
        >
          {/* Circular Avatar */}
          <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
            <Avatar className="h-[44px] w-[44px]">
              <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
              <AvatarFallback
                className="text-white"
                style={{
                  background: avatarBg,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {getInitials(pupil.name)}
              </AvatarFallback>
            </Avatar>
            {/* Status indicator dot */}
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

          {/* Name + Phone + Stats */}
          <div className="flex-1 min-w-0" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div className="flex items-center gap-2">
              <h3
                className="truncate"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#000000",
                  letterSpacing: "-0.2px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {pupil.name}
              </h3>
              {isTracking && (
                <span
                  style={{
                    background: "#FBEAEC",
                    color: "#C8434F",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.3px",
                    padding: "2px 6px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                    lineHeight: 1.2,
                  }}
                >
                  LIVE
                </span>
              )}
            </div>
            {pupil.phone && (
              <p
                className="flex items-center"
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#6E6E73",
                  gap: 5,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <Phone size={11} strokeWidth={1.3} aria-hidden="true" />
                {pupil.phone}
              </p>
            )}
            <div
              className="flex items-center"
              style={{
                gap: 12,
                fontFamily: "Inter, sans-serif",
                flexWrap: "wrap",
                rowGap: 3,
              }}
            >
              <span style={{ fontSize: 12, color: "#6E6E73" }}>
                {pupil.lessons_completed || 0} {pupil.lessons_completed === 1 ? "lesson" : "lessons"} · {totalHours}h
              </span>
              {lessonSummary && (
                <span className="flex items-center" style={{ gap: 5, fontSize: 12, color: "#6E6E73" }}>
                  <Calendar size={11} strokeWidth={1.3} aria-hidden="true" />
                  {lessonSummary.type === "next" ? "Next" : "Last"}: {format(parseISO(lessonSummary.date), "d MMM")}
                </span>
              )}
            </div>
          </div>

          {/* Balance badge — kept (not in spec but live data field; preserves behaviour) */}
          {(hasDebt || hasCredit) && (
            <span
              className="shrink-0"
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 6,
                fontFamily: "Inter, sans-serif",
                background: hasDebt ? "#FBEAEC" : "#E8F3E8",
                color: hasDebt ? "#C8434F" : "#3B8B3B",
              }}
            >
              £{Math.abs(balance).toFixed(0)}
            </span>
          )}

          {/* Chevron */}
          <ChevronRight size={12} strokeWidth={1.6} color="#6E6E73" className="shrink-0" />
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

      {/* Mobile: Full-screen pupil profile sheet */}
      {isMobile && (
        <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
          <SheetContent side="bottom" className="h-[95vh] rounded-2xl p-0 overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="h-4 w-4 text-white" />
            </button>
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
              <div className="mx-4 -mt-4 bg-card rounded-2xl shadow-lift border border-border shadow-md">
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
                    <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0", isUrgent ? "bg-amber-500/20" : "bg-muted")}>
                      <Calendar className={cn("h-5 w-5", isUrgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{format(new Date(pupil.test_date), "EEE, d MMM yyyy")}</p>
                      <p className={cn("text-xs font-medium", isUrgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                        {daysUntilTest === 0 ? "Test is today!" : daysUntilTest === 1 ? "Test is tomorrow" : `${daysUntilTest} days until test`}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* ── Quick Actions ── */}
              <div className="mx-4 mt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Quick Actions</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: ClipboardList, label: "Syllabus", color: "bg-blue-500/10 text-blue-600", action: () => setShowSyllabusSheet(true) },
                    { icon: History, label: "History", color: "bg-violet-500/10 text-violet-600", action: () => onViewHistory(pupil) },
                    { icon: Gauge, label: "Report", color: "bg-emerald-500/10 text-emerald-600", action: () => onViewReport(pupil) },
                    { icon: Award, label: "Test Result", color: "bg-amber-500/10 text-amber-600", action: () => onRecordTestResult?.(pupil, false) },
                    { icon: PoundSterling, label: "Payment", color: "bg-rose-500/10 text-rose-600", action: () => setShowRecordPaymentModal(true) },
                    { icon: Share2, label: "Share", color: "bg-sky-500/10 text-sky-600", action: () => {} },
                  ].map(({ icon: Icon, label, color, action }) => (
                    <button key={label} onClick={action} className={`${color} rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform`}>
                      <Icon className="h-5 w-5" />
                      <span className="text-[11px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Contact Info ── */}
              <div className="mx-4 mt-3">
                <SectionPanel title="Details">
                  <div className="space-y-3">
                    {pupil.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground">{pupil.phone}</span>
                      </div>
                    )}
                    {pupil.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">{pupil.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground">{pupil.postcode}</span>
                    </div>
                  </div>
                </SectionPanel>
              </div>

              {/* ── Action buttons ── */}
              <div className="mx-4 mt-3 space-y-2 pb-4">
                {onViewTerms && (
                  <Button variant={hasSignedTerms ? "outline" : "default"} size="sm" className={cn("w-full rounded-2xl", hasSignedTerms && "border-emerald-500 text-emerald-600")} onClick={(e) => { e.stopPropagation(); onViewTerms(pupil); }}>
                    {hasSignedTerms ? (<><CheckCircle2 className="h-4 w-4 mr-2" />T&Cs Signed</>) : (<><FileSignature className="h-4 w-4 mr-2" />Sign T&Cs</>)}
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="rounded-2xl" onClick={(e) => { e.stopPropagation(); onEdit(pupil); }}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete(pupil); }}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

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
        <SheetContent side="bottom" className="h-[85vh] rounded-2xl overflow-y-auto">
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
