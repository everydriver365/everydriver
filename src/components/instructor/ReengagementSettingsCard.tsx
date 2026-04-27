import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { UserMinus, Loader2 } from "lucide-react";

export function ReengagementSettingsCard() {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<{ sent30d: number } | null>(null);

  useEffect(() => {
    if (!instructor?.id) return;
    setEnabled(Boolean((instructor as { auto_reengage_dormant?: boolean }).auto_reengage_dormant));
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    supabase
      .from("pupil_reengagement_log")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructor.id)
      .gte("sent_at", since)
      .then(({ count }) => setStats({ sent30d: count ?? 0 }));
  }, [instructor?.id]);

  const toggle = async (value: boolean) => {
    if (!instructor?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("instructors")
      .update({ auto_reengage_dormant: value })
      .eq("id", instructor.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    setEnabled(value);
    await refreshInstructor();
    toast.success(value ? "Auto re-engagement enabled" : "Auto re-engagement disabled");
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-2xl bg-amber-100 dark:bg-amber-900/30 p-2">
          <UserMinus className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Auto re-engage dormant pupils</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Send a "we miss you" message to active pupils who haven't booked a lesson in 21+ days.
            WhatsApp is used when available, otherwise SMS. Capped at 5 per day.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <Label htmlFor="reengage-toggle" className="text-sm cursor-pointer">
          Enable daily auto re-engagement
        </Label>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Switch id="reengage-toggle" checked={enabled} onCheckedChange={toggle} disabled={saving} />
        </div>
      </div>

      {stats && (
        <p className="text-[11px] text-muted-foreground mt-3">
          {stats.sent30d} message{stats.sent30d === 1 ? "" : "s"} sent in the last 30 days.
        </p>
      )}
    </Card>
  );
}
