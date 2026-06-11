import { useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useOptionalSettingsDirty } from "@/components/instructor/settings/useOptionalSettingsDirty";
import { SettingsDirtyContextRaw } from "@/components/instructor/settings/SettingsDirtyContext";

interface Props {
  instructorId: string;
}

interface Row {
  allow_start_date_only_booking: boolean;
  start_date_only_max_hours_per_week: number | null;
}

const DEFAULT: Row = {
  allow_start_date_only_booking: false,
  start_date_only_max_hours_per_week: null,
};

export function StartDateOnlyBookingEditor({ instructorId }: Props) {
  const queryClient = useQueryClient();
  // Detect whether we're inside a SettingsDirtyProvider (desktop V3 shell)
  // or rendered standalone (mobile sheet). When standalone, render our own
  // Save button so the user's changes actually persist.
  const hasProvider = useContext(SettingsDirtyContextRaw) !== null;

  const { data, isLoading } = useQuery({
    queryKey: ["instructor-booking-settings", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_booking_settings")
        .select("allow_start_date_only_booking, start_date_only_max_hours_per_week")
        .eq("instructor_id", instructorId)
        .maybeSingle();
      if (error) throw error;
      return (data as Row | null) ?? DEFAULT;
    },
  });

  const [local, setLocal] = useState<Row | null>(null);
  const current = local ?? data ?? DEFAULT;
  const { register, setDirty } = useOptionalSettingsDirty();
  const dirty = local !== null;
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Row>(key: K, value: Row[K]) =>
    setLocal((prev) => ({ ...(prev ?? current), [key]: value }));

  const save = async () => {
    const toSave = local ?? current;
    const { error } = await supabase
      .from("instructor_booking_settings")
      .upsert(
        { instructor_id: instructorId, ...toSave },
        { onConflict: "instructor_id" }
      );
    if (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
      throw error;
    }
    queryClient.invalidateQueries({ queryKey: ["instructor-booking-settings"] });
    setLocal(null);
  };

  const handleSaveClick = async () => {
    setSaving(true);
    try {
      await save();
      toast({ title: "Settings saved" });
    } catch {
      // toast already shown in save()
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setDirty("first-lesson-only", dirty);
    return () => setDirty("first-lesson-only", false);
  }, [dirty, setDirty]);

  useEffect(() => {
    register("first-lesson-only", { save, reset: () => setLocal(null) });
    return () => register("first-lesson-only", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, data, register]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        When enabled, pupils can book a course by picking only a start date and the days/times they're free. You arrange the exact lesson slots together afterwards from your Pending Scheduling list.
      </p>

      <div className="flex items-center justify-between rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <div>
            <Label className="text-base">Book first lesson only</Label>
            <p className="text-sm text-muted-foreground">
              Reserve a start date and availability windows — schedule the rest later.
            </p>
          </div>
        </div>
        <Switch
          checked={current.allow_start_date_only_booking}
          onCheckedChange={(v) => update("allow_start_date_only_booking", v)}
        />
      </div>

      {current.allow_start_date_only_booking && (
        <div className="ml-4 pl-4 border-l-2">
          <Label className="text-sm">Maximum hours per week the pupil can request</Label>
          <Input
            type="number"
            min={1}
            max={60}
            placeholder="e.g. 10 (leave blank for no cap)"
            value={current.start_date_only_max_hours_per_week ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              update("start_date_only_max_hours_per_week", Number.isFinite(n) && n > 0 ? n : null);
            }}
            className="mt-1 max-w-[260px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Caps the "hours per week" slider on the pupil's booking form so capacity checks stay realistic.
          </p>
        </div>
      )}

      {!hasProvider && (
        <Button
          type="button"
          onClick={() => void handleSaveClick()}
          disabled={!dirty || saving}
          className="w-full"
        >
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save changes"}
        </Button>
      )}
    </div>
  );
}
