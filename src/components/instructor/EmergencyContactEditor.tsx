import { useState } from "react";
import { Phone, User, Heart, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmergencyContactEditorProps {
  pupilId: string;
  initialData?: {
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
  };
  onSaved?: () => void;
}

const RELATIONS = [
  "Parent",
  "Spouse",
  "Partner",
  "Sibling",
  "Friend",
  "Guardian",
  "Other",
];

export function EmergencyContactEditor({ 
  pupilId, 
  initialData,
  onSaved 
}: EmergencyContactEditorProps) {
  const [name, setName] = useState(initialData?.emergency_contact_name || "");
  const [phone, setPhone] = useState(initialData?.emergency_contact_phone || "");
  const [relation, setRelation] = useState(initialData?.emergency_contact_relation || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          emergency_contact_name: name.trim(),
          emergency_contact_phone: phone.trim(),
          emergency_contact_relation: relation || null,
        })
        .eq("id", pupilId);

      if (error) throw error;
      toast.success("Emergency contact saved");
      onSaved?.();
    } catch (error) {
      console.error("Error saving emergency contact:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Heart className="h-4 w-4 text-red-500" />
        Next of Kin / Emergency Contact
      </div>

      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ec-name" className="text-xs">Contact Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="ec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emergency contact name"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ec-phone" className="text-xs">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="ec-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXX XXXXXX"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ec-relation" className="text-xs">Relationship</Label>
          <Select value={relation} onValueChange={setRelation}>
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONS.map((rel) => (
                <SelectItem key={rel} value={rel}>
                  {rel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Emergency Contact
      </Button>
    </div>
  );
}
