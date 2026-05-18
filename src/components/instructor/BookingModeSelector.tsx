import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, UserCog, Mail, Loader2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingModeSelectorProps {
  instructorId: string;
  currentMode: string;
  onModeChange?: (mode: string) => void;
}

export function BookingModeSelector({ instructorId, currentMode, onModeChange }: BookingModeSelectorProps) {
  const [mode, setMode] = useState(currentMode || "pupil_choice");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ booking_mode: mode })
        .eq("id", instructorId);

      if (error) throw error;
      
      toast.success("Booking mode updated");
      onModeChange?.(mode);
    } catch (error) {
      console.error("Error updating booking mode:", error);
      toast.error("Failed to update booking mode");
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = mode !== currentMode;

  return (
    <div className="space-y-4">
      <RadioGroup value={mode} onValueChange={setMode} className="space-y-3">
        <div className={`flex items-start space-x-3 p-3 rounded-2xl border transition-colors ${
          mode === 'pupil_choice' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
        }`}>
          <RadioGroupItem value="pupil_choice" id="pupil_choice" className="mt-1" />
          <Label htmlFor="pupil_choice" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Pupil Choice
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pupils pick their own dates and times from your live availability calendar
            </p>
          </Label>
        </div>

        <div className={`flex items-start space-x-3 p-3 rounded-2xl border transition-colors ${
          mode === 'auto_assign' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
        }`}>
          <RadioGroupItem value="auto_assign" id="auto_assign" className="mt-1" />
          <Label htmlFor="auto_assign" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Auto-Assign
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              System automatically finds optimal slots based on your availability and pupil preferences
            </p>
          </Label>
        </div>

        <div className={`flex items-start space-x-3 p-3 rounded-2xl border transition-colors ${
          mode === 'instructor_assigns' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
        }`}>
          <RadioGroupItem value="instructor_assigns" id="instructor_assigns" className="mt-1" />
          <Label htmlFor="instructor_assigns" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 font-medium">
              <UserCog className="h-4 w-4 text-emerald-500" />
              Instructor Assigns
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pupils submit a booking request, you manually schedule their lessons later
            </p>
          </Label>
        </div>

        <div className={`flex items-start space-x-3 p-3 rounded-2xl border transition-colors ${
          mode === 'enquiry_only' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
        }`}>
          <RadioGroupItem value="enquiry_only" id="enquiry_only" className="mt-1" />
          <Label htmlFor="enquiry_only" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4" style={{ color: '#2B7BC8' }} />
              Enquiry Only
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pupils submit an enquiry — no payment or slot booked. You contact them to arrange lessons.
            </p>
          </Label>
        </div>
      </RadioGroup>

      {hasChanged && (
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      )}
    </div>
  );
}
