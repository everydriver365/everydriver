import { useEffect, useState } from "react";
import { PoundSterling, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PupilRateEditorProps {
  pupilId: string;
  pupilName: string;
  /** Instructor's default hourly rate, used to derive per-duration defaults */
  defaultRate?: number;
  currentCustomRate?: number | null;
  currentCustomRate90?: number | null;
  currentCustomRate120?: number | null;
  onSaved?: () => void;
}

interface DurationRow {
  key: "60" | "90" | "120";
  label: string;
  hours: number;
}

const DURATIONS: DurationRow[] = [
  { key: "60", label: "1 hour", hours: 1 },
  { key: "90", label: "1.5 hours", hours: 1.5 },
  { key: "120", label: "2 hours", hours: 2 },
];

export function PupilRateEditor({
  pupilId,
  pupilName,
  defaultRate = 40,
  currentCustomRate,
  currentCustomRate90,
  currentCustomRate120,
  onSaved,
}: PupilRateEditorProps) {
  const [rate60, setRate60] = useState(currentCustomRate?.toString() ?? "");
  const [rate90, setRate90] = useState(currentCustomRate90?.toString() ?? "");
  const [rate120, setRate120] = useState(currentCustomRate120?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRate60(currentCustomRate?.toString() ?? "");
    setRate90(currentCustomRate90?.toString() ?? "");
    setRate120(currentCustomRate120?.toString() ?? "");
  }, [pupilId, currentCustomRate, currentCustomRate90, currentCustomRate120]);

  const parseOrNull = (val: string): number | null | "invalid" => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const n = parseFloat(trimmed);
    if (isNaN(n) || n < 0) return "invalid";
    return n;
  };

  const handleSave = async () => {
    const v60 = parseOrNull(rate60);
    const v90 = parseOrNull(rate90);
    const v120 = parseOrNull(rate120);
    if (v60 === "invalid" || v90 === "invalid" || v120 === "invalid") {
      toast.error("Please enter valid rates");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          custom_hourly_rate: v60,
          custom_rate_90min: v90,
          custom_rate_120min: v120,
        })
        .eq("id", pupilId);
      if (error) throw error;
      toast.success("Lesson rates saved");
      onSaved?.();
    } catch (error) {
      console.error("Error saving rates:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          custom_hourly_rate: null,
          custom_rate_90min: null,
          custom_rate_120min: null,
        })
        .eq("id", pupilId);
      if (error) throw error;
      setRate60("");
      setRate90("");
      setRate120("");
      toast.success("Reset to default rates");
      onSaved?.();
    } catch (error) {
      console.error("Error clearing rates:", error);
    } finally {
      setSaving(false);
    }
  };

  const stateFor = (key: DurationRow["key"]) => {
    if (key === "60") return [rate60, setRate60] as const;
    if (key === "90") return [rate90, setRate90] as const;
    return [rate120, setRate120] as const;
  };

  const hasAnyCustom =
    currentCustomRate != null ||
    currentCustomRate90 != null ||
    currentCustomRate120 != null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <PoundSterling className="h-4 w-4 text-green-600" />
        Lesson Rates for {pupilName}
      </div>

      <div className="space-y-2">
        {DURATIONS.map((d) => {
          const [val, set] = stateFor(d.key);
          const defaultForDuration = defaultRate * d.hours;
          return (
            <div key={d.key} className="space-y-1">
              <Label className="text-xs">
                {d.label} (default £{defaultForDuration.toFixed(2)})
              </Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={defaultForDuration.toFixed(2)}
                  className="pl-9"
                  min="0"
                  step="0.50"
                />
              </div>
            </div>
          );
        })}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save rates
          </Button>
          {hasAnyCustom && (
            <Button variant="outline" size="sm" onClick={clearAll} disabled={saving}>
              Reset to default
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Leave any field empty to use the instructor's default rate for that duration.
        </p>
      </div>
    </div>
  );
}
