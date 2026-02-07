import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Save, PoundSterling } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NoShowPolicySettingsProps {
  instructorId: string;
}

interface PolicySettings {
  no_show_fee: number;
  late_cancel_fee: number;
  late_cancel_hours: number;
  auto_charge_no_show: boolean;
}

export function NoShowPolicySettings({ instructorId }: NoShowPolicySettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PolicySettings>({
    no_show_fee: 0,
    late_cancel_fee: 0,
    late_cancel_hours: 24,
    auto_charge_no_show: false,
  });

  useEffect(() => {
    if (!instructorId) return;
    fetchSettings();
  }, [instructorId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructor_reminder_preferences")
        .select("no_show_fee, late_cancel_fee, late_cancel_hours, auto_charge_no_show")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          no_show_fee: data.no_show_fee ?? 0,
          late_cancel_fee: data.late_cancel_fee ?? 0,
          late_cancel_hours: data.late_cancel_hours ?? 24,
          auto_charge_no_show: data.auto_charge_no_show ?? false,
        });
      }
    } catch (err) {
      console.error("Error fetching no-show settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructor_reminder_preferences")
        .upsert({
          instructor_id: instructorId,
          ...settings,
        }, { onConflict: "instructor_id" });

      if (error) throw error;
      toast.success("No-show policy saved");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5" />
          No-Show & Cancellation Policy
        </CardTitle>
        <CardDescription>
          Set fees for no-shows and late cancellations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* No-show fee */}
        <div className="space-y-2">
          <Label>No-show fee</Label>
          <div className="relative">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              step={0.5}
              value={settings.no_show_fee}
              onChange={(e) => setSettings(s => ({ ...s, no_show_fee: parseFloat(e.target.value) || 0 }))}
              className="pl-9"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Charged when a pupil doesn't turn up for their lesson
          </p>
        </div>

        {/* Late cancellation fee */}
        <div className="space-y-2">
          <Label>Late cancellation fee</Label>
          <div className="relative">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              step={0.5}
              value={settings.late_cancel_fee}
              onChange={(e) => setSettings(s => ({ ...s, late_cancel_fee: parseFloat(e.target.value) || 0 }))}
              className="pl-9"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Late cancellation window */}
        <div className="space-y-2">
          <Label>Late cancellation window (hours)</Label>
          <Input
            type="number"
            min={1}
            max={72}
            value={settings.late_cancel_hours}
            onChange={(e) => setSettings(s => ({ ...s, late_cancel_hours: parseInt(e.target.value) || 24 }))}
          />
          <p className="text-xs text-muted-foreground">
            Cancellations within {settings.late_cancel_hours}h of the lesson are charged the late cancellation fee
          </p>
        </div>

        {/* Auto-charge toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <Label htmlFor="auto-charge">Auto-charge no-shows</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically deduct from pupil's balance when marked as no-show
            </p>
          </div>
          <Switch
            id="auto-charge"
            checked={settings.auto_charge_no_show}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, auto_charge_no_show: checked }))}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Policy
        </Button>
      </CardContent>
    </Card>
  );
}
