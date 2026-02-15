import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Eye, Wifi, PauseCircle, Smartphone, Moon,
  CreditCard, Landmark, Receipt, Building2,
  MessageSquare, Mail, Bell, Clock,
  Palette, ImageIcon, SunMoon,
} from "lucide-react";

interface QuickSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReminderPrefs {
  sms_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  reminder_1h_enabled: boolean;
}

interface SettingRow {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (val: boolean) => void;
}

export const QuickSettingsSheet: React.FC<QuickSettingsSheetProps> = ({ open, onOpenChange }) => {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const { theme, setTheme } = useTheme();
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPrefs>({
    sms_enabled: false,
    email_enabled: false,
    push_enabled: false,
    reminder_1h_enabled: false,
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && instructor?.id) {
      supabase
        .from("instructor_reminder_preferences")
        .select("sms_enabled, email_enabled, push_enabled, reminder_1h_enabled")
        .eq("instructor_id", instructor.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setReminderPrefs({
              sms_enabled: data.sms_enabled ?? false,
              email_enabled: data.email_enabled ?? false,
              push_enabled: data.push_enabled ?? false,
              reminder_1h_enabled: data.reminder_1h_enabled ?? false,
            });
          }
        });
    }
  }, [open, instructor?.id]);

  const updateInstructorField = async (field: string, value: boolean) => {
    if (!instructor?.id) return;
    setLoading((prev) => ({ ...prev, [field]: true }));
    const { error } = await supabase
      .from("instructors")
      .update({ [field]: value })
      .eq("id", instructor.id);
    setLoading((prev) => ({ ...prev, [field]: false }));
    if (error) {
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `${field.replace(/_/g, " ")} ${value ? "enabled" : "disabled"}` });
      refreshInstructor();
    }
  };

  const updateReminderPref = async (field: keyof ReminderPrefs, value: boolean) => {
    if (!instructor?.id) return;
    setLoading((prev) => ({ ...prev, [field]: true }));
    setReminderPrefs((prev) => ({ ...prev, [field]: value }));
    const { error } = await supabase
      .from("instructor_reminder_preferences")
      .upsert({ instructor_id: instructor.id, [field]: value }, { onConflict: "instructor_id" });
    setLoading((prev) => ({ ...prev, [field]: false }));
    if (error) {
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
      setReminderPrefs((prev) => ({ ...prev, [field]: !value }));
    } else {
      toast({ title: "Updated", description: `${field.replace(/_/g, " ")} ${value ? "enabled" : "disabled"}` });
    }
  };

  if (!instructor) return null;

  const sections: { title: string; items: SettingRow[] }[] = [
    {
      title: "Visibility & Status",
      items: [
        { key: "is_active", label: "Online Visibility", description: "Show on course finder", icon: <Eye className="h-4 w-4" />, checked: instructor.is_active ?? false, onChange: (v) => updateInstructorField("is_active", v) },
        { key: "is_online", label: "Online Status", description: "Show as online for chat", icon: <Wifi className="h-4 w-4" />, checked: (instructor as any).is_online ?? false, onChange: (v) => updateInstructorField("is_online", v) },
        { key: "availability_paused", label: "Pause Availability", description: "Block all pupil bookings", icon: <PauseCircle className="h-4 w-4" />, checked: (instructor as any).availability_paused ?? false, onChange: (v) => updateInstructorField("availability_paused", v) },
      ],
    },
    {
      title: "Pupil App",
      items: [
        { key: "pupil_app_enabled", label: "Pupil App", description: "Pupil-facing portal", icon: <Smartphone className="h-4 w-4" />, checked: (instructor as any).pupil_app_enabled ?? false, onChange: (v) => updateInstructorField("pupil_app_enabled", v) },
        { key: "pupil_app_dark_mode", label: "Pupil Dark Mode", description: "Dark mode for pupils", icon: <Moon className="h-4 w-4" />, checked: (instructor as any).pupil_app_dark_mode ?? false, onChange: (v) => updateInstructorField("pupil_app_dark_mode", v) },
      ],
    },
    {
      title: "Payments",
      items: [
        { key: "klarna_enabled", label: "Klarna", description: "Pay in 3", icon: <CreditCard className="h-4 w-4" />, checked: instructor.klarna_enabled ?? false, onChange: (v) => updateInstructorField("klarna_enabled", v) },
        { key: "clearpay_enabled", label: "Clearpay", description: "Pay in 4", icon: <CreditCard className="h-4 w-4" />, checked: instructor.clearpay_enabled ?? false, onChange: (v) => updateInstructorField("clearpay_enabled", v) },
        { key: "deposit_enabled", label: "Deposit Required", description: "Require deposit on bookings", icon: <Receipt className="h-4 w-4" />, checked: (instructor as any).deposit_enabled ?? false, onChange: (v) => updateInstructorField("deposit_enabled", v) },
        { key: "truelayer_enabled", label: "Open Banking", description: "TrueLayer payments", icon: <Landmark className="h-4 w-4" />, checked: (instructor as any).truelayer_enabled ?? false, onChange: (v) => updateInstructorField("truelayer_enabled", v) },
      ],
    },
    {
      title: "Notifications",
      items: [
        { key: "sms_enabled", label: "SMS Reminders", description: "Lesson SMS reminders", icon: <MessageSquare className="h-4 w-4" />, checked: reminderPrefs.sms_enabled, onChange: (v) => updateReminderPref("sms_enabled", v) },
        { key: "email_enabled", label: "Email Reminders", description: "Lesson email reminders", icon: <Mail className="h-4 w-4" />, checked: reminderPrefs.email_enabled, onChange: (v) => updateReminderPref("email_enabled", v) },
        { key: "push_enabled", label: "Push Notifications", description: "Browser push alerts", icon: <Bell className="h-4 w-4" />, checked: reminderPrefs.push_enabled, onChange: (v) => updateReminderPref("push_enabled", v) },
        { key: "reminder_1h_enabled", label: "1-Hour Reminder", description: "Remind 1h before lesson", icon: <Clock className="h-4 w-4" />, checked: reminderPrefs.reminder_1h_enabled, onChange: (v) => updateReminderPref("reminder_1h_enabled", v) },
      ],
    },
    {
      title: "Website",
      items: [
        { key: "custom_branding_enabled", label: "Custom Branding", description: "Branding on mini website", icon: <Palette className="h-4 w-4" />, checked: (instructor as any).custom_branding_enabled ?? false, onChange: (v) => updateInstructorField("custom_branding_enabled", v) },
        { key: "hero_show_logo", label: "Show Logo on Hero", description: "Logo on website hero", icon: <ImageIcon className="h-4 w-4" />, checked: (instructor as any).hero_show_logo ?? false, onChange: (v) => updateInstructorField("hero_show_logo", v) },
      ],
    },
    {
      title: "Appearance",
      items: [
        { key: "dark_mode", label: "Dark Mode", description: "App dark/light theme", icon: <SunMoon className="h-4 w-4" />, checked: theme === "dark", onChange: (v) => { setTheme(v ? "dark" : "light"); toast({ title: "Theme changed", description: v ? "Dark mode enabled" : "Light mode enabled" }); } },
      ],
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Quick Settings</SheetTitle>
        </SheetHeader>
        <div className="py-2 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <div className="rounded-xl border bg-card divide-y">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-muted-foreground shrink-0">{item.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={item.checked}
                      onCheckedChange={item.onChange}
                      disabled={!!loading[item.key]}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
