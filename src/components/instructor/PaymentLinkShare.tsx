import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2, Link, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PaymentLinkShareProps {
  instructorId: string;
  instructorName?: string;
}

export function PaymentLinkShare({ instructorId, instructorName }: PaymentLinkShareProps) {
  const [copied, setCopied] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const parsedAmount = parseFloat(customAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 1 && parsedAmount <= 5000;

  const baseUrl = `${window.location.origin}/pay/${instructorId}`;
  const paymentUrl = customAmount && isValidAmount
    ? `${baseUrl}?amount=${parsedAmount}`
    : baseUrl;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    toast.success("Payment link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${instructorName || "Your Instructor"}`,
          text: "Use this link to make a payment",
          url: paymentUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-4">
      {/* Optional amount pre-fill */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Pre-fill amount <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="relative">
          <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            min="1"
            max="5000"
            step="0.01"
            placeholder="Leave blank for any amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="pl-9"
          />
        </div>
        {customAmount && !isValidAmount && (
          <p className="text-xs text-destructive mt-1">Enter an amount between £1 and £5,000</p>
        )}
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG value={paymentUrl} size={180} level="M" />
        </div>
      </div>

      {/* Link display */}
      <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-md border border-border">
        <Link className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs text-foreground truncate flex-1">{paymentUrl}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Link"}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
