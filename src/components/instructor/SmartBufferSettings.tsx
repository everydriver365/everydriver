import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Car, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartBufferSettingsProps {
  instructorId: string;
}

const modes = [
  { value: "flat", label: "Flat Buffer", description: "Same buffer time between all lessons" },
  { value: "travel_time", label: "Travel Time", description: "Auto-calculate drive time between postcodes" },
  { value: "travel_time_plus", label: "Travel + Padding", description: "Drive time plus extra padding minutes" },
];

export function SmartBufferSettings({ instructorId }: SmartBufferSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState("flat");
  const [paddingMinutes, setPaddingMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [instructorId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("smart_buffer_enabled, smart_buffer_mode, smart_buffer_padding_minutes")
        .eq("id", instructorId)
        .single();

      if (error) throw error;
      if (data) {
        setEnabled(data.smart_buffer_enabled ?? false);
        setMode(data.smart_buffer_mode ?? "flat");
        setPaddingMinutes(data.smart_buffer_padding_minutes ?? 5);
      }
    } catch (error) {
      console.error("Error fetching smart buffer settings:", error);
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
          smart_buffer_enabled: enabled,
          smart_buffer_mode: mode,
          smart_buffer_padding_minutes: paddingMinutes,
        })
        .eq("id", instructorId);

      if (error) throw error;
      toast({ title: "Saved", description: "Smart buffer settings updated" });
    } catch (error) {
      console.error("Error saving smart buffer settings:", error);
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Smart Buffer</Label>
          <p className="text-xs text-muted-foreground">
            Use real drive times instead of flat buffer
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Buffer Mode</Label>
          <div className="space-y-2">
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  mode === m.value
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  {m.value === "flat" ? (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Car className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{m.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-6">{m.description}</p>
              </button>
            ))}
          </div>

          {mode === "travel_time_plus" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Extra padding (minutes)</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={paddingMinutes}
                onChange={(e) => setPaddingMinutes(parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                Added on top of estimated drive time
              </p>
            </div>
          )}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save Buffer Settings
      </Button>
    </div>
  );
}
