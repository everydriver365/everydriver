import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MessageSquare, Mail, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
  phone: string | null;
  email: string | null;
  profile_image_url?: string | null;
}

interface OwesMoneyCardProps {
  pupils: Pupil[];
  instructorId: string;
  instructorName: string;
  paymentLink?: string | null;
}

export function OwesMoneyCard({ pupils, instructorId, instructorName, paymentLink }: OwesMoneyCardProps) {
  const [chasing, setChasing] = useState<string | null>(null);

  const debtors = [...pupils]
    .filter((p) => (p.account_balance || 0) < 0)
    .sort((a, b) => (a.account_balance || 0) - (b.account_balance || 0));

  if (debtors.length === 0) return null;

  const totalOwed = debtors.reduce((sum, p) => sum + Math.abs(p.account_balance || 0), 0);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleChase = async (pupil: Pupil, method: "sms" | "email") => {
    const key = `${pupil.id}-${method}`;
    setChasing(key);

    try {
      const amount = Math.abs(pupil.account_balance || 0).toFixed(2);
      const paymentLinkLine = paymentLink ? `\n\nPay now: ${paymentLink}` : "";
      const paymentLinkHtml = paymentLink
        ? `<p><a href="${paymentLink}" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Pay £${amount} Now</a></p><p style="font-size:12px;color:#888;">Or copy this link: ${paymentLink}</p>`
        : "";

      if (method === "sms") {
        if (!pupil.phone) {
          toast.error("No phone number on file for this pupil");
          return;
        }
        await supabase.functions.invoke("send-sms", {
          body: {
            to: pupil.phone,
            message: `Hi ${pupil.name.split(" ")[0]}, this is a friendly reminder from ${instructorName} that you have an outstanding balance of £${amount} for driving lessons. Please arrange payment at your earliest convenience.${paymentLinkLine} Thank you!`,
          },
        });
        toast.success(`Payment reminder sent to ${pupil.name} via SMS`);
      } else {
        if (!pupil.email) {
          toast.error("No email on file for this pupil");
          return;
        }
        await supabase.functions.invoke("send-email", {
          body: {
            to: pupil.email,
            subject: `Payment Reminder — £${amount} outstanding`,
            html: `<p>Hi ${pupil.name.split(" ")[0]},</p><p>This is a friendly reminder that you have an outstanding balance of <strong>£${amount}</strong> for driving lessons with ${instructorName}.</p>${paymentLinkHtml}<p>Please arrange payment at your earliest convenience.</p><p>Thank you!</p>`,
          },
        });
        toast.success(`Payment reminder sent to ${pupil.name} via email`);
      }

      // Log the followup
      await supabase.from("followup_log").insert({
        instructor_id: instructorId,
        pupil_id: pupil.id,
        channel: method,
        trigger_type: "manual_chase",
        message_content: `Payment reminder for £${amount}`,
      });
    } catch (e) {
      console.error("Chase error:", e);
      toast.error("Failed to send reminder");
    } finally {
      setChasing(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-card rounded-2xl shadow-lift border border-rose-200 dark:border-rose-900/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-rose-100 dark:border-rose-900/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Owes Money</h3>
            <p className="text-xs text-muted-foreground">
              {debtors.length} pupil{debtors.length !== 1 ? "s" : ""} · £{totalOwed.toFixed(2)} total
            </p>
          </div>
        </div>
        {debtors.length > 1 && (
          <Link
            to="/instructor/send-reminder?bulk=1"
            className="text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 rounded-full px-3 py-1.5 transition active:scale-95"
          >
            Remind all
          </Link>
        )}
      </div>

      {/* Debtor list */}
      <div className="divide-y divide-border/50">
        {debtors.map((pupil) => {
          const amount = Math.abs(pupil.account_balance || 0);
          return (
            <div key={pupil.id} className="p-3 flex items-center gap-3">
              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={pupil.profile_image_url || undefined} alt={pupil.name} />
                <AvatarFallback className="bg-rose-100 dark:bg-rose-900/30 text-sm font-semibold text-rose-700 dark:text-rose-400">
                  {getInitials(pupil.name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <Link
                to={`/instructor/pupils?pupil=${pupil.id}`}
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-sm truncate">{pupil.name}</p>
                <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  Owes £{amount.toFixed(2)}
                </p>
              </Link>

              {/* Chase buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  onClick={() => handleChase(pupil, "sms")}
                  disabled={!!chasing || !pupil.phone}
                  title={pupil.phone ? "Send SMS reminder" : "No phone number"}
                >
                  {chasing === `${pupil.id}-sms` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  onClick={() => handleChase(pupil, "email")}
                  disabled={!!chasing || !pupil.email}
                  title={pupil.email ? "Send email reminder" : "No email address"}
                >
                  {chasing === `${pupil.id}-email` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
