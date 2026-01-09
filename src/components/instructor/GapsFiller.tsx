import { useState, useEffect } from "react";
import { Calendar, MessageSquare, Percent, PoundSterling, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, parseISO, startOfDay, isAfter } from "date-fns";

interface GapSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  selected: boolean;
}

interface GapsFillerProps {
  instructorId: string;
}

export function GapsFiller({ instructorId }: GapsFillerProps) {
  const [instructorName, setInstructorName] = useState("");
  const [gaps, setGaps] = useState<GapSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [pupilCount, setPupilCount] = useState(0);

  useEffect(() => {
    fetchInstructorData();
    fetchAvailableGaps();
    fetchPupilCount();
  }, [instructorId]);

  const fetchInstructorData = async () => {
    try {
      const { data } = await supabase
        .from("instructors")
        .select("name")
        .eq("id", instructorId)
        .single();
      
      if (data) setInstructorName(data.name);
    } catch (error) {
      console.error("Error fetching instructor:", error);
    }
  };

  const fetchPupilCount = async () => {
    try {
      const { count } = await supabase
        .from("pupils")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .not("phone", "is", null);
      
      setPupilCount(count || 0);
    } catch (error) {
      console.error("Error fetching pupil count:", error);
    }
  };

  const fetchAvailableGaps = async () => {
    setLoading(true);
    try {
      // Get instructor's working hours
      const { data: workingHours } = await supabase
        .from("instructor_working_hours")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      // Get scheduled lessons for next 14 days
      const today = format(new Date(), "yyyy-MM-dd");
      const twoWeeksLater = format(addDays(new Date(), 14), "yyyy-MM-dd");
      
      const { data: scheduledLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", today)
        .lte("lesson_date", twoWeeksLater)
        .neq("status", "cancelled");

      // Get date overrides
      const { data: overrides } = await supabase
        .from("instructor_date_overrides")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("override_date", today);

      // Calculate gaps
      const calculatedGaps: GapSlot[] = [];
      
      for (let i = 0; i < 14; i++) {
        const currentDate = addDays(startOfDay(new Date()), i);
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dayOfWeek = currentDate.getDay();

        // Check if there's an override for this date
        const override = overrides?.find(o => o.override_date === dateStr);
        
        if (override && !override.is_available) {
          continue; // Instructor marked as unavailable
        }

        // Get working hours for this day
        const dayHours = workingHours?.find(wh => wh.day_of_week === dayOfWeek);
        
        if (!dayHours && !override?.is_available) {
          continue; // No working hours set for this day
        }

        const startHour = override?.start_time || dayHours?.start_time || "09:00";
        const endHour = override?.end_time || dayHours?.end_time || "17:00";

        // Get lessons for this day
        const dayLessons = scheduledLessons?.filter(l => l.lesson_date === dateStr) || [];

        // Find gaps in the schedule (simplified: show 2-hour slots that are free)
        const workStart = parseInt(startHour.split(":")[0]);
        const workEnd = parseInt(endHour.split(":")[0]);

        for (let hour = workStart; hour < workEnd - 1; hour += 2) {
          const slotStart = `${hour.toString().padStart(2, "0")}:00`;
          const slotEnd = `${(hour + 2).toString().padStart(2, "0")}:00`;

          // Check if this slot overlaps with any scheduled lesson
          const hasConflict = dayLessons.some(lesson => {
            const lessonStart = parseInt(lesson.start_time.split(":")[0]);
            const lessonEnd = lessonStart + Math.ceil(lesson.duration_minutes / 60);
            return (hour < lessonEnd && hour + 2 > lessonStart);
          });

          if (!hasConflict) {
            calculatedGaps.push({
              id: `${dateStr}-${slotStart}`,
              date: dateStr,
              startTime: slotStart,
              endTime: slotEnd,
              selected: false,
            });
          }
        }
      }

      setGaps(calculatedGaps.slice(0, 20)); // Limit to 20 slots
    } catch (error) {
      console.error("Error fetching gaps:", error);
      toast.error("Failed to load available slots");
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    setGaps(prev => prev.map(g => 
      g.id === slotId ? { ...g, selected: !g.selected } : g
    ));
  };

  const selectAll = () => {
    setGaps(prev => prev.map(g => ({ ...g, selected: true })));
  };

  const clearAll = () => {
    setGaps(prev => prev.map(g => ({ ...g, selected: false })));
  };

  const selectedSlots = gaps.filter(g => g.selected);

  const sendOffers = async () => {
    if (selectedSlots.length === 0) {
      toast.error("Please select at least one slot");
      return;
    }

    if (pupilCount === 0) {
      toast.error("No pupils with phone numbers to message");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-gap-sms", {
        body: {
          instructorId,
          instructorName,
          slots: selectedSlots.map(s => ({
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          discountType: discountType === "none" ? null : discountType,
          discountValue: discountType === "none" ? null : discountValue,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Sent offers to ${data.sentCount} pupils!`);
        clearAll();
      } else {
        toast.error(data?.message || "Failed to send offers");
      }
    } catch (error) {
      console.error("Error sending offers:", error);
      toast.error("Failed to send SMS offers");
    } finally {
      setSending(false);
    }
  };

  const formatSlotDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "EEE d MMM");
  };

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-purple-500" />
          Fill Your Gaps
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Text all {pupilCount} pupils with phone numbers about available slots
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : gaps.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No gaps found - you're fully booked!</p>
          </div>
        ) : (
          <>
            {/* Slot Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select slots to offer</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {gaps.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                      slot.selected 
                        ? "border-purple-500 bg-purple-500/10" 
                        : "border-border hover:border-purple-500/50"
                    }`}
                  >
                    <Checkbox checked={slot.selected} />
                    <div className="flex-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {formatSlotDate(slot.date)}
                      </Badge>
                      <span className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Options */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium">Add a discount?</Label>
              <RadioGroup 
                value={discountType} 
                onValueChange={(v) => setDiscountType(v as typeof discountType)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="text-sm cursor-pointer">No discount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="text-sm cursor-pointer flex items-center gap-1">
                    <Percent className="h-3 w-3" /> Percentage off
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="text-sm cursor-pointer flex items-center gap-1">
                    <PoundSterling className="h-3 w-3" /> Fixed amount off
                  </Label>
                </div>
              </RadioGroup>

              {discountType !== "none" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-20"
                    min={1}
                    max={discountType === "percentage" ? 50 : 100}
                  />
                  <span className="text-sm text-muted-foreground">
                    {discountType === "percentage" ? "% off" : "£ off"}
                  </span>
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendOffers}
              disabled={sending || selectedSlots.length === 0 || pupilCount === 0}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {sending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send to {pupilCount} Pupils ({selectedSlots.length} slots)
                </>
              )}
            </Button>

            {pupilCount === 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 rounded-lg p-2">
                <AlertCircle className="h-4 w-4" />
                Add phone numbers to your pupils first
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
