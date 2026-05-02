import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Send, Loader2 } from "lucide-react";
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
}

export default function InstructorSendReminder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const pupilId = params.get("pupilId");
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const instructorName = instructor?.name || "Your Instructor";

  const [pupil, setPupil] = useState<PupilRow | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("sms");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pupilId || !instructorId) return;
    (async () => {
      const [{ data: p }, { data: i }] = await Promise.all([
        supabase
          .from("pupils")
          .select("id, name, phone, email, account_balance")
          .eq("id", pupilId)
          .maybeSingle(),
        supabase
          .from("instructors")
          .select("payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays")
          .eq("id", instructorId)
          .maybeSingle(),
      ]);
      setPupil(p as PupilRow | null);
      setPaymentLink(i ? getActivePaymentQrUrl(i) : null);
      setLoaded(true);
    })();
  }, [pupilId, instructorId]);

  const amount = useMemo(
    () => Math.abs(pupil?.account_balance || 0),
    [pupil?.account_balance]
  );
  const amountStr = amount.toFixed(2);
  const firstName = pupil?.name?.split(" ")[0] || "there";

  // Default channel based on availability
  useEffect(() => {
    if (!pupil) return;
    if (pupil.phone) setChannel("sms");
    else setChannel("in-app");
  }, [pupil]);

  // Prefill message
  useEffect(() => {
    if (!pupil) return;
    setMessage(`Hi ${firstName}, just a reminder your balance is £${amountStr}.`);
  }, [pupil, firstName, amountStr]);

  const linkSuffix = paymentLink ? `\n\nPay now: ${paymentLink}` : "";

  const quickMessages = [
    {
      id: "pay-now",
      label: `Pay £${amountStr} now`,
      text: `Hi ${firstName}, please settle your outstanding balance of £${amountStr} when you can.${linkSuffix}`,
    },
    {
      id: "friendly",
      label: "Friendly reminder",
      text: `Hi ${firstName}, just a friendly reminder that you have £${amountStr} outstanding for your lessons. Thanks!${linkSuffix}`,
    },
    {
      id: "due",
      label: "Due today",
      text: `Hi ${firstName}, your balance of £${amountStr} is due today. Please arrange payment at your earliest convenience.${linkSuffix}`,
    },
    {
      id: "overdue",
      label: "Overdue notice",
      text: `Hi ${firstName}, your balance of £${amountStr} is now overdue. Please make payment as soon as possible to avoid disruption to your lessons.${linkSuffix}`,
    },
  ];

  const handleQuick = (text: string) => {
    haptics.selection();
    setMessage(text);
  };

  const handleSend = async () => {
    if (!pupil || !instructorId || sending) return;
    if (!message.trim()) return;
    haptics.selection();
    setSending(true);
    try {
      if (channel === "sms") {
        if (!pupil.phone) {
          toast.error("No phone number on file");
          setSending(false);
          return;
        }
        const { error } = await supabase.functions.invoke("send-sms", {
          body: { to: pupil.phone, message: message.trim() },
        });
        if (error) throw error;
      } else if (channel === "whatsapp") {
        if (!pupil.phone) {
          toast.error("No phone number on file");
          setSending(false);
          return;
        }
        const { error } = await supabase.functions.invoke("send-whatsapp", {
          body: { to: pupil.phone, message: message.trim() },
        });
        if (error) throw error;
      } else {
        // in-app: insert into conversations + messages
        let convId: string | null = null;
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructorId)
          .eq("pupil_id", pupil.id)
          .maybeSingle();
        if (existing) {
          convId = existing.id;
        } else {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({ instructor_id: instructorId, pupil_id: pupil.id })
            .select("id")
            .single();
          convId = newConv?.id || null;
        }
        if (!convId) throw new Error("Could not start conversation");
        const { error } = await supabase.from("messages").insert({
          conversation_id: convId,
          sender_type: "instructor",
          sender_id: instructorId,
          content: message.trim(),
        });
        if (error) throw error;
        supabase.functions
          .invoke("notify-pupil", {
            body: {
              pupilId: pupil.id,
              type: "lesson_reminder",
              title: "Payment Reminder",
              body: message.trim().slice(0, 80),
            },
          })
          .catch(() => {});
      }

      // Log followup (best effort)
      supabase
        .from("followup_log")
        .insert({
          instructor_id: instructorId,
          pupil_id: pupil.id,
          channel,
          trigger_type: "manual_chase",
          message_content: `Payment reminder for £${amountStr}`,
        })
        .then(() => {});

      // Close screen, no confirmation popup
      navigate(-1);
    } catch (e) {
      console.error("Send reminder error:", e);
      toast.error("Failed to send reminder");
      setSending(false);
    }
  };

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
          <h1 className="text-[20px] font-bold text-[#1c1c1e] tracking-tight">
            Send Reminder
          </h1>
        </div>

        {!loaded ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" />
          </div>
        ) : !pupil ? (
          <div className="mt-10 text-center text-sm text-[#71717A]">
            Pupil not found.
          </div>
        ) : (
          <>
            {/* Pupil summary */}
            <div
              className="mt-2 rounded-2xl p-4 flex items-center justify-between"
              style={{
                background:
                  "linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 70%)",
                border: "1px solid rgba(220,38,38,0.15)",
              }}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9F1239]">
                  Outstanding
                </p>
                <p className="mt-0.5 text-[18px] font-semibold text-[#1c1c1e] truncate">
                  {pupil.name}
                </p>
              </div>
              <p className="text-[26px] font-bold text-[#DC2626] tabular-nums leading-none">
                £{amountStr}
              </p>
            </div>

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
              {paymentLink && (
                <p className="mt-1.5 px-1 text-[11px] text-[#71717A]">
                  Payment link will be included automatically.
                </p>
              )}
            </div>

            {/* Send via */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#71717A] mb-2 px-1">
                Send via
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "sms", label: "SMS", disabled: !pupil.phone },
                  { id: "whatsapp", label: "WhatsApp", disabled: !pupil.phone },
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
      {pupil && (
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
            Send Reminder
          </button>
        </div>
      )}
    </InstructorPortalLayout>
  );
}
