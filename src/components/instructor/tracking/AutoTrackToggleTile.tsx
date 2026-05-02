import { useEffect, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  instructorId: string;
}

/**
 * Surfaces the `auto_start_tracker` instructor preference directly on the
 * Tracking screen so it is easy to discover. Mirrors the toggle in
 * Settings → Feature Toggles.
 */
export function AutoTrackToggleTile({ instructorId }: Props) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    supabase
      .from("instructors")
      .select("auto_start_tracker")
      .eq("id", instructorId)
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(Boolean((data as any)?.auto_start_tracker));
      });
  }, [instructorId]);

  const handleChange = async (value: boolean) => {
    setSaving(true);
    const previous = enabled;
    setEnabled(value);
    const { error } = await supabase
      .from("instructors")
      .update({ auto_start_tracker: value } as any)
      .eq("id", instructorId);
    setSaving(false);
    if (error) {
      setEnabled(previous);
      toast({ title: "Couldn't update setting", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: value ? "Auto-tracking on" : "Auto-tracking off" });
  };

  if (enabled === null) return null;

  const accent = enabled ? "#34C759" : "#2B7BC8";
  const accentBg = enabled ? "rgba(52,199,89,0.12)" : "rgba(43,123,200,0.10)";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: enabled ? "0.5px solid rgba(52,199,89,0.45)" : "0.5px solid #E5E5EA",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "border-color 200ms ease",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: accentBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 200ms ease",
        }}
      >
        <Zap size={18} color={accent} strokeWidth={2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#000", letterSpacing: -0.2 }}>
          Auto-track every lesson
        </div>
        <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 2, lineHeight: 1.35 }}>
          Tap “Start lesson” and the tracker opens automatically — the trip is saved to the pupil's records.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {saving && <Loader2 size={14} className="animate-spin" color="#8E8E93" />}
        <Switch
          checked={enabled}
          onCheckedChange={handleChange}
          disabled={saving}
          className="data-[state=checked]:bg-[#34C759]"
        />
      </div>
    </div>
  );
}
