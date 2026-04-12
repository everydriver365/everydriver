import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PupilAvatarUpload } from "@/components/instructor/PupilAvatarUpload";
import { LessonRouteViewer } from "@/components/instructor/LessonRouteViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  MapPin,
  ChevronDown,
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
  MoreVertical,
  UserCheck,
  UserX,
  Pause,
  XCircle,
  Route
} from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { PupilAssignmentsPanel } from "@/components/instructor/PupilAssignmentsPanel";
import { EmergencyContactEditor } from "@/components/instructor/EmergencyContactEditor";
import { PupilTrackingHistory } from "@/components/instructor/PupilTrackingHistory";
import { PupilPaymentHistory } from "@/components/instructor/PupilPaymentHistory";
import { PupilCreditBreakdown } from "@/components/instructor/PupilCreditBreakdown";
import { RecordPaymentModal } from "@/components/instructor/RecordPaymentModal";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { SendPaymentReminderButton } from "@/components/instructor/SendPaymentReminderButton";
import { DrivingSyllabus } from "@/components/instructor/DrivingSyllabus";
import { SyllabusRecommendations } from "@/components/instructor/SyllabusRecommendations";
import { NewPupilChecklist } from "@/components/instructor/NewPupilChecklist";
import { TestDayPrep } from "@/components/instructor/TestDayPrep";
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
import { LessonNotesTemplates } from "@/components/instructor/LessonNotesTemplates";
import { SendSigningLinkButton } from "@/components/instructor/SendSigningLinkButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { haptics } from "@/lib/haptics";

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
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
}

type PupilStatus = 'active' | 'passed' | 'inactive' | 'on_hold' | 'cancelled';

const statusConfig: Record<PupilStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', icon: UserCheck },
  passed: { label: 'Passed', color: 'bg-primary/10 text-primary border-primary/20', icon: GraduationCap },
  inactive: { label: 'Inactive', color: 'bg-muted text-muted-foreground border-border', icon: UserX },
  on_hold: { label: 'On Hold', color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: Pause },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

interface LatestFeedback {
  id: string;
  lesson_date: string;
  notes: string | null;
  rating: number | null;
}

interface ExpandablePupilCardProps {
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

export function ExpandablePupilCard({
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
}: ExpandablePupilCardProps) {
  const [changingStatus, setChangingStatus] = useState(false);
  const currentStatus = (pupil.status || 'active') as PupilStatus;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTrackingHistoryExpanded, setIsTrackingHistoryExpanded] = useState(false);
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
      // Get past and recent scheduled lessons for this pupil
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
        // Auto-select the most recent lesson
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
      // Get tracking sessions for this pupil from the last 30 days
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
      // Get the selected lesson details
      const selectedLesson = availableLessons.find(l => l.id === selectedLessonId);
      const lessonDate = selectedLesson?.lesson_date || format(new Date(), "yyyy-MM-dd");
      const lessonDuration = selectedLesson?.duration_minutes || 0;

      // Get instructor_id from context or scheduled lesson
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
        // Try to get from scheduled lessons
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

      // Create lesson feedback linked to the selected lesson and tracking session
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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const getProgressColor = () => {
    const progress = pupil.progress || 0;
    if (progress >= 100) return "text-emerald-500";
    if (progress >= 75) return "text-primary";
    if (progress >= 50) return "text-amber-500";
    return "text-muted-foreground";
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

  // Swipe state for quick actions
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeThreshold = 80;
  const maxSwipe = 140;
  
  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragX < -swipeThreshold) {
      // Snap to reveal actions
      setDragX(-maxSwipe);
    } else {
      // Snap back
      setDragX(0);
    }
  };
  
  const handleSwipeCall = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (pupil.phone) {
      haptics.medium();
      window.location.href = `tel:${pupil.phone}`;
    } else {
      toast.error("No phone number on file");
    }
    setDragX(0);
  };
  
  const handleSwipeMessage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (pupil.phone) {
      haptics.medium();
      window.location.href = `sms:${pupil.phone}`;
    } else {
      toast.error("No phone number on file");
    }
    setDragX(0);
  };

   return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Main Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow relative z-10"
      >
      {/* Main Card - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 flex gap-4"
      >
        {/* Avatar */}
        <Avatar className="h-12 w-12 shrink-0 border-2 border-border">
          <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
          <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
            {getInitials(pupil.name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <h3 className="font-semibold text-foreground truncate mb-1">
            {pupil.name}
          </h3>
          
          {/* Badges row - separate line */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {/* Status Badge with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="focus:outline-none">
                  <Badge 
                    className={`${statusConfig[currentStatus].color} text-xs gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
                  >
                    {(() => {
                      const StatusIcon = statusConfig[currentStatus].icon;
                      return <StatusIcon className="h-3 w-3" />;
                    })()}
                    {statusConfig[currentStatus].label}
                    {changingStatus && <Clock className="h-3 w-3 animate-spin ml-0.5" />}
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-background z-50" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
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
                      disabled={changingStatus}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                      {status === currentStatus && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currently Tracking Badge */}
            {isTracking && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1 animate-pulse">
                <Radio className="h-3 w-3" />
                Live
              </Badge>
            )}
            {/* Payment Status Badges */}
            {pupil.deposit_forfeited && (
              <Badge variant="destructive" className="text-xs">
                Deposit Lost
              </Badge>
            )}
            {!pupil.deposit_forfeited && pupil.payment_type === "deposit" && (pupil.account_balance || 0) < 0 && (
              (() => {
                const daysUntilDue = pupil.balance_due_date 
                  ? Math.ceil((new Date(pupil.balance_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0;
                
                return (
                  <Badge 
                    variant={isOverdue ? "destructive" : isUrgent ? "default" : "secondary"}
                    className={`text-xs ${isOverdue ? "" : isUrgent ? "bg-amber-500 hover:bg-amber-600" : "bg-amber-100 text-amber-700 border-0"}`}
                  >
                    {isOverdue ? "OVERDUE" : `£${Math.abs(pupil.account_balance || 0)} due`}
                  </Badge>
                );
              })()
            )}
            {pupil.payment_type === "full" && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                Paid
              </Badge>
            )}
            {pupil.payment_type === "deposit" && (pupil.account_balance || 0) >= 0 && !pupil.deposit_forfeited && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                Paid
              </Badge>
            )}
            {pupil.course_type && (
              <Badge variant="secondary" className="text-xs">
                {courseTypeLabels[pupil.course_type] || pupil.course_type}
              </Badge>
            )}
            {(pupil.progress || 0) >= 100 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                Passed
              </Badge>
            )}
            {/* Test Stats Badges */}
            {testStats.mockTests > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <ClipboardList className="h-3 w-3" />
                {testStats.mockTests} mock
              </Badge>
            )}
            {testStats.realTests > 0 && (
              <Badge 
                className={`text-xs gap-1 ${
                  testStats.lastResult === 'pass' 
                    ? 'bg-emerald-100 text-emerald-700 border-0' 
                    : 'bg-destructive/10 text-destructive border-0'
                }`}
              >
                <Award className="h-3 w-3" />
                {testStats.realTests} test{testStats.realTests > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{pupil.postcode}</span>
            {pupil.what3words && (
              <>
                <span className="mx-1">•</span>
                <span className="text-primary truncate">
                  ///{pupil.what3words}
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={pupil.progress || 0} className="h-1.5 flex-1" />
            <span className={`text-xs font-medium ${getProgressColor()}`}>
              {pupil.progress || 0}%
            </span>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="flex items-center self-center shrink-0">
          <ExpandChevron isExpanded={isExpanded} size={20} />
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Quick Actions Strip - Top of expanded view */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartChat?.(pupil);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs">Message</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRecordPaymentModal(true);
                  }}
                >
                  <PoundSterling className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs">Pay</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory(pupil);
                  }}
                >
                  <History className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs">Lessons</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSyllabusSheet(true);
                  }}
                >
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">Progress</span>
                </Button>
              </div>

              {/* Profile Photo Upload */}
              <div className="flex justify-center">
                <PupilAvatarUpload
                  pupilId={pupil.id}
                  pupilName={pupil.name}
                  currentImageUrl={pupil.profile_image_url}
                  onImageUploaded={async (url) => {
                    try {
                      await supabase.from("pupils").update({ profile_image_url: url }).eq("id", pupil.id);
                    } catch {}
                  }}
                  onImageRemoved={async () => {
                    try {
                      await supabase.from("pupils").update({ profile_image_url: null }).eq("id", pupil.id);
                    } catch {}
                  }}
                />
              </div>
              {/* Full Address & What3Words */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-foreground">{pupil.address}</p>
                    <p className="text-muted-foreground">{pupil.postcode}</p>
                  </div>
                </div>
                
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
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-2xl p-2">
                  <div className="text-lg font-bold">{pupil.lessons_completed || 0}</div>
                  <div className="text-xs text-muted-foreground">Lessons</div>
                </div>
                <div className="bg-muted/50 rounded-2xl p-2">
                  <div className="text-lg font-bold">{pupil.prepaid_hours || 0}h</div>
                  <div className="text-xs text-muted-foreground">Credit</div>
                </div>
                <div className={`rounded-2xl p-2 ${(pupil.account_balance || 0) < 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-muted/50'}`}>
                  <div className={`text-lg font-bold ${(pupil.account_balance || 0) < 0 ? 'text-amber-600' : ''}`}>
                    {pupil.account_balance ? (pupil.account_balance < 0 ? `-£${Math.abs(pupil.account_balance)}` : `£${pupil.account_balance}`) : "£0"}
                  </div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                </div>
              </div>

              {/* Deposit Due Date Warning */}
              {pupil.payment_type === "deposit" && (pupil.account_balance || 0) < 0 && pupil.balance_due_date && !pupil.deposit_forfeited && (
                (() => {
                  const dueDate = new Date(pupil.balance_due_date);
                  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntilDue < 0;
                  const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;
                  
                  return (
                    <div className={`flex items-center gap-2 text-sm rounded-2xl p-3 ${
                      isOverdue ? 'bg-destructive/10 text-destructive' : 
                      isUrgent ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' : 
                      'bg-muted/50 text-muted-foreground'
                    }`}>
                      <Clock className="h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-medium">
                          {isOverdue ? 'OVERDUE: ' : isUrgent ? '⚠️ ' : ''}
                          £{Math.abs(pupil.account_balance || 0)} outstanding
                        </span>
                        <span className="ml-1">
                          {isOverdue 
                            ? `(was due ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
                            : `due by ${dueDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
                          }
                        </span>
                        {isUrgent && !isOverdue && (
                          <span className="ml-1 font-medium">({daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left)</span>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Deposit Forfeited Warning */}
              {pupil.deposit_forfeited && (
                <div className="flex items-center gap-2 text-sm bg-destructive/10 text-destructive rounded-2xl p-3">
                  <X className="h-4 w-4 shrink-0" />
                  <span>Booking cancelled - £{pupil.deposit_paid || 0} deposit forfeited due to non-payment</span>
                </div>
              )}

              {/* Test Date if set */}
              {pupil.test_date && (
                <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-2xl p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Test: {new Date(pupil.test_date).toLocaleDateString("en-GB", { 
                    weekday: "short", day: "numeric", month: "short" 
                  })}</span>
                </div>
              )}

              {/* Notes */}
              {pupil.notes && (
                <div className="flex items-start gap-2 text-sm bg-muted/30 rounded-2xl p-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground line-clamp-2">{pupil.notes}</p>
                </div>
              )}

              {/* Lesson Feedback Section */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Lesson Feedback</span>
                  </div>
                  {!isAddingFeedback && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingFeedback(true);
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Add Feedback
                    </Button>
                  )}
                </div>

                {/* Latest Feedback Display */}
                {latestFeedback?.notes && !isAddingFeedback && (
                  <div className="bg-background/60 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(latestFeedback.lesson_date), 'EEE, d MMM')}
                      </span>
                      {latestFeedback.rating && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${star <= latestFeedback.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{latestFeedback.notes}</p>
                    <p className="text-xs text-muted-foreground italic">
                      Visible to pupil & parents
                    </p>
                  </div>
                )}

                {!latestFeedback?.notes && !isAddingFeedback && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No feedback yet. Add your first lesson note!
                  </p>
                )}

                {/* Add Feedback Form */}
                {isAddingFeedback && (
                  <div className="space-y-3">
                    {/* Lesson Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">
                        Link to lesson:
                      </label>
                      <Select
                        value={selectedLessonId}
                        onValueChange={setSelectedLessonId}
                      >
                        <SelectTrigger 
                          className="w-full text-sm h-9"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue placeholder="Select a lesson..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-[1100]">
                          {availableLessons.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No recent lessons found
                            </SelectItem>
                          ) : (
                            availableLessons.map((lesson) => (
                              <SelectItem key={lesson.id} value={lesson.id}>
                                {format(parseISO(lesson.lesson_date), 'EEE, d MMM')} at {lesson.start_time.slice(0, 5)} ({lesson.duration_minutes}min)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tracking Session Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">
                        Link to tracking session (optional):
                      </label>
                      <Select
                        value={selectedTrackingSessionId}
                        onValueChange={setSelectedTrackingSessionId}
                      >
                        <SelectTrigger 
                          className="w-full text-sm h-9"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue placeholder="Select a GPS session..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-[1100]">
                          <SelectItem value="">No tracking session</SelectItem>
                          {availableTrackingSessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {format(new Date(session.started_at), 'EEE, d MMM')} at {format(new Date(session.started_at), 'HH:mm')}
                              {session.total_distance_km ? ` • ${(session.total_distance_km * 0.621371).toFixed(1)} mi` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <LessonNotesTemplates
                        onSelect={(template) => setNewFeedback(prev => prev ? `${prev} ${template}` : template)}
                      />
                    </div>
                    <Textarea
                      placeholder="How did the lesson go? What should they focus on next?"
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      className="min-h-[80px] text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Star Rating */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewRating(star === newRating ? 0 : star);
                            }}
                            className="p-0.5"
                          >
                            <Star
                              className={`h-5 w-5 transition-colors ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingFeedback(false);
                          setNewFeedback("");
                          setNewRating(0);
                          setSelectedLessonId("");
                          setSelectedTrackingSessionId("");
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveFeedback();
                        }}
                        disabled={savingFeedback}
                      >
                        {savingFeedback ? (
                          <Clock className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* New Pupil Checklist */}
              <NewPupilChecklist pupilId={pupil.id} pupilName={pupil.name} />

              {/* Test Day Preparation */}
              <TestDayPrep pupilId={pupil.id} pupilName={pupil.name} />

              {/* Syllabus Recommendations */}
              <SyllabusRecommendations pupilId={pupil.id} />

              {/* Assignments Panel */}
              {instructorId && (
                <PupilAssignmentsPanel 
                  pupilId={pupil.id} 
                  instructorId={instructorId}
                  pupilName={pupil.name}
                />
              )}

              {/* Tracking History - Collapsible Section */}
              <div className="border rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTrackingHistoryExpanded(!isTrackingHistoryExpanded);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Tracking History</span>
                  </div>
                  <ExpandChevron isExpanded={isTrackingHistoryExpanded} />
                </button>
                <AnimatePresence>
                  {isTrackingHistoryExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 space-y-3">
                        <PupilTrackingHistory pupilId={pupil.id} pupilName={pupil.name} />
                        <LessonRouteViewer pupilId={pupil.id} pupilName={pupil.name} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Payment Section */}
              <div className="space-y-3">
                {/* Payment Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRecordPaymentModal(true);
                    }}
                  >
                    <PoundSterling className="h-4 w-4" />
                    <span className="text-xs">Record Payment</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${!paymentQrUrl ? 'text-muted-foreground' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQRModal(true);
                    }}
                  >
                    <QrCode className="h-4 w-4" />
                    <span className="text-xs">QR Code</span>
                  </Button>
                  
                  {instructorId && instructorName && (pupil.account_balance || 0) < 0 && (
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

                {/* Payment History */}
                <PupilPaymentHistory
                  pupilId={pupil.id}
                  pupilName={pupil.name}
                  refreshTrigger={paymentRefreshTrigger}
                />

                {/* Credits from Course Booking */}
                <PupilCreditBreakdown
                  pupilId={pupil.id}
                  prepaidHours={pupil.prepaid_hours || 0}
                  depositPaid={pupil.deposit_paid || 0}
                  paymentType={pupil.payment_type}
                />
              </div>

              {/* Quick Actions - 4 columns */}
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate();
                  }}
                >
                  <Navigation className="h-4 w-4 text-primary" />
                  <span className="text-[10px]">Navigate</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pupil.phone) window.open(`tel:${pupil.phone}`);
                  }}
                  disabled={!pupil.phone}
                >
                  <Phone className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px]">Call</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pupil.phone) window.open(`sms:${pupil.phone}`);
                  }}
                  disabled={!pupil.phone}
                >
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-[10px]">Text</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartChat?.(pupil);
                  }}
                >
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span className="text-[10px]">Chat</span>
                </Button>
              </div>

              {/* History & Reports - 3 columns */}
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory(pupil);
                  }}
                >
                  <History className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px]">Lessons</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSyllabusSheet(true);
                  }}
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-[10px]">Syllabus</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReport(pupil);
                  }}
                >
                  <Car className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px]">Driving</span>
                </Button>
              </div>

              {/* Test Actions - 3 columns */}
              {(onRecordTestResult || onViewTestHistory) && (
                <div className="grid grid-cols-3 gap-1.5">
                  {onRecordTestResult && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecordTestResult(pupil, false);
                        }}
                      >
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-[10px]">Test</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecordTestResult(pupil, true);
                        }}
                      >
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <span className="text-[10px]">Mock</span>
                      </Button>
                    </>
                  )}
                  {onViewTestHistory && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-col h-auto py-2 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTestHistory(pupil);
                      }}
                    >
                      <FileText className="h-4 w-4 text-amber-500" />
                      <span className="text-[10px]">History</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Emergency Contact */}
              <EmergencyContactEditor
                pupilId={pupil.id}
                initialData={{
                  emergency_contact_name: pupil.emergency_contact_name,
                  emergency_contact_phone: pupil.emergency_contact_phone,
                  emergency_contact_relation: pupil.emergency_contact_relation,
                }}
              />

              {/* T&Cs and Signing Actions - full width stacked */}
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border">
                {onViewTerms && (
                  <Button
                    variant={hasSignedTerms ? "outline" : "default"}
                    size="sm"
                    className={`w-full ${hasSignedTerms ? "border-green-500 text-green-600" : ""}`}
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
                {instructorId && instructorName && !hasSignedTerms && (
                  <SendSigningLinkButton
                    pupilId={pupil.id}
                    pupilName={pupil.name}
                    pupilPhone={pupil.phone}
                    instructorId={instructorId}
                    instructorName={instructorName}
                    disabled={hasSignedTerms}
                    className="w-full"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReport(pupil);
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Driving Report
                </Button>
              </div>

              {/* Edit/Delete Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
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
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modals */}
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

      {/* Syllabus Sheet */}
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
      </motion.div>
    </div>
  );
}