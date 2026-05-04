import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { triggerFamulorCall, type FamulorPurpose } from "@/lib/famulorClient";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pupilId: string;
  pupilName?: string;
  pupilPhone?: string | null;
}

const PURPOSES: { id: FamulorPurpose; label: string; sub: string }[] = [
  { id: "reminder",   label: "Lesson reminder",   sub: "Confirm the next lesson, offer to reschedule." },
  { id: "win_back",   label: "Win-back",          sub: "Re-engage a dormant pupil." },
  { id: "custom",     label: "Custom message",    sub: "Use your own brief for this single call." },
];

export function AiCallPupilSheet({ open, onOpenChange, pupilId, pupilName, pupilPhone }: Props) {
  const [purpose, setPurpose] = useState<FamulorPurpose>("reminder");
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!pupilPhone) {
      toast.error("This pupil has no phone number on file.");
      return;
    }
    setBusy(true);
    try {
      await triggerFamulorCall({
        pupil_id: pupilId,
        purpose,
        custom_prompt: purpose === "custom" ? customPrompt : undefined,
      });
      toast.success(`AI call queued for ${pupilName ?? "pupil"}`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not queue AI call");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[16px]">
        <SheetHeader>
          <SheetTitle>AI call {pupilName ?? "pupil"}</SheetTitle>
          <SheetDescription>
            Famulor will dial {pupilPhone ?? "—"} on your behalf and send you the transcript.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 py-4">
          {PURPOSES.map((p) => {
            const selected = purpose === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPurpose(p.id)}
                className={`text-left rounded-[12px] border px-3 py-2.5 transition ${selected ? "border-[#1A52A0] bg-[#EDF2FE]" : "border-[#E5E5EA] bg-white"}`}
              >
                <div className="text-[14px] font-medium">{p.label}</div>
                <div className="text-[12px] text-muted-foreground">{p.sub}</div>
              </button>
            );
          })}
          {purpose === "custom" && (
            <div className="pt-1">
              <Label className="text-[12px]">Brief for the agent</Label>
              <Textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Ask if they want to add a 2-hour lesson next Tuesday after work."
              />
            </div>
          )}
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="flex-1">
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} style={{ backgroundColor: "#1A52A0" }} className="flex-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PhoneCall className="h-4 w-4 mr-2" />}
            Place call
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
