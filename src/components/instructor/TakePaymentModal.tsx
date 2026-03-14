import { useState } from "react";
import { QrCode, CreditCard, Send, ChevronLeft, MessageSquare, Mail, Loader2, Check } from "lucide-react";
import { CardstreamCheckout } from "@/components/payments/CardstreamCheckout";
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
import { useAdminFee } from "@/hooks/useAdminFee";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type View = "picker" | "qr" | "card" | "card-entry" | "link";

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
  const [sendViaSms, setSendViaSms] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [clearForManual, setClearForManual] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const { adminFee, totalCharge, hasFee } = useAdminFee(parsedAmount, commissionPayer);

  const selectedPupil = pupils.find((p) => p.id === selectedPupilId);

  const handleClose = (o: boolean) => {
    if (!o) {
      setView("picker");
      setSelectedPupilId("");
      setAmount("");
      setLinkSent(false);
      setManualPhone("");
      setManualEmail("");
      setClearForManual(false);
    }
    onOpenChange(o);
  };

  const handleBack = () => {
    if (view === "card-entry") {
      setView("card");
    } else {
      setView("picker");
    }
  };




  const handlePupilSelectForLink = (pupilId: string) => {
    setSelectedPupilId(pupilId);
    if (clearForManual) return; // Don't auto-fill when manual mode is active
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

  // Send Link
  const handleSendLink = async () => {
    if (!instructorId) return;
    if (!manualPhone && !manualEmail) return;
    const method = sendViaSms && sendViaEmail ? "both" : sendViaSms ? "sms" : "email";
    setSending(true);
    try {
      const isManualOnly = selectedPupilId === "_manual" || !selectedPupilId;
      const paymentLink = isManualOnly
        ? `${window.location.origin}/pay/${instructorId}`
        : `${window.location.origin}/pay/${instructorId}?pupil=${selectedPupilId}`;

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
        toast.success(`Payment link sent to ${recipientName}`);
      } else {
        toast.error("Failed to send — check contact details");
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
                {view === "card-entry" && "Enter Card Details"}
                {view === "link" && "Send Payment Link"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {view === "picker" && "Choose a payment method"}
                {view === "qr" && "Pupil scans to pay"}
                {view === "card" && "Enter card details manually"}
                {view === "card-entry" && "Complete payment"}
                {view === "link" && "Send a link via SMS or email"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className={`p-4 ${view === "card-entry" ? "" : "max-h-[70vh] overflow-y-auto"}`}>
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

          {/* === Payment type switcher (shown on sub-views, not card-entry) === */}
          {view !== "picker" && view !== "card-entry" && (
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

          {view === "card" && (
            <div className="space-y-4">
              {/* Pupil selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Select Pupil</Label>
                <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="-- Select a pupil --" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    {pupils.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={!selectedPupilId || parsedAmount <= 0}
                onClick={() => setView("card-entry")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Continue to Payment
              </Button>
            </div>
          )}

          {/* === Card Entry === */}
          {view === "card-entry" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{selectedPupil?.name}</span>
                <span className="font-semibold">£{totalCharge.toFixed(2)}</span>
              </div>
              <CardstreamCheckout
                amount={totalCharge}
                pupilId={selectedPupilId}
                instructorId={instructorId}
                customerName={selectedPupil?.name}
                customerEmail={selectedPupil?.email || undefined}
                onPaid={() => {
                  toast.success("Payment successful!");
                  handleClose(false);
                }}
              />
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
                  <p className="font-medium text-sm">Link sent!</p>
                  <Button variant="outline" size="sm" onClick={() => { setLinkSent(false); setSelectedPupilId(""); setManualPhone(""); setManualEmail(""); setClearForManual(false); }}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <>
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
                    disabled={(!sendViaSms && !sendViaEmail) || sending}
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
