import { CalendarPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BookingPrefill {
  instructorId?: string;
  date?: string;
  time?: string;
  duration?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  instructorIds: string[];
  prefill?: BookingPrefill;
}

export default function SchoolTakeBookingModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Take a Booking
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 text-center text-muted-foreground">
          <p className="font-medium">Coming soon</p>
          <p className="text-sm mt-1">This feature is being set up. Please use the main booking flow for now.</p>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
