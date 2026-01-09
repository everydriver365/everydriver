import { useState } from "react";
import { QrCode, CreditCard, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface PaymentQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentQrUrl?: string | null;
}

export function PaymentQRModal({ open, onOpenChange, paymentQrUrl }: PaymentQRModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Placeholder payment link - in production this would be dynamic
  const paymentLink = "https://pay.example.com/instructor/abc123";
  
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Take Payment
          </DialogTitle>
          <DialogDescription>
            Show this QR code to your pupil to accept payment
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-6">
          {/* QR Code Display */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            {paymentQrUrl ? (
              <img 
                src={paymentQrUrl} 
                alt="Payment QR Code" 
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 bg-muted flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No QR Code</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload in settings</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Pupil can scan this code to pay via card, Apple Pay, or Google Pay
          </p>
          
          {/* Copy Link Button */}
          <div className="w-full flex gap-2">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm truncate">
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
      </DialogContent>
    </Dialog>
  );
}
