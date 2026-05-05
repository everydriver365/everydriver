import { useState } from "react";
import { QrCode, Mail, MessageSquare, Banknote, Send, Loader2, Receipt } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentLinkShare } from "./PaymentLinkShare";

interface TakePaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentQrUrl?: string | null;
  commissionPayer?: string | null;
  instructorName?: string;
  instructorId?: string;
  pupils?: Array<{ id: string; name: string; phone?: string | null; email?: string | null }>;
  onShowQR?: () => void;
  onRecordPayment?: () => void;
}

export function TakePaymentSheet({
  open,
  onOpenChange,
  paymentQrUrl,
  commissionPayer = "pupil",
  instructorName = "Your Instructor",
  instructorId,
  pupils = [],
  onShowQR,
  onRecordPayment,
}: TakePaymentSheetProps) {
  const [sendingLink, setSendingLink] = useState<string | null>(null);
  const [selectedPupil, setSelectedPupil] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState<"sms" | "email" | null>(null);
  const [showPaymentLink, setShowPaymentLink] = useState(false);

  const handleShowQR = () => {
    onOpenChange(false);
    onShowQR?.();
  };

  const handleRecordPayment = () => {
    onOpenChange(false);
    onRecordPayment?.();
  };

  const handleSendPaymentLink = async (pupilId: string, pupilName: string, method: "sms" | "email") => {
    if (!instructorId) {
      toast.error("Instructor not found");
      return;
    }
    setSendingLink(`${pupilId}-${method}`);
    try {
      const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
        body: {
          instructorId,
          instructorName,
          pupilIds: [pupilId],
        },
      });

      if (error) throw error;

      if (data?.sent > 0) {
        toast.success(`Payment link sent to ${pupilName} via ${method === "sms" ? "SMS" : "email"}`);
        setLinkMode(null);
        setSelectedPupil(null);
      } else {
        toast.error(`Failed to send - pupil may not have ${method === "sms" ? "a phone number" : "an email"}`);
      }
    } catch (error) {
      console.error("Error sending payment link:", error);
      toast.error("Failed to send payment link");
    } finally {
      setSendingLink(null);
    }
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-lg">Take Payment</SheetTitle>
          <SheetDescription>Choose how you'd like to collect payment</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 pb-4">
          {/* Show QR Code */}
          <button
            onClick={handleShowQR}
            className="w-full flex items-center gap-3 p-4 border border-border bg-card hover:bg-accent transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">Show QR Code</p>
              <p className="text-xs text-muted-foreground">
                {paymentQrUrl ? "Display QR for pupil to scan" : "No QR code configured"}
              </p>
            </div>
          </button>

          {/* Send Payment Link */}
          {linkMode === null ? (
            <button
              onClick={() => setLinkMode("sms")}
              className="w-full flex items-center gap-3 p-4 border border-border bg-card hover:bg-accent transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">Send Payment Link</p>
                <p className="text-xs text-muted-foreground">Send via SMS or email, or share a link</p>
              </div>
            </button>
          ) : (
            <div className="border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-foreground">Send Payment Link</p>
                <Button variant="ghost" size="sm" onClick={() => { setLinkMode(null); setSelectedPupil(null); setShowPaymentLink(false); }}>
                  Cancel
                </Button>
              </div>

              {/* Pupil selection */}
              {pupils.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pupils found</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {pupils.map((pupil) => (
                    <div
                      key={pupil.id}
                      className={`flex items-center justify-between p-2.5 border text-sm cursor-pointer transition-colors ${
                        selectedPupil === pupil.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                      }`}
                      onClick={() => setSelectedPupil(pupil.id)}
                    >
                      <span className="font-medium text-foreground">{pupil.name}</span>
                      {selectedPupil === pupil.id && (
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            disabled={!pupil.phone || sendingLink === `${pupil.id}-sms`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendPaymentLink(pupil.id, pupil.name, "sms");
                            }}
                          >
                            {sendingLink === `${pupil.id}-sms` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <MessageSquare className="h-3 w-3" />
                            )}
                            SMS
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Shareable link section */}
              {instructorId && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Or share a general payment link</p>
                  <PaymentLinkShare instructorId={instructorId} instructorName={instructorName} pupils={pupils} />
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
