import { useState, useEffect } from "react";
import { Loader2, PoundSterling, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DepositSettingsEditorProps {
  instructorId: string;
}

interface DepositSettings {
  deposit_enabled: boolean;
  deposit_amount: number;
  deposit_deadline_days: number;
}

export function DepositSettingsEditor({ instructorId }: DepositSettingsEditorProps) {
  const [settings, setSettings] = useState<DepositSettings>({
    deposit_enabled: false,
    deposit_amount: 350,
    deposit_deadline_days: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [instructorId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("deposit_enabled, deposit_amount, deposit_deadline_days")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      
      setSettings({
        deposit_enabled: data.deposit_enabled ?? false,
        deposit_amount: data.deposit_amount ?? 350,
        deposit_deadline_days: data.deposit_deadline_days ?? 30,
      });
    } catch (error) {
      console.error("Error fetching deposit settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          deposit_enabled: settings.deposit_enabled,
          deposit_amount: settings.deposit_amount,
        })
        .eq("id", instructorId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Deposit settings have been updated",
      });
    } catch (error) {
      console.error("Error saving deposit settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between rounded-none border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="deposit-toggle" className="text-sm font-medium">
            Accept deposit payments
          </Label>
          <p className="text-xs text-muted-foreground">
            Allow customers to pay a deposit instead of the full amount
          </p>
        </div>
        <Switch
          id="deposit-toggle"
          checked={settings.deposit_enabled}
          onCheckedChange={(checked) =>
            setSettings((prev) => ({ ...prev, deposit_enabled: checked }))
          }
        />
      </div>

      {/* Deposit Amount */}
      {settings.deposit_enabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount" className="text-sm font-medium">
              Deposit Amount
            </Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="deposit-amount"
                type="number"
                min="50"
                max="1000"
                step="10"
                value={settings.deposit_amount}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    deposit_amount: parseFloat(e.target.value) || 350,
                  }))
                }
                className="pl-9"
              />
            </div>
          </div>

          {/* Warning message */}
          <div className="rounded-none bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {settings.deposit_deadline_days}-Day Payment Deadline
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Customers who pay a deposit must pay the remaining balance at least 
                  {settings.deposit_deadline_days} days before their first lesson. If payment is not received by 
                  this date, the booking will be cancelled and the deposit will be forfeited.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Deposit Settings
      </Button>
    </div>
  );
}
