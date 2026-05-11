import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Star, Car, Zap, TrendingUp, ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  features,
  isIntensive,
  discountedPrice,
  customFeatures,
  areaName,
}: IOSCourseCardProps) {
  const navigate = useNavigate();

  const hourlyRate = instructor.hourly_rate || 40;
  const schoolSkim = instructor.school_skim_amount || 0;
  const basePrice = hours * hourlyRate;
  const totalPrice = basePrice + schoolSkim;
  const finalPrice = discountedPrice || totalPrice;
  const hasDiscount = discountedPrice && discountedPrice < totalPrice;
  const courseName = hours === 28 ? "Test in a Week" : `${hours} Hour Course`;

  const carType = instructor.car_type.toLowerCase();
  const isAutomatic = carType.includes("automatic") || carType === "auto";
  const isBoth = carType === "both" || (carType.includes("automatic") && carType.includes("manual"));
  const transmissionLabel = isBoth ? "Auto & Manual" : isAutomatic ? "Automatic" : "Manual";

  const isSemiIntensive = !isIntensive && hours >= 30 && hours <= 40;
  const showIntensiveBadge = isIntensive || isSemiIntensive;
  const intensiveLabel = isIntensive ? "Intensive" : "Semi-Intensive";

  const hasDelayedAvailability = availableFrom && isFuture(parseISO(availableFrom));
  const availableFromDate = availableFrom ? parseISO(availableFrom) : null;
  const displayDate = nextAvailable ? new Date(nextAvailable) : (hasDelayedAvailability ? availableFromDate : null);
  const fullDateDisplay = displayDate ? format(displayDate, "d MMM") : "TBC";

  const locationDisplay = areaName || instructor.home_postcode;

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dateParam = nextAvailable ? `&date=${format(nextAvailable, "yyyy-MM-dd")}` : "";
    navigate(`/book/${instructor.id}?hours=${hours}${dateParam}`);
  };

  const initials = instructor.name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
      {/* Instructor Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <Avatar className="h-11 w-11 border-2 border-primary/20">
          <AvatarImage src={instructor.profile_image_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{instructor.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>4.9</span>
            <span>·</span>
            <span className="truncate">{locationDisplay}</span>
          </div>
        </div>
        {isPopular && (
          <Badge className="bg-emerald-500 text-white border-0 shrink-0">Popular</Badge>
        )}
      </div>

      {/* Course Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop`}
          alt={courseName}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {showIntensiveBadge && (
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                  {isIntensive ? <Zap className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                  {intensiveLabel}
                </Badge>
              )}
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                <Car className="h-3 w-3 mr-1" />{transmissionLabel}
              </Badge>
            </div>
            {distance !== undefined && (
              <span className="text-white text-xs font-medium">{distance.toFixed(1)} mi away</span>
            )}
          </div>
        </div>
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-lg">
            Save £{(totalPrice - discountedPrice!).toFixed(0)}
          </div>
        )}
      </div>

      {/* Course Info & CTA */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{courseName}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Starting {fullDateDisplay}
            </p>
          </div>
          <div className="text-right">
            {hasDiscount && (
              <p className="text-xs line-through text-muted-foreground">£{totalPrice.toFixed(0)}</p>
            )}
            <p className="text-2xl font-bold">£{finalPrice.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">from £{Math.round(finalPrice / 4)}/mo</p>
          </div>
        </div>
        <CompactPaymentBadges
          amount={finalPrice}
          klarnaEnabled={instructor.klarna_enabled ?? false}
          clearpayEnabled={instructor.clearpay_enabled ?? false}
        />
        <Button className="w-full rounded-xl" onClick={handleBookNow}>
          Book Now <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
