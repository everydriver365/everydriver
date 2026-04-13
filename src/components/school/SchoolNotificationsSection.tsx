import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import type { SchoolRecord } from "@/hooks/useSchoolData";

interface Props { school: SchoolRecord; onRefresh: () => void; }

const DEFAULTS = { new_bookings: true, payments: true, test_results: true, cancellations: true, email: true, sms: false };

export default function SchoolNotificationsSection({ school, onRefresh }: Props) {
  const { isDemo } = useSchoolDemo();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ ...DEFAULTS, ...(school.notification_preferences || {}) });
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    if (isDemo) { toast.info("Demo mode — no changes saved"); return; }
    setSaving(true);
    const { error } = await supabase.from("schools").update({ notification_preferences: prefs } as any).eq("id", school.id) as any;
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Notification preferences saved");
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">Configure how you receive alerts</p>
      </div>
      <Card className="max-w-xl">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alert Types</h3>
            {[
              { key: "new_bookings", label: "New Bookings", desc: "Get notified when a student books a lesson" },
              { key: "payments", label: "Payments", desc: "Get notified when payments are received" },
              { key: "test_results", label: "Test Results", desc: "Get notified when test results are recorded" },
              { key: "cancellations", label: "Cancellations", desc: "Get notified when lessons are cancelled" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Channels</h3>
            {[
              { key: "email", label: "Email", desc: "Receive alerts via email" },
              { key: "sms", label: "SMS", desc: "Receive alerts via text message" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
          <Button onClick={save} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
