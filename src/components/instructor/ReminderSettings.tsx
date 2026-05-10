import { useEffect, useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone, Clock, Loader2, Save, Sun, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOptionalSettingsDirty } from "@/components/instructor/settings/useOptionalSettingsDirty";

interface ReminderSettingsProps {
  instructorId: string;
}

interface ReminderPreferences {
  sms_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  reminder_time: string;
  morning_briefing: boolean;
  auto_reengagement: boolean;
}

const timeOptions = [
  { value: "06:00:00", label: "6:00 AM" },
  { value: "07:00:00", label: "7:00 AM" },
  { value: "08:00:00", label: "8:00 AM" },
  { value: "09:00:00", label: "9:00 AM" },
  { value: "10:00:00", label: "10:00 AM" },
  { value: "12:00:00", label: "12:00 PM" },
  { value: "14:00:00", label: "2:00 PM" },
  { value: "16:00:00", label: "4:00 PM" },
  { value: "18:00:00", label: "6:00 PM" },
  { value: "20:00:00", label: "8:00 PM" },
];

export function ReminderSettings({ instructorId }: ReminderSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    sms_enabled: true,
    email_enabled: true,
    push_enabled: true,
    reminder_time: "18:00:00",
    morning_briefing: false,
    auto_reengagement: false,
  });
  const [original, setOriginal] = useState<ReminderPreferences | null>(null);
  const { register, setDirty } = useOptionalSettingsDirty();

  useEffect(() => {
    if (!instructorId) return;
    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('instructor_reminder_preferences')
        .select('*')
        .eq('instructor_id', instructorId)
        .maybeSingle();

      if (error) throw error;

      let next: ReminderPreferences = {
        sms_enabled: data?.sms_enabled ?? true,
        email_enabled: data?.email_enabled ?? true,
        push_enabled: data?.push_enabled ?? true,
        reminder_time: data?.reminder_time ?? "18:00:00",
        morning_briefing: false,
        auto_reengagement: false,
      };

      // Fetch instructor-level settings
      const { data: instrData } = await supabase
        .from("instructors")
        .select("morning_briefing_enabled, auto_reengagement_enabled")
        .eq("id", instructorId)
        .single();

      if (instrData) {
        next = {
          ...next,
          morning_briefing: instrData.morning_briefing_enabled ?? false,
          auto_reengagement: instrData.auto_reengagement_enabled ?? false,
        };
      }

      setPreferences(next);
      setOriginal(next);
    } catch (error) {
      console.error('Error fetching reminder preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { morning_briefing, auto_reengagement, ...reminderPrefs } = preferences;

      const { error } = await supabase
        .from('instructor_reminder_preferences')
        .upsert({
          instructor_id: instructorId,
          ...reminderPrefs,
        }, {
          onConflict: 'instructor_id',
        });

      // Also save instructor-level toggles
      await supabase
        .from("instructors")
        .update({
          morning_briefing_enabled: morning_briefing,
          auto_reengagement_enabled: auto_reengagement,
        } as any)
        .eq("id", instructorId);

      if (error) throw error;
      setOriginal(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save settings');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const dirty = !!original && JSON.stringify(preferences) !== JSON.stringify(original);

  useEffect(() => {
    setDirty("reminders", dirty);
    return () => setDirty("reminders", false);
  }, [dirty, setDirty]);

  useEffect(() => {
    register("reminders", {
      save: handleSave,
      reset: () => { if (original) setPreferences(original); },
    });
    return () => register("reminders", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences, original, register]);

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
          <Bell className="h-5 w-5" />
          Lesson Reminders
        </CardTitle>
        <CardDescription>
          Automatic reminders sent to pupils before their lessons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification channels */}
        <div className="space-y-4">
          <p className="text-sm font-medium">Send reminders via:</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-toggle" className="cursor-pointer">
                Email
              </Label>
            </div>
            <Switch
              id="email-toggle"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => 
                setPreferences(p => ({ ...p, email_enabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sms-toggle" className="cursor-pointer">
                SMS
              </Label>
            </div>
            <Switch
              id="sms-toggle"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => 
                setPreferences(p => ({ ...p, sms_enabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="push-toggle" className="cursor-pointer">
                Push notifications
              </Label>
            </div>
            <Switch
              id="push-toggle"
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => 
                setPreferences(p => ({ ...p, push_enabled: checked }))
              }
            />
          </div>
        </div>

        {/* Reminder time */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label>Send reminders at:</Label>
          </div>
          <Select
            value={preferences.reminder_time}
            onValueChange={(value) => 
              setPreferences(p => ({ ...p, reminder_time: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} (day before lesson)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Reminders are sent the day before each scheduled lesson
          </p>
        </div>

        {/* Morning Briefing & Re-engagement */}
        <div className="space-y-4 pt-2 border-t">
          <p className="text-sm font-medium">Instructor Features</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="briefing-toggle" className="cursor-pointer">
                  Morning Briefing
                </Label>
                <p className="text-xs text-muted-foreground">
                  Daily SMS summary of today's schedule
                </p>
              </div>
            </div>
            <Switch
              id="briefing-toggle"
              checked={preferences.morning_briefing}
              onCheckedChange={(checked) =>
                setPreferences(p => ({ ...p, morning_briefing: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="reengage-toggle" className="cursor-pointer">
                  Auto Re-engagement
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically SMS pupils inactive for 21+ days
                </p>
              </div>
            </div>
            <Switch
              id="reengage-toggle"
              checked={preferences.auto_reengagement}
              onCheckedChange={(checked) =>
                setPreferences(p => ({ ...p, auto_reengagement: checked }))
              }
            />
          </div>
        </div>

        {/* Save button */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
