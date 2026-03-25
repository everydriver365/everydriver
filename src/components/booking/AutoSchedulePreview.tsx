import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, Clock, RefreshCw, Check } from "lucide-react";
import { findOptimalSlots, formatSlotForDisplay } from "@/utils/autoScheduler";
import { format } from "date-fns";

interface SlotCandidate {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  score: number;
}

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
}

interface AutoSchedulePreviewProps {
  instructorId: string;
  totalHours: number;
  lessonLength: number;
  courseType?: 'intensive' | 'semi-intensive' | 'weekly';
  preferredTimes: string[];
  preferredDays: string[];
  onSlotsConfirmed: (slots: SelectedSlot[]) => void;
  brandColour?: string;
}

export function AutoSchedulePreview({
  instructorId,
  totalHours,
  lessonLength,
  courseType = 'weekly',
  preferredTimes,
  preferredDays,
  onSlotsConfirmed,
  brandColour,
}: AutoSchedulePreviewProps) {
  const [loading, setLoading] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<SlotCandidate[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch instructor's earliest slot preference
      const { data: instrData } = await supabase
        .from("instructors")
        .select("prefer_earliest_slot")
        .eq("id", instructorId)
        .single();
      
      const slots = await findOptimalSlots({
        instructorId,
        totalHours,
        lessonLength,
        preferredTimes,
        preferredDays,
        courseType,
        startFromDate: new Date(),
        preferEarliestSlot: (instrData as any)?.prefer_earliest_slot ?? false,
      });

      if (slots.length === 0) {
        setError("No available slots found matching your preferences. Please try different times or days.");
      } else {
        setSuggestedSlots(slots);
      }
    } catch (err) {
      console.error("Error finding slots:", err);
      setError("Failed to find available slots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preferredTimes.length > 0 || preferredDays.length > 0) {
      findSlots();
    }
  }, [instructorId, totalHours, preferredTimes.join('|'), preferredDays.join('|')]);

  const handleConfirm = () => {
    if (!isComplete || confirmed) return;
    const convertedSlots: SelectedSlot[] = suggestedSlots.map(slot => ({
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
    }));
    setConfirmed(true);
    onSlotsConfirmed(convertedSlots);
  };

  const scheduledHours = suggestedSlots.reduce((acc, slot) => acc + slot.duration / 60, 0);
  const isComplete = scheduledHours >= totalHours;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Finding the best times for your lessons...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={findSlots}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (suggestedSlots.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground">
            Select your preferred times and days above to find available slots
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Suggested Schedule
          </CardTitle>
          <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-emerald-500" : ""}>
            {scheduledHours}/{totalHours}h
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Slot list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {suggestedSlots.map((slot, index) => (
            <div
              key={`${slot.date}-${slot.startTime}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                  style={{ backgroundColor: brandColour || 'hsl(var(--primary))' }}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {format(new Date(slot.date), 'EEE, MMM d')}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {slot.startTime} - {slot.endTime}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {slot.duration >= 60 ? `${slot.duration / 60}h` : `${slot.duration}m`}
              </Badge>
            </div>
          ))}
        </div>

        {!isComplete && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            Only {scheduledHours} of {totalHours} hours could be scheduled with your preferences.
            Consider adding more preferred times or days.
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={findSlots} 
            className="flex-1"
            disabled={confirmed}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Find Different Times
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1"
            disabled={!isComplete || confirmed}
            style={isComplete && !confirmed ? { backgroundColor: brandColour } : {}}
          >
            {confirmed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmed
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Confirm Schedule
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
