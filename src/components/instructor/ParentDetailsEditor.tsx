import { useState } from "react";
import { Phone, Mail, User, Save, Loader2, Send, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { differenceInYears } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParentDetailsEditorProps {
  pupilId: string;
  pupilName: string;
  dateOfBirth?: string | null;
  initialData: {
    parent_name?: string | null;
    parent_phone?: string | null;
    parent_email?: string | null;
    parent_portal_enabled?: boolean | null;
    parent_invited_at?: string | null;
  };
  onSaved?: () => void;
}

export function ParentDetailsEditor({
  pupilId,
  pupilName,
  dateOfBirth,
  initialData,
  onSaved,
}: ParentDetailsEditorProps) {
  const [name, setName] = useState(initialData.parent_name || "");
  const [phone, setPhone] = useState(initialData.parent_phone || "");
  const [email, setEmail] = useState(initialData.parent_email || "");
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invitedAt, setInvitedAt] = useState<string | null>(initialData.parent_invited_at ?? null);

  const age = dateOfBirth ? differenceInYears(new Date(), new Date(dateOfBirth)) : null;
  const isUnder18 = age !== null && age < 18;
  const isUnder28 = age !== null && age < 28;
  const anyFieldEmpty = !name.trim() || !phone.trim() || !email.trim();

  const portalEnabled = initialData.parent_portal_enabled !== false;
  const canInviteParent = isUnder28 && phone.trim() && portalEnabled && !invitedAt;
  const alreadyHasPortal = portalEnabled && !!invitedAt;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pupils")
        .update({
          parent_name: name.trim() || null,
          parent_phone: phone.trim() || null,
          parent_email: email.trim() || null,
        })
        .eq("id", pupilId);
      if (error) throw error;
      toast.success("Parent details saved");
      onSaved?.();
    } catch (err) {
      console.error("Error saving parent details:", err);
      toast.error("Failed to save parent details");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteParent = async () => {
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke("invite-parent", {
        body: { pupil_id: pupilId },
      });
      if (error) throw error;
      const nowIso = new Date().toISOString();
      setInvitedAt(nowIso);
      toast.success(`Invite sent to ${phone}`);
      onSaved?.();
    } catch (err) {
      console.error("Error inviting parent:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-blue-500" />
          Parent / Guardian
        </div>
        {isUnder18 && anyFieldEmpty && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Under 18 — parent details required
          </Badge>
        )}
        {!isUnder18 && isUnder28 && anyFieldEmpty && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Under 28 — parent details recommended
          </Badge>
        )}
      </div>

      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="parent-name" className="text-xs">Parent Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="parent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Parent / guardian name"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parent-phone" className="text-xs">Parent Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="parent-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXX XXXXXX"
              className="pl-9"
            />
          </div>
          {phone.trim() && (
            <a
              href={`tel:${phone.trim()}`}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" /> Call parent
            </a>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parent-email" className="text-xs">Parent Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="parent-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="pl-9"
            />
          </div>
          {email.trim() && (
            <a
              href={`mailto:${email.trim()}`}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3" /> Email parent
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Parent Details
        </Button>

        {alreadyHasPortal && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2">
            <CheckCircle2 className="h-4 w-4" />
            Parent has portal access
          </div>
        )}

        {canInviteParent && (
          <Button
            onClick={handleInviteParent}
            disabled={inviting}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Invite parent to portal
          </Button>
        )}
      </div>
    </div>
  );
}
