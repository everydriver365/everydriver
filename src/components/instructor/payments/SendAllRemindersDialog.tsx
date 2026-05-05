import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, MessageSquare, AlertCircle, Check, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import type { OutstandingPupil } from "@/hooks/useInstructorPaymentsData";

type PupilContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  account_balance: number | null;
};

type Channel = "sms" | "email";

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export function SendAllRemindersDialog({
  open, onOpenChange, outstanding, allPupils, instructorId, instructorName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  outstanding: OutstandingPupil[];
  allPupils: PupilContact[];
  instructorId?: string;
  instructorName?: string;
}) {
  const [channel] = useState<Channel>("sms");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; failures: string[] } | null>(null);

  // Merge outstanding (amount, due) with contact details
  const candidates = useMemo(() => {
    const byId = new Map(allPupils.map(p => [p.id, p]));
    return outstanding.map(o => {
      const c = byId.get(o.id);
      return {
        id: o.id,
        name: o.name,
        amount: o.amount,
        daysOverdue: o.daysOverdue,
        daysUntilDue: o.daysUntilDue,
        phone: c?.phone ?? null,
        email: c?.email ?? null,
      };
    });
  }, [outstanding, allPupils]);

  const eligible = useMemo(
    () => candidates.filter(c => (channel === "sms" ? !!c.phone : !!c.email)),
    [candidates, channel],
  );
  const ineligible = useMemo(
    () => candidates.filter(c => !(channel === "sms" ? !!c.phone : !!c.email)),
    [candidates, channel],
  );

  // Reset selection when dialog opens or channel changes
  useEffect(() => {
    if (open) {
      setSelected(new Set(eligible.map(c => c.id)));
      setProgress(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channel]);

  const allChecked = eligible.length > 0 && selected.size === eligible.length;
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(eligible.map(c => c.id)));
  };
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const send = async () => {
    if (!instructorId) { toast.error("Not signed in"); return; }
    const list = eligible.filter(c => selected.has(c.id));
    if (list.length === 0) { toast.error("Select at least one pupil"); return; }

    setSending(true);
    setProgress({ done: 0, total: list.length, failures: [] });
    const failures: string[] = [];
    let done = 0;

    for (const p of list) {
      try {
        const amount = p.amount.toFixed(2);
        const firstName = p.name.split(" ")[0];
        const fromName = instructorName || "your instructor";

        if (channel === "sms") {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: p.phone,
              message: `Hi ${firstName}, friendly reminder from ${fromName} — you have an outstanding balance of £${amount}. Thank you!`,
            },
          });
        } else {
          await supabase.functions.invoke("send-email", {
            body: {
              to: p.email,
              subject: `Payment reminder — £${amount} outstanding`,
              html: `<p>Hi ${firstName},</p><p>Friendly reminder: you have an outstanding balance of <strong>£${amount}</strong> with ${fromName}.</p><p>Thank you!</p>`,
            },
          });
        }

        await supabase.from("followup_log").insert({
          instructor_id: instructorId,
          pupil_id: p.id,
          channel,
          trigger_type: "manual_chase_bulk",
          message_content: `Payment reminder for £${amount}`,
        });
      } catch (e: any) {
        console.error("Reminder failed for", p.name, e);
        failures.push(p.name);
      } finally {
        done += 1;
        setProgress({ done, total: list.length, failures: [...failures] });
      }
    }

    setSending(false);
    if (failures.length === 0) {
      toast.success(`Reminders sent to ${list.length} pupil${list.length === 1 ? "" : "s"}`);
      onOpenChange(false);
    } else {
      toast.warning(`Sent ${list.length - failures.length} of ${list.length}. ${failures.length} failed.`);
    }
  };

  const totalAmount = eligible
    .filter(c => selected.has(c.id))
    .reduce((s, c) => s + c.amount, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!sending) onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send payment reminders</DialogTitle>
          <DialogDescription>
            Review pupils with outstanding balances. Reminders log to your followup history.
          </DialogDescription>
        </DialogHeader>

        {/* SMS-only reminders */}

        {/* Select-all */}
        {eligible.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={allChecked} onCheckedChange={toggleAll} disabled={sending} />
              <span>{selected.size} of {eligible.length} selected · {gbp(totalAmount)}</span>
            </label>
          </div>
        )}

        {/* Pupil list */}
        <div className="max-h-[280px] overflow-y-auto -mx-1 px-1">
          {eligible.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {candidates.length === 0
                ? "No outstanding balances."
                : `No pupils have a ${channel === "sms" ? "phone number" : "email address"} on file.`}
            </div>
          )}
          {eligible.map((p) => {
            const checked = selected.has(p.id);
            const overdue = p.daysOverdue !== undefined && p.daysOverdue > 0;
            const sent = progress && progress.done > 0 && !progress.failures.includes(p.name);
            return (
              <label
                key={p.id}
                className="flex items-center gap-3 py-2 px-1 border-b last:border-0 cursor-pointer hover:bg-muted/30 rounded-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleOne(p.id)}
                  disabled={sending}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {channel === "sms" ? p.phone : p.email}
                    {overdue && <span className="text-rose-600 ml-1">· {p.daysOverdue}d overdue</span>}
                  </div>
                </div>
                <div className="text-sm font-medium tabular-nums">{gbp(p.amount)}</div>
                {sending && checked && progress && progress.done < progress.total && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                {!sending && progress && checked && (
                  progress.failures.includes(p.name)
                    ? <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                    : <Check className="h-3.5 w-3.5 text-emerald-600" />
                )}
              </label>
            );
          })}
        </div>

        {/* Ineligible footnote */}
        {ineligible.length > 0 && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-md p-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              {ineligible.length} pupil{ineligible.length === 1 ? "" : "s"} skipped — no {channel === "sms" ? "phone number" : "email"} on file:
              {" "}{ineligible.slice(0, 3).map(p => p.name).join(", ")}
              {ineligible.length > 3 && ` +${ineligible.length - 3} more`}
            </span>
          </div>
        )}

        {/* Progress */}
        {sending && progress && (
          <div className="text-xs text-muted-foreground text-center">
            Sending… {progress.done} of {progress.total}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending || selected.size === 0}>
            {sending
              ? `Sending… (${progress?.done ?? 0}/${progress?.total ?? 0})`
              : `Send ${selected.size} ${channel === "sms" ? "SMS" : "email"}${selected.size === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
