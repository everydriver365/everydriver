import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { checkDuplicatePupilName, isDuplicatePupilNameError } from "@/lib/checkDuplicatePupil";

export interface QuickAddedPupil {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  postcode: string | null;
}

interface Props {
  /** When provided (admin scope), the new pupil is attached to this instructor.
   *  When omitted (instructor scope), the current user must be an instructor;
   *  we resolve their instructor_id via the RPC. */
  instructorId?: string | null;
  onCreated: (pupil: QuickAddedPupil) => void;
  /** Optional label override */
  label?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "outline" | "secondary" | "default";
}

export function QuickAddPupilButton({
  instructorId,
  onCreated,
  label = "New pupil",
  size = "sm",
  variant = "outline",
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPostcode("");
  };

  const resolveInstructorId = async (): Promise<string | null> => {
    if (instructorId) return instructorId;
    const { data, error } = await supabase.rpc("get_instructor_id_for_user", {
      _user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    } as any);
    if (error) return null;
    return (data as string | null) ?? null;
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const targetInstructor = await resolveInstructorId();
      if (!targetInstructor) {
        toast.error("Could not determine instructor for new pupil");
        return;
      }
      const payload: Record<string, any> = {
        instructor_id: targetInstructor,
        name: trimmedName,
        status: "active",
        scheduling_status: "unscheduled",
      };
      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (postcode.trim()) payload.postcode = postcode.trim().toUpperCase();

      const existingDup = await checkDuplicatePupilName(targetInstructor, trimmedName);
      if (existingDup) {
        toast.error(`A pupil named "${existingDup.name}" already exists.`);
        return;
      }

      const { data, error } = await supabase
        .from("pupils")
        .insert(payload as any)
        .select("id, name, email, phone, postcode")
        .single();
      if (error) {
        if (isDuplicatePupilNameError(error)) {
          toast.error("A pupil with that name already exists for this instructor.");
          return;
        }
        throw error;
      }

      toast.success(`Added ${data.name}`);
      onCreated(data as QuickAddedPupil);
      reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add pupil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
        className="gap-1"
      >
        <UserPlus className="h-4 w-4" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add new pupil</DialogTitle>
            <DialogDescription>
              Create a pupil record. You can edit full details later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="qap-name">Name *</Label>
              <Input
                id="qap-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qap-email">Email</Label>
              <Input
                id="qap-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qap-phone">Phone</Label>
                <Input
                  id="qap-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07700 900123"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qap-postcode">Postcode</Label>
                <Input
                  id="qap-postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="SO21 1AA"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add pupil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
