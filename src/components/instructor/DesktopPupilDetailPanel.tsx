import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone, Mail, MapPin, Navigation, Calendar, GraduationCap,
  FileText, ExternalLink, MessageSquare, Star, Send, Check, X,
  FileSignature, CheckCircle2, Award, ClipboardList, Car, Route,
  PoundSterling, QrCode, Edit, Trash2, History, UserCheck, UserX,
  Pause, XCircle, Clock, BookOpen, AlertCircle, ChevronDown, Share2,
} from "lucide-react";
import { InlineEditField } from "@/components/ui/InlineEditField";
import { SharePupilDetailsDialog } from "@/components/instructor/SharePupilDetailsDialog";
import { PupilTrackingHistory } from "@/components/instructor/PupilTrackingHistory";
import { PupilPaymentHistory } from "@/components/instructor/PupilPaymentHistory";
import { PupilCreditBreakdown } from "@/components/instructor/PupilCreditBreakdown";
import { RecordPaymentModal } from "@/components/instructor/RecordPaymentModal";
import { PaymentQRModal } from "@/components/instructor/PaymentQRModal";
import { SendPaymentReminderButton } from "@/components/instructor/SendPaymentReminderButton";
import { SendSigningLinkButton } from "@/components/instructor/SendSigningLinkButton";
import { DrivingSyllabus } from "@/components/instructor/DrivingSyllabus";
import { LessonNotesTemplates } from "@/components/instructor/LessonNotesTemplates";
import { EmergencyContactEditor } from "@/components/instructor/EmergencyContactEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────
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
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
}

type PupilStatus = 'active' | 'passed' | 'inactive' | 'on_hold' | 'cancelled';

const statusConfig: Record<PupilStatus, { label: string; color: string; icon: React.ComponentType<any> }> = {
  active: { label: 'Active', color: 'bg-emerald-500', icon: UserCheck },
  passed: { label: 'Passed', color: 'bg-primary', icon: GraduationCap },
  inactive: { label: 'Inactive', color: 'bg-muted-foreground', icon: UserX },
  on_hold: { label: 'On Hold', color: 'bg-amber-500', icon: Pause },
  cancelled: { label: 'Cancelled', color: 'bg-destructive', icon: XCircle },
};

const courseTypeLabels: Record<string, string> = {
  intensive: "Intensive",
  "semi-intensive": "Semi-Intensive",
  weekly: "Weekly",
  refresher: "Refresher",
  "pass-plus": "Pass Plus",
  motorway: "Motorway",
  other: "Custom",
};

interface TimelineEvent {
  id: string;
  type: 'lesson' | 'payment' | 'feedback' | 'test' | 'warning';
  date: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  extra?: React.ReactNode;
}

interface DesktopPupilDetailPanelProps {
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
  onClose: () => void;
}

// ─── Collapsible Section ───────────────────────────────
function CollapsibleSection({ title, icon, open, onToggle, badge, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────
function QuickAction({ icon: Icon, label, color, onClick, disabled }: {
  icon: any; label: string; color: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
      <div className={cn("h-11 w-11 rounded-full flex items-center justify-center", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────
export function DesktopPupilDetailPanel({
  pupil, onEdit, onDelete, onViewHistory, onViewReport, onViewTerms,
  onStartChat, onRecordTestResult, onViewTestHistory, onStatusChange,
  hasSignedTerms, instructorId, instructorName, isTracking = false,
  paymentQrUrl, commissionPayer, onClose,
}: DesktopPupilDetailPanelProps) {
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [paymentRefreshTrigger, setPaymentRefreshTrigger] = useState(0);
  const [showSyllabusSheet, setShowSyllabusSheet] = useState(false);
  
  // Feedback state
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [availableLessons, setAvailableLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [availableTrackingSessions, setAvailableTrackingSessions] = useState<any[]>([]);
  const [selectedTrackingSessionId, setSelectedTrackingSessionId] = useState("");
  
  const [testStats, setTestStats] = useState({ realTests: 0, mockTests: 0 });

  const currentStatus = (pupil.status || 'active') as PupilStatus;
  const hasDebt = (pupil.account_balance || 0) < 0;
  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Inline edit save helper
  const saveField = async (field: string, value: string | null) => {
    const { error } = await supabase.from("pupils").update({ [field]: value }).eq("id", pupil.id);
    if (error) { toast.error("Failed to save"); throw error; }
    toast.success("Updated");
    queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
  };

  // Fetch timeline data
  useEffect(() => {
    fetchTimelineData();
    fetchTestStats();
  }, [pupil.id]);

  useEffect(() => {
    if (isAddingFeedback) {
      fetchAvailableLessons();
      fetchAvailableTrackingSessions();
    }
  }, [isAddingFeedback, pupil.id]);

  const fetchTimelineData = async () => {
    setLoadingTimeline(true);
    try {
      const [lessonsRes, feedbackRes, testsRes] = await Promise.all([
        supabase.from("scheduled_lessons").select("id, lesson_date, start_time, duration_minutes, lesson_type, pickup_postcode")
          .eq("pupil_id", pupil.id).order("lesson_date", { ascending: false }).limit(20),
        supabase.from("lesson_history").select("id, lesson_date, notes, rating, duration_minutes")
          .eq("pupil_id", pupil.id).order("lesson_date", { ascending: false }).limit(10),
        supabase.from("driving_test_results").select("id, test_date, result, is_mock, total_minor_faults, total_serious_faults")
          .eq("pupil_id", pupil.id).order("test_date", { ascending: false }).limit(10),
      ]);

      // Fetch payments separately due to type issues
      const paymentsRes = await supabase.from("payment_history").select("id, amount, payment_method, recorded_at, notes")
        .eq("pupil_id", pupil.id).order("recorded_at", { ascending: false }).limit(15);

      const events: TimelineEvent[] = [];

      // Payment due warning
      if (hasDebt && pupil.balance_due_date) {
        const dueDate = new Date(pupil.balance_due_date);
        const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        events.push({
          id: 'payment-warning',
          type: 'warning',
          date: pupil.balance_due_date,
          title: `£${Math.abs(pupil.account_balance || 0)} outstanding`,
          subtitle: daysLeft < 0 ? 'OVERDUE' : `${daysLeft} days until due`,
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
          color: "bg-amber-100 dark:bg-amber-900/30",
        });
      }

      lessonsRes.data?.forEach(l => {
        events.push({
          id: `lesson-${l.id}`,
          type: 'lesson',
          date: l.lesson_date,
          title: `${l.duration_minutes / 60}hr — ${l.lesson_type || 'Lesson'}`,
          subtitle: l.pickup_postcode ? `From ${l.pickup_postcode}` : undefined,
          icon: <Calendar className="h-4 w-4 text-primary" />,
          color: "bg-primary/10",
        });
      });

      paymentsRes.data?.forEach(p => {
        events.push({
          id: `payment-${p.id}`,
          type: 'payment',
          date: p.recorded_at,
          title: `£${Math.abs(p.amount).toFixed(2)} received`,
          subtitle: p.payment_method || 'Payment',
          icon: <PoundSterling className="h-4 w-4 text-emerald-600" />,
          color: "bg-emerald-50 dark:bg-emerald-900/20",
        });
      });

      feedbackRes.data?.forEach(f => {
        if (f.notes) {
          events.push({
            id: `feedback-${f.id}`,
            type: 'feedback',
            date: f.lesson_date,
            title: f.notes,
            icon: <Star className="h-4 w-4 text-amber-500" />,
            color: "bg-amber-50 dark:bg-amber-900/20",
            extra: f.rating ? (
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={cn("h-3 w-3", s <= f.rating! ? "fill-amber-400 text-amber-400" : "text-muted")} />
                ))}
              </div>
            ) : null,
          });
        }
      });

      testsRes.data?.forEach(t => {
        events.push({
          id: `test-${t.id}`,
          type: 'test',
          date: t.test_date,
          title: `${t.is_mock ? 'Mock' : 'Driving'} Test — ${t.result === 'pass' ? 'Pass' : 'Fail'}`,
          subtitle: `${t.total_minor_faults}m · ${t.total_serious_faults}s`,
          icon: <ClipboardList className={cn("h-4 w-4", t.result === 'pass' ? "text-emerald-500" : "text-rose-500")} />,
          color: t.result === 'pass' ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20",
        });
      });

      // Sort by date descending, keep warnings at top
      events.sort((a, b) => {
        if (a.type === 'warning') return -1;
        if (b.type === 'warning') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setTimelineEvents(events);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const fetchTestStats = async () => {
    const { data } = await supabase.from("driving_test_results").select("id, is_mock")
      .eq("pupil_id", pupil.id);
    if (data) {
      setTestStats({
        realTests: data.filter(t => !t.is_mock).length,
        mockTests: data.filter(t => t.is_mock).length,
      });
    }
  };

  const fetchAvailableLessons = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data } = await supabase.from("scheduled_lessons")
      .select("id, lesson_date, start_time, duration_minutes")
      .eq("pupil_id", pupil.id)
      .gte("lesson_date", format(thirtyDaysAgo, "yyyy-MM-dd"))
      .lte("lesson_date", format(new Date(), "yyyy-MM-dd"))
      .order("lesson_date", { ascending: false });
    if (data) {
      setAvailableLessons(data);
      if (data.length > 0 && !selectedLessonId) setSelectedLessonId(data[0].id);
    }
  };

  const fetchAvailableTrackingSessions = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data } = await supabase.from("lesson_telematics")
      .select("id, started_at, ended_at, total_distance_km")
      .eq("pupil_id", pupil.id)
      .not("ended_at", "is", null)
      .gte("started_at", thirtyDaysAgo.toISOString())
      .order("started_at", { ascending: false });
    if (data) setAvailableTrackingSessions(data);
  };

  const handleSaveFeedback = async () => {
    if (!newFeedback.trim()) { toast.error("Please enter feedback"); return; }
    setSavingFeedback(true);
    try {
      const selectedLesson = availableLessons.find(l => l.id === selectedLessonId);
      let instructorIdToUse = instructorId;
      if (!instructorIdToUse) {
        const { data } = await supabase.from("scheduled_lessons").select("instructor_id")
          .eq("pupil_id", pupil.id).limit(1).maybeSingle();
        instructorIdToUse = data?.instructor_id;
      }
      if (!instructorIdToUse) { toast.error("Unable to find instructor"); return; }
      
      const { error } = await supabase.from("lesson_history").insert({
        pupil_id: pupil.id,
        instructor_id: instructorIdToUse,
        lesson_date: selectedLesson?.lesson_date || format(new Date(), "yyyy-MM-dd"),
        duration_minutes: selectedLesson?.duration_minutes || 0,
        notes: newFeedback,
        rating: newRating > 0 ? newRating : null,
        scheduled_lesson_id: selectedLessonId || null,
        telematics_session_id: selectedTrackingSessionId || null,
      });
      if (error) throw error;
      toast.success("Feedback saved!");
      setIsAddingFeedback(false);
      setNewFeedback("");
      setNewRating(0);
      fetchTimelineData();
    } catch (error) {
      toast.error("Failed to save feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleStatusChange = async (newStatus: PupilStatus) => {
    if (newStatus === currentStatus) return;
    setChangingStatus(true);
    try {
      const { error } = await supabase.from('pupils').update({ status: newStatus }).eq('id', pupil.id);
      if (error) throw error;
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      onStatusChange?.(pupil.id, newStatus);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleNavigate = () => {
    const query = pupil.what3words ? `what3words.com/${pupil.what3words}` : `${pupil.address}, ${pupil.postcode}`;
    window.open(`https://maps.google.com/maps?q=${encodeURIComponent(query)}`, "_blank");
  };

  // Calculate days until test
  const daysUntilTest = pupil.test_date
    ? Math.ceil((new Date(pupil.test_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4 mt-1"
      >
        {/* ─── LEFT: Timeline (1/3) ─── */}
        <div className="col-span-1">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Pupil Journey
              </h4>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-4">
                {loadingTimeline ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
                ) : (
                  <div className="relative border-l-2 border-primary/20 ml-3 space-y-4">
                    {timelineEvents.map(event => (
                      <div key={event.id} className="relative pl-7">
                        <div className={cn("absolute -left-[9px] top-0 h-5 w-5 rounded-full flex items-center justify-center", event.color)}>
                          {event.icon}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                          {event.type === 'warning' ? event.subtitle : format(new Date(event.date), 'EEE, d MMM')}
                        </p>
                        <div className="bg-muted/30 rounded-2xl p-2.5">
                          <p className="text-sm font-medium line-clamp-2">{event.title}</p>
                          {event.subtitle && event.type !== 'warning' && (
                            <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                          )}
                          {event.extra}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* ─── RIGHT: Dashboard Cards (2/3) ─── */}
        <div className="col-span-2 space-y-3">
          {/* Header with actions */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={pupil.profile_image_url || undefined} />
                  <AvatarFallback className="text-white text-base font-bold" style={{ backgroundColor: '#1877F2' }}>
                    {getInitials(pupil.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card", statusConfig[currentStatus].color)} />
              </div>
               <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <InlineEditField
                    value={pupil.name}
                    onSave={(v) => saveField("name", v)}
                    textClassName="font-bold text-lg"
                    placeholder="Pupil name"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="focus:outline-none">
                        <Badge className={cn("text-[10px] cursor-pointer hover:opacity-80", 
                          statusConfig[currentStatus].color === 'bg-emerald-500' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                          statusConfig[currentStatus].color === 'bg-primary' ? 'bg-primary/10 text-primary border-primary/20' :
                          'bg-muted text-muted-foreground')}>
                          {statusConfig[currentStatus].label}
                          {changingStatus && <Clock className="h-3 w-3 animate-spin ml-1" />}
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-background z-50">
                      <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(Object.keys(statusConfig) as PupilStatus[]).map(status => {
                        const config = statusConfig[status];
                        const Icon = config.icon;
                        return (
                          <DropdownMenuItem key={status} onClick={() => handleStatusChange(status)} className={status === currentStatus ? "bg-muted" : ""}>
                            <Icon className="h-4 w-4 mr-2" />{config.label}
                            {status === currentStatus && <Check className="h-4 w-4 ml-auto" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {pupil.course_type && <Badge variant="secondary" className="text-[10px]">{courseTypeLabels[pupil.course_type] || pupil.course_type}</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <InlineEditField
                    value={pupil.address || ""}
                    onSave={(v) => saveField("address", v)}
                    placeholder="Address"
                    textClassName="text-sm text-muted-foreground"
                    emptyText="Add address"
                  />
                  <span className="text-muted-foreground text-sm">,</span>
                  <InlineEditField
                    value={pupil.postcode || ""}
                    onSave={(v) => saveField("postcode", v)}
                    placeholder="Postcode"
                    textClassName="text-sm text-muted-foreground"
                    emptyText="Postcode"
                  />
                  {pupil.what3words && (
                    <button onClick={() => window.open(`https://what3words.com/${pupil.what3words}`, "_blank")} className="text-xs text-primary hover:underline">
                      ///{pupil.what3words}
                    </button>
                  )}
                </div>
                {/* Pickup address */}
                <div className="flex items-center gap-2 mt-1">
                  <Navigation className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <InlineEditField
                    value={pupil.pickup_address || ""}
                    onSave={(v) => saveField("pickup_address", v || null)}
                    placeholder="Pickup address"
                    textClassName="text-sm text-muted-foreground"
                    emptyText="Add pickup address"
                  />
                  <span className="text-muted-foreground text-sm">,</span>
                  <InlineEditField
                    value={pupil.pickup_postcode || ""}
                    onSave={(v) => saveField("pickup_postcode", v || null)}
                    placeholder="Pickup postcode"
                    textClassName="text-sm text-muted-foreground"
                    emptyText="Pickup postcode"
                  />
                </div>
                {/* Inline editable phone & email */}
                <div className="flex items-center gap-4 mt-1">
                  <InlineEditField
                    value={pupil.phone || ""}
                    onSave={(v) => saveField("phone", v)}
                    type="tel"
                    icon={<Phone className="h-3.5 w-3.5 text-muted-foreground" />}
                    placeholder="Phone number"
                    textClassName="text-sm"
                    emptyText="Add phone"
                  />
                  <InlineEditField
                    value={pupil.email || ""}
                    onSave={(v) => saveField("email", v || null)}
                    type="email"
                    icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                    placeholder="Email address"
                    textClassName="text-sm"
                    emptyText="Add email"
                  />
                </div>
              </div>
              <div className="flex gap-1.5">
                <QuickAction icon={Phone} label="Call" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" onClick={() => pupil.phone && window.open(`tel:${pupil.phone}`)} disabled={!pupil.phone} />
                <QuickAction icon={MessageSquare} label="Text" color="bg-[#0075c9]/10 dark:bg-[#0075c9]/20 text-[#0075c9]" onClick={() => pupil.phone && window.open(`sms:${pupil.phone}`)} disabled={!pupil.phone} />
                <QuickAction icon={Navigation} label="Nav" color="bg-purple-100 dark:bg-purple-900/30 text-purple-600" onClick={handleNavigate} />
                <QuickAction icon={Mail} label="Chat" color="bg-primary/10 text-primary" onClick={() => onStartChat?.(pupil)} />
                <QuickAction icon={PoundSterling} label="Pay" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600" onClick={() => setShowRecordPaymentModal(true)} />
                <SharePupilDetailsDialog pupil={pupil} instructorName={instructorName} />
              </div>
            </div>
          </div>

          {/* Stat cards — 4 across */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Lessons</span>
                </div>
                <div className="text-2xl font-bold">{pupil.lessons_completed || 0}</div>
                <Progress value={pupil.progress || 0} className="h-1.5 mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">{pupil.progress || 0}% syllabus</p>
              </CardContent>
            </Card>
            <Card className={cn("border-rose-200 dark:border-rose-800", hasDebt ? "bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20" : "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800")}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <PoundSterling className={cn("h-4 w-4", hasDebt ? "text-rose-600" : "text-emerald-600")} />
                  <span className="text-xs text-muted-foreground">Finance</span>
                </div>
                <div className={cn("text-2xl font-bold", hasDebt ? "text-rose-600" : "text-emerald-600")}>
                  {pupil.account_balance ? (pupil.account_balance < 0 ? `-£${Math.abs(pupil.account_balance).toFixed(0)}` : `£${Number(pupil.account_balance).toFixed(0)}`) : "£0"}
                </div>
                <p className="text-[10px] text-muted-foreground">{pupil.prepaid_hours || 0}h credit</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Test Date</span>
                </div>
                {pupil.test_date ? (
                  <>
                    <div className="text-lg font-bold">{format(new Date(pupil.test_date), 'd MMM')}</div>
                    <p className="text-[10px] text-muted-foreground">{daysUntilTest} days away</p>
                  </>
                ) : (
                  <div className="text-lg font-bold text-muted-foreground">—</div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-[#0075c9]/5 to-[#0075c9]/10 dark:from-[#0075c9]/10 dark:to-[#0075c9]/5 border-[#0075c9]/20 dark:border-[#0075c9]/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-[#0075c9]" />
                  <span className="text-xs text-muted-foreground">Tests</span>
                </div>
                <div className="text-lg font-bold">{testStats.mockTests} mock</div>
                <p className="text-[10px] text-muted-foreground">{testStats.realTests} real test{testStats.realTests !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          </div>

          {/* Collapsible detail sections */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <CollapsibleSection title="Payments" icon={<PoundSterling className="h-4 w-4" />}
              open={expandedSection === "payments"} onToggle={() => toggle("payments")}
              badge={hasDebt ? <Badge variant="destructive" className="text-[10px]">£{Math.abs(pupil.account_balance || 0)} owed</Badge> : undefined}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowRecordPaymentModal(true)}>
                    <PoundSterling className="h-4 w-4 mr-1" /> Record
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowQRModal(true)}>
                    <QrCode className="h-4 w-4 mr-1" /> QR
                  </Button>
                  {instructorId && instructorName && hasDebt && (
                    <SendPaymentReminderButton pupilId={pupil.id} pupilName={pupil.name} pupilPhone={pupil.phone} pupilEmail={pupil.email}
                      instructorId={instructorId} instructorName={instructorName} outstandingAmount={pupil.account_balance || 0} />
                  )}
                </div>
                <PupilPaymentHistory pupilId={pupil.id} pupilName={pupil.name} refreshTrigger={paymentRefreshTrigger} />
                <PupilCreditBreakdown pupilId={pupil.id} prepaidHours={pupil.prepaid_hours || 0} depositPaid={pupil.deposit_paid || 0} paymentType={pupil.payment_type} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Syllabus & Progress" icon={<GraduationCap className="h-4 w-4" />}
              open={expandedSection === "syllabus"} onToggle={() => toggle("syllabus")}>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-bold">{pupil.progress || 0}%</span>
                </div>
                <Progress value={pupil.progress || 0} className="h-2.5" />
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowSyllabusSheet(true)}>
                  <GraduationCap className="h-4 w-4 mr-2" /> Open Full Syllabus
                </Button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Lesson Feedback" icon={<Star className="h-4 w-4" />}
              open={expandedSection === "feedback"} onToggle={() => toggle("feedback")}>
              <div className="space-y-3">
                {!isAddingFeedback ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddingFeedback(true)}>
                    <Send className="h-4 w-4 mr-2" /> Add Feedback
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {availableLessons.length > 0 && (
                      <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                        <SelectTrigger><SelectValue placeholder="Link to lesson..." /></SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {availableLessons.map(l => (
                            <SelectItem key={l.id} value={l.id}>
                              {format(parseISO(l.lesson_date), 'EEE, d MMM')} at {l.start_time?.slice(0, 5)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setNewRating(star === newRating ? 0 : star)} className="p-0.5">
                          <Star className={cn("h-5 w-5", star <= newRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                        </button>
                      ))}
                    </div>
                    <LessonNotesTemplates onSelect={t => setNewFeedback(prev => prev ? `${prev} ${t}` : t)} />
                    <Textarea value={newFeedback} onChange={e => setNewFeedback(e.target.value)} placeholder="How did the lesson go?" className="min-h-[80px]" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setIsAddingFeedback(false); setNewFeedback(""); setNewRating(0); }}>Cancel</Button>
                      <Button size="sm" className="flex-1" onClick={handleSaveFeedback} disabled={savingFeedback}>{savingFeedback ? "Saving..." : "Save"}</Button>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Tests & Results" icon={<Award className="h-4 w-4" />}
              open={expandedSection === "tests"} onToggle={() => toggle("tests")}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {onRecordTestResult && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onRecordTestResult(pupil, false)}>
                        <Award className="h-4 w-4 mr-1" /> Record Test
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onRecordTestResult(pupil, true)}>
                        <ClipboardList className="h-4 w-4 mr-1" /> Record Mock
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Tracking & Routes" icon={<Route className="h-4 w-4" />}
              open={expandedSection === "tracking"} onToggle={() => toggle("tracking")}>
              <PupilTrackingHistory pupilId={pupil.id} pupilName={pupil.name} />
            </CollapsibleSection>

            <CollapsibleSection title="Emergency Contact" icon={<Phone className="h-4 w-4 text-red-500" />}
              open={expandedSection === "emergency"} onToggle={() => toggle("emergency")}>
              <EmergencyContactEditor
                pupilId={pupil.id}
                initialData={{
                  emergency_contact_name: pupil.emergency_contact_name,
                  emergency_contact_phone: pupil.emergency_contact_phone,
                  emergency_contact_relation: pupil.emergency_contact_relation,
                }}
              />
            </CollapsibleSection>
          </div>

          {/* Footer actions */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onViewHistory(pupil)}>
                  <History className="h-4 w-4 mr-1" /> Lesson Log
                </Button>
                <Button variant="outline" size="sm" onClick={() => onViewReport(pupil)}>
                  <Car className="h-4 w-4 mr-1" /> Driving Report
                </Button>
                {onViewTerms && (
                  <Button variant="outline" size="sm"
                    className={hasSignedTerms ? "border-emerald-500 text-emerald-600" : ""}
                    onClick={() => onViewTerms(pupil)}>
                    {hasSignedTerms ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <FileSignature className="h-4 w-4 mr-1" />}
                    {hasSignedTerms ? "T&Cs Signed" : "Sign T&Cs"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(pupil)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(pupil)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
            <div className="bg-muted/30 rounded-2xl p-3 mt-3">
              <InlineEditField
                value={pupil.notes || ""}
                onSave={(v) => saveField("notes", v || null)}
                type="textarea"
                icon={<FileText className="h-4 w-4 text-muted-foreground mt-0.5" />}
                placeholder="Add notes..."
                textClassName="text-sm text-muted-foreground"
                emptyText="Click to add notes"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {instructorId && (
        <RecordPaymentModal open={showRecordPaymentModal} onOpenChange={setShowRecordPaymentModal}
          pupilId={pupil.id} pupilName={pupil.name} instructorId={instructorId}
          currentBalance={pupil.account_balance || 0} onPaymentRecorded={() => { setPaymentRefreshTrigger(p => p + 1); fetchTimelineData(); }} />
      )}
      <PaymentQRModal open={showQRModal} onOpenChange={setShowQRModal} paymentQrUrl={paymentQrUrl}
        commissionPayer={commissionPayer} instructorName={instructorName} />
      <Sheet open={showSyllabusSheet} onOpenChange={setShowSyllabusSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-2xl overflow-y-auto">
          <SheetHeader className="pb-4"><SheetTitle>Driving Syllabus - {pupil.name}</SheetTitle></SheetHeader>
          <DrivingSyllabus pupilId={pupil.id} pupilName={pupil.name} onClose={() => setShowSyllabusSheet(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
