import { useState, useEffect, useRef } from "react";
import { 
  ClipboardCheck, Eye, Glasses, FileText, Car, Camera, 
  Loader2, Save, CheckCircle2, ChevronDown
} from "lucide-react";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewPupilChecklistProps {
  pupilId: string;
  pupilName: string;
}

interface ChecklistData {
  eyesight_checked: boolean | null;
  needs_glasses: boolean | null;
  special_needs: string | null;
  dvla_check_code: string | null;
  driver_number: string | null;
  theory_cert_number: string | null;
  previous_experience: string | null;
  licence_photo_url: string | null;
  licence_photo_back_url: string | null;
  checklist_completed_at: string | null;
}

export function NewPupilChecklist({ pupilId, pupilName }: NewPupilChecklistProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<ChecklistData>({
    eyesight_checked: null,
    needs_glasses: null,
    special_needs: null,
    dvla_check_code: null,
    driver_number: null,
    theory_cert_number: null,
    previous_experience: null,
    licence_photo_url: null,
    licence_photo_back_url: null,
    checklist_completed_at: null,
  });
  const fileInputFrontRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [pupilId]);

  const fetchData = async () => {
    try {
      const { data: pupil, error } = await supabase
        .from("pupils")
        .select("eyesight_checked, needs_glasses, special_needs, dvla_check_code, driver_number, theory_cert_number, previous_experience, licence_photo_url, licence_photo_back_url, checklist_completed_at")
        .eq("id", pupilId)
        .single();
      if (error) throw error;
      if (pupil) setData(pupil as unknown as ChecklistData);
    } catch (err) {
      console.error("Error fetching checklist:", err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = [
    data.eyesight_checked !== null,
    data.needs_glasses !== null,
    data.special_needs !== null && data.special_needs !== "",
    data.dvla_check_code !== null && data.dvla_check_code !== "",
    data.driver_number !== null && data.driver_number !== "",
    data.theory_cert_number !== null && data.theory_cert_number !== "",
    data.previous_experience !== null && data.previous_experience !== "",
    data.licence_photo_url !== null && data.licence_photo_url !== "",
    data.licence_photo_back_url !== null && data.licence_photo_back_url !== "",
  ].filter(Boolean).length;

  const totalItems = 9;

  const handleSave = async () => {
    setSaving(true);
    try {
      const allComplete = completedCount === totalItems;
      const updateData: Record<string, unknown> = {
        eyesight_checked: data.eyesight_checked,
        needs_glasses: data.needs_glasses,
        special_needs: data.special_needs || null,
        dvla_check_code: data.dvla_check_code || null,
        driver_number: data.driver_number || null,
        theory_cert_number: data.theory_cert_number || null,
        previous_experience: data.previous_experience || null,
        licence_photo_url: data.licence_photo_url || null,
        licence_photo_back_url: data.licence_photo_back_url || null,
        checklist_completed_at: allComplete ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("pupils")
        .update(updateData)
        .eq("id", pupilId);

      if (error) throw error;
      toast.success("Checklist saved");
    } catch (err) {
      console.error("Error saving checklist:", err);
      toast.error("Failed to save checklist");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${pupilId}/licence-${side}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("pupil-avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("pupil-avatars")
        .getPublicUrl(filePath);

      const field = side === 'front' ? 'licence_photo_url' : 'licence_photo_back_url';
      setData(prev => ({ ...prev, [field]: publicUrl }));
      toast.success(`Licence ${side} photo uploaded`);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      const ref = side === 'front' ? fileInputFrontRef : fileInputBackRef;
      if (ref.current) ref.current.value = "";
    }
  };

  if (loading) {
    return (
      <SectionPanel
        title="New Pupil Checklist"
        icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
      >
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel
      title="New Pupil Checklist"
      icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
      badge={
        <Badge 
          variant={completedCount === totalItems ? "default" : "secondary"} 
          className={`text-xs ${completedCount === totalItems ? "bg-green-600" : ""}`}
        >
          {completedCount}/{totalItems}
        </Badge>
      }
    >
      <div className="space-y-4">
        <Progress 
          value={(completedCount / totalItems) * 100} 
          className="h-1.5"
        />

        {/* Eyesight Check */}
        <div className="flex items-center justify-between p-3 rounded-2xl border">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="text-sm">Eyesight check</Label>
          </div>
          <div className="flex gap-1">
            <Button
              variant={data.eyesight_checked === true ? "default" : "outline"}
              size="sm"
              className={`h-7 text-xs ${data.eyesight_checked === true ? "bg-green-600 hover:bg-green-700" : ""}`}
              onClick={() => setData(prev => ({ ...prev, eyesight_checked: true }))}
            >
              Pass
            </Button>
            <Button
              variant={data.eyesight_checked === false ? "destructive" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setData(prev => ({ ...prev, eyesight_checked: false }))}
            >
              Fail
            </Button>
          </div>
        </div>

        {/* Needs Glasses */}
        <div className="flex items-center justify-between p-3 rounded-2xl border">
          <div className="flex items-center gap-3">
            <Glasses className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="text-sm">Needs glasses / contacts</Label>
          </div>
          <Checkbox
            checked={data.needs_glasses === true}
            onCheckedChange={(checked) => 
              setData(prev => ({ ...prev, needs_glasses: checked === true }))
            }
          />
        </div>

        {/* Special Needs */}
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Special needs / requirements
          </Label>
          <Textarea
            value={data.special_needs || ""}
            onChange={(e) => setData(prev => ({ ...prev, special_needs: e.target.value }))}
            placeholder="Any additional needs or requirements..."
            className="min-h-[60px] text-sm"
          />
        </div>

        {/* DVLA Check Code */}
        <div className="space-y-1.5">
          <Label className="text-sm">DVLA check code</Label>
          <Input
            value={data.dvla_check_code || ""}
            onChange={(e) => setData(prev => ({ ...prev, dvla_check_code: e.target.value }))}
            placeholder="Enter DVLA check code"
            className="text-sm"
          />
        </div>

        {/* Driver Number */}
        <div className="space-y-1.5">
          <Label className="text-sm">Driver number</Label>
          <Input
            value={data.driver_number || ""}
            onChange={(e) => setData(prev => ({ ...prev, driver_number: e.target.value }))}
            placeholder="Enter driver number"
            className="text-sm"
          />
        </div>

        {/* Theory Cert Number */}
        <div className="space-y-1.5">
          <Label className="text-sm">Theory test certificate number</Label>
          <Input
            value={data.theory_cert_number || ""}
            onChange={(e) => setData(prev => ({ ...prev, theory_cert_number: e.target.value }))}
            placeholder="Enter theory certificate number"
            className="text-sm"
          />
        </div>

        {/* Previous Experience */}
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            Previous driving experience
          </Label>
          <Select
            value={data.previous_experience || ""}
            onValueChange={(val) => setData(prev => ({ ...prev, previous_experience: val }))}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="some_lessons">Some lessons</SelectItem>
              <SelectItem value="significant">Significant experience</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Licence Photos */}
        <div className="space-y-3">
          <Label className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            Driving licence photos
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {/* Front */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Front</span>
              {data.licence_photo_url ? (
                <div className="space-y-1.5">
                  <img
                    src={data.licence_photo_url}
                    alt="Licence front"
                    className="rounded-2xl border h-24 w-full object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => setData(prev => ({ ...prev, licence_photo_url: null }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputFrontRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, 'front')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 h-24 flex-col"
                    onClick={() => fileInputFrontRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5" />
                        <span className="text-xs">Take Photo</span>
                        <span className="text-[10px] text-muted-foreground">Front</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            {/* Back */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Back</span>
              {data.licence_photo_back_url ? (
                <div className="space-y-1.5">
                  <img
                    src={data.licence_photo_back_url}
                    alt="Licence back"
                    className="rounded-2xl border h-24 w-full object-cover"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => setData(prev => ({ ...prev, licence_photo_back_url: null }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputBackRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, 'back')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 h-24 flex-col"
                    onClick={() => fileInputBackRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5" />
                        <span className="text-xs">Take Photo</span>
                        <span className="text-[10px] text-muted-foreground">Back</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4" /> Save Checklist</>
          )}
        </Button>

        {data.checklist_completed_at && (
          <div className="flex items-center gap-2 text-xs text-green-600 justify-center">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Checklist completed
          </div>
        )}
      </div>
    </SectionPanel>
  );
}
