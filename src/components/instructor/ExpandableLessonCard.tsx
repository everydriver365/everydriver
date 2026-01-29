import { useState } from "react";
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
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  sendingMessage: string | null;
  cardColor?: string;
  onColorChange?: (color: string) => void;
  onDelete?: (lesson: ScheduledLesson) => void;
}

const colorPresets = [
  { label: "Default", bg: "bg-card", border: "border-border" },
  { label: "Blue", bg: "bg-blue-50", border: "border-blue-200" },
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
  sendingMessage,
  cardColor = "bg-card",
  onColorChange,
  onDelete
}: ExpandableLessonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-120, -60], [1, 0]);
  const deleteScale = useTransform(x, [-120, -60], [1, 0.8]);

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
        <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">
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

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      {onDelete && (
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-r-xl"
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
          "rounded-xl border overflow-hidden shadow-sm relative",
          colorPreset.bg,
          colorPreset.border,
          isDragging && "cursor-grabbing"
        )}
      >
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

        {/* Main Card - Compact Layout */}
        <button
          onClick={() => !isDragging && setIsExpanded(!isExpanded)}
          className="w-full text-left p-3 flex gap-3"
        >
          {/* Time Column - More Compact */}
          <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-border/50 pr-3">
            <span className="text-lg font-bold text-foreground leading-tight">{formatTime(lesson.start_time)}</span>
            <span className="text-[10px] text-muted-foreground">{lesson.duration_minutes}m</span>
          </div>

          {/* Content Column - Tighter Spacing */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {lesson.pupil?.name || "Unknown"}
              </h3>
              {getPaymentBadge()}
            </div>
            
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {lesson.lesson_type}
            </p>
            
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {pickupAddress.length > 35 ? pickupAddress.substring(0, 35) + "..." : pickupAddress}
            </p>
          </div>

          {/* Expand Indicator */}
          <div className="flex items-center self-center">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
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

                {/* Action Buttons - Compact Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(pickupAddress, pickupPostcode);
                    }}
                  >
                    <Navigation className="h-4 w-4 text-blue-500" />
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onOnWay(lesson)}>
                        <Check className="h-4 w-4 mr-2" />
                        On my way!
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 5)}>
                        <Clock className="h-4 w-4 mr-2" />
                        5 mins late
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 10)}>
                        <Clock className="h-4 w-4 mr-2" />
                        10 mins late
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOnWay(lesson, 15)}>
                        <Clock className="h-4 w-4 mr-2" />
                        15 mins late
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
    </div>
  );
}
