import { useEffect, useState } from "react";
import { Gift, Loader2, Save, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferralSettingsCardProps {
  instructorId: string;
}

interface ReferralSettings {
  is_enabled: boolean;
  referrer_reward_type: string;
  referrer_reward_amount: number;
  referee_reward_type: string;
  referee_reward_amount: number;
  max_referrals_per_pupil: number;
  reward_description: string;
}

const rewardTypes = [
  { value: "discount", label: "Discount (£ off next lesson)" },
  { value: "credit", label: "Account credit" },
  { value: "free_lesson", label: "Free lesson" },
  { value: "points", label: "Reward points" },
];

export function ReferralSettingsCard({ instructorId }: ReferralSettingsCardProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [settings, setSettings] = useState<ReferralSettings>({
    is_enabled: true,
    referrer_reward_type: "discount",
    referrer_reward_amount: 5,
    referee_reward_type: "discount",
    referee_reward_amount: 5,
    max_referrals_per_pupil: 10,
    reward_description: "Refer a friend and you both get £5 off!",
  });

  useEffect(() => {
    if (!instructorId) return;
    fetchSettings();
    fetchStats();
  }, [instructorId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructor_referral_settings")
        .select("*")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          is_enabled: data.is_enabled ?? true,
          referrer_reward_type: data.referrer_reward_type ?? "discount",
          referrer_reward_amount: data.referrer_reward_amount ?? 5,
          referee_reward_type: data.referee_reward_type ?? "discount",
          referee_reward_amount: data.referee_reward_amount ?? 5,
          max_referrals_per_pupil: data.max_referrals_per_pupil ?? 10,
          reward_description: data.reward_description ?? "",
        });
      }
    } catch (err) {
      console.error("Error fetching referral settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await supabase
        .from("pupil_referrals")
        .select("status")
        .eq("instructor_id", instructorId);

      if (data) {
        setStats({
          total: data.length,
          completed: data.filter(r => r.status === "completed").length,
          pending: data.filter(r => r.status === "pending").length,
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructor_referral_settings")
        .upsert({
          instructor_id: instructorId,
          ...settings,
        }, { onConflict: "instructor_id" });

      if (error) throw error;
      toast.success("Referral settings saved");
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5" />
              Referral Programme
            </CardTitle>
            <CardDescription>Configure how pupils earn rewards for referrals</CardDescription>
          </div>
          <Switch
            checked={settings.is_enabled}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, is_enabled: checked }))}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-none">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Total</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-none">
            <div className="text-xl font-bold text-emerald-600">{stats.completed}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Completed</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-none">
            <div className="text-xl font-bold text-amber-500">{stats.pending}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Pending</div>
          </div>
        </div>

        {settings.is_enabled && (
          <>
            {/* Referrer reward */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Referrer</Badge>
                <span className="text-sm text-muted-foreground">Existing pupil gets:</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={settings.referrer_reward_type}
                  onValueChange={(v) => setSettings(s => ({ ...s, referrer_reward_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rewardTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={settings.referrer_reward_amount}
                  onChange={(e) => setSettings(s => ({ ...s, referrer_reward_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="Amount"
                />
              </div>
            </div>

            {/* Referee reward */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">New Pupil</Badge>
                <span className="text-sm text-muted-foreground">Referred pupil gets:</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={settings.referee_reward_type}
                  onValueChange={(v) => setSettings(s => ({ ...s, referee_reward_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rewardTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={settings.referee_reward_amount}
                  onChange={(e) => setSettings(s => ({ ...s, referee_reward_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="Amount"
                />
              </div>
            </div>

            {/* Max referrals */}
            <div className="space-y-2 pt-2 border-t">
              <Label>Max referrals per pupil</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.max_referrals_per_pupil}
                onChange={(e) => setSettings(s => ({ ...s, max_referrals_per_pupil: parseInt(e.target.value) || 10 }))}
              />
            </div>

            {/* Description shown to pupils */}
            <div className="space-y-2">
              <Label>Message shown to pupils</Label>
              <Textarea
                value={settings.reward_description}
                onChange={(e) => setSettings(s => ({ ...s, reward_description: e.target.value }))}
                rows={2}
                placeholder="Refer a friend and you both get £5 off!"
              />
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Referral Settings
        </Button>
      </CardContent>
    </Card>
  );
}
