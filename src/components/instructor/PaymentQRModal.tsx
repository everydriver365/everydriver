import { QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PaymentQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentQrUrl?: string | null;
  instructorName?: string;
  commissionPayer?: string | null;
  // Keep these props for backward compatibility but they're unused now
  pupils?: unknown[];
  instructorId?: string;
  onPaymentRecorded?: () => void;
}

export function PaymentQRModal({ 
  open, 
  onOpenChange, 
  paymentQrUrl, 
  instructorName = "Your Instructor",
  commissionPayer = "pupil",
}: PaymentQRModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] max-w-[90vw] p-6" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>Payment QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          {paymentQrUrl ? (
            <div className="bg-white p-4 rounded-none shadow-md">
              <img 
                src={paymentQrUrl} 
                alt="Payment QR Code" 
                className="w-60 h-60 object-contain"
              />
            </div>
          ) : (
            <div className="w-60 h-60 bg-muted flex items-center justify-center rounded-none border-2 border-dashed border-muted-foreground/30">
              <div className="text-center">
                <QrCode className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No QR Code</p>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground text-center font-medium">
            Scan to pay {instructorName}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
