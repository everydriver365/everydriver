import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Clock, Bell, BellOff, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PupilWaitlistSignupProps {
  pupilId: string;
  instructorId: string;
}

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const TIMES = [
  { value: "morning", label: "Morning (before 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm - 5pm)" },
  { value: "evening", label: "Evening (after 5pm)" },
];

export function PupilWaitlistSignup({ pupilId, instructorId }: PupilWaitlistSignupProps) {
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [minDuration, setMinDuration] = useState("60");
  const [maxDuration, setMaxDuration] = useState("120");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (pupilId && instructorId) {
      fetchWaitlistStatus();
    }
  }, [pupilId, instructorId]);

  const fetchWaitlistStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_waitlist")
        .select("*")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsOnWaitlist(true);
        setWaitlistId(data.id);
        setSelectedDays(data.preferred_days || []);
        setSelectedTimes(data.preferred_times || []);
        setMinDuration(String(data.min_duration_mins || 60));
        setMaxDuration(String(data.max_duration_mins || 120));
        setNotes(data.notes || "");
      }
    } catch (error) {
      console.error("Error fetching waitlist status:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleJoinWaitlist = async () => {
    if (selectedDays.length === 0 || selectedTimes.length === 0) {
      toast({
        title: "Please select preferences",
        description: "Select at least one day and one time slot",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("lesson_waitlist")
        .insert({
          pupil_id: pupilId,
          instructor_id: instructorId,
          preferred_days: selectedDays,
          preferred_times: selectedTimes,
          min_duration_mins: parseInt(minDuration),
          max_duration_mins: parseInt(maxDuration),
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setIsOnWaitlist(true);
      setWaitlistId(data.id);
      toast({
        title: "Joined waitlist!",
        description: "You'll be notified when matching slots become available",
      });
    } catch (error) {
      console.error("Error joining waitlist:", error);
      toast({
        title: "Error",
        description: "Failed to join waitlist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!waitlistId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("lesson_waitlist")
        .update({
          preferred_days: selectedDays,
          preferred_times: selectedTimes,
          min_duration_mins: parseInt(minDuration),
          max_duration_mins: parseInt(maxDuration),
          notes: notes || null,
        })
        .eq("id", waitlistId);

      if (error) throw error;

      toast({ title: "Preferences updated" });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!waitlistId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("lesson_waitlist")
        .update({ is_active: false })
        .eq("id", waitlistId);

      if (error) throw error;

      setIsOnWaitlist(false);
      setWaitlistId(null);
      setSelectedDays([]);
      setSelectedTimes([]);
      setNotes("");
      toast({ title: "Left waitlist" });
    } catch (error) {
      console.error("Error leaving waitlist:", error);
      toast({
        title: "Error",
        description: "Failed to leave waitlist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isOnWaitlist ? (
            <>
              <Bell className="h-5 w-5 text-primary" />
              Waitlist Preferences
            </>
          ) : (
            <>
              <Clock className="h-5 w-5" />
              Join the Waitlist
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOnWaitlist && (
          <p className="text-sm text-muted-foreground">
            Get notified when lesson slots become available that match your preferences.
          </p>
        )}

        {/* Preferred Days */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Preferred Days
          </Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <label
                key={day.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selectedDays.includes(day.value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Checkbox
                  checked={selectedDays.includes(day.value)}
                  onCheckedChange={() => toggleDay(day.value)}
                  className="sr-only"
                />
                {day.label}
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Times */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Preferred Times
          </Label>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((time) => (
              <label
                key={time.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selectedTimes.includes(time.value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Checkbox
                  checked={selectedTimes.includes(time.value)}
                  onCheckedChange={() => toggleTime(time.value)}
                  className="sr-only"
                />
                {time.label}
              </label>
            ))}
          </div>
        </div>

        {/* Duration Preferences */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Min Duration</Label>
            <Select value={minDuration} onValueChange={setMinDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Max Duration</Label>
            <Select value={maxDuration} onValueChange={setMaxDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Additional Notes (optional)</Label>
          <Textarea
            placeholder="e.g., Only after 3pm on weekdays, prefer morning on weekends..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isOnWaitlist ? (
            <>
              <Button
                onClick={handleUpdatePreferences}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving..." : "Update Preferences"}
              </Button>
              <Button
                variant="outline"
                onClick={handleLeaveWaitlist}
                disabled={saving}
              >
                <BellOff className="mr-2 h-4 w-4" />
                Leave Waitlist
              </Button>
            </>
          ) : (
            <Button
              onClick={handleJoinWaitlist}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Joining..." : "Join Waitlist"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
