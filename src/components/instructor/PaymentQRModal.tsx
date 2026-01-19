import { useState, useEffect } from "react";
import { QrCode, CreditCard, Copy, Check, User, PoundSterling, Send, MessageSquare, ExternalLink, Clock, Eye, X, Maximize2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Pupil {
  id: string;
  name: string;
  account_balance?: number | null;
  phone?: string | null;
}

interface PaymentLinkTracking {
  id: string;
  link_code: string;
  pupil_id: string | null;
  amount_requested: number | null;
  sent_at: string;
  sent_via: string;
  opened_at: string | null;
  opened_count: number;
  paid_at: string | null;
  status: string;
  pupils?: { name: string } | null;
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

function generateLinkCode(): string {
  return `PAY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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
  const [linkHistory, setLinkHistory] = useState<PaymentLinkTracking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);
  
  const baseUrl = `${window.location.origin}/pay`;
  const selectedPupil = pupils.find(p => p.id === selectedPupilId);

  // Fetch link history when modal opens
  useEffect(() => {
    if (open && instructorId) {
      fetchLinkHistory();
    }
  }, [open, instructorId]);

  const fetchLinkHistory = async () => {
    if (!instructorId) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("payment_link_tracking")
        .select("*, pupils(name)")
        .eq("instructor_id", instructorId)
        .order("sent_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLinkHistory(data || []);
    } catch (error) {
      console.error("Error fetching link history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const generatePaymentLink = (code: string) => {
    return `${baseUrl}/${code}`;
  };
  
  const handleCopy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
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
    if (!selectedPupilId || !instructorId) {
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
      // Generate unique link code
      const linkCode = generateLinkCode();
      const paymentLink = generatePaymentLink(linkCode);
      const amount = paymentAmount ? parseFloat(paymentAmount) : null;

      // Save tracking record
      const { error: trackingError } = await supabase
        .from("payment_link_tracking")
        .insert({
          instructor_id: instructorId,
          pupil_id: selectedPupilId,
          link_code: linkCode,
          amount_requested: amount,
          sent_via: "sms",
          status: "sent",
        });

      if (trackingError) throw trackingError;

      // Send SMS with payment link
      const message = amount 
        ? `Hi ${selectedPupil.name}, here's your payment link for £${amount.toFixed(2)} from ${instructorName}: ${paymentLink}`
        : `Hi ${selectedPupil.name}, here's your payment link from ${instructorName}: ${paymentLink}`;

      const { error: smsError } = await supabase.functions.invoke("send-gap-sms", {
        body: {
          to: selectedPupil.phone,
          message,
        },
      });

      if (smsError) throw smsError;

      toast({
        title: "Link sent!",
        description: `Payment link texted to ${selectedPupil.name}`,
      });

      // Refresh history
      fetchLinkHistory();
      setPaymentAmount("");
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
        await supabase
          .from("payment_history")
          .insert({
            instructor_id: instructorId,
            pupil_id: selectedPupilId,
            amount: amount,
            payment_method: "manual",
            notes: `Payment recorded via Take Payment modal`,
          });
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

  const getStatusBadge = (status: string, openedCount: number) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500 text-white text-[10px]">Paid</Badge>;
      case "opened":
        return <Badge variant="secondary" className="text-[10px] gap-0.5"><Eye className="h-2.5 w-2.5" />{openedCount}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Sent</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Take Payment
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="record" className="text-[10px] gap-0.5 px-1">
                <PoundSterling className="h-3 w-3" />
                Record
              </TabsTrigger>
              <TabsTrigger value="link" className="text-[10px] gap-0.5 px-1">
                <MessageSquare className="h-3 w-3" />
                Text
              </TabsTrigger>
              <TabsTrigger value="qr" className="text-[10px] gap-0.5 px-1">
                <QrCode className="h-3 w-3" />
                QR
              </TabsTrigger>
              <TabsTrigger value="history" className="text-[10px] gap-0.5 px-1">
                <Clock className="h-3 w-3" />
                History
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

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <PoundSterling className="h-3 w-3" />
                  Amount (optional)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                  <Input
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
                <div 
                  className="bg-white p-2 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow relative group"
                  onClick={() => paymentQrUrl && setShowFullscreenQR(true)}
                >
                  {paymentQrUrl ? (
                    <>
                      <img 
                        src={paymentQrUrl} 
                        alt="Payment QR Code" 
                        className="w-28 h-28 object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                        <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <div className="w-28 h-28 bg-muted flex items-center justify-center rounded border-2 border-dashed border-muted-foreground/30">
                      <div className="text-center">
                        <QrCode className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
                        <p className="text-[9px] text-muted-foreground">No QR Code</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {paymentQrUrl && (
                  <p className="text-[10px] text-muted-foreground">Tap QR to fullscreen</p>
                )}
                
                <p className="text-xs text-muted-foreground text-center">
                  Scan to pay via card, Apple Pay, or Google Pay
                </p>
                
                <div className="w-full flex gap-1.5">
                  <div className="flex-1 bg-muted rounded px-2 py-1.5 text-xs truncate">
                    {baseUrl}/...
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopy(`${baseUrl}/${instructorId}`)}
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

            {/* History Tab */}
            <TabsContent value="history" className="mt-3">
              <ScrollArea className="h-[200px]">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-20">
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                ) : linkHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-20">
                    <p className="text-xs text-muted-foreground">No payment links sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkHistory.map((link) => (
                      <div key={link.id} className="border rounded-md p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate max-w-[120px]">
                            {link.pupils?.name || "Unknown"}
                          </span>
                          {getStatusBadge(link.status, link.opened_count)}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {link.amount_requested ? `£${link.amount_requested.toFixed(2)}` : "No amount"}
                          </span>
                          <span>{format(new Date(link.sent_at), "dd MMM HH:mm")}</span>
                        </div>
                        {link.opened_at && (
                          <p className="text-[10px] text-muted-foreground">
                            Opened: {format(new Date(link.opened_at), "dd MMM HH:mm")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Fullscreen QR Overlay - Rendered outside Dialog for proper z-index on mobile */}
      {showFullscreenQR && paymentQrUrl && (
        <div 
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setShowFullscreenQR(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <button
            onClick={() => setShowFullscreenQR(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <X className="h-8 w-8" />
          </button>
          
          <div className="flex flex-col items-center gap-6 p-8 w-full max-w-md">
            <div className="bg-white p-6 rounded-2xl shadow-2xl">
              <img 
                src={paymentQrUrl} 
                alt="Payment QR Code" 
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
              />
            </div>
            <p className="text-white/90 text-lg font-medium text-center">Scan to pay {instructorName}</p>
            <p className="text-white/60 text-sm">Tap anywhere to close</p>
          </div>
        </div>
      )}
    </>
  );
}
