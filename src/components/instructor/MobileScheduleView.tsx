import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, isToday, isTomorrow, parseISO } from "date-fns";
import { 
  Calendar, 
  Navigation, 
  Phone, 
  MessageSquare, 
  Clock, 
  X, 
  CalendarClock,
  MapPin,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Loader2,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

interface MobileScheduleViewProps {
  instructorId: string;
}

export function MobileScheduleView({ instructorId }: MobileScheduleViewProps) {
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchLessons();
  }, [instructorId, selectedDate]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          lesson_date,
          start_time,
          duration_minutes,
          lesson_type,
          pickup_location,
          pickup_postcode,
          status,
          payment_status,
          prepaid_hours_used,
          amount_due,
          notes,
          pupil:pupils(
            id,
            name,
            phone,
            address,
            postcode,
            prepaid_hours,
            account_balance
          )
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", dateStr)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      // Transform data to handle the joined pupil data
      const transformedData = (data || []).map((lesson: any) => ({
        ...lesson,
        pupil: lesson.pupil || {
          id: "",
          name: "Unknown",
          phone: null,
          address: "",
          postcode: "",
          prepaid_hours: 0,
          account_balance: 0
        }
      }));
      
      setLessons(transformedData);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (lesson: ScheduledLesson) => {
    const { payment_status, prepaid_hours_used, amount_due, pupil } = lesson;
    
    if (payment_status === "paid") {
      return <Badge className="bg-success text-success-foreground">Paid</Badge>;
    }
    
    if (prepaid_hours_used > 0 || (pupil?.prepaid_hours && pupil.prepaid_hours > 0)) {
      const hoursAvailable = pupil?.prepaid_hours || 0;
      return (
        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
          {hoursAvailable}h Credit
        </Badge>
      );
    }
    
    if (pupil?.account_balance && pupil.account_balance > 0) {
      return (
        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
          £{pupil.account_balance.toFixed(0)} Credit
        </Badge>
      );
    }
    
    return <Badge variant="destructive">Not Paid</Badge>;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const handleNavigate = (address: string, postcode: string) => {
    const query = encodeURIComponent(`${address}, ${postcode}`);
    // Use geo: URI for native map apps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `maps://maps.apple.com/?daddr=${query}`
      : `geo:0,0?q=${query}`;
    
    // Fallback to Google Maps
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    
    window.location.href = url;
    // Fallback after short delay
    setTimeout(() => {
      window.open(fallbackUrl, "_blank");
    }, 500);
  };

  const handleCall = (phone: string | null) => {
    if (!phone) {
      toast({
        title: "No phone number",
        description: "This pupil doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleText = (phone: string | null) => {
    if (!phone) {
      toast({
        title: "No phone number",
        description: "This pupil doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `sms:${phone}`;
  };

  const handleOnWay = async (lesson: ScheduledLesson, delayMinutes?: number) => {
    if (!lesson.pupil?.phone) {
      toast({
        title: "No phone number",
        description: "This pupil doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(lesson.id);
    
    const firstName = (lesson.pupil?.name || "").split(" ")[0];
    let message: string;
    
    if (delayMinutes === -1) {
      message = `Hi ${firstName}, I'll call you as soon as I can!`;
    } else if (delayMinutes === -2) {
      message = `Hi ${firstName}, I'm on my way to you now!`;
    } else if (delayMinutes) {
      message = `Hi ${firstName}, I'm on my way! I'll be with you in about ${delayMinutes} minutes.`;
    } else {
      message = `Hi ${firstName}, I'm on my way to you!`;
    }
    
    // Open SMS with pre-filled message
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${lesson.pupil.phone}?body=${encodedMessage}`;
    
    setSendingMessage(null);
  };

  const handleCancel = async () => {
    if (!selectedLesson) return;
    
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({ status: "cancelled" })
        .eq("id", selectedLesson.id);

      if (error) throw error;
      
      toast({
        title: "Lesson cancelled",
        description: "The lesson has been cancelled",
      });
      
      setCancelDialogOpen(false);
      setSelectedLesson(null);
      fetchLessons();
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      toast({
        title: "Error",
        description: "Failed to cancel lesson",
        variant: "destructive",
      });
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return "Today";
    if (isTomorrow(selectedDate)) return "Tomorrow";
    return format(selectedDate, "EEEE, MMM d");
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card rounded-none p-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-semibold text-lg">{getDateLabel()}</div>
          <div className="text-xs text-muted-foreground">
            {format(selectedDate, "d MMMM yyyy")}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextDay}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No lessons scheduled</p>
            <p className="text-sm text-muted-foreground/70">
              {isToday(selectedDate) ? "Enjoy your day off!" : `No lessons on ${format(selectedDate, "EEEE")}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Time Header */}
                  <div className="bg-primary px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-bold">{formatTime(lesson.start_time)}</span>
                      <span className="text-primary-foreground/70">•</span>
                      <span className="text-sm">{lesson.duration_minutes} mins</span>
                    </div>
                    {getPaymentStatusBadge(lesson)}
                  </div>

                  {/* Lesson Details */}
                  <div className="p-4 space-y-3">
                    {/* Pupil Name & Lesson Type */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{lesson.pupil?.name || "Unknown"}</h3>
                        <p className="text-sm text-muted-foreground">{lesson.lesson_type}</p>
                      </div>
                    </div>

                    {/* Pickup Location */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p>{lesson.pickup_location || lesson.pupil?.address || "No address"}</p>
                        <p className="text-muted-foreground">
                          {lesson.pickup_postcode || lesson.pupil?.postcode || ""}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => handleNavigate(
                          lesson.pickup_location || lesson.pupil?.address || "",
                          lesson.pickup_postcode || lesson.pupil?.postcode || ""
                        )}
                      >
                        <Navigation className="h-4 w-4 text-accent" />
                        <span className="text-xs">Navigate</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => handleCall(lesson.pupil?.phone)}
                      >
                        <Phone className="h-4 w-4 text-success" />
                        <span className="text-xs">Call</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => handleText(lesson.pupil?.phone)}
                      >
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-xs">Text</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-col h-auto py-2 gap-1"
                            disabled={sendingMessage === lesson.id}
                          >
                            {sendingMessage === lesson.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 text-warning" />
                            )}
                            <span className="text-xs">On Way</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => handleOnWay(lesson)}>
                            <Check className="h-4 w-4 mr-2" />
                            On my way!
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOnWay(lesson, 5)}>
                            <Clock className="h-4 w-4 mr-2" />
                            I'll be 5 mins
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOnWay(lesson, 10)}>
                            <Clock className="h-4 w-4 mr-2" />
                            I'll be 10 mins
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOnWay(lesson, 15)}>
                            <Clock className="h-4 w-4 mr-2" />
                            I'll be 15 mins
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOnWay(lesson, 20)}>
                            <Clock className="h-4 w-4 mr-2" />
                            I'll be 20 mins
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOnWay(lesson, 30)}>
                            <Clock className="h-4 w-4 mr-2" />
                            I'll be 30 mins
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOnWay(lesson, -1)}>
                            <Phone className="h-4 w-4 mr-2" />
                            I'll call you ASAP
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOnWay(lesson, -2)}>
                            <Send className="h-4 w-4 mr-2 text-primary" />
                            Send current ETA
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setCancelDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setRescheduleDialogOpen(true);
                        }}
                      >
                        <CalendarClock className="h-4 w-4 mr-1" />
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Lesson
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the lesson with {selectedLesson?.pupil?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Lesson
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Lesson</DialogTitle>
            <DialogDescription>
              Reschedule the lesson with {selectedLesson?.pupil?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>To reschedule, cancel this lesson and create a new booking.</p>
            <p className="text-sm">Your calendar will sync automatically.</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
