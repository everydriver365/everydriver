import { useNavigate } from "react-router-dom";
import { MapPin, Clock, User, PoundSterling, Car, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";
import { format, isFuture, parseISO } from "date-fns";

interface IOSCourseCardProps {
  instructor: {
    id: string;
    name: string;
    profile_image_url: string | null;
    car_type: string;
    car_make: string | null;
    car_model: string | null;
    home_postcode: string;
    home_address?: string | null;
    hourly_rate: number | null;
    bio: string | null;
    brand_colour: string | null;
    school_skim_amount?: number | null;
    klarna_enabled?: boolean | null;
    clearpay_enabled?: boolean | null;
  };
  hours: number;
  nextAvailable?: Date | null;
  courseImageUrl?: string | null;
  isPopular?: boolean;
  availableFrom?: string | null;
  distance?: number;
  features?: string[] | null;
  isIntensive?: boolean;
  discountedPrice?: number | null;
  customFeatures?: string[] | null;
  areaName?: string | null;
}

export function IOSCourseCard({
  instructor,
  hours,
  nextAvailable,
  courseImageUrl,
  isPopular = false,
  availableFrom,
  distance,
  isIntensive,
  discountedPrice,
  areaName,
}: IOSCourseCardProps) {
  const navigate = useNavigate();

  const hourlyRate = instructor.hourly_rate || 40;
  const schoolSkim = instructor.school_skim_amount || 0;
  const basePrice = hours * hourlyRate;
  const totalPrice = basePrice + schoolSkim;
  const finalPrice = discountedPrice || totalPrice;
  const hasDiscount = discountedPrice && discountedPrice < totalPrice;
  const courseName = hours === 28 ? "TEST IN A WEEK" : `${hours} HOUR DRIVING LESSONS`;
  const brandColour = instructor.brand_colour || "#1e3a5f";

  const carType = instructor.car_type.toLowerCase();
  const isAutomatic = carType.includes("automatic") || carType === "auto";
  const isBoth = carType === "both" || (carType.includes("automatic") && carType.includes("manual"));
  const transmissionLabel = isBoth ? "Auto & Manual" : isAutomatic ? "Automatic" : "Manual";

  const isSemiIntensive = !isIntensive && hours >= 30 && hours <= 40;
  const showIntensiveBadge = isIntensive || isSemiIntensive;
  const intensiveLabel = isIntensive ? "Intensive" : "Semi-Intensive";

  const hasDelayedAvailability = availableFrom && isFuture(parseISO(availableFrom));
  const availableFromDate = availableFrom ? parseISO(availableFrom) : null;
  const displayDate = nextAvailable
    ? new Date(nextAvailable)
    : hasDelayedAvailability
    ? availableFromDate
    : null;

  const dayNumber = displayDate ? format(displayDate, "d") : "TBC";
  const monthName = displayDate ? format(displayDate, "MMM").toUpperCase() : "";
  const fullDateDisplay = displayDate ? format(displayDate, "d MMM") : "TBC";

  const locationDisplay = areaName || instructor.home_postcode;

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dateParam = nextAvailable ? `&date=${format(nextAvailable, "yyyy-MM-dd")}` : "";
    navigate(`/book/${instructor.id}?hours=${hours}${dateParam}`);
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-black/5 transition-shadow hover:shadow-xl">
      {/* Hero photo */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop`}
          alt={courseName}
          className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
          {isPopular && <Badge className="border-0 bg-emerald-500 text-white">Popular</Badge>}
          {showIntensiveBadge && (
            <Badge className={`border-0 text-white ${isIntensive ? "bg-primary" : "bg-amber-500"}`}>
              {isIntensive ? <Zap className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
              {intensiveLabel}
            </Badge>
          )}
          <Badge variant="secondary" className="bg-white/90 text-foreground">
            <Car className="h-3 w-3 mr-1" />
            {transmissionLabel}
          </Badge>
        </div>

        {distance !== undefined && (
          <div className="absolute right-2 top-2 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-primary px-2.5 py-1.5 rounded-lg shadow-lg">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-sm font-bold">{distance.toFixed(1)} mi</span>
          </div>
        )}

        {hasDiscount && (
          <div className="absolute left-2 bottom-2 bg-red-500 text-white px-2.5 py-1 rounded-md shadow-lg">
            <span className="text-sm font-bold">
              Save £{(totalPrice - discountedPrice!).toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* Body: navy date rail + content */}
      <div className="flex">
        <div
          className="flex flex-col items-center justify-center px-4 py-5 min-w-[68px]"
          style={{ backgroundColor: brandColour }}
        >
          <span className="text-3xl font-bold leading-none text-white">{dayNumber}</span>
          <span className="mt-1 text-[11px] font-semibold tracking-wider text-white/80 uppercase">
            {monthName}
          </span>
        </div>

        <div className="flex-1 px-4 py-4 space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide leading-snug">
            {courseName}
          </h3>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{hours} hours ({fullDateDisplay})</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-primary truncate">{locationDisplay}</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              With <span className="font-medium text-primary">{instructor.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-foreground">
            <PoundSterling className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-sm line-through text-muted-foreground">£{totalPrice.toFixed(2)}</span>
                <span className="text-sm font-bold text-red-600">£{finalPrice.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-sm font-semibold">£{totalPrice.toFixed(2)}</span>
            )}
          </div>

          <CompactPaymentBadges
            amount={finalPrice}
            className="pt-1"
            klarnaEnabled={instructor.klarna_enabled ?? false}
            clearpayEnabled={instructor.clearpay_enabled ?? false}
          />

          <Button className="mt-2 w-full rounded-xl" onClick={handleBookNow}>
            Book Now <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
