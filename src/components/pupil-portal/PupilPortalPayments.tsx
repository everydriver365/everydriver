import { useState, useEffect } from "react";
import { CreditCard, Clock, PoundSterling, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { PupilPaymentModal } from "./PupilPaymentModal";

interface PupilPortalPaymentsProps {
  pupilId: string;
  instructorId: string;
  instructorSlug?: string;
  brandColour: string | null;
  darkMode: boolean;
  accountBalance: number | null;
  prepaidHours: number | null;
  pupilName?: string;
  pupilEmail?: string | null;
  pupilPhone?: string | null;
  onBalanceUpdate?: () => void;
}

interface PaymentRecord {
  id: string;
  amount: number;
  recorded_at: string;
  payment_method: string | null;
  notes: string | null;
}

export function PupilPortalPayments({ 
  pupilId, 
  instructorId,
  instructorSlug = "",
  brandColour, 
  darkMode,
  accountBalance,
  prepaidHours,
  pupilName = "Pupil",
  pupilEmail,
  pupilPhone,
  onBalanceUpdate
}: PupilPortalPaymentsProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [pupilId]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select("id, amount, recorded_at, payment_method, notes")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'd MMM yyyy');
  };

  const balance = accountBalance || 0;
  const hasCredit = balance > 0;
  const hasDebt = balance < 0;
  const accentColor = brandColour || 'hsl(var(--primary))';

  return (
    <div className="px-4 space-y-4 pb-24">
      {/* Hero Balance Card - matches money page gradient hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-none p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd, ${accentColor}bb)` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs">Account Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {hasDebt ? '-' : ''}£{Math.abs(balance).toFixed(2)}
              </span>
            </div>
            <p className="text-white/70 text-xs mt-1">
              {hasCredit && 'Credit on account'}
              {hasDebt && 'Amount owed'}
              {balance === 0 && 'All balanced'}
            </p>
          </div>
          <div className="text-right">
            {(prepaidHours || 0) > 0 && (
              <div>
                <p className="text-white/70 text-xs">Prepaid</p>
                <p className="text-xl font-bold">{prepaidHours}h</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row - matches money page 3-col grid */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-none border border-l-4 p-3 text-center"
          style={{ borderLeftColor: accentColor }}
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: `${accentColor}1a` }}>
            <PoundSterling className="h-4 w-4" style={{ color: accentColor }} />
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--brand-text, inherit)' }}>
            £{Math.abs(balance).toFixed(0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Balance</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-none border border-l-4 p-3 text-center"
          style={{ borderLeftColor: accentColor }}
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-1">
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--brand-text, inherit)' }}>
            {payments.length}
          </p>
          <p className="text-[10px] text-muted-foreground">Payments</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-none border border-l-4 p-3 text-center"
          style={{ borderLeftColor: accentColor }}
        >
          <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-1">
            <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--brand-text, inherit)' }}>
            {prepaidHours || 0}h
          </p>
          <p className="text-[10px] text-muted-foreground">Prepaid</p>
        </motion.div>
      </div>

      {/* Make Payment CTA */}
      {hasDebt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-none border border-l-4 p-4"
          style={{ borderLeftColor: accentColor }}
        >
          <p className="text-sm mb-3 text-muted-foreground">
            Pay your balance securely online
          </p>
          <Button 
            className="w-full text-white"
            style={{ backgroundColor: accentColor }}
            onClick={() => setPaymentModalOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        </motion.div>
      )}

      {/* Payment Modal */}
      <PupilPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        pupilId={pupilId}
        pupilName={pupilName}
        pupilEmail={pupilEmail || null}
        pupilPhone={pupilPhone || null}
        instructorId={instructorId}
        instructorSlug={instructorSlug}
        accountBalance={balance}
        brandColour={brandColour}
      />

      {/* Payment History - matches money page section card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-none border border-l-4"
        style={{ borderLeftColor: accentColor }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" style={{ color: accentColor }} />
            Payment History
          </h3>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-6">
              <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div>
                    <div className="font-medium text-sm">
                      £{payment.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(payment.recorded_at)}
                      {payment.payment_method && ` • ${payment.payment_method}`}
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]"
                  >
                    Paid
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
