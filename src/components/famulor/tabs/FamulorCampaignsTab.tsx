import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FamulorHubScope } from "../FamulorHub";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Clock, UserX, Trophy, PoundSterling, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ACCENT = "#1A52A0";

interface Props {
  scope: FamulorHubScope;
  instructorId?: string;
  instructorIds?: string[];
}

interface Settings {
  reminders_enabled: boolean;
  dormant_winback_enabled: boolean;
  reminder_hours_before: number;
  dormant_days_threshold: number;
  business_hours_only: boolean;
}

const DEFAULTS: Settings = {
  reminders_enabled: true,
  dormant_winback_enabled: false,
  reminder_hours_before: 24,
  dormant_days_threshold: 60,
  business_hours_only: true,
};

const CAMPAIGNS = [
  { key: "reminders_enabled", title: "Lesson reminders", subtitle: "Auto-call pupils ahead of each lesson", icon: Bell, owned: true, status: "live" as const },
  { key: "dormant_winback_enabled", title: "Dormant pupil win-back", subtitle: "Re-engage pupils who've gone quiet", icon: UserX, owned: true, status: "live" as const },
  { key: "test_day_enabled", title: "Test-day pep call", subtitle: "Morning-of confidence call before driving test", icon: Trophy, owned: false, status: "soon" as const },
  { key: "failed_test_enabled", title: "Failed-test follow-up", subtitle: "Friendly call 3 days after a fail to rebook", icon: Trophy, owned: false, status: "soon" as const },
  { key: "payment_due_enabled", title: "Payment-due reminder", subtitle: "AI nudge with payment link via SMS handoff", icon: PoundSterling, owned: false, status: "soon" as const },
];

export function FamulorCampaignsTab({ scope, instructorId }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const readOnly = scope !== "instructor" || !instructorId;

  const inQuietHours = (() => {
    const h = new Date().getHours();
    return h < 8 || h >= 20;
  })();

  useEffect(() => {
    if (!instructorId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("famulor_settings")
        .select("reminders_enabled, dormant_winback_enabled, reminder_hours_before, dormant_days_threshold, business_hours_only")
        .eq("instructor_id", instructorId)
        .maybeSingle();
      if (data) setSettings({ ...DEFAULTS, ...data });
      setLoading(false);
    })();
  }, [instructorId]);

  const toggle = async (key: keyof Settings, value: boolean) => {
    if (readOnly || !instructorId) return;
    setSettings((s) => ({ ...s, [key]: value }));
    setSaving(true);
    const { error } = await supabase
      .from("famulor_settings")
      .upsert({ instructor_id: instructorId, ...settings, [key]: value }, { onConflict: "instructor_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Campaign updated");
  };

  if (loading) {
    return <div className="py-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {inQuietHours && (
        <div className="rounded-[12px] bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-[13px] text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Outside business hours (08:00–20:00 UK). Outbound campaigns are paused until tomorrow morning.
          </div>
        </div>
      )}

      {readOnly && scope !== "instructor" && (
        <div className="rounded-[12px] bg-[#F4F7F6] p-3 text-[12px] text-muted-foreground">
          {scope === "school"
            ? "Read-only view. Each instructor controls their own campaigns from their own dashboard."
            : "Read-only view. Campaign toggles are managed per-instructor."}
        </div>
      )}

      {CAMPAIGNS.map((c) => {
        const enabled = c.owned ? (settings as any)[c.key] : false;
        const Icon = c.icon;
        return (
          <div key={c.key} className="rounded-[12px] bg-white border border-[#E5E5EA] p-3 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "#EDF2FE", color: ACCENT }}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-[14px] font-medium">{c.title}</div>
                {c.status === "soon" && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-[#F4F7F6] px-1.5 py-0.5 rounded">Coming soon</span>
                )}
              </div>
              <div className="text-[12px] text-muted-foreground">{c.subtitle}</div>
              {c.key === "reminders_enabled" && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Sent {settings.reminder_hours_before}h before each lesson
                </div>
              )}
              {c.key === "dormant_winback_enabled" && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Triggers after {settings.dormant_days_threshold} days of inactivity
                </div>
              )}
            </div>
            <Switch
              checked={enabled}
              disabled={!c.owned || readOnly || saving}
              onCheckedChange={(v) => toggle(c.key as keyof Settings, v)}
            />
          </div>
        );
      })}

      <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-3 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "#EDF2FE", color: ACCENT }}>
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-medium">Business hours only (08:00–20:00 UK)</div>
          <div className="text-[12px] text-muted-foreground">Suppress outbound calls outside quiet hours.</div>
        </div>
        <Switch
          checked={settings.business_hours_only}
          disabled={readOnly || saving}
          onCheckedChange={(v) => toggle("business_hours_only", v)}
        />
      </div>
    </div>
  );
}
