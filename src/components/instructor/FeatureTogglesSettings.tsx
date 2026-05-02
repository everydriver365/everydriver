import { useState, useEffect } from "react";
import { Loader2, Sparkles, Radio } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
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
  { key: "instant_bank_pay_enabled", label: "Instant Bank Pay", description: "Offer one-off bank payments at checkout via GoCardless (lower fees than card)", defaultValue: false },
  { key: "direct_debit_enabled", label: "Direct Debit for Pupils", description: "Collect weekly lesson payments via Direct Debit from recurring pupils", defaultValue: false },
  { key: "prefer_earliest_slot", label: "Earliest Slot Priority", description: "Offer pupils the earliest available slot first to keep your day compact and avoid gaps", defaultValue: false },
  { key: "auto_start_tracker", label: "Auto-track every lesson", description: "When you tap Start lesson, the live tracker opens automatically and the trip is recorded into the pupil's records — no extra tap required.", defaultValue: false },
];

const aiFeatureToggles: FeatureToggle[] = [
  { key: "ai_lesson_plans_enabled", label: "AI Lesson Plans", description: "Auto-generate lesson plans from your notes and voice feedback", defaultValue: true },
  { key: "ai_test_readiness_enabled", label: "Test Readiness Predictor", description: "AI predicts when a pupil is ready for their test based on progress data", defaultValue: true },
  { key: "ai_pricing_suggestions_enabled", label: "Smart Pricing", description: "Get AI pricing suggestions based on local demand and your schedule", defaultValue: true },
  { key: "ai_cancellation_risk_enabled", label: "Cancellation Risk Alerts", description: "Get warned when a pupil is likely to cancel based on patterns", defaultValue: true },
  { key: "ai_parent_reports_enabled", label: "AI Parent Reports", description: "Automatically generate weekly progress summaries for parents", defaultValue: true },
  { key: "ai_waitlist_filling_enabled", label: "Smart Waitlist Filling", description: "Auto-offer cancelled slots to the best-matched replacement pupil", defaultValue: true },
  { key: "ai_auto_invoices_enabled", label: "Auto-Invoice Generation", description: "Automatically create and send invoices after lessons", defaultValue: true },
  { key: "ai_weekly_report_enabled", label: "AI Weekly Report", description: "Receive an AI-generated summary of your week's performance", defaultValue: true },
  { key: "ai_morning_briefing_enabled", label: "Morning Briefing", description: "Get a daily AI briefing with schedule highlights and reminders", defaultValue: true },
  { key: "ai_receptionist_enabled", label: "AI Receptionist", description: "AI handles enquiry responses and initial pupil communications", defaultValue: true },
  { key: "ai_re_engagement_enabled", label: "Auto Re-engagement", description: "Automatically send SMS to inactive pupils to win them back", defaultValue: true },
];

interface FeatureTogglesSettingsProps {
  instructorId: string;
}

function ToggleList({ toggles, instructorId }: { toggles: FeatureToggle[]; instructorId: string }) {
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
    <>
      {toggles.map((toggle, index) => {
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
            {index < toggles.length - 1 && (
              <div className="ml-1 border-b border-border/40" />
            )}
          </div>
        );
      })}
    </>
  );
}

function TrackingProviderSelector({ instructorId }: { instructorId: string }) {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const [providerCount, setProviderCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("gps_devices")
      .select("tracking_provider")
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) {
          const unique = new Set(data.map((d) => d.tracking_provider));
          setProviderCount(unique.size);
        }
      });
  }, [instructorId]);

  if (providerCount < 2) return null;

  const currentValue = (instructor as any)?.preferred_tracking_provider || "auto";

  const handleChange = async (value: string) => {
    setSaving(true);
    try {
      const dbValue = value === "auto" ? null : value;
      const { error } = await supabase
        .from("instructors")
        .update({ preferred_tracking_provider: dbValue } as any)
        .eq("id", instructorId);
      if (error) throw error;
      await refreshInstructor();
      toast({ title: "Tracking provider updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update provider", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-4 mb-2 border-b border-border/40">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Radio className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Tracking Provider</span>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <div className="px-1">
        <IOSSegmentedControl
          segments={[
            { value: "auto", label: "Auto" },
            { value: "radius", label: "Radius" },
          ]}
          value={currentValue}
          onChange={handleChange}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Choose which GPS provider powers your live tracking and telematics
        </p>
      </div>
    </div>
  );
}

export function FeatureTogglesSettings({ instructorId }: FeatureTogglesSettingsProps) {
  return (
    <div className="space-y-6">
      <TrackingProviderSelector instructorId={instructorId} />
      <ToggleList toggles={featureToggles} instructorId={instructorId} />
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI & Automation</span>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-1">
          <ToggleList toggles={aiFeatureToggles} instructorId={instructorId} />
        </div>
      </div>
    </div>
  );
}
