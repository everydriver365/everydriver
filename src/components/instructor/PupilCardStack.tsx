import { useState, useEffect } from "react";
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
import { CardSection } from "@/components/ui/CardSection";

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

  // Calculate if there's a balance issue
  const hasDebt = (pupil.account_balance || 0) < 0;
  const hasCredit = (pupil.prepaid_hours || 0) > 0;

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

          {/* Credit / Balance indicator */}
          <div className="text-right shrink-0">
            {hasCredit ? (
              <span className="text-[13px] font-semibold text-emerald-600">
                {pupil.prepaid_hours} hrs credit
              </span>
            ) : hasDebt ? (
              <span className="text-[13px] font-semibold text-rose-600">
                -£{Math.abs(pupil.account_balance || 0).toFixed(0)} owed
              </span>
            ) : (
              <span className="text-[13px] font-semibold text-emerald-600">
                0 hrs credit
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
                <div>
                {/* Quick Actions Row */}
                <div className="flex items-center justify-around py-3 px-4 bg-muted/30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pupil.phone) window.open(`tel:${pupil.phone}`);
                    }}
                    disabled={!pupil.phone}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[10px]">Call</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pupil.phone) window.open(`sms:${pupil.phone}`);
                    }}
                    disabled={!pupil.phone}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[10px]">Text</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate();
                    }}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Navigation className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-[10px]">Navigate</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartChat?.(pupil);
                    }}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px]">Chat</span>
                  </button>
                  <SharePupilDetailsDialog 
                    pupil={pupil} 
                    instructorName={instructorName}
                    trigger={
                      <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Share2 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-[10px]">Share</span>
                      </button>
                    }
                  />
                </div>

                <div className="p-4 space-y-4">
                  {/* Address Section - Inline Editable */}
                  <div className="space-y-1">
                    <InlineEditField
                      value={pupil.address || ""}
                      onSave={(v) => saveField("address", v)}
                      icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                      placeholder="Address"
                      emptyText="Add address"
                    />
                    <InlineEditField
                      value={pupil.postcode || ""}
                      onSave={(v) => saveField("postcode", v)}
                      placeholder="Postcode"
                      className="ml-6"
                      textClassName="text-muted-foreground"
                      emptyText="Add postcode"
                    />
                    {pupil.what3words && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openWhat3Words(); }}
                        className="flex items-center gap-2 text-sm text-primary hover:underline ml-6"
                      >
                        <span className="font-medium">///</span>
                        <span>{pupil.what3words}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold">{pupil.lessons_completed || 0}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Lessons</div>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold">{pupil.prepaid_hours || 0}h</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Credit</div>
                    </div>
                    <div className={cn(
                      "rounded-xl p-3 text-center",
                      hasDebt ? "bg-rose-50 dark:bg-rose-950/30" : "bg-muted/50"
                    )}>
                      <div className={cn("text-xl font-bold", hasDebt && "text-rose-600")}>
                        {pupil.account_balance 
                          ? (pupil.account_balance < 0 ? `-£${Math.abs(pupil.account_balance).toFixed(0)}` : `£${Number(pupil.account_balance).toFixed(0)}`) 
                          : "£0"}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{pupil.progress || 0}%</span>
                    </div>
                    <Progress value={pupil.progress || 0} className="h-2" />
                  </div>

                  {/* Test Date */}
                  {pupil.test_date && (
                    <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-xl p-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Test: {new Date(pupil.test_date).toLocaleDateString("en-GB", { 
                        weekday: "short", day: "numeric", month: "short" 
                      })}</span>
                    </div>
                  )}

                  {/* Payment Due Warning */}
                  {pupil.payment_type === "deposit" && hasDebt && pupil.balance_due_date && !pupil.deposit_forfeited && (
                    (() => {
                      const dueDate = new Date(pupil.balance_due_date);
                      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntilDue < 0;
                      const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;
                      
                      return (
                        <div className={cn(
                          "flex items-center gap-2 text-sm rounded-xl p-3",
                          isOverdue ? "bg-destructive/10 text-destructive" : 
                          isUrgent ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" : 
                          "bg-muted/50 text-muted-foreground"
                        )}>
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            {isOverdue ? "OVERDUE: " : ""}
                            £{Math.abs(pupil.account_balance || 0)} due {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      );
                    })()
                  )}

                  {/* Notes - Inline Editable */}
                  <div className="bg-muted/30 rounded-xl p-3">
                    <InlineEditField
                      value={pupil.notes || ""}
                      onSave={(v) => saveField("notes", v || null)}
                      type="textarea"
                      icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                      placeholder="Add notes..."
                      textClassName="text-sm text-muted-foreground"
                      emptyText="Tap to add notes"
                    />
                  </div>

                  {/* Lesson Feedback Section */}
                  <CardSection title="Lesson Feedback" defaultOpen={false}>
                    <div className="px-4 pb-2 space-y-3">
                      {latestFeedback?.notes && !isAddingFeedback && (
                        <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(latestFeedback.lesson_date), 'EEE, d MMM')}
                            </span>
                            {latestFeedback.rating && (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn("h-3 w-3", star <= latestFeedback.rating! ? "fill-amber-400 text-amber-400" : "text-muted")}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-sm">{latestFeedback.notes}</p>
                        </div>
                      )}
                      
                      {!isAddingFeedback ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingFeedback(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Add Feedback
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          {availableLessons.length > 0 && (
                            <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                              <SelectTrigger className="w-full" onClick={(e) => e.stopPropagation()}>
                                <SelectValue placeholder="Link to lesson..." />
                              </SelectTrigger>
                              <SelectContent className="bg-background z-50">
                                {availableLessons.map((lesson) => (
                                  <SelectItem key={lesson.id} value={lesson.id}>
                                    {format(parseISO(lesson.lesson_date), 'EEE, d MMM')} at {lesson.start_time.slice(0, 5)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          <div className="flex items-center gap-1 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewRating(star);
                                }}
                                className="p-1"
                              >
                                <Star className={cn("h-6 w-6", star <= newRating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                              </button>
                            ))}
                          </div>
                          
                          <Textarea
                            value={newFeedback}
                            onChange={(e) => setNewFeedback(e.target.value)}
                            placeholder="Enter lesson feedback..."
                            className="min-h-[80px]"
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddingFeedback(false);
                                setNewFeedback("");
                                setNewRating(0);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveFeedback();
                              }}
                              disabled={savingFeedback}
                            >
                              {savingFeedback ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardSection>

                  {/* Tracking History */}
                  <CardSection title="Tracking History" defaultOpen={false}>
                    <div className="px-4 pb-2">
                      <PupilTrackingHistory pupilId={pupil.id} pupilName={pupil.name} />
                    </div>
                  </CardSection>

                  {/* Payments Section */}
                  <CardSection title="Payments" defaultOpen={false}>
                    <div className="px-4 pb-2 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRecordPaymentModal(true);
                          }}
                        >
                          <PoundSterling className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowQRModal(true);
                          }}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR
                        </Button>
                        {instructorId && instructorName && hasDebt && (
                          <SendPaymentReminderButton
                            pupilId={pupil.id}
                            pupilName={pupil.name}
                            pupilPhone={pupil.phone}
                            pupilEmail={pupil.email}
                            instructorId={instructorId}
                            instructorName={instructorName}
                            outstandingAmount={pupil.account_balance || 0}
                          />
                        )}
                      </div>
                      
                      <PupilPaymentHistory
                        pupilId={pupil.id}
                        pupilName={pupil.name}
                        refreshTrigger={paymentRefreshTrigger}
                      />
                      
                      <PupilCreditBreakdown
                        pupilId={pupil.id}
                        prepaidHours={pupil.prepaid_hours || 0}
                        depositPaid={pupil.deposit_paid || 0}
                        paymentType={pupil.payment_type}
                      />
                    </div>
                  </CardSection>

                  {/* Tools Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-col h-auto py-3 gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewHistory(pupil);
                      }}
                    >
                      <History className="h-5 w-5 text-amber-500" />
                      <span className="text-[10px]">Lessons</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-col h-auto py-3 gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSyllabusSheet(true);
                      }}
                    >
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <span className="text-[10px]">Syllabus</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-col h-auto py-3 gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewReport(pupil);
                      }}
                    >
                      <Car className="h-5 w-5 text-emerald-500" />
                      <span className="text-[10px]">Report</span>
                    </Button>
                    {onRecordTestResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-3 gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecordTestResult(pupil, false);
                        }}
                      >
                        <Award className="h-5 w-5 text-blue-500" />
                        <span className="text-[10px]">Test</span>
                      </Button>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="gap-2">
                          {(() => {
                            const StatusIcon = statusConfig[currentStatus].icon;
                            return <StatusIcon className="h-4 w-4" />;
                          })()}
                          {statusConfig[currentStatus].label}
                          {changingStatus && <Clock className="h-3 w-3 animate-spin" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background z-50" onClick={(e) => e.stopPropagation()}>
                        {(Object.keys(statusConfig) as PupilStatus[]).map((status) => {
                          const config = statusConfig[status];
                          const Icon = config.icon;
                          return (
                            <DropdownMenuItem
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(status);
                              }}
                              className={status === currentStatus ? "bg-muted" : ""}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {config.label}
                              {status === currentStatus && <Check className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* T&Cs */}
                  {onViewTerms && (
                    <Button
                      variant={hasSignedTerms ? "outline" : "default"}
                      size="sm"
                      className={cn("w-full", hasSignedTerms && "border-emerald-500 text-emerald-600")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTerms(pupil);
                      }}
                    >
                      {hasSignedTerms ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          T&Cs Signed
                        </>
                      ) : (
                        <>
                          <FileSignature className="h-4 w-4 mr-2" />
                          Sign T&Cs
                        </>
                      )}
                    </Button>
                  )}

                  {/* Edit/Delete */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(pupil);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pupil);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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
