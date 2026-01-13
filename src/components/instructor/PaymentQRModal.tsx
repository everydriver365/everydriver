import { useState } from "react";
import { QrCode, CreditCard, Copy, Check, User, PoundSterling, Send, MessageSquare, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [sendingLink, setSendingLink] = useState(false);
  
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

  const handleSendPaymentLink = async () => {
    if (!selectedPupilId) {
      toast({
        title: "Select a pupil",
        description: "Please select which pupil to send the link to",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPupil?.phone) {
      toast({
        title: "No phone number",
        description: "This pupil doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }

    setSendingLink(true);
    try {
      const { error } = await supabase.functions.invoke("send-gap-sms", {
        body: {
          to: selectedPupil.phone,
          message: `Hi ${selectedPupil.name}, here's your payment link from ${instructorName}: ${paymentLink}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Link sent!",
        description: `Payment link texted to ${selectedPupil.name}`,
      });
    } catch (error) {
      console.error("Error sending payment link:", error);
      toast({
        title: "Failed to send",
        description: "Could not send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingLink(false);
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
      const { data: pupil, error: fetchError } = await supabase
        .from("pupils")
        .select("account_balance")
        .eq("id", selectedPupilId)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = pupil?.account_balance || 0;
      const newBalance = currentBalance + amount;

      const { error: updateError } = await supabase
        .from("pupils")
        .update({ account_balance: newBalance })
        .eq("id", selectedPupilId);

      if (updateError) throw updateError;

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

      if (sendSms && selectedPupil?.phone) {
        try {
          await supabase.functions.invoke("send-payment-confirmation", {
            body: {
              pupilId: selectedPupilId,
              amount: amount,
              instructorName: instructorName,
              newBalance: newBalance,
            },
          });
        } catch (smsErr) {
          console.error("Failed to send SMS:", smsErr);
        }
      }

      toast({
        title: "Payment recorded",
        description: `£${amount.toFixed(2)} added to ${selectedPupil?.name}'s account`,
      });

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
      <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Take Payment
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="record" className="text-xs gap-1">
              <PoundSterling className="h-3 w-3" />
              Record
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs gap-1">
              <MessageSquare className="h-3 w-3" />
              Text Link
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-xs gap-1">
              <QrCode className="h-3 w-3" />
              QR Code
            </TabsTrigger>
          </TabsList>
          
          {/* Record Payment Tab */}
          <TabsContent value="record" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="pupil-select" className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" />
                Pupil
              </Label>
              <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
                <SelectTrigger id="pupil-select" className="h-9 text-sm">
                  <SelectValue placeholder="Select pupil..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {pupils.length === 0 ? (
                    <SelectItem value="none" disabled>No pupils found</SelectItem>
                  ) : (
                    pupils.map((pupil) => (
                      <SelectItem key={pupil.id} value={pupil.id}>
                        <div className="flex items-center gap-2">
                          <span>{pupil.name}</span>
                          {pupil.account_balance !== null && (
                            <span className="text-xs text-muted-foreground">
                              (£{(pupil.account_balance || 0).toFixed(0)})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-amount" className="text-xs flex items-center gap-1">
                <PoundSterling className="h-3 w-3" />
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-6 h-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-1.5">
                <Send className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">SMS receipt</span>
              </div>
              <Switch
                id="send-sms"
                checked={sendSms && !!selectedPupil?.phone}
                onCheckedChange={setSendSms}
                disabled={!selectedPupil?.phone}
                className="scale-90"
              />
            </div>

            <Button 
              onClick={handleRecordPayment} 
              disabled={recording || !selectedPupilId || !paymentAmount}
              className="w-full h-9"
              size="sm"
            >
              {recording ? "Recording..." : "Record Payment"}
            </Button>
          </TabsContent>
          
          {/* Text Link Tab */}
          <TabsContent value="link" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" />
                Send to
              </Label>
              <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select pupil..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {pupils.filter(p => p.phone).length === 0 ? (
                    <SelectItem value="none" disabled>No pupils with phone</SelectItem>
                  ) : (
                    pupils.filter(p => p.phone).map((pupil) => (
                      <SelectItem key={pupil.id} value={pupil.id}>
                        {pupil.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-1">Payment link:</p>
              <div className="flex items-center gap-1.5">
                <code className="text-xs truncate flex-1">{paymentLink}</code>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleSendPaymentLink} 
              disabled={sendingLink || !selectedPupilId || !selectedPupil?.phone}
              className="w-full h-9"
              size="sm"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              {sendingLink ? "Sending..." : "Text Payment Link"}
            </Button>

            {selectedPupil && !selectedPupil.phone && (
              <p className="text-xs text-amber-600 text-center">
                This pupil has no phone number on file
              </p>
            )}
          </TabsContent>
          
          {/* QR Code Tab */}
          <TabsContent value="qr" className="mt-3">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                {paymentQrUrl ? (
                  <img 
                    src={paymentQrUrl} 
                    alt="Payment QR Code" 
                    className="w-28 h-28 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 bg-muted flex items-center justify-center rounded border-2 border-dashed border-muted-foreground/30">
                    <div className="text-center">
                      <QrCode className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
                      <p className="text-[9px] text-muted-foreground">No QR Code</p>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Scan to pay via card, Apple Pay, or Google Pay
              </p>
              
              <div className="w-full flex gap-1.5">
                <div className="flex-1 bg-muted rounded px-2 py-1.5 text-xs truncate">
                  {paymentLink}
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
