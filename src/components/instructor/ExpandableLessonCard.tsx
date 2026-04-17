import { useState, useEffect } from "react";
import { UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { 
  Clock, 
  Navigation, 
  Phone, 
  MessageSquare, 
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  CalendarClock,
  Check,
  Loader2,
  Trash2,
  Palette,
  Repeat,
  Zap,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { QuickMessageSheet } from "./QuickMessageSheet";

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_location: string | null;
  pickup_postcode: string | null;
  status: string;
  payment_status: string;
  prepaid_hours_used: number;
  amount_due: number;
  notes: string | null;
  recurrence_rule?: string | null;
  google_event_id?: string | null;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    postcode: string;
    prepaid_hours: number;
    account_balance: number;
  };
}

interface ExpandableLessonCardProps {
  lesson: ScheduledLesson;
  onNavigate: (address: string, postcode: string) => void;
  onCall: (phone: string | null) => void;
  onText: (phone: string | null) => void;
  onOnWay: (lesson: ScheduledLesson, delayMinutes?: number) => void;
  onCancel: (lesson: ScheduledLesson) => void;
  onReschedule: (lesson: ScheduledLesson) => void;
  onNoShow?: (lesson: ScheduledLesson) => void;
  sendingMessage: string | null;
  cardColor?: string;
  onColorChange?: (color: string) => void;
  onDelete?: (lesson: ScheduledLesson) => void;
  renderCustomCollapsed?: React.ReactNode;
}

const colorPresets = [
  { label: "Default", bg: "bg-card", border: "border-border" },
  { label: "Blue", bg: "bg-[#0075c9]/5", border: "border-[#0075c9]/20" },
  { label: "Green", bg: "bg-emerald-50", border: "border-emerald-200" },
  { label: "Amber", bg: "bg-amber-50", border: "border-amber-200" },
  { label: "Purple", bg: "bg-purple-50", border: "border-purple-200" },
  { label: "Pink", bg: "bg-pink-50", border: "border-pink-200" },
  { label: "Teal", bg: "bg-teal-50", border: "border-teal-200" },
  { label: "Rose", bg: "bg-rose-50", border: "border-rose-200" },
];

export function ExpandableLessonCard({
  lesson,
  onNavigate,
  onCall,
  onText,
  onOnWay,
  onCancel,
  onReschedule,
  onNoShow,
  sendingMessage,
  cardColor = "bg-card",
  onColorChange,
  onDelete,
  renderCustomCollapsed
}: ExpandableLessonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [quickMessageOpen, setQuickMessageOpen] = useState(false);
  const [upcomingLessons, setUpcomingLessons] = useState<Array<{ id: string; lesson_date: string; start_time: string; duration_minutes: number }>>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-120, -60], [1, 0]);
  const deleteScale = useTransform(x, [-120, -60], [1, 0.8]);

  // Fetch upcoming lessons for this pupil when expanded
  useEffect(() => {
    if (!isExpanded || !lesson.pupil?.id) return;
    let cancelled = false;
    setLoadingUpcoming(true);
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes")
        .eq("pupil_id", lesson.pupil.id)
        .neq("id", lesson.id)
        .gte("lesson_date", today)
        .in("status", ["scheduled", "confirmed"])
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5);
      if (!cancelled) {
        setUpcomingLessons(data || []);
        setLoadingUpcoming(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isExpanded, lesson.pupil?.id, lesson.id]);

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const displayHour = hour.toString().padStart(2, "0");
    return `${displayHour}:${minutes}`;
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x < -100 && onDelete) {
      onDelete(lesson);
    }
  };

  const getPaymentBadge = () => {
    const { payment_status, prepaid_hours_used, pupil } = lesson;
    
    if (payment_status === "paid") {
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0">Paid</Badge>;
    }
    
    if (prepaid_hours_used > 0 || (pupil?.prepaid_hours && pupil.prepaid_hours > 0)) {
      const hoursAvailable = pupil?.prepaid_hours || 0;
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5 py-0">
          {hoursAvailable}h
        </Badge>
      );
    }
    
    if (pupil?.account_balance && pupil.account_balance > 0) {
      return (
        <Badge className="bg-[#0075c9]/10 text-[#0075c9] border-0 text-[10px] px-1.5 py-0">
          £{pupil.account_balance.toFixed(0)}
        </Badge>
      );
    }
    
    return <Badge className="bg-rose-100 text-rose-700 border-0 text-[10px] px-1.5 py-0">Due</Badge>;
  };

  const pickupAddress = lesson.pickup_location || lesson.pupil?.address || "No address";
  const pickupPostcode = lesson.pickup_postcode || lesson.pupil?.postcode || "";
  
  // Get color preset or default
  const colorPreset = colorPresets.find(c => c.bg === cardColor) || colorPresets[0];
  
  // Check if this is a recurring lesson
  const isRecurring = !!lesson.recurrence_rule;

  // Payment overdue: negative balance and lesson not already paid/prepaid
  const isPaymentOverdue =
    lesson.payment_status !== "paid" &&
    (lesson.pupil?.account_balance ?? 0) < 0;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      {onDelete && (
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-2xl"
          style={{ opacity: deleteOpacity, scale: deleteScale, width: 100 }}
        >
          <Trash2 className="h-6 w-6 text-white" />
        </motion.div>
      )}
      
      <motion.div
        layout
        drag={onDelete ? "x" : false}
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-2xl border overflow-hidden relative",
          colorPreset.bg,
          colorPreset.border,
          isDragging && "cursor-grabbing"
        )}
      >
        {/* Overdue corner ribbon */}
        {isPaymentOverdue && (
          <div
            aria-label="Payment overdue"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 52,
              height: 52,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 6,
            }}
          >
            <div
              style={{
                position: "absolute",
                transform: "rotate(45deg)",
                background: "linear-gradient(135deg, #FF6B6B, #FF3B30)",
                color: "#FFFFFF",
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: 0.3,
                textAlign: "center",
                lineHeight: "14px",
                width: 78,
                top: 9,
                right: -26,
                boxShadow: "0 2px 5px rgba(255,59,48,0.35)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              OVERDUE
            </div>
          </div>
        )}

        {/* Color picker button */}
        {onColorChange && (
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="absolute top-2 right-2 z-10 h-6 w-6 flex items-center justify-center rounded-full bg-background/80 hover:bg-background shadow-sm transition-colors touch-manipulation"
                onClick={(e) => e.stopPropagation()}
              >
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="end">
              <p className="text-xs font-medium text-muted-foreground mb-2">Card Color</p>
              <div className="grid grid-cols-4 gap-1">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.label}
                    className={cn(
                      "h-7 w-full rounded border-2 transition-all",
                      preset.bg,
                      cardColor === preset.bg ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-muted-foreground/30"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onColorChange(preset.bg);
                    }}
                    title={preset.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Main Card - Collapsed View */}
        <button
          onClick={() => !isDragging && setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          {renderCustomCollapsed ? (
            renderCustomCollapsed
          ) : (
            <div className="px-3 py-2 flex gap-3 items-center">
              <span className="text-sm font-bold text-foreground min-w-[44px]">{formatTime(lesson.start_time)}</span>
              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                <h3 className="font-medium text-sm text-foreground truncate">
                  {lesson.pupil?.name || "Unknown"}
                </h3>
                {isRecurring && (
                  <Repeat className="h-3 w-3 text-primary shrink-0" />
                )}
                <span className="text-xs text-muted-foreground shrink-0">{lesson.duration_minutes}m</span>
                {getPaymentBadge()}
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                isExpanded && "rotate-180"
              )} />
            </div>
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border/50"
            >
              <div className="p-3 space-y-3">
                {/* Full Address */}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{pickupAddress}</p>
                    <p className="text-xs text-muted-foreground">{pickupPostcode}</p>
                  </div>
                </div>

                {/* Action Buttons - Compact Grid with Quick Message */}
                <div className="grid grid-cols-5 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(pickupAddress, pickupPostcode);
                    }}
                  >
                    <Navigation className="h-4 w-4 text-[#0075c9]" />
                    Nav
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCall(lesson.pupil?.phone);
                    }}
                  >
                    <Phone className="h-4 w-4 text-emerald-500" />
                    Call
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickMessageOpen(true);
                    }}
                  >
                    <Zap className="h-4 w-4 text-amber-500" />
                    Quick
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onText(lesson.pupil?.phone);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Text
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1 text-[10px]"
                        disabled={sendingMessage === lesson.id}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sendingMessage === lesson.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-amber-500" />
                        )}
                        On Way
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => onOnWay(lesson)}>
                        <Check className="h-4 w-4 mr-2" />
                        On my way!
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 5)}>
                        <Clock className="h-4 w-4 mr-2" />
                        I'll be 5 mins
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 10)}>
                        <Clock className="h-4 w-4 mr-2" />
                        I'll be 10 mins
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 15)}>
                        <Clock className="h-4 w-4 mr-2" />
                        I'll be 15 mins
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 20)}>
                        <Clock className="h-4 w-4 mr-2" />
                        I'll be 20 mins
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 30)}>
                        <Clock className="h-4 w-4 mr-2" />
                        I'll be 30 mins
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onOnWay(lesson, -1)}>
                        <Phone className="h-4 w-4 mr-2" />
                        I'll call you ASAP
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, -2)}>
                        <Send className="h-4 w-4 mr-2 text-primary" />
                        Send current ETA
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(lesson);
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  {onNoShow && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNoShow(lesson);
                      }}
                    >
                      <UserX className="h-3.5 w-3.5 mr-1" />
                      No Show
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReschedule(lesson);
                    }}
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-1" />
                    Reschedule
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Message Sheet */}
      <QuickMessageSheet
        open={quickMessageOpen}
        onOpenChange={setQuickMessageOpen}
        pupilName={lesson.pupil?.name || "Pupil"}
        pupilPhone={lesson.pupil?.phone || null}
      />
    </div>
  );
}
