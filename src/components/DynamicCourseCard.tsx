import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, User, PoundSterling, Star, CheckCircle, Car, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isFuture, parseISO, differenceInDays } from "date-fns";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";

interface DynamicCourseCardProps {
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
    weekend_surcharge_amount?: number | null;
    bank_holiday_surcharge_amount?: number | null;
    odd_hours_surcharge_amount?: number | null;
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
  areaName?: string | null;
  /** Effective hourly rate after applying any postcode-rule override for the learner's postcode. */
  effectiveHourlyRate?: number | null;
  /** Learner's postcode (for "pricing for SO22…" hint). */
  learnerPostcode?: string | null;
}

export function DynamicCourseCard({ 
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
  isPremium = false,
  placementType,
  areaName,
  effectiveHourlyRate,
  learnerPostcode,
}: DynamicCourseCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  const defaultRate = instructor.hourly_rate || 40;
  const hourlyRate = (effectiveHourlyRate != null && effectiveHourlyRate > 0) ? effectiveHourlyRate : defaultRate;
  const schoolSkim = instructor.school_skim_amount || 0;
  const basePrice = hours * hourlyRate;
  const totalPrice = basePrice + schoolSkim;
  const finalPrice = discountedPrice || totalPrice;
  const hasDiscount = discountedPrice && discountedPrice < totalPrice;
  const isPostcodeAdjusted = effectiveHourlyRate != null && effectiveHourlyRate > 0 && effectiveHourlyRate !== defaultRate;
  const learnerOutward = (learnerPostcode || "").replace(/\s+/g, "").toUpperCase().slice(0, -3) || null;
  const hasSurcharges =
    Number(instructor.weekend_surcharge_amount) > 0 ||
    Number(instructor.bank_holiday_surcharge_amount) > 0 ||
    Number(instructor.odd_hours_surcharge_amount) > 0;
  const courseName = hours === 28 ? "TEST IN A WEEK" : `${hours} HOUR COURSE`;
  const brandColour = instructor.brand_colour || "#1e3a5f";

  // Determine transmission type
  const carType = instructor.car_type.toLowerCase();
  const isAutomatic = carType.includes("automatic") || carType === "auto";
  const isManual = carType.includes("manual");
  const isBoth = carType === "both" || (carType.includes("automatic") && carType.includes("manual"));
  const transmissionLabel = isBoth ? "Auto & Manual" : isAutomatic ? "Automatic" : "Manual";

  // Determine course intensity - semi-intensive if 30-40 hours, intensive if is_intensive flag or specific hour ranges
  const isSemiIntensive = !isIntensive && hours >= 30 && hours <= 40;
  const showIntensiveBadge = isIntensive || isSemiIntensive;
  const intensiveLabel = isIntensive ? "Intensive" : "Semi-Intensive";

  // Use custom features if available, otherwise fall back to template features
  const displayFeatures = customFeatures && customFeatures.length > 0 ? customFeatures : features;

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dateParam = nextAvailable ? `&date=${format(nextAvailable, "yyyy-MM-dd")}` : "";
    navigate(`/book/${instructor.id}?hours=${hours}${dateParam}`);
  };

  // Check if instructor has a future available_from date
  const hasDelayedAvailability = availableFrom && isFuture(parseISO(availableFrom));
  const availableFromDate = availableFrom ? parseISO(availableFrom) : null;

  // Get the display date
  const displayDate = nextAvailable ? new Date(nextAvailable) : (hasDelayedAvailability ? availableFromDate : null);
  const isAvailableSoon = displayDate && differenceInDays(displayDate, new Date()) <= 7 && differenceInDays(displayDate, new Date()) >= 0;

  // Format date parts
  const dayNumber = displayDate ? format(displayDate, "d") : "TBC";
  const monthName = displayDate ? format(displayDate, "MMM").toUpperCase() : "";
  const fullDateDisplay = displayDate ? format(displayDate, "d MMM") : "TBC";

  // Location display - show area name (city) instead of full address
  const locationDisplay = areaName || instructor.home_postcode;

  return (
    <div
      className="group cursor-pointer [perspective:1000px] transition-transform duration-300 hover:-translate-y-2"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front of Card — pale wash + photo on top + navy date rail + icon list */}
        <div
          className={`relative overflow-hidden rounded-2xl border bg-secondary/40 p-2 shadow-lg [backface-visibility:hidden] transition-shadow duration-300 group-hover:shadow-xl ${
            isPremium
              ? "border-2 border-amber-400/60 shadow-amber-400/20 group-hover:shadow-amber-400/30 ring-1 ring-amber-400/30"
              : "border-border/60 shadow-black/10 group-hover:shadow-black/15"
          }`}
        >
          {/* Premium Featured Badge */}
          {isPremium && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-400 text-white px-2.5 py-1 rounded-md shadow-lg shadow-amber-500/30">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-bold tracking-wide">Featured</span>
            </div>
          )}

          {/* Hero Image (rounded top corners only, sits inside the wash) */}
          <div className="relative h-44 overflow-hidden rounded-xl">
            <img
              src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop`}
              alt={courseName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Top-left badges */}
            <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
              {isPopular && (
                <Badge className="border-0 bg-emerald-500 text-white">Popular</Badge>
              )}
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

            {/* Distance chip */}
            {distance !== undefined && (
              <div className="absolute right-3 top-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-primary px-2.5 py-1.5 rounded-lg shadow-lg">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{distance.toFixed(1)} mi</span>
              </div>
            )}

            {/* Discount pill */}
            {hasDiscount && (
              <div className="absolute left-3 bottom-3 bg-red-500 text-white px-2.5 py-1 rounded-md shadow-lg">
                <span className="text-sm font-bold">
                  Save £{(totalPrice - discountedPrice!).toFixed(0)}
                </span>
              </div>
            )}
          </div>

          {/* Lower body: navy date rail + white content */}
          <div className="mt-2 flex overflow-hidden rounded-xl bg-card">
            {/* Date rail */}
            <div
              className="flex flex-col items-center justify-center px-4 py-5 min-w-[68px]"
              style={{ backgroundColor: brandColour }}
            >
              <span className="text-3xl font-bold leading-none text-white">{dayNumber}</span>
              <span className="mt-1 text-[11px] font-semibold tracking-wider text-white/80 uppercase">
                {monthName}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide leading-snug">
                {courseName}
              </h3>

              {/* Time / date row */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{hours} hours ({fullDateDisplay})</span>
              </div>

              {/* Location (blue accent) */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-primary truncate">{locationDisplay}</span>
              </div>

              {/* Instructor (name in blue) */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  With <span className="font-medium text-primary">{instructor.name}</span>
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 text-foreground">
                <PoundSterling className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                {hasDiscount ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm line-through text-muted-foreground">£{totalPrice.toFixed(2)}</span>
                    <span className="text-sm font-bold text-red-600">£{finalPrice.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold">
                    {hasSurcharges ? "From " : ""}£{totalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {(isPostcodeAdjusted || (hasSurcharges && !hasDiscount)) && (
                <p className="text-[11px] text-muted-foreground -mt-1">
                  {isPostcodeAdjusted && learnerOutward ? `Pricing for ${learnerOutward}. ` : null}
                  {hasSurcharges && !hasDiscount
                    ? "Weekends, bank holidays & off-peak hours may cost more."
                    : null}
                </p>
              )}

              {/* Klarna / Clearpay — unchanged behaviour */}
              <CompactPaymentBadges
                amount={finalPrice}
                className="pt-1"
                klarnaEnabled={instructor.klarna_enabled ?? false}
                clearpayEnabled={instructor.clearpay_enabled ?? false}
              />

              {/* Book Now */}
              <Button
                className="mt-2 w-full rounded-xl"
                onClick={handleBookNow}
              >
                Book Now <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div 
          className="absolute inset-0 overflow-hidden border shadow-lg shadow-black/10 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ backgroundColor: brandColour, borderColor: `${brandColour}50` }}
        >
          <div className="flex h-full flex-col p-5">
            <h3 className="text-lg font-bold text-primary-foreground uppercase">{courseName}</h3>
            
            <div className="mt-3 flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={instructor.profile_image_url || undefined} />
                <AvatarFallback 
                  className="text-sm text-white"
                  style={{ backgroundColor: brandColour }}
                >
                  {instructor.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-primary-foreground">{instructor.name}</div>
                <div className="flex items-center gap-1 text-xs text-primary-foreground/70">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>4.9 rating</span>
                </div>
              </div>
            </div>

            <p className="mt-4 flex-1 text-sm text-primary-foreground/80 line-clamp-3">
              {instructor.bio || `Experienced ${instructor.car_type.toLowerCase()} driving instructor ready to help you pass your test.`}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {displayFeatures && displayFeatures.length > 0 ? (
                displayFeatures.slice(0, 8).map((feature, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-sm text-white/80">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                    <span className="line-clamp-1">{feature}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-white/80">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Theory support</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-white/80">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Home pick-up</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/20 pt-4">
              <div>
                {hasDiscount ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-lg line-through text-white/50">£{totalPrice}</span>
                      <span className="text-2xl font-bold text-white">£{finalPrice}</span>
                    </div>
                    <div className="text-xs text-primary-foreground/70">
                      or from £{Math.round(finalPrice / 4)}/month
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-primary-foreground">£{totalPrice}</span>
                    <div className="text-xs text-primary-foreground/70">
                      or from £{Math.round(totalPrice / 4)}/month
                    </div>
                  </>
                )}
              </div>
              <Button size="sm" variant="secondary" onClick={handleBookNow}>
                Learn More
              </Button>
            </div>

            <div className="mt-2 text-center text-[10px] text-primary-foreground/60">
              ← Hover to flip back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
