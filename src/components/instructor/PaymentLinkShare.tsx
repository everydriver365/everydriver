import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentLinkShareProps {
  instructorId: string;
  instructorName?: string;
}

export function PaymentLinkShare({ instructorId, instructorName }: PaymentLinkShareProps) {
  const [copied, setCopied] = useState(false);

  const paymentUrl = `${window.location.origin}/pay/${instructorId}`;

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
