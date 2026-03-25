import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CommissionPayerSettingsProps {
  instructorId: string;
  initialPayer?: string | null;
  initialSplitPercent?: number | null;
}

export function CommissionPayerSettings({ instructorId, initialPayer, initialSplitPercent }: CommissionPayerSettingsProps) {
  const resolvedInitial = initialSplitPercent ?? (initialPayer === "instructor" ? 0 : 100);
  const [split, setSplit] = useState(resolvedInitial);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const pupilPercent = split;
  const instructorPercent = 100 - split;

  const saveSplit = async (value: number) => {
    setSaving(true);
    try {
      const payer = value === 0 ? "instructor" : value === 100 ? "pupil" : "split";
      const { error } = await supabase
        .from("instructors")
        .update({ commission_split_percent: value, commission_payer: payer })
        .eq("id", instructorId);
      if (error) throw error;
      setSplit(value);
      toast({ title: "Commission split updated" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Example fee for preview (2.5% + 20p on £40)
  const exampleBase = 40;
  const exampleFee = Math.round((exampleBase * 2.5 / 100 + 0.20) * 100) / 100;
  const pupilPays = Math.round(exampleFee * (pupilPercent / 100) * 100) / 100;
  const youPay = Math.round((exampleFee - pupilPays) * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Service Fee Split</Label>
        <p className="text-xs text-muted-foreground">
          Control how much of the service fee your pupil pays vs how much you absorb.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>You pay 100%</span>
          <span>Pupil pays 100%</span>
        </div>
        <Slider
          value={[split]}
          onValueChange={([v]) => setSplit(v)}
          onValueCommit={([v]) => saveSplit(v)}
          min={0}
          max={100}
          step={5}
          disabled={saving}
        />
        <div className="flex justify-center">
          <span className="text-sm font-semibold text-foreground">
            Pupil {pupilPercent}% · You {instructorPercent}%
          </span>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2">
        {[
          { label: "I pay all", value: 0 },
          { label: "Split 50/50", value: 50 },
          { label: "Pupil pays all", value: 100 },
        ].map((preset) => (
          <Button
            key={preset.value}
            variant={split === preset.value ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            disabled={saving}
            onClick={() => { setSplit(preset.value); saveSplit(preset.value); }}
          >
            {saving && split === preset.value ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Live preview */}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-xs">Example: £{exampleBase} lesson (fee £{exampleFee.toFixed(2)})</p>
        <p>Pupil pays: £{pupilPays.toFixed(2)} · You absorb: £{youPay.toFixed(2)}</p>
        <p>Pupil total: £{(exampleBase + pupilPays).toFixed(2)}</p>
      </div>
    </div>
  );
}
