import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, X, RefreshCw, ShoppingCart, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useOptionalSettingsDirty } from "@/components/instructor/settings/useOptionalSettingsDirty";

interface PupilBookingSettingsEditorProps {
  instructorId: string;
}

interface BookingSettings {
  id?: string;
  allow_self_booking: boolean;
  allow_self_cancel: boolean;
  allow_self_reschedule: boolean;
  require_approval: boolean;
  cancel_notice_hours: number;
  reschedule_notice_hours: number;
  min_notice_hours: number;
  max_advance_days: number;
  allowed_durations: number[];
  booking_message: string | null;
  allow_extra_hours_request: boolean;
}

const DEFAULT_SETTINGS: BookingSettings = {
  allow_self_booking: false,
  allow_self_cancel: false,
  allow_self_reschedule: false,
  require_approval: true,
  cancel_notice_hours: 24,
  reschedule_notice_hours: 24,
  min_notice_hours: 24,
  max_advance_days: 56,
  allowed_durations: [60, 90, 120],
  booking_message: null,
  allow_extra_hours_request: false,
};

export function PupilBookingSettingsEditor({ instructorId }: PupilBookingSettingsEditorProps) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['instructor-booking-settings', instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_booking_settings')
        .select('*')
        .eq('instructor_id', instructorId)
        .single();

      if (error && error.code === 'PGRST116') return { ...DEFAULT_SETTINGS };
      if (error) throw error;
      return data as BookingSettings;
    },
  });

  const [localSettings, setLocalSettings] = useState<BookingSettings | null>(null);
  const current = localSettings || settings || DEFAULT_SETTINGS;
  const { register, setDirty } = useOptionalSettingsDirty();

  const updateField = <K extends keyof BookingSettings>(key: K, value: BookingSettings[K]) => {
    setLocalSettings(prev => ({ ...(prev || current), [key]: value }));
  };

  const saveSettings = async () => {
    const toSave = localSettings || current;
    const { id, ...settingsData } = toSave as BookingSettings & { id?: string };

    const { error } = await supabase
      .from('instructor_booking_settings')
      .upsert({
        instructor_id: instructorId,
        ...settingsData,
      }, { onConflict: 'instructor_id' });

    if (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
      throw error;
    }
    queryClient.invalidateQueries({ queryKey: ['instructor-booking-settings'] });
    setLocalSettings(null);
  };

  const dirty = localSettings !== null;

  useEffect(() => {
    setDirty("pupil-booking", dirty);
    return () => setDirty("pupil-booking", false);
  }, [dirty, setDirty]);

  useEffect(() => {
    register("pupil-booking", {
      save: saveSettings,
      reset: () => setLocalSettings(null),
    });
    return () => register("pupil-booking", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSettings, settings, register]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasChanges = localSettings !== null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Control what pupils can do themselves through their portal — book, reschedule, or cancel lessons.
      </p>

      {/* Self-Booking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <Label className="text-base">Self-Service Booking</Label>
              <p className="text-sm text-muted-foreground">Pupils can book lessons from available slots</p>
            </div>
          </div>
          <Switch
            checked={current.allow_self_booking}
            onCheckedChange={(v) => updateField('allow_self_booking', v)}
          />
        </div>

        {current.allow_self_booking && (
          <div className="ml-4 pl-4 border-l-2 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div>
                <Label>Require Approval</Label>
                <p className="text-xs text-muted-foreground">You'll need to confirm each booking</p>
              </div>
              <Switch
                checked={current.require_approval}
                onCheckedChange={(v) => updateField('require_approval', v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Min Notice (hours)</Label>
                <Input
                  type="number"
                  min={0}
                  max={168}
                  value={current.min_notice_hours}
                  onChange={(e) => updateField('min_notice_hours', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Max Advance (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={current.max_advance_days}
                  onChange={(e) => updateField('max_advance_days', parseInt(e.target.value) || 14)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Booking Message (optional)</Label>
              <Textarea
                placeholder="Any instructions for pupils..."
                value={current.booking_message || ''}
                onChange={(e) => updateField('booking_message', e.target.value || null)}
                className="mt-1"
                maxLength={500}
              />
            </div>
          </div>
        )}
      </div>

      {/* Self-Cancel */}
      <div className="flex items-center justify-between rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <X className="h-5 w-5 text-destructive" />
          <div>
            <Label className="text-base">Self-Service Cancellation</Label>
            <p className="text-sm text-muted-foreground">Pupils can cancel their own lessons</p>
          </div>
        </div>
        <Switch
          checked={current.allow_self_cancel}
          onCheckedChange={(v) => updateField('allow_self_cancel', v)}
        />
      </div>

      {current.allow_self_cancel && (
        <div className="ml-4 pl-4 border-l-2">
          <Label className="text-sm">Cancellation Notice (hours)</Label>
          <Input
            type="number"
            min={0}
            max={168}
            value={current.cancel_notice_hours}
            onChange={(e) => updateField('cancel_notice_hours', parseInt(e.target.value) || 0)}
            className="mt-1 max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pupils must cancel at least this many hours before the lesson
          </p>
        </div>
      )}

      {/* Self-Reschedule */}
      <div className="flex items-center justify-between rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          <div>
            <Label className="text-base">Self-Service Reschedule</Label>
            <p className="text-sm text-muted-foreground">Pupils can move lessons to a different time</p>
          </div>
        </div>
        <Switch
          checked={current.allow_self_reschedule}
          onCheckedChange={(v) => updateField('allow_self_reschedule', v)}
        />
      </div>

      {current.allow_self_reschedule && (
        <div className="ml-4 pl-4 border-l-2">
          <Label className="text-sm">Reschedule Notice (hours)</Label>
          <Input
            type="number"
            min={0}
            max={168}
            value={current.reschedule_notice_hours}
            onChange={(e) => updateField('reschedule_notice_hours', parseInt(e.target.value) || 0)}
            className="mt-1 max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pupils must reschedule at least this many hours before the lesson
          </p>
        </div>
      )}

      {/* Extra Hours */}
      <div className="flex items-center justify-between rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-green-500" />
          <div>
            <Label className="text-base">Request Extra Hours</Label>
            <p className="text-sm text-muted-foreground">Pupils can request additional lesson hours</p>
          </div>
        </div>
        <Switch
          checked={current.allow_extra_hours_request}
          onCheckedChange={(v) => updateField('allow_extra_hours_request', v)}
        />
      </div>

      {/* Save handled by the sticky settings save bar */}
    </div>
  );
}
