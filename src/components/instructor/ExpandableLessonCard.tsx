import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

export function ExpandableLessonCard({
  lesson,
  onNavigate,
  onCall,
  onText,
  onOnWay,
  onCancel,
  onReschedule,
  sendingMessage
}: ExpandableLessonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const displayHour = hour.toString().padStart(2, "0");
    return `${displayHour}:${minutes}`;
  };

  const getPaymentBadge = () => {
    const { payment_status, prepaid_hours_used, pupil } = lesson;
    
    if (payment_status === "paid") {
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Paid</Badge>;
    }
    
    if (prepaid_hours_used > 0 || (pupil?.prepaid_hours && pupil.prepaid_hours > 0)) {
      const hoursAvailable = pupil?.prepaid_hours || 0;
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
          {hoursAvailable}h Credit
        </Badge>
      );
    }
    
    if (pupil?.account_balance && pupil.account_balance > 0) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
          £{pupil.account_balance.toFixed(0)} Credit
        </Badge>
      );
    }
    
    return <Badge className="bg-rose-100 text-rose-700 border-0 text-xs">Due</Badge>;
  };

  const pickupAddress = lesson.pickup_location || lesson.pupil?.address || "No address";
  const pickupPostcode = lesson.pickup_postcode || lesson.pupil?.postcode || "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
    >
      {/* Main Card - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 flex gap-4"
      >
        {/* Time Column */}
        <div className="flex flex-col items-center justify-start min-w-[60px] border-r border-border pr-4">
          <span className="text-2xl font-bold text-foreground">{formatTime(lesson.start_time)}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{lesson.duration_minutes} min</span>
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {lesson.pupil?.name || "Unknown"}
            </h3>
            {getPaymentBadge()}
          </div>
          
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
            {lesson.lesson_type}
          </p>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="text-primary">£</span>
            <span>• {pickupAddress.length > 30 ? pickupAddress.substring(0, 30) + "..." : pickupAddress}</span>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="flex items-center self-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
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
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Full Address */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground">{pickupAddress}</p>
                  <p className="text-muted-foreground">{pickupPostcode}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-3 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(pickupAddress, pickupPostcode);
                  }}
                >
                  <Navigation className="h-5 w-5 text-blue-500" />
                  <span className="text-xs">Navigate</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-3 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCall(lesson.pupil?.phone);
                  }}
                >
                  <Phone className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs">Call</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-3 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onText(lesson.pupil?.phone);
                  }}
                >
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="text-xs">Text</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-col h-auto py-3 gap-1.5"
                      disabled={sendingMessage === lesson.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sendingMessage === lesson.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="text-xs">On Way</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onOnWay(lesson)}>
                      <Check className="h-4 w-4 mr-2" />
                      On my way!
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOnWay(lesson, 5)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Running 5 mins late
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOnWay(lesson, 10)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Running 10 mins late
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOnWay(lesson, 15)}>
                      <Clock className="h-4 w-4 mr-2" />
                      Running 15 mins late
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(lesson);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReschedule(lesson);
                  }}
                >
                  <CalendarClock className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
