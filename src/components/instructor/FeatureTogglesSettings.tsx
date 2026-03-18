import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

interface FeatureToggle {
  key: string;
  label: string;
  description: string;
  defaultValue: boolean;
}

const featureToggles: FeatureToggle[] = [
  { key: "drive_time_alerts_enabled", label: "Drive-Time Alerts", description: "Show travel time warnings between lessons on your daily schedule", defaultValue: false },
  { key: "quotes_enabled", label: "Bookable Quotes", description: "Send branded quotes that pupils can accept & book from a link", defaultValue: false },
  { key: "intake_questions_enabled", label: "Intake Questions", description: "Collect custom info from pupils during booking", defaultValue: false },
  { key: "pricing_rules_enabled", label: "Dynamic Pricing", description: "Adjust lesson price based on time, day, or location", defaultValue: false },
  { key: "pupil_self_booking_enabled", label: "Pupil Self-Booking", description: "Let pupils book available slots directly from their portal", defaultValue: false },
  { key: "broadcast_messaging_enabled", label: "Broadcast Messaging", description: "Send messages to all pupils at once from your inbox", defaultValue: true },
  { key: "lesson_feedback_enabled", label: "Post-Lesson Feedback", description: "Automatically request feedback from pupils after lessons", defaultValue: true },
  { key: "reflective_logs_enabled", label: "Reflective Logs", description: "Let pupils write reflective journal entries in their portal", defaultValue: true },
  { key: "cancellation_analytics_enabled", label: "Cancellation Analytics", description: "Show cancellation trends on the Performance page", defaultValue: true },
  { key: "cash_payments_enabled", label: "Cash Payments", description: "Allow pupils to select 'Pay by Cash' during booking checkout", defaultValue: false },
];

interface FeatureTogglesSettingsProps {
  instructorId: string;
}

export function FeatureTogglesSettings({ instructorId }: FeatureTogglesSettingsProps) {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (key: string, value: boolean) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ [key]: value } as any)
        .eq("id", instructorId);

      if (error) throw error;

      await refreshInstructor();
      toast({ title: value ? "Feature enabled" : "Feature disabled" });
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      {featureToggles.map((toggle, index) => {
        const currentValue = instructor?.[toggle.key as keyof typeof instructor] as boolean | null ?? toggle.defaultValue;
        const isSaving = saving === toggle.key;

        return (
          <div key={toggle.key}>
            <div className="flex items-center justify-between py-3 px-1 gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor={toggle.key} className="text-sm font-medium cursor-pointer">
                  {toggle.label}
                </Label>
                <p className="text-xs text-muted-foreground">{toggle.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                <Switch
                  id={toggle.key}
                  checked={currentValue}
                  onCheckedChange={(v) => handleToggle(toggle.key, v)}
                  disabled={isSaving}
                />
              </div>
            </div>
            {index < featureToggles.length - 1 && (
              <div className="ml-1 border-b border-border/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}
