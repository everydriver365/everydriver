import { useState, useEffect } from "react";
import { CreditCard, Clock, PoundSterling, ExternalLink, Share2, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { PupilPaymentModal } from "./PupilPaymentModal";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { useToast } from "@/hooks/use-toast";

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
  paymentQrUrl?: string | null;
  paymentQrUrlPupilPays?: string | null;
  paymentQrUrlInstructorPays?: string | null;
  paymentLinkBaseUrl?: string | null;
  commissionPayer?: string | null;
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
  onBalanceUpdate,
  paymentQrUrl,
  paymentQrUrlPupilPays,
  paymentQrUrlInstructorPays,
  paymentLinkBaseUrl,
  commissionPayer,
}: PupilPortalPaymentsProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const activePaymentUrl = getActivePaymentQrUrl({
    commission_payer: commissionPayer,
    payment_qr_url_pupil_pays: paymentQrUrlPupilPays,
    payment_qr_url_instructor_pays: paymentQrUrlInstructorPays,
    payment_qr_url: paymentQrUrl,
  });

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

  const handleShareLink = async () => {
    if (!activePaymentUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Payment Link", url: activePaymentUrl });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(activePaymentUrl);
      setCopied(true);
      toast({ title: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const balance = accountBalance || 0;
  const hasCredit = balance > 0;
  const hasDebt = balance < 0;

  return (
    <div className="px-4 space-y-6">
      {/* Balance Card */}
      <Card 
        style={{ 
          backgroundColor: brandColour || '#1e3a5f',
          borderColor: 'transparent'
        }}
      >
        <CardContent className="p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <PoundSterling className="h-5 w-5 text-white/80" />
            <span className="text-white/80 text-sm font-medium">Account Balance</span>
          </div>
          
          <div className="text-center mb-4">
            <div className={`text-4xl font-bold ${hasDebt ? 'text-red-300' : ''}`}>
              {hasDebt ? '-' : ''}£{Math.abs(balance).toFixed(2)}
            </div>
            <div className="text-white/70 text-sm mt-1">
              {hasCredit && 'Credit on account'}
              {hasDebt && 'Amount owed'}
              {balance === 0 && 'All balanced'}
            </div>
          </div>

          {(prepaidHours || 0) > 0 && (
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{prepaidHours} prepaid hours remaining</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Now Button - uses payment link URL */}
      {(paymentLinkBaseUrl || activePaymentUrl) && (
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
              Pay securely online
            </p>
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
                onClick={() => {
                  const url = paymentLinkBaseUrl || activePaymentUrl;
                  if (url) window.open(url, '_blank', 'noopener');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const url = paymentLinkBaseUrl || activePaymentUrl;
                  if (!url) return;
                  if (navigator.share) {
                    navigator.share({ title: "Payment Link", url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    toast({ title: "Link copied to clipboard" });
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                title="Share payment link"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>
              Share this link with a parent or guardian to pay on your behalf
            </p>
          </CardContent>
        </Card>
      )}

      {/* Make Payment CTA (existing modal-based) */}
      {hasDebt && !activePaymentUrl && (
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-4">
            <p className="text-sm mb-3" style={{ color: 'var(--brand-text)' }}>
              Pay your balance securely online
            </p>
            <Button 
              className="w-full"
              style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
              onClick={() => setPaymentModalOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          </CardContent>
        </Card>
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
        commissionPayer={commissionPayer}
      />

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--brand-text)' }}>
          Payment History
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
                <CardContent className="p-4">
                  <div className="animate-pulse flex justify-between">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
            <CardContent className="p-6 text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
              <p style={{ color: 'var(--brand-muted)' }}>No payments recorded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <Card 
                key={payment.id}
                style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--brand-text)' }}>
                        £{payment.amount.toFixed(2)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                        {formatDate(payment.recorded_at)}
                        {payment.payment_method && ` • ${payment.payment_method}`}
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-200"
                    >
                      Paid
                    </Badge>
                  </div>
                  {payment.notes && (
                    <p className="text-xs mt-2" style={{ color: 'var(--brand-muted)' }}>
                      {payment.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
