import { useState } from "react";
import { QrCode, CreditCard, Copy, Check, User, PoundSterling, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Pupil {
  id: string;
  name: string;
  account_balance?: number | null;
  phone?: string | null;
}

interface PaymentQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentQrUrl?: string | null;
  pupils?: Pupil[];
  instructorId?: string;
  instructorName?: string;
  onPaymentRecorded?: () => void;
}

export function PaymentQRModal({ 
  open, 
  onOpenChange, 
  paymentQrUrl, 
  pupils = [],
  instructorId,
  instructorName = "Your Instructor",
  onPaymentRecorded 
}: PaymentQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedPupilId, setSelectedPupilId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [sendSms, setSendSms] = useState(true);
  const [recording, setRecording] = useState(false);
  
  // Placeholder payment link - in production this would be dynamic
  const paymentLink = "https://pay.example.com/instructor/abc123";
  
  const selectedPupil = pupils.find(p => p.id === selectedPupilId);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Payment link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedPupilId) {
      toast({
        title: "Select a pupil",
        description: "Please select which pupil this payment is for",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setRecording(true);
    try {
      // Get current balance and add payment
      const { data: pupil, error: fetchError } = await supabase
        .from("pupils")
        .select("account_balance")
        .eq("id", selectedPupilId)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = pupil?.account_balance || 0;
      const newBalance = currentBalance + amount;

      // Update pupil's account balance
      const { error: updateError } = await supabase
        .from("pupils")
        .update({ account_balance: newBalance })
        .eq("id", selectedPupilId);

      if (updateError) throw updateError;

      // Record payment in history
      if (instructorId) {
        const { error: historyError } = await supabase
          .from("payment_history")
          .insert({
            instructor_id: instructorId,
            pupil_id: selectedPupilId,
            amount: amount,
            payment_method: "manual",
            notes: `Payment recorded via Take Payment modal`,
          });

        if (historyError) {
          console.error("Error recording payment history:", historyError);
        }
      }

      // Send SMS confirmation if enabled
      if (sendSms && selectedPupil?.phone) {
        try {
          const { error: smsError } = await supabase.functions.invoke("send-payment-confirmation", {
            body: {
              pupilId: selectedPupilId,
              amount: amount,
              instructorName: instructorName,
              newBalance: newBalance,
            },
          });

          if (smsError) {
            console.error("SMS error:", smsError);
          }
        } catch (smsErr) {
          console.error("Failed to send SMS:", smsErr);
        }
      }

      toast({
        title: "Payment recorded",
        description: `£${amount.toFixed(2)} added to ${selectedPupil?.name}'s account${sendSms && selectedPupil?.phone ? ". SMS confirmation sent." : ""}`,
      });

      // Reset form
      setSelectedPupilId("");
      setPaymentAmount("");
      onPaymentRecorded?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRecording(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedPupilId("");
      setPaymentAmount("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Take Payment
          </DialogTitle>
          <DialogDescription>
            Select pupil and record the payment
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          {/* Pupil Selection */}
          <div className="space-y-2">
            <Label htmlFor="pupil-select" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Pupil
            </Label>
            <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
              <SelectTrigger id="pupil-select" className="bg-background">
                <SelectValue placeholder="Choose a pupil..." />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {pupils.length === 0 ? (
                  <SelectItem value="none" disabled>No pupils found</SelectItem>
                ) : (
                  pupils.map((pupil) => (
                    <SelectItem key={pupil.id} value={pupil.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{pupil.name}</span>
                        {pupil.account_balance !== null && pupil.account_balance !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Balance: £{(pupil.account_balance || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount" className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4" />
              Payment Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* SMS Confirmation Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="send-sms" className="text-sm font-medium cursor-pointer">
                  Send SMS confirmation
                </Label>
                <p className="text-xs text-muted-foreground">
                  {selectedPupil?.phone ? "Notify pupil of payment" : "Pupil has no phone number"}
                </p>
              </div>
            </div>
            <Switch
              id="send-sms"
              checked={sendSms && !!selectedPupil?.phone}
              onCheckedChange={setSendSms}
              disabled={!selectedPupil?.phone}
            />
          </div>

          {/* Record Payment Button */}
          <Button 
            onClick={handleRecordPayment} 
            disabled={recording || !selectedPupilId || !paymentAmount}
            className="w-full"
          >
            {recording ? "Recording..." : "Record Payment"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or show QR code</span>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              {paymentQrUrl ? (
                <img 
                  src={paymentQrUrl} 
                  alt="Payment QR Code" 
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="w-32 h-32 bg-muted flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
                  <div className="text-center">
                    <QrCode className="h-10 w-10 text-muted-foreground/50 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">No QR Code</p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Pupil can scan to pay via card, Apple Pay, or Google Pay
            </p>
            
            {/* Copy Link Button */}
            <div className="w-full flex gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs truncate">
                {paymentLink}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
