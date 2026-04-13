import { useState } from "react";
import { Save, Loader2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SchoolRecord } from "@/hooks/useSchoolData";

interface Props { school: SchoolRecord; onRefresh: () => void; }

export default function SchoolBrandingSection({ school, onRefresh }: Props) {
  const [brandColour, setBrandColour] = useState(school.brand_colour || "#6366f1");
  const [logoUrl, setLogoUrl] = useState(school.logo_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("schools").update({ brand_colour: brandColour, logo_url: logoUrl } as any).eq("id", school.id) as any;
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Branding updated");
    onRefresh();
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `school-logos/${school.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("instructor-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("instructor-images").getPublicUrl(path);
    setLogoUrl(publicUrl);
    setUploading(false);
    toast.success("Logo uploaded");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Branding</h2>
        <p className="text-muted-foreground">Customise your school's visual identity</p>
      </div>

      <Card className="max-w-xl">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>School Logo</Label>
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 w-auto rounded-lg border mb-2" />}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="gap-1">
                <label>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                </label>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Brand Colour</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={brandColour} onChange={e => setBrandColour(e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
              <Input value={brandColour} onChange={e => setBrandColour(e.target.value)} className="w-32" />
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Branding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
