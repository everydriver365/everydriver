import { useState } from "react";
import { PoundSterling, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PupilRateEditorProps {
  pupilId: string;
  pupilName: string;
  defaultRate?: number;
  currentCustomRate?: number | null;
  onSaved?: () => void;
}

export function PupilRateEditor({ 
  pupilId, 
  pupilName,
  defaultRate = 40,
  currentCustomRate,
  onSaved 
}: PupilRateEditorProps) {
  const [rate, setRate] = useState(currentCustomRate?.toString() || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const rateValue = rate.trim() ? parseFloat(rate) : null;
    
    if (rateValue !== null && (isNaN(rateValue) || rateValue < 0)) {
      toast.error("Please enter a valid rate");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ custom_hourly_rate: rateValue })
        .eq("id", pupilId);

      if (error) throw error;
      toast.success(rateValue ? "Custom rate saved" : "Using default rate");
      onSaved?.();
    } catch (error) {
      console.error("Error saving rate:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const clearCustomRate = async () => {
    setRate("");
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({ custom_hourly_rate: null })
        .eq("id", pupilId);

      if (error) throw error;
      toast.success("Using default rate");
      onSaved?.();
    } catch (error) {
      console.error("Error clearing rate:", error);
    } finally {
      setSaving(false);
    }
  };

  const effectiveRate = rate ? parseFloat(rate) : defaultRate;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <PoundSterling className="h-4 w-4 text-green-600" />
        Lesson Rate for {pupilName}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">
          Custom Hourly Rate (leave empty for default £{defaultRate}/hr)
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder={defaultRate.toString()}
              className="pl-9"
              min="0"
              step="0.50"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} size="icon">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>

        {currentCustomRate && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearCustomRate}
            className="text-xs"
          >
            Reset to default rate
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Effective rate: <span className="font-medium">£{effectiveRate.toFixed(2)}/hr</span>
        </p>
      </div>
    </div>
  );
}
