import { useState } from "react";
import { QrCode, CreditCard, Send, ChevronLeft, MessageSquare, Mail, Loader2, Check } from "lucide-react";
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
import { CardstreamCheckout } from "@/components/payments/CardstreamCheckout";
import { useAdminFee } from "@/hooks/useAdminFee";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type View = "picker" | "qr" | "card" | "link";

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
  instructorName?: string;
  instructorId?: string;
  pupils: Pupil[];
}

export function TakePaymentModal({
  open,
  onOpenChange,
  paymentQrUrl,
  commissionPayer,
  instructorName = "Your Instructor",
  instructorId,
  pupils,
}: TakePaymentModalProps) {
  const [view, setView] = useState<View>("picker");
  const [selectedPupilId, setSelectedPupilId] = useState("");
  const [amount, setAmount] = useState("");
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [sendViaSms, setSendViaSms] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const { adminFee, totalCharge, hasFee } = useAdminFee(parsedAmount, commissionPayer);

  const selectedPupil = pupils.find((p) => p.id === selectedPupilId);

  const handleClose = (o: boolean) => {
    if (!o) {
      setView("picker");
      setSelectedPupilId("");
      setAmount("");
      setMerchantId(null);
      setLinkSent(false);
    }
    onOpenChange(o);
  };

  const handleBack = () => {
    setView("picker");
    setMerchantId(null);
  };

  // Card Entry: create intent to get merchantId
  const handleProceedToCard = async () => {
    if (!instructorId || parsedAmount <= 0) return;
    setCreatingIntent(true);
    try {
      const { data, error } = await supabase.functions.invoke("payment-intent-create", {
        body: {
          amount: totalCharge,
          pupilId: selectedPupilId || undefined,
          instructorId,
          customerName: selectedPupil?.name,
          currency: "GBP",
        },
      });
      if (error || !data?.success) throw new Error("Failed to create payment session");
      setMerchantId(data.merchantId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment error");
    } finally {
      setCreatingIntent(false);
    }
  };

  // Send Link
  const handleSendLink = async () => {
    if (!instructorId || !selectedPupilId) return;
    const method = sendViaSms && sendViaEmail ? "both" : sendViaSms ? "sms" : "email";
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
        body: {
          instructorId,
          instructorName,
          pupilIds: [selectedPupilId],
          method,
          paymentLink: `${window.location.origin}/pay/${instructorId}?pupil=${selectedPupilId}`,
        },
      });
      if (error) throw error;
      if (data?.sent > 0 || data?.emailSent > 0) {
        setLinkSent(true);
        toast.success(`Payment link sent to ${selectedPupil?.name}`);
      } else {
        toast.error("Failed to send — check pupil contact details");
      }
    } catch {
      toast.error("Failed to send payment link");
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
      id: "card" as const,
      icon: CreditCard,
      label: "Card Entry",
      desc: "Manually enter card details",
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      id: "link" as const,
      icon: Send,
      label: "Send Link",
      desc: "Send payment link via SMS or email",
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
                {view === "card" && "Card Entry"}
                {view === "link" && "Send Payment Link"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {view === "picker" && "Choose a payment method"}
                {view === "qr" && "Pupil scans to pay"}
                {view === "card" && "Enter card details manually"}
                {view === "link" && "Send a link via SMS or email"}
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

          {/* === QR Code === */}
          {view === "qr" && (
            <div className="flex flex-col items-center gap-4">
              {paymentQrUrl ? (
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <img src={paymentQrUrl} alt="Payment QR Code" className="w-56 h-56 object-contain" />
                </div>
              ) : (
                <div className="w-56 h-56 bg-muted flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30">
                  <div className="text-center">
                    <QrCode className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No QR code configured</p>
                    <p className="text-xs text-muted-foreground mt-1">Set up in Settings → Payments</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center font-medium">
                Scan to pay {instructorName}
              </p>
            </div>
          )}

          {/* === Card Entry === */}
          {view === "card" && (
            <div className="space-y-4">
              {!merchantId ? (
                <>
                  {/* Pupil selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Select Pupil</Label>
                    <select
                      value={selectedPupilId}
                      onChange={(e) => setSelectedPupilId(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="">-- Select a pupil --</option>
                      {pupils.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Amount (£)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {/* Fee breakdown */}
                  {parsedAmount > 0 && hasFee && (
                    <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lesson amount</span>
                        <span>£{parsedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin fee</span>
                        <span>£{adminFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total charge</span>
                        <span>£{totalCharge.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={parsedAmount <= 0 || !selectedPupilId || creatingIntent}
                    onClick={handleProceedToCard}
                  >
                    {creatingIntent && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Proceed to Card Entry
                  </Button>
                </>
              ) : (
                <CardstreamCheckout
                  amount={totalCharge}
                  pupilId={selectedPupilId || undefined}
                  instructorId={instructorId}
                  customerName={selectedPupil?.name}
                  onPaid={() => {
                    toast.success("Payment successful!");
                    handleClose(false);
                  }}
                  merchantIdForHPF={merchantId}
                />
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
                  <p className="font-medium text-sm">Link sent to {selectedPupil?.name}!</p>
                  <Button variant="outline" size="sm" onClick={() => { setLinkSent(false); setSelectedPupilId(""); }}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <>
                  {/* Pupil selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Select Pupil</Label>
                    <select
                      value={selectedPupilId}
                      onChange={(e) => setSelectedPupilId(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="">-- Select a pupil --</option>
                      {pupils.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.account_balance && p.account_balance < 0 ? ` (owes £${Math.abs(p.account_balance).toFixed(2)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Send method checkboxes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Send via</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={sendViaSms}
                          onCheckedChange={(c) => setSendViaSms(!!c)}
                          disabled={!selectedPupil?.phone}
                        />
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">SMS</span>
                        {selectedPupil && !selectedPupil.phone && (
                          <span className="text-[10px] text-destructive">No phone</span>
                        )}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={sendViaEmail}
                          onCheckedChange={(c) => setSendViaEmail(!!c)}
                          disabled={!selectedPupil?.email}
                        />
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">Email</span>
                        {selectedPupil && !selectedPupil.email && (
                          <span className="text-[10px] text-destructive">No email</span>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!selectedPupilId || (!sendViaSms && !sendViaEmail) || sending}
                    onClick={handleSendLink}
                  >
                    {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Send Payment Link
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
