import { useState } from "react";
import { QrCode, Send, ChevronLeft, MessageSquare, Mail, Loader2, Check, PoundSterling, RotateCcw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminFee } from "@/hooks/useAdminFee";
import { useInstructorTierConfig } from "@/hooks/useInstructorTierConfig";
import { AdminFeeBreakdown } from "@/components/payments/AdminFeeBreakdown";

type View = "picker" | "qr" | "link";

interface Pupil {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  account_balance?: number | null;
}

interface TakePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentQrUrl?: string | null;
  commissionPayer?: string | null;
  commissionSplitPercent?: number | null;
  instructorName?: string;
  instructorId?: string;
  pupils: Pupil[];
}

export function TakePaymentModal({
  open,
  onOpenChange,
  paymentQrUrl,
  commissionPayer,
  commissionSplitPercent,
  instructorName = "Your Instructor",
  instructorId,
  pupils,
}: TakePaymentModalProps) {
  const [view, setView] = useState<View>("picker");
  const [selectedPupilId, setSelectedPupilId] = useState("");
  const [qrSelectedPupilId, setQrSelectedPupilId] = useState("");
  const [amount, setAmount] = useState("");
  const [sendViaSms, setSendViaSms] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [clearForManual, setClearForManual] = useState(false);
  const [qrAmount, setQrAmount] = useState("");
  const [qrCheckoutUrl, setQrCheckoutUrl] = useState<string | null>(null);
  const [qrGenerating, setQrGenerating] = useState(false);

  const selectedPupil = pupils.find((p) => p.id === selectedPupilId);

  // Admin fee calculation with tier-specific rates
  const tierConfig = useInstructorTierConfig(instructorId);
  const parsedAmount = parseFloat(amount) || 0;
  const splitPct = commissionPayer === "instructor" ? 0 : commissionSplitPercent ?? 100;
  const { adminFee, totalCharge, hasFee, instructorAbsorbs, fullFee } = useAdminFee(parsedAmount, splitPct, tierConfig);

  // QR fee calc
  const qrParsedAmount = parseFloat(qrAmount) || 0;
  const qrFee = useAdminFee(qrParsedAmount, splitPct, tierConfig);

  const handleClose = (o: boolean) => {
    if (!o) {
      setView("picker");
      setSelectedPupilId("");
      setAmount("");
      setLinkSent(false);
      setManualPhone("");
      setManualEmail("");
      setClearForManual(false);
      setQrAmount("");
      setQrCheckoutUrl(null);
      setQrSelectedPupilId("");
    }
    onOpenChange(o);
  };

  const handleBack = () => {
    setView("picker");
  };

  const handlePupilSelectForLink = (pupilId: string) => {
    setSelectedPupilId(pupilId);
    if (clearForManual) return;
    if (pupilId === "_manual") {
      setManualPhone("");
      setManualEmail("");
    } else {
      const pupil = pupils.find((p) => p.id === pupilId);
      setManualPhone(pupil?.phone || "");
      setManualEmail(pupil?.email || "");
    }
  };

  const handleToggleManual = (checked: boolean) => {
    setClearForManual(checked);
    if (checked) {
      setManualPhone("");
      setManualEmail("");
    } else if (selectedPupilId && selectedPupilId !== "_manual") {
      const pupil = pupils.find((p) => p.id === selectedPupilId);
      setManualPhone(pupil?.phone || "");
      setManualEmail(pupil?.email || "");
    }
  };

  // Generate Square payment link then send via SMS/email
  const handleSendLink = async () => {
    if (!instructorId) return;
    if (!manualPhone && !manualEmail) return;
    const method = sendViaSms && sendViaEmail ? "both" : sendViaSms ? "sms" : "email";
    setSending(true);
    try {
      const isManualOnly = selectedPupilId === "_manual" || !selectedPupilId;
      let paymentLink: string;

      // If amount is set, generate a Square payment link with the total (including admin fee)
      if (parsedAmount > 0) {
        const chargeAmount = hasFee ? totalCharge : parsedAmount;
        const recipientName = isManualOnly ? "Payment" : (selectedPupil?.name || "Payment");
        const orderRef = `PR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("square-checkout", {
          body: {
            amount: chargeAmount,
            orderReference: orderRef,
            customerEmail: manualEmail || undefined,
            customerPhone: manualPhone || undefined,
            customerName: recipientName,
            description: `Payment request from ${instructorName}`,
            returnUrl: `https://everydriver.lovable.app/pay/${instructorId}?success=true`,
            cancelUrl: `https://everydriver.lovable.app/pay/${instructorId}?cancelled=true`,
            instructorId,
            pupilId: isManualOnly ? undefined : selectedPupilId,
          },
        });

        if (checkoutError || !checkoutData?.checkoutUrl) {
          throw new Error(checkoutData?.error || "Failed to generate payment link");
        }

        paymentLink = checkoutData.checkoutUrl;
      } else {
        // No amount — send generic payment page link
        paymentLink = isManualOnly
          ? `${window.location.origin}/pay/${instructorId}`
          : `${window.location.origin}/pay/${instructorId}?pupil=${selectedPupilId}`;
      }

      const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
        body: {
          instructorId,
          instructorName,
          pupilIds: isManualOnly ? [] : [selectedPupilId],
          method,
          paymentLink,
          manualPhone: manualPhone || undefined,
          manualEmail: manualEmail || undefined,
          manualName: isManualOnly ? "there" : undefined,
        },
      });
      if (error) throw error;
      if (data?.sent > 0 || data?.emailSent > 0) {
        setLinkSent(true);
        const recipientName = isManualOnly ? (manualPhone || manualEmail) : selectedPupil?.name;
        const amountText = parsedAmount > 0 ? ` for £${(hasFee ? totalCharge : parsedAmount).toFixed(2)}` : "";
        toast.success(`Payment request${amountText} sent to ${recipientName}`);
      } else {
        toast.error("Failed to send — check contact details");
      }
    } catch (e) {
      console.error("Send payment link error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to send payment link");
    } finally {
      setSending(false);
    }
  };

  const options = [
    {
      id: "qr" as const,
      icon: QrCode,
      label: "QR Code",
      desc: "Show QR for pupil to scan & pay",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      id: "link" as const,
      icon: Send,
      label: "Send Request",
      desc: "Send payment request via SMS or email",
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-w-[92vw] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            {view !== "picker" && (
              <button onClick={handleBack} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div>
               <DialogTitle className="text-base">
                {view === "picker" && "Take Payment"}
                {view === "qr" && "QR Code"}
                {view === "link" && "Send Payment Request"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {view === "picker" && "Choose a payment method"}
                {view === "qr" && "Pupil scans to pay"}
                {view === "link" && "Set amount and send via SMS or email"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* === Picker === */}
          {view === "picker" && (
            <div className="grid gap-3">
              {options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setView(opt.id)}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left"
                  >
                    <div className={`h-11 w-11 rounded-xl ${opt.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${opt.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* === Payment type switcher (shown on sub-views) === */}
          {view !== "picker" && (
            <div className="flex gap-1 p-1 rounded-lg bg-muted mb-4">
              {options.map((opt) => {
                const Icon = opt.icon;
                const isActive = view === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setView(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* === QR Code === */}
          {view === "qr" && (
            <div className="space-y-4">
              {qrCheckoutUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-md">
                    <QRCodeSVG value={qrCheckoutUrl} size={220} />
                  </div>
                  <p className="text-sm text-muted-foreground text-center font-medium">
                    Scan to pay £{(qrFee.hasFee ? qrFee.totalCharge : qrParsedAmount).toFixed(2)}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => { setQrCheckoutUrl(null); setQrAmount(""); }}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    New Amount
                  </Button>
                </div>
              ) : (
                <>
                  {/* Pupil selector */}
                  {pupils.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Select Pupil (optional)</Label>
                      <Select value={qrSelectedPupilId} onValueChange={setQrSelectedPupilId}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="-- No pupil --" />
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                          {pupils.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Amount</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        max="5000"
                        step="0.01"
                        placeholder="Enter amount"
                        value={qrAmount}
                        onChange={(e) => setQrAmount(e.target.value)}
                        className="pl-9 text-lg"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[30, 40, 50, 100].map((v) => (
                        <Button key={v} variant="outline" size="sm" className="text-xs h-7" onClick={() => setQrAmount(v.toString())}>
                          £{v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {qrParsedAmount > 0 && (
                    <AdminFeeBreakdown
                      baseAmount={qrParsedAmount}
                      adminFee={qrFee.adminFee}
                      totalCharge={qrFee.totalCharge}
                      hasFee={qrFee.hasFee}
                      instructorAbsorbs={qrFee.instructorAbsorbs}
                      fullFee={qrFee.fullFee}
                    />
                  )}

                  <Button
                    className="w-full"
                    disabled={qrParsedAmount <= 0 || qrGenerating}
                    onClick={async () => {
                      if (!instructorId) return;
                      setQrGenerating(true);
                      try {
                        const chargeAmount = qrFee.hasFee ? qrFee.totalCharge : qrParsedAmount;
                        const qrPupil = pupils.find((p) => p.id === qrSelectedPupilId);
                        const orderRef = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                        const { data, error } = await supabase.functions.invoke("square-checkout", {
                          body: {
                            amount: chargeAmount,
                            orderReference: orderRef,
                            description: qrPupil ? `Payment from ${qrPupil.name}` : `QR payment to ${instructorName}`,
                            customerName: qrPupil?.name,
                            customerEmail: qrPupil?.email || undefined,
                            customerPhone: qrPupil?.phone || undefined,
                            returnUrl: `https://everydriver.lovable.app/pay/${instructorId}?success=true`,
                            cancelUrl: `https://everydriver.lovable.app/pay/${instructorId}?cancelled=true`,
                            instructorId,
                            pupilId: qrSelectedPupilId || undefined,
                          },
                        });
                        if (error || !data?.checkoutUrl) throw new Error(data?.error || "Failed to generate QR");
                        setQrCheckoutUrl(data.checkoutUrl);
                      } catch (e) {
                        console.error("QR generation error:", e);
                        toast.error(e instanceof Error ? e.message : "Failed to generate QR code");
                      } finally {
                        setQrGenerating(false);
                      }
                    }}
                  >
                    {qrGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
                    {qrParsedAmount > 0
                      ? `Generate QR for £${(qrFee.hasFee ? qrFee.totalCharge : qrParsedAmount).toFixed(2)}`
                      : "Enter an amount"}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* === Send Link === */}
          {view === "link" && (
            <div className="space-y-4">
              {linkSent ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="font-medium text-sm">Payment request sent!</p>
                  <Button variant="outline" size="sm" onClick={() => { setLinkSent(false); setSelectedPupilId(""); setAmount(""); setManualPhone(""); setManualEmail(""); setClearForManual(false); }}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <>
                  {/* Amount input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Amount to request</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        max="5000"
                        step="0.01"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-9 text-lg"
                      />
                    </div>
                  </div>

                  {/* Admin fee breakdown */}
                  {parsedAmount > 0 && (
                    <AdminFeeBreakdown
                      baseAmount={parsedAmount}
                      adminFee={adminFee}
                      totalCharge={totalCharge}
                      hasFee={hasFee}
                      instructorAbsorbs={instructorAbsorbs}
                      fullFee={fullFee}
                    />
                  )}

                  {/* Pupil selector (optional) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Select Pupil (optional)</Label>
                    <Select value={selectedPupilId} onValueChange={handlePupilSelectForLink}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="-- None (manual entry) --" />
                      </SelectTrigger>
                      <SelectContent className="z-[200]">
                        <SelectItem value="_manual">None (manual entry)</SelectItem>
                        {pupils.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.account_balance && p.account_balance < 0 ? ` (owes £${Math.abs(p.account_balance).toFixed(2)})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear for manual entry checkbox */}
                  {selectedPupilId && selectedPupilId !== "_manual" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={clearForManual}
                        onCheckedChange={(c) => handleToggleManual(!!c)}
                      />
                      <span className="text-xs text-muted-foreground">Clear fields for manual entry</span>
                    </label>
                  )}

                  {/* Manual phone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Phone number</Label>
                    <Input
                      type="tel"
                      placeholder="07700 900000"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </div>

                  {/* Manual email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Email address</Label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </div>

                  {/* Send method checkboxes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Send via</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={sendViaSms}
                          onCheckedChange={(c) => setSendViaSms(!!c)}
                          disabled={!manualPhone.trim()}
                        />
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">SMS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={sendViaEmail}
                          onCheckedChange={(c) => setSendViaEmail(!!c)}
                          disabled={!manualEmail.trim()}
                        />
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">Email</span>
                      </label>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={(!sendViaSms && !sendViaEmail) || sending || parsedAmount <= 0}
                    onClick={handleSendLink}
                  >
                    {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {parsedAmount > 0
                      ? `Send Request for £${(hasFee ? totalCharge : parsedAmount).toFixed(2)}`
                      : "Enter an amount"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
