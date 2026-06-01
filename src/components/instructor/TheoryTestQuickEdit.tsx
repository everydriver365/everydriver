import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Status = "none" | "booked" | "passed" | "failed";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupil: any;
  onSaved?: () => void;
}

export function TheoryTestQuickEdit({ open, onOpenChange, pupil, onSaved }: Props) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("none");
  const [date, setDate] = useState<string>("");
  const [centreId, setCentreId] = useState<string>("");
  const [cert, setCert] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [centres, setCentres] = useState<Array<{ id: string; name: string; postcode: string | null }>>([]);

  useEffect(() => {
    if (!open || !pupil) return;
    const initial: Status =
      pupil.theory_test_passed === true ? "passed"
      : pupil.theory_test_passed === false ? "failed"
      : pupil.theory_test_date ? "booked"
      : "none";
    setStatus(initial);
    setDate(pupil.theory_test_date || "");
    setCentreId(pupil.theory_test_centre_id || "");
    setCert(pupil.theory_cert_number || "");
  }, [open, pupil?.id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("theory_test_centres")
        .select("id, name, postcode")
        .eq("is_active", true)
        .order("name");
      if (!cancelled) setCentres((data || []) as any);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const save = async () => {
    if (!pupil) return;
    setSaving(true);
    try {
      const payload: any = {
        theory_test_passed:
          status === "passed" ? true
          : status === "failed" ? false
          : null,
        theory_test_date: status === "none" ? null : (date || null),
        theory_test_centre_id: (status === "booked" || status === "passed") ? (centreId || null) : null,
        theory_cert_number: status === "passed" ? (cert.trim() || null) : null,
      };
      const { error } = await supabase.from("pupils").update(payload).eq("id", pupil.id);
      if (error) throw error;
      toast.success("Theory test updated");
      qc.invalidateQueries({ queryKey: ["pupil-profile"] });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Theory test</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not taken</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Not passed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(status === "booked" || status === "passed" || status === "failed") && (
            <div className="space-y-1.5">
              <Label>{status === "booked" ? "Date booked" : "Test date"}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}

          {(status === "booked" || status === "passed") && (
            <div className="space-y-1.5">
              <Label>Theory centre</Label>
              <Select value={centreId || "__none__"} onValueChange={(v) => setCentreId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select a centre…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {centres.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.postcode ? ` · ${c.postcode}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {status === "passed" && (
            <div className="space-y-1.5">
              <Label>Certificate number</Label>
              <Input value={cert} onChange={(e) => setCert(e.target.value)} placeholder="Optional" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
