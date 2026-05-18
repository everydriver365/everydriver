import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { PupilPaymentModal } from "./PupilPaymentModal";
import { getActivePaymentQrUrl } from "@/lib/getActivePaymentQrUrl";
import { useToast } from "@/hooks/use-toast";
import { BalanceHero } from "./payments/BalanceHero";
import { PaymentsSearchRow } from "./payments/PaymentsSearchRow";
import { PaymentsResultsBar } from "./payments/PaymentsResultsBar";
import { PaymentsHistoryCard, type UIPayment } from "./payments/PaymentsHistoryCard";
import { PayNowCard } from "./payments/PayNowCard";
import { paymentsTokens as t } from "./payments/tokens";

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
  instructorName?: string;
  instructorCentre?: string | null;
  onBack?: () => void;
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
  accountBalance,
  pupilName = "Pupil",
  pupilEmail,
  pupilPhone,
  paymentQrUrl,
  paymentQrUrlPupilPays,
  paymentQrUrlInstructorPays,
  paymentLinkBaseUrl,
  commissionPayer,
  brandColour,
  instructorName,
  instructorCentre,
  onBack,
}: PupilPortalPaymentsProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const activePaymentUrl = getActivePaymentQrUrl({
    commission_payer: commissionPayer,
    payment_qr_url_pupil_pays: paymentQrUrlPupilPays,
    payment_qr_url_instructor_pays: paymentQrUrlInstructorPays,
    payment_qr_url: paymentQrUrl,
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from("payment_history")
          .select("id, amount, recorded_at, payment_method, notes")
          .eq("pupil_id", pupilId)
          .eq("instructor_id", instructorId)
          .order("recorded_at", { ascending: false })
          .limit(20);

        if (!error && data) setPayments(data);
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [pupilId, instructorId]);

  const uiPayments: UIPayment[] = useMemo(
    () =>
      payments.map((p) => ({
        id: p.id,
        description: p.notes || "Lesson payment",
        dateFormatted: format(parseISO(p.recorded_at), "EEE d MMM yyyy"),
        amount: Number(p.amount) || 0,
        status: "paid" as const,
      })),
    [payments],
  );

  const filtered = useMemo(
    () =>
      uiPayments.filter((p) =>
        p.description.toLowerCase().includes(query.toLowerCase()),
      ),
    [uiPayments, query],
  );

  const balance = accountBalance ?? 0;
  const payUrl = paymentLinkBaseUrl || activePaymentUrl;

  const handlePayNow = () => {
    if (payUrl) {
      window.open(payUrl, "_blank", "noopener");
    } else {
      setPaymentModalOpen(true);
    }
  };

  const handleShare = async () => {
    if (!payUrl) {
      toast({ title: "No payment link available" });
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: "Payment Link", url: payUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      toast({ title: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: "No payments to export" });
      return;
    }
    const header = ["Date", "Description", "Amount", "Status"];
    const rows = filtered.map((p) => [
      p.dateFormatted,
      `"${p.description.replace(/"/g, '""')}"`,
      p.amount.toFixed(2),
      p.status,
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFilter = () => {
    toast({ title: "Filters coming soon" });
  };

  const handleBack = () => {
    if (onBack) onBack();
    else if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
  };

  return (
    <div style={{ backgroundColor: t.surface, minHeight: "100vh" }}>
      <PaymentsNav
        instructorName={instructorName || "Your instructor"}
        centre={instructorCentre}
        onBack={handleBack}
      />
      <BalanceHero balance={balance} />

      <div
        style={{
          padding: 16,
          paddingBottom: 48,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <PaymentsSearchRow
          query={query}
          onChangeQuery={setQuery}
          onFilter={handleFilter}
        />
        <PaymentsResultsBar count={filtered.length} onExport={handleExport} />
        <PaymentsHistoryCard payments={filtered} loading={loading} />
        <PayNowCard onPayNow={handlePayNow} onShare={handleShare} copied={copied} />
      </div>

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
    </div>
  );
}
