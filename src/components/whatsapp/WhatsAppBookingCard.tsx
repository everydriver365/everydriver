import { format } from "date-fns";
import { MapPin, Calendar, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingResult {
  instructorId: string;
  instructorName: string;
  profileImageUrl: string | null;
  hourlyRate: number | null;
  carType: string;
  nextAvailable: Date;
  hours: number;
  discountedPrice: number | null;
  slug: string | null;
}

interface WhatsAppBookingCardProps {
  result: BookingResult;
  onSelect: (result: BookingResult) => void;
}

export function WhatsAppBookingCard({ result, onSelect }: WhatsAppBookingCardProps) {
  const totalPrice = result.discountedPrice ?? (result.hourlyRate ? result.hourlyRate * result.hours : null);

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2 w-full">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {result.profileImageUrl ? (
            <img src={result.profileImageUrl} alt={result.instructorName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">
              {result.instructorName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{result.instructorName}</p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Car className="h-3 w-3 shrink-0" />
            <span className="truncate">{result.carType}</span>
          </div>
        </div>
        {totalPrice && (
          <div className="ml-auto text-right shrink-0">
            <p className="text-base font-bold text-foreground">£{totalPrice}</p>
            <p className="text-[10px] text-muted-foreground">{result.hours}hrs</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3 shrink-0" />
        <span>Next: {format(result.nextAvailable, "EEE d MMM")}</span>
      </div>

      <Button
        size="sm"
        className="w-full text-xs h-8"
        onClick={() => onSelect(result)}
      >
        View & Book
      </Button>
    </div>
  );
}

export type { BookingResult };
