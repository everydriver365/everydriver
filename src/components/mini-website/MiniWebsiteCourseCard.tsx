import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Car, Zap, Calendar, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";
import { format, isFuture, parseISO } from "date-fns";

interface MiniWebsiteCourseCardProps {
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
  isPremium?: boolean;
  placementType?: string;
  /** Override for the header/accent color (e.g., from STYLE_OVERRIDES) */
  primaryColor?: string;
  areaName?: string | null;
}

export function MiniWebsiteCourseCard({
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
  primaryColor,
  areaName,
}: MiniWebsiteCourseCardProps) {
  const navigate = useNavigate();

  const hourlyRate = instructor.hourly_rate || 40;
  const schoolSkim = instructor.school_skim_amount || 0;
  const basePrice = hours * hourlyRate + schoolSkim;
  const finalPrice = discountedPrice || basePrice;
  const hasDiscount = discountedPrice && discountedPrice < basePrice;
  const courseName = hours === 28 ? "Test in a Week" : `${hours} Hour Course`;
  const brandColour = primaryColor || instructor.brand_colour || "#1e3a5f";

  const carType = instructor.car_type.toLowerCase();
  const isAutomatic = carType.includes("automatic") || carType === "auto";
  const isBoth = carType === "both" || (carType.includes("automatic") && carType.includes("manual"));
  const transmissionLabel = isBoth ? "Auto & Manual" : isAutomatic ? "Automatic" : "Manual";

  const displayFeatures = customFeatures && customFeatures.length > 0 ? customFeatures : features;

  const hasDelayedAvailability = availableFrom && isFuture(parseISO(availableFrom));
  const availableFromDate = availableFrom ? parseISO(availableFrom) : null;
  const displayDate = nextAvailable ? new Date(nextAvailable) : (hasDelayedAvailability ? availableFromDate : null);
  const locationDisplay = areaName || instructor.home_postcode;

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dateParam = nextAvailable ? `&date=${format(nextAvailable, "yyyy-MM-dd")}` : "";
    navigate(`/book/${instructor.id}?hours=${hours}${dateParam}`);
  };

  return (
    <div className="rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-border group">
      {/* Image with gradient overlay */}
      <div className="relative">
        <img
          src={courseImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop"}
          alt={courseName}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div className="text-white">
            <div className="flex gap-1.5 mb-1">
              {isPopular && <Badge className="bg-emerald-500/90 border-0 text-white text-[10px]">Popular</Badge>}
              {isIntensive && <Badge className="bg-amber-500/90 border-0 text-white text-[10px]"><Zap className="h-3 w-3 mr-0.5" />Intensive</Badge>}
              {hasDiscount && (
                <Badge className="bg-red-500/90 border-0 text-white text-[10px]">Save £{(basePrice - discountedPrice!).toFixed(0)}</Badge>
              )}
            </div>
            <h3 className="text-xl font-black">{courseName}</h3>
          </div>
          <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white"><Car className="h-3 w-3 mr-1" />{transmissionLabel}</Badge>
        </div>
      </div>

      {/* Branded info bar */}
      <div className="p-4" style={{ backgroundColor: brandColour }}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-white/70" />{hours}hrs</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-white/70" />{locationDisplay}</span>
            {displayDate && (
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-white/70" />{format(displayDate, "d MMM")}</span>
            )}
          </div>
          <div className="text-right">
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">£{finalPrice.toFixed(0)}</span>
                <span className="text-xs line-through text-white/50">£{basePrice.toFixed(0)}</span>
              </div>
            ) : (
              <span className="text-xl font-black">£{basePrice.toFixed(0)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom content area */}
      <div className="bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={instructor.profile_image_url || undefined} />
            <AvatarFallback style={{ backgroundColor: brandColour, color: 'white' }} className="text-xs">
              {instructor.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{instructor.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />4.9 rating
            </div>
          </div>
          <Button size="sm" className="rounded-full" style={{ backgroundColor: brandColour }} onClick={handleBookNow}>
            Book Now
          </Button>
        </div>
        <CompactPaymentBadges
          amount={finalPrice}
          klarnaEnabled={instructor.klarna_enabled ?? false}
          clearpayEnabled={instructor.clearpay_enabled ?? false}
        />
      </div>
    </div>
  );
}
