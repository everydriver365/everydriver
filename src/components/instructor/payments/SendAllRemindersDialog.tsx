import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, MessageSquare, AlertCircle, Check, Loader2, MessageCircle, Send, X } from "lucide-react";
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

type Channel = "sms" | "email" | "whatsapp" | "in_app";

const CHANNEL_META: Record<Channel, { label: string; Icon: any; field: "phone" | "email" | null }> = {
  email:    { label: "Email",    Icon: Mail,          field: "email" },
  sms:      { label: "Text",     Icon: MessageSquare, field: "phone" },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle, field: "phone" },
  in_app:   { label: "In-app",   Icon: Send,          field: null   },
};
const ALL_CHANNELS: Channel[] = ["email", "sms", "whatsapp", "in_app"];

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

type Candidate = {
  id: string;
  name: string;
  amount: number;
  daysOverdue?: number;
  daysUntilDue?: number;
  phone: string | null;
  email: string | null;
};

type ChannelStatus = "ready" | "missing-phone" | "missing-email";

function channelStatusFor(p: Candidate, ch: Channel): ChannelStatus {
  const f = CHANNEL_META[ch].field;
  if (!f) return "ready";
  if (f === "phone") return p.phone ? "ready" : "missing-phone";
  return p.email ? "ready" : "missing-email";
}

function buildMessage(p: Candidate, ch: Channel, fromName: string): { subject?: string; body: string; html?: string } {
  const firstName = p.name.split(" ")[0];
  const amount = p.amount.toFixed(2);
  const shortMsg = `Hi ${firstName}, friendly reminder from ${fromName} — you have an outstanding balance of £${amount}. Thank you!`;
  if (ch === "email") {
    return {
      subject: `Payment reminder — £${amount} outstanding`,
      body: `Hi ${firstName},\n\nFriendly reminder: you have an outstanding balance of £${amount} with ${fromName}.\n\nThank you!`,
      html: `<p>Hi ${firstName},</p><p>Friendly reminder: you have an outstanding balance of <strong>£${amount}</strong> with ${fromName}.</p><p>Thank you!</p>`,
    };
  }
  return { body: shortMsg };
}

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
  const [channels, setChannels] = useState<Set<Channel>>(new Set(["sms"]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; failures: string[] } | null>(null);

  // Merge outstanding (amount, due) with contact details
  const candidates = useMemo<Candidate[]>(() => {
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

  const eligibleChannelsFor = (c: Candidate): Channel[] =>
    Array.from(channels).filter((ch) => channelStatusFor(c, ch) === "ready");

  const eligible   = useMemo(() => candidates.filter(c => eligibleChannelsFor(c).length > 0), [candidates, channels]);
  const ineligible = useMemo(() => candidates.filter(c => eligibleChannelsFor(c).length === 0), [candidates, channels]);

  useEffect(() => {
    if (open) {
      setSelected(new Set(eligible.map(c => c.id)));
      setProgress(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, Array.from(channels).sort().join(",")]);

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
  const toggleChannel = (c: Channel) =>
    setChannels(prev => {
      const next = new Set(prev);
      if (next.has(c)) {
        if (next.size > 1) next.delete(c);
      } else next.add(c);
      return next;
    });

  const sendInApp = async (pupilId: string, content: string) => {
    if (!instructorId) throw new Error("Missing instructor");
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("instructor_id", instructorId)
      .eq("pupil_id", pupilId)
      .maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ instructor_id: instructorId, pupil_id: pupilId, last_message_preview: content, last_message_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) throw error;
      convId = created.id;
    } else {
      await supabase
        .from("conversations")
        .update({ last_message_preview: content, last_message_at: new Date().toISOString() })
        .eq("id", convId);
    }
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: convId,
      sender_type: "instructor",
      sender_id: instructorId,
      content,
    });
    if (msgErr) throw msgErr;
  };

  const sendOne = async (p: Candidate, ch: Channel, fromName: string) => {
    const msg = buildMessage(p, ch, fromName);
    if (ch === "sms") {
      await supabase.functions.invoke("send-sms", { body: { to: p.phone, message: msg.body } });
    } else if (ch === "whatsapp") {
      await supabase.functions.invoke("send-whatsapp", { body: { to: p.phone, message: msg.body } });
    } else if (ch === "email") {
      await supabase.functions.invoke("send-email", {
        body: { to: p.email, subject: msg.subject, html: msg.html },
      });
    } else if (ch === "in_app") {
      await sendInApp(p.id, msg.body);
    }

    await supabase.from("followup_log").insert({
      instructor_id: instructorId!,
      pupil_id: p.id,
      channel: ch,
      trigger_type: "manual_chase_bulk",
      message_content: `Payment reminder for £${p.amount.toFixed(2)}`,
    });
  };

  const send = async () => {
    if (!instructorId) { toast.error("Not signed in"); return; }
    if (channels.size === 0) { toast.error("Pick at least one channel"); return; }
    const list = eligible.filter(c => selected.has(c.id));
    if (list.length === 0) { toast.error("Select at least one pupil"); return; }

    const tasks = list.flatMap((p) => eligibleChannelsFor(p).map((ch) => ({ p, ch })));

    setSending(true);
    setProgress({ done: 0, total: tasks.length, failures: [] });
    const failures: string[] = [];
    let done = 0;
    const fromName = instructorName || "your instructor";

    for (const { p, ch } of tasks) {
      try {
        await sendOne(p, ch, fromName);
      } catch (e: any) {
        console.error(`Reminder failed for ${p.name} via ${ch}`, e);
        failures.push(`${p.name} (${CHANNEL_META[ch].label})`);
      } finally {
        done += 1;
        setProgress({ done, total: tasks.length, failures: [...failures] });
      }
    }

    setSending(false);
    const pupilCount = list.length;
    const channelCount = channels.size;
    if (failures.length === 0) {
      toast.success(
        `Sent ${tasks.length} reminder${tasks.length === 1 ? "" : "s"} to ${pupilCount} pupil${pupilCount === 1 ? "" : "s"} across ${channelCount} channel${channelCount === 1 ? "" : "s"}`
      );
      onOpenChange(false);
    } else {
      toast.warning(`Sent ${tasks.length - failures.length} of ${tasks.length}. ${failures.length} failed.`);
    }
  };

  const totalAmount = eligible
    .filter(c => selected.has(c.id))
    .reduce((s, c) => s + c.amount, 0);

  const totalSends = useMemo(
    () => eligible.filter(c => selected.has(c.id))
      .reduce((sum, c) => sum + eligibleChannelsFor(c).length, 0),
    [eligible, selected, channels],
  );

  // Skip summary: count missing-phone / missing-email across selected pupils × selected channels
  const skipSummary = useMemo(() => {
    let missingPhone = 0;
    let missingEmail = 0;
    const selectedList = candidates.filter(c => selected.has(c.id) || ineligible.includes(c));
    for (const p of selectedList) {
      for (const ch of channels) {
        const s = channelStatusFor(p, ch);
        if (s === "missing-phone") missingPhone++;
        else if (s === "missing-email") missingEmail++;
      }
    }
    return { missingPhone, missingEmail, total: missingPhone + missingEmail };
  }, [candidates, selected, channels, ineligible]);

  const reasonLabel = (s: ChannelStatus) =>
    s === "missing-phone" ? "no phone on file" : s === "missing-email" ? "no email on file" : "";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!sending) onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send payment reminders</DialogTitle>
          <DialogDescription>
            Pick one or more channels. Each pupil receives the reminder on every selected channel they have a contact for.
          </DialogDescription>
        </DialogHeader>

        {/* Channel picker */}
        <div className="grid grid-cols-4 gap-1.5 rounded-md bg-muted/40 p-1">
          {ALL_CHANNELS.map((c) => {
            const m = CHANNEL_META[c];
            const active = channels.has(c);
            return (
              <button
                key={c}
                type="button"
                disabled={sending}
                onClick={() => toggleChannel(c)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium transition border ${
                  active
                    ? "bg-background shadow-sm text-foreground border-primary/40"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <m.Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {eligible.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={allChecked} onCheckedChange={toggleAll} disabled={sending} />
              <span>{selected.size} of {eligible.length} selected · {gbp(totalAmount)} · {totalSends} send{totalSends === 1 ? "" : "s"}</span>
            </label>
          </div>
        )}

        {/* Pupil list */}
        <div className="max-h-[280px] overflow-y-auto -mx-1 px-1">
          {candidates.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No outstanding balances.
            </div>
          )}
          {candidates.map((p) => {
            const checked = selected.has(p.id);
            const overdue = p.daysOverdue !== undefined && p.daysOverdue > 0;
            const pupilEligibleChs = eligibleChannelsFor(p);
            const isEligible = pupilEligibleChs.length > 0;
            const channelList = Array.from(channels);

            return (
              <label
                key={p.id}
                className={`flex items-start gap-3 py-2 px-1 border-b last:border-0 rounded-sm ${
                  isEligible ? "cursor-pointer hover:bg-muted/30" : "opacity-70 cursor-not-allowed"
                }`}
              >
                {isEligible ? (
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOne(p.id)}
                    disabled={sending}
                    className="mt-0.5"
                  />
                ) : (
                  <div className="h-4 w-4 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    {overdue && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                        {p.daysOverdue}d overdue
                      </span>
                    )}
                  </div>

                  {/* Per-channel status chips */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {channelList.map((ch) => {
                      const m = CHANNEL_META[ch];
                      const status = channelStatusFor(p, ch);
                      const ready = status === "ready";
                      return (
                        <span
                          key={ch}
                          title={ready ? `Will send via ${m.label}` : reasonLabel(status)}
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                            ready
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {ready ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                          <m.Icon className="h-2.5 w-2.5" />
                          {m.label}
                        </span>
                      );
                    })}
                  </div>

                  {!isEligible && (
                    <div className="text-[11px] text-rose-700 mt-1">
                      Skipped on all channels — no phone or email on file
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium tabular-nums whitespace-nowrap">{gbp(p.amount)}</div>
                {sending && checked && progress && progress.done < progress.total && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mt-1" />
                )}
                {!sending && progress && checked && (
                  progress.failures.some((f) => f.startsWith(p.name + " ("))
                    ? <AlertCircle className="h-3.5 w-3.5 text-rose-600 mt-1" />
                    : <Check className="h-3.5 w-3.5 text-emerald-600 mt-1" />
                )}
              </label>
            );
          })}
        </div>

        {/* Summary */}
        {(totalSends > 0 || skipSummary.total > 0) && !sending && (
          <div className="text-[11px] text-muted-foreground">
            <span className="text-foreground font-medium">{totalSends}</span> will send
            {skipSummary.total > 0 && (
              <>
                {" · "}
                <span className="text-amber-700 font-medium">{skipSummary.total}</span> skipped
                {" ("}
                {skipSummary.missingEmail > 0 && <>{skipSummary.missingEmail} missing email</>}
                {skipSummary.missingEmail > 0 && skipSummary.missingPhone > 0 && <>, </>}
                {skipSummary.missingPhone > 0 && <>{skipSummary.missingPhone} missing phone</>}
                {")"}
              </>
            )}
          </div>
        )}

        {/* Per-channel preview */}
        {selected.size > 0 && !sending && (
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Preview ({selected.size} pupil{selected.size === 1 ? "" : "s"})
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-3">
              {eligible
                .filter(c => selected.has(c.id))
                .map((p) => {
                  const fromName = instructorName || "your instructor";
                  return (
                    <div key={p.id} className="text-xs leading-relaxed">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-medium text-foreground">{p.name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground tabular-nums">{gbp(p.amount)}</span>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {Array.from(channels).map((ch) => {
                          const m = CHANNEL_META[ch];
                          const status = channelStatusFor(p, ch);
                          if (status !== "ready") {
                            return (
                              <div key={ch} className="flex items-start gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                  <X className="h-2.5 w-2.5" />
                                  <m.Icon className="h-2.5 w-2.5" />
                                  {m.label}
                                </span>
                                <span className="text-rose-700 text-[11px] pt-0.5">
                                  Skipped — {reasonLabel(status)}
                                </span>
                              </div>
                            );
                          }
                          const msg = buildMessage(p, ch, fromName);
                          return (
                            <div key={ch} className="flex items-start gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <Check className="h-2.5 w-2.5" />
                                <m.Icon className="h-2.5 w-2.5" />
                                {m.label}
                              </span>
                              <div className="flex-1 min-w-0 pl-1 border-l-2 border-primary/30 ml-1 px-2 text-muted-foreground italic">
                                {msg.subject && (
                                  <div className="not-italic font-medium text-foreground/80 text-[11px] mb-0.5">
                                    {msg.subject}
                                  </div>
                                )}
                                <div className="whitespace-pre-line">{msg.body}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {sending && progress && (
          <div className="text-xs text-muted-foreground text-center">
            Sending… {progress.done} of {progress.total}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending || selected.size === 0 || totalSends === 0}>
            {sending
              ? `Sending… (${progress?.done ?? 0}/${progress?.total ?? 0})`
              : `Send ${totalSends} reminder${totalSends === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
