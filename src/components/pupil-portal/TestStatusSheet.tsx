import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type Kind = "theory" | "driving";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: Kind;
  pupilId: string;
  initial: {
    theory_test_date?: string | null;
    theory_test_passed?: boolean | null;
    test_date?: string | null;
    test_time?: string | null;
    test_passed?: boolean | null;
  };
}

type Status = "not_taken" | "booked" | "passed" | "failed";

export function TestStatusSheet({ open, onOpenChange, kind, pupilId, initial }: Props) {
  const qc = useQueryClient();
  const isTheory = kind === "theory";
  const dateField = isTheory ? "theory_test_date" : "test_date";
  const passedField = isTheory ? "theory_test_passed" : "test_passed";
  const title = isTheory ? "Theory test" : "Driving test";

  const initDate = (initial[dateField as keyof typeof initial] as string | null | undefined) ?? "";
  const initPassed = initial[passedField as keyof typeof initial] as boolean | null | undefined;
  const initTime = (initial.test_time ?? "") as string;

  const initialStatus: Status =
    initPassed === true ? "passed" : initPassed === false ? "failed" : initDate ? "booked" : "not_taken";

  const [status, setStatus] = useState<Status>(initialStatus);
  const [date, setDate] = useState<string>(initDate ? String(initDate).slice(0, 10) : "");
  const [time, setTime] = useState<string>(initTime ? String(initTime).slice(0, 5) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      setDate(initDate ? String(initDate).slice(0, 10) : "");
      setTime(initTime ? String(initTime).slice(0, 5) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    setSaving(true);
    const payload: Record<string, any> = {};
    if (status === "passed") {
      payload[passedField] = true;
      payload[dateField] = date || null;
    } else if (status === "failed") {
      payload[passedField] = false;
      payload[dateField] = date || null;
    } else if (status === "booked") {
      payload[passedField] = null;
      payload[dateField] = date || null;
    } else {
      payload[passedField] = null;
      payload[dateField] = null;
    }
    if (!isTheory) {
      payload.test_time = status === "booked" && time ? time : status === "not_taken" ? null : (time || null);
    }

    const { error } = await supabase.from("pupils").update(payload).eq("id", pupilId);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${title} updated` });
    qc.invalidateQueries({ queryKey: ["pupil-home-extras", pupilId] });
    onOpenChange(false);
  };

  const StatusBtn = ({ value, label }: { value: Status; label: string }) => (
    <button
      type="button"
      onClick={() => setStatus(value)}
      className="px-3 py-2 text-sm rounded-lg border transition-colors"
      style={{
        borderColor: status === value ? "#0F2044" : "#E5E7EB",
        background: status === value ? "#0F2044" : "#fff",
        color: status === value ? "#fff" : "#0F2044",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Update your status — your instructor will see it instantly.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatusBtn value="not_taken" label={isTheory ? "Not taken" : "Not booked"} />
          <StatusBtn value="booked" label={isTheory ? "Booked" : "Booked"} />
          <StatusBtn value="passed" label="Passed" />
          <StatusBtn value="failed" label={isTheory ? "Failed" : "Didn't pass"} />
        </div>

        {status !== "not_taken" && (
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="t-date">Date</Label>
              <Input
                id="t-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {!isTheory && status === "booked" && (
              <div>
                <Label htmlFor="t-time">Time</Label>
                <Input
                  id="t-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
