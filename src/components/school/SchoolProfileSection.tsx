import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SchoolRecord } from "@/hooks/useSchoolData";

interface Props { school: SchoolRecord; onRefresh: () => void; }

export default function SchoolProfileSection({ school, onRefresh }: Props) {
  const [form, setForm] = useState({
    name: school.name || "",
    contact_email: school.contact_email || "",
    contact_phone: school.contact_phone || "",
    description: school.description || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("schools").update(form as any).eq("id", school.id) as any;
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Profile updated");
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">School Profile</h2>
        <p className="text-muted-foreground">Update your school's details</p>
      </div>

      <Card className="max-w-xl">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>School Name</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Contact Email</Label>
            <Input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <Input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} />
          </div>
          <Button onClick={save} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
