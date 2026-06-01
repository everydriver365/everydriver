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

export function DrivingTestQuickEdit({ open, onOpenChange, pupil, onSaved }: Props) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("none");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [centreId, setCentreId] = useState<string>("");
  const [resultDate, setResultDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [centres, setCentres] = useState<Array<{ id: string; name: string; postcode: string | null }>>([]);

  useEffect(() => {
    if (!open || !pupil) return;
    const today = new Date().toISOString().slice(0, 10);
    const initial: Status =
      pupil.test_passed === true ? "passed"
      : (pupil.test_date && pupil.test_date >= today) ? "booked"
      : pupil.test_passed === false ? "failed"
      : "none";
    setStatus(initial);
    setDate(pupil.test_date || "");
    setTime(pupil.test_time ? String(pupil.test_time).slice(0, 5) : "");
    setCentreId(pupil.test_centre_id || "");
    setResultDate(pupil.test_result_date || "");
  }, [open, pupil?.id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("test_centres")
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
        test_passed:
          status === "passed" ? true
          : status === "failed" ? false
          : null,
        test_date: status === "booked" ? (date || null) : (status === "none" ? null : (date || null)),
        test_time: status === "booked" ? (time || null) : null,
        test_centre_id: (status === "booked" || status === "passed" || status === "failed") ? (centreId || null) : null,
        test_result_date: (status === "passed" || status === "failed") ? (resultDate || null) : null,
      };
      const { error } = await supabase.from("pupils").update(payload).eq("id", pupil.id);
      if (error) throw error;
      toast.success("Driving test updated");
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
          <DialogTitle>Driving test</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not booked</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Not passed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "booked" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {(status === "passed" || status === "failed") && (
            <div className="space-y-1.5">
              <Label>Result date</Label>
              <Input type="date" value={resultDate} onChange={(e) => setResultDate(e.target.value)} />
            </div>
          )}

          {(status === "booked" || status === "passed" || status === "failed") && (
            <div className="space-y-1.5">
              <Label>Test centre</Label>
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
