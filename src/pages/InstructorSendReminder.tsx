import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2, ChevronRight, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { haptics } from "@/lib/haptics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Channel = "sms" | "whatsapp" | "in-app";

interface PupilRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  account_balance: number | null;
  postcode: string | null;
  pickup_postcode: string | null;
}

const getPostcode = (p: PupilRow) => (p.postcode || p.pickup_postcode || "").trim();
const postcodeOutward = (pc: string) => pc.toUpperCase().split(/\s+/)[0] || "";

const renderTemplate = (tpl: string, name: string, amount: string) =>
  tpl.replace(/\{name\}/g, name).replace(/\{amount\}/g, amount);

export default function InstructorSendReminder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const pupilIdParam = params.get("pupilId");
  const isBulk = params.get("bulk") === "1";
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  const [pupils, setPupils] = useState<PupilRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("sms");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editingRecipients, setEditingRecipients] = useState(false);

  // Load pupils + instructor
  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      const instructorPromise = supabase
        .from("instructors")
        .select("payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays")
        .eq("id", instructorId)
        .maybeSingle();

      if (isBulk) {
        const [{ data: list }, { data: i }] = await Promise.all([
          supabase
            .from("pupils")
            .select("id, name, phone, email, account_balance, postcode, pickup_postcode")
            .eq("instructor_id", instructorId)
            .is("deleted_at", null)
            .lt("account_balance", 0)
            .order("account_balance", { ascending: true }),
          instructorPromise,
        ]);
        const rows = (list || []) as PupilRow[];
        setPupils(rows);
        setSelectedIds(new Set(rows.map((p) => p.id)));
        setPaymentLink(i ? getActivePaymentQrUrl(i) : null);
      } else if (pupilIdParam) {
        const [{ data: p }, { data: i }] = await Promise.all([
          supabase
            .from("pupils")
            .select("id, name, phone, email, account_balance, postcode, pickup_postcode")
            .eq("id", pupilIdParam)
            .maybeSingle(),
          instructorPromise,
        ]);
        if (p) {
          setPupils([p as PupilRow]);
          setSelectedIds(new Set([(p as PupilRow).id]));
        }
        setPaymentLink(i ? getActivePaymentQrUrl(i) : null);
      }
      setLoaded(true);
    })();
  }, [pupilIdParam, instructorId, isBulk]);

  const selectedPupils = useMemo(
    () => pupils.filter((p) => selectedIds.has(p.id)),
    [pupils, selectedIds]
  );

  const totalOwed = useMemo(
    () => selectedPupils.reduce((sum, p) => sum + Math.abs(p.account_balance || 0), 0),
    [selectedPupils]
  );

  const singleAmount = useMemo(
    () => Math.abs(selectedPupils[0]?.account_balance || 0).toFixed(2),
    [selectedPupils]
  );
  const singleFirstName = selectedPupils[0]?.name?.split(" ")[0] || "there";

  const linkSuffix = paymentLink ? `\n\nPay now: ${paymentLink}` : "";

  // Default channel
  useEffect(() => {
    if (!loaded) return;
    const anyPhone = selectedPupils.some((p) => !!p.phone);
    setChannel(anyPhone ? "sms" : "in-app");
  }, [loaded, selectedPupils.length]); // eslint-disable-line

  // Prefill message (tokenised in bulk, resolved in single)
  useEffect(() => {
    if (!loaded || selectedPupils.length === 0) return;
    if (isBulk) {
      setMessage(`Hi {name}, just a reminder your balance is £{amount}.`);
    } else {
      setMessage(`Hi ${singleFirstName}, just a reminder your balance is £${singleAmount}.`);
    }
  }, [loaded, isBulk, singleFirstName, singleAmount, selectedPupils.length]);

  const quickMessages = isBulk
    ? [
        { id: "pay-now", label: "Pay {amount} now", text: `Hi {name}, please settle your outstanding balance of £{amount} when you can.${linkSuffix}` },
        { id: "friendly", label: "Friendly reminder", text: `Hi {name}, just a friendly reminder that you have £{amount} outstanding for your lessons. Thanks!${linkSuffix}` },
        { id: "due", label: "Due today", text: `Hi {name}, your balance of £{amount} is due today. Please arrange payment at your earliest convenience.${linkSuffix}` },
        { id: "overdue", label: "Overdue notice", text: `Hi {name}, your balance of £{amount} is now overdue. Please make payment as soon as possible to avoid disruption to your lessons.${linkSuffix}` },
      ]
    : [
        { id: "pay-now", label: `Pay £${singleAmount} now`, text: `Hi ${singleFirstName}, please settle your outstanding balance of £${singleAmount} when you can.${linkSuffix}` },
        { id: "friendly", label: "Friendly reminder", text: `Hi ${singleFirstName}, just a friendly reminder that you have £${singleAmount} outstanding for your lessons. Thanks!${linkSuffix}` },
        { id: "due", label: "Due today", text: `Hi ${singleFirstName}, your balance of £${singleAmount} is due today. Please arrange payment at your earliest convenience.${linkSuffix}` },
        { id: "overdue", label: "Overdue notice", text: `Hi ${singleFirstName}, your balance of £${singleAmount} is now overdue. Please make payment as soon as possible to avoid disruption to your lessons.${linkSuffix}` },
      ];

  const handleQuick = (text: string) => {
    haptics.selection();
    setMessage(text);
  };

  const sendOne = async (
    pupil: PupilRow,
    finalMessage: string
  ): Promise<{ ok: boolean; skipped?: string }> => {
    try {
      if (channel === "sms") {
        if (!pupil.phone) return { ok: false, skipped: "no-phone" };
        const { error } = await supabase.functions.invoke("send-sms", {
          body: { to: pupil.phone, message: finalMessage },
        });
        if (error) throw error;
      } else if (channel === "whatsapp") {
        if (!pupil.phone) return { ok: false, skipped: "no-phone" };
        const { error } = await supabase.functions.invoke("send-whatsapp", {
          body: { to: pupil.phone, message: finalMessage },
        });
        if (error) throw error;
      } else {
        let convId: string | null = null;
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId!)
          .eq("pupil_id", pupil.id)
          .maybeSingle();
        if (existing) {
          convId = (existing as any).id;
        } else {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({ instructor_id: instructorId!, pupil_id: pupil.id })
            .select("id")
            .single();
          convId = (newConv as any)?.id || null;
        }
        if (!convId) throw new Error("Could not start conversation");
        const { error } = await supabase.from("messages").insert({
          conversation_id: convId,
          sender_type: "instructor",
          sender_id: instructorId!,
          content: finalMessage,
        });
        if (error) throw error;
        supabase.functions
          .invoke("notify-pupil", {
            body: {
              pupilId: pupil.id,
              type: "lesson_reminder",
              title: "Payment Reminder",
              body: finalMessage.slice(0, 80),
            },
          })
          .catch(() => {});
      }

      // log followup
      supabase
        .from("followup_log")
        .insert({
          instructor_id: instructorId!,
          pupil_id: pupil.id,
          channel,
          trigger_type: "manual_chase",
          message_content: finalMessage.slice(0, 200),
        })
        .then(() => {});

      return { ok: true };
    } catch (e) {
      console.error("Send error for pupil", pupil.id, e);
      return { ok: false, skipped: "error" };
    }
  };

  const handleSend = async () => {
    if (!instructorId || sending) return;
    if (!message.trim() || selectedPupils.length === 0) return;
    haptics.selection();
    setSending(true);

    let sent = 0;
    let skippedNoPhone = 0;
    let failed = 0;

    for (const p of selectedPupils) {
      const amt = Math.abs(p.account_balance || 0).toFixed(2);
      const first = p.name?.split(" ")[0] || "there";
      const finalMsg = renderTemplate(message.trim(), first, amt);
      const result = await sendOne(p, finalMsg);
      if (result.ok) sent++;
      else if (result.skipped === "no-phone") skippedNoPhone++;
      else failed++;
    }

    // Single summary toast (no modal)
    const parts: string[] = [];
    if (sent > 0) parts.push(`Sent to ${sent}`);
    if (skippedNoPhone > 0) parts.push(`skipped ${skippedNoPhone} (no phone)`);
    if (failed > 0) parts.push(`${failed} failed`);
    if (sent > 0) toast.success(parts.join(" · "));
    else toast.error(parts.join(" · ") || "Nothing sent");

    navigate(-1);
  };

  const toggleRecipient = (id: string) => {
    haptics.selection();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const anySelectedHasPhone = selectedPupils.some((p) => !!p.phone);
  const headerTitle = isBulk
    ? `Send Reminder · ${selectedPupils.length} pupil${selectedPupils.length !== 1 ? "s" : ""}`
    : "Send Reminder";

  return (
    <InstructorPortalLayout>
      <div className="pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 py-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition"
            aria-label="Back"
          >
            <ArrowLeft size={20} color="#1c1c1e" />
          </button>
          <h1 className="text-[20px] font-bold text-[#1c1c1e] tracking-tight truncate">
            {headerTitle}
          </h1>
        </div>

        {!loaded ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" />
          </div>
        ) : selectedPupils.length === 0 && pupils.length === 0 ? (
          <div className="mt-10 text-center text-sm text-[#71717A]">
            {isBulk ? "No pupils currently owe money." : "Pupil not found."}
          </div>
        ) : (
          <>
            {/* Summary */}
            <div
              className="mt-2 rounded-2xl p-4 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 70%)",
                border: "1px solid rgba(220,38,38,0.15)",
              }}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9F1239]">
                  Outstanding
                </p>
                <p className="mt-0.5 text-[18px] font-semibold text-[#1c1c1e] truncate">
                  {isBulk
                    ? `${selectedPupils.length} pupil${selectedPupils.length !== 1 ? "s" : ""} owe you`
                    : selectedPupils[0]?.name}
                </p>
              </div>
              <p className="text-[26px] font-bold text-[#DC2626] tabular-nums leading-none">
                £{totalOwed.toFixed(2)}
              </p>
            </div>

            {/* Recipients (bulk only) */}
            {isBulk && (
              <button
                type="button"
                onClick={() => setEditingRecipients(true)}
                className="mt-3 w-full rounded-2xl bg-white border border-[#E4E4E7] px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#71717A]">
                    Recipients ({selectedPupils.length})
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#1c1c1e] truncate">
                    {selectedPupils.length === 0
                      ? "None selected"
                      : selectedPupils
                          .slice(0, 3)
                          .map((p) => `${p.name.split(" ")[0]} · £${Math.abs(p.account_balance || 0).toFixed(0)}`)
                          .join("  ") +
                        (selectedPupils.length > 3 ? `  +${selectedPupils.length - 3} more` : "")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#71717A] shrink-0 ml-2" />
              </button>
            )}

            {/* Quick messages */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#71717A] mb-2 px-1">
                Quick messages
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickMessages.map((q) => {
                  const active = message === q.text;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleQuick(q.text)}
                      className={cn(
                        "rounded-xl px-3 py-3 text-left text-[13.5px] font-semibold transition active:scale-[0.98]",
                        active
                          ? "bg-[#1c1c1e] text-white shadow-md"
                          : "bg-white text-[#1c1c1e] border border-[#E4E4E7]"
                      )}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom message */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#71717A] mb-2 px-1">
                Message
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-2xl bg-white border border-[#E4E4E7] p-3 text-[14.5px] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#1c1c1e]/10 resize-none"
              />
              <div className="mt-1.5 px-1 text-[11px] text-[#71717A] space-y-0.5">
                {isBulk && (
                  <p>
                    <span className="font-mono">{"{name}"}</span> and{" "}
                    <span className="font-mono">{"{amount}"}</span> are personalised per pupil.
                  </p>
                )}
                {paymentLink && <p>Payment link will be included automatically.</p>}
              </div>
            </div>

            {/* Send via */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#71717A] mb-2 px-1">
                Send via
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "sms", label: "SMS", disabled: !anySelectedHasPhone },
                  { id: "whatsapp", label: "WhatsApp", disabled: !anySelectedHasPhone },
                  { id: "in-app", label: "In-app", disabled: false },
                ] as { id: Channel; label: string; disabled: boolean }[]).map((opt) => {
                  const active = channel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        haptics.selection();
                        setChannel(opt.id);
                      }}
                      className={cn(
                        "rounded-xl py-2.5 text-[13px] font-semibold transition active:scale-[0.98]",
                        active
                          ? "bg-[#1c1c1e] text-white shadow-md"
                          : "bg-white text-[#1c1c1e] border border-[#E4E4E7]",
                        opt.disabled && "opacity-40"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky send bar */}
      {selectedPupils.length > 0 && (
        <div
          className="fixed left-0 right-0 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
          style={{
            bottom: 64,
            background:
              "linear-gradient(to top, rgba(244,247,246,1) 60%, rgba(244,247,246,0))",
          }}
        >
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className={cn(
              "w-full h-12 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(13,27,46,0.25)] active:scale-[0.98] transition",
              "bg-gradient-to-br from-[#0d1b2e] to-[#1c2b4a]",
              (sending || !message.trim()) && "opacity-60"
            )}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isBulk
              ? `Send to ${selectedPupils.length} pupil${selectedPupils.length !== 1 ? "s" : ""}`
              : "Send Reminder"}
          </button>
        </div>
      )}

      {/* Recipients editor sheet */}
      {editingRecipients && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setEditingRecipients(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl pb-[max(env(safe-area-inset-bottom),16px)] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="text-[17px] font-bold text-[#1c1c1e]">Recipients</h2>
              <button
                type="button"
                onClick={() => setEditingRecipients(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-black/5"
                aria-label="Close"
              >
                <X size={18} color="#1c1c1e" />
              </button>
            </div>
            <div className="px-4 pb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setSelectedIds(new Set(pupils.map((p) => p.id)));
                }}
                className="text-[12px] font-semibold text-[#1c1c1e] bg-[#F4F4F5] rounded-full px-3 py-1.5"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setSelectedIds(new Set());
                }}
                className="text-[12px] font-semibold text-[#1c1c1e] bg-[#F4F4F5] rounded-full px-3 py-1.5"
              >
                Clear
              </button>
              <div className="ml-auto text-[12px] text-[#71717A]">
                {selectedIds.size}/{pupils.length}
              </div>
            </div>
            <div className="overflow-y-auto px-2 pb-2">
              {pupils.map((p) => {
                const checked = selectedIds.has(p.id);
                const amt = Math.abs(p.account_balance || 0).toFixed(2);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleRecipient(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 active:scale-[0.99] transition text-left"
                  >
                    <div
                      className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center border-2 transition",
                        checked
                          ? "bg-[#1c1c1e] border-[#1c1c1e]"
                          : "bg-white border-[#D4D4D8]"
                      )}
                    >
                      {checked && <Check size={14} color="white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1c1c1e] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11.5px] text-[#71717A]">
                        £{amt} owed{!p.phone ? " · no phone" : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecipients(false)}
                className="w-full h-11 rounded-2xl bg-[#1c1c1e] text-white text-[14px] font-semibold active:scale-[0.98] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </InstructorPortalLayout>
  );
}
