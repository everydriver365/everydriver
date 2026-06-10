import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useEmbed } from "@/context/EmbedContext";
import { MapPin, Clock, User, PoundSterling, Star, CheckCircle, Car, Zap, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isFuture, parseISO, differenceInDays } from "date-fns";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";
import { InstructorSignalRow } from "@/components/courses/variants/InstructorSignalRow";
import { computeOfferStatus } from "@/lib/courseOffer";
import { cleanInstructorName } from "@/lib/utils";


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
    google_rating?: number | null;
    google_review_count?: number | null;
    google_top_review_text?: string | null;
    google_top_review_author?: string | null;
    google_review_url?: string | null;
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
  offerActive?: boolean | null;
  offerLabel?: string | null;
  offerPercentOff?: number | null;
  offerStartsAt?: string | null;
  offerEndsAt?: string | null;
  /** Effective hourly rate after applying any postcode-rule override for the learner's postcode. */
  effectiveHourlyRate?: number | null;
  /** Learner's postcode (for "pricing for SO22…" hint). */
  learnerPostcode?: string | null;
}

function DynamicCourseCardImpl({ 
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
  offerActive,
  offerLabel,
  offerPercentOff,
  offerStartsAt,
  offerEndsAt,
  effectiveHourlyRate,
  learnerPostcode,
}: DynamicCourseCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();
  const { bookNavigate } = useEmbed();

  const displayName = cleanInstructorName(instructor.name);

  const defaultRate = instructor.hourly_rate || 40;
  const hourlyRate = (effectiveHourlyRate != null && effectiveHourlyRate > 0) ? effectiveHourlyRate : defaultRate;
  const schoolSkim = instructor.school_skim_amount || 0;
  const basePrice = hours * hourlyRate;
  const totalPrice = basePrice + schoolSkim;
  const offer = computeOfferStatus(totalPrice, {
    offer_active: offerActive,
    offer_label: offerLabel,
    offer_percent_off: offerPercentOff,
    offer_starts_at: offerStartsAt,
    offer_ends_at: offerEndsAt,
    discounted_price: discountedPrice,
  });
  const hasDiscount = offer.isLive;
  const finalPrice = hasDiscount ? offer.finalPrice : totalPrice;
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
    bookNavigate(`/book/${instructor.id}?hours=${hours}${dateParam}`);
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
          className={`relative overflow-hidden rounded-2xl border bg-card shadow-lg [backface-visibility:hidden] transition-shadow duration-300 group-hover:shadow-xl ${
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
          {/* Network placeholder badge — enquiry-only fallback for postcodes with no real instructor yet */}
          {(instructor as any).is_network_placeholder && (
            <div className="absolute top-4 left-4 z-30 flex items-center gap-1 bg-slate-900/90 text-white px-2.5 py-1 rounded-md shadow-lg">
              <span className="text-xs font-bold tracking-wide">EveryDriver Network — Enquire</span>
            </div>
          )}

          {/* Hero Image — locked 4:3, smoothly clamped height across breakpoints */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted max-h-[clamp(14rem,31vw,21rem)]">
            <img
              src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=900&fit=crop`}
              alt={courseName}
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1280px) 28rem, (min-width: 640px) 45vw, 100vw"
              className="block h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />

            {/* Pills — at the bottom of the image */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-1.5 px-3 py-1.5">
              {isPopular && (
                <Badge className="rounded-none border-0 bg-emerald-500 text-white">Popular</Badge>
              )}
              {showIntensiveBadge && (
                <Badge className={`rounded-none border-0 text-white ${isIntensive ? "bg-primary" : "bg-amber-500"}`}>
                  {isIntensive ? <Zap className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                  {intensiveLabel}
                </Badge>
              )}
              <Badge variant="secondary" className="rounded-none bg-secondary text-secondary-foreground">
                <Car className="h-3 w-3 mr-1" />
                {transmissionLabel}
              </Badge>
              {hasDiscount && (
                <Badge className="rounded-none border-0 bg-red-500 text-white gap-1">
                  <Sparkles className="h-3 w-3" />
                  {offer.label || (offer.percentOff ? `${offer.percentOff}% off` : `Save £${offer.savings.toFixed(0)}`)}
                </Badge>
              )}
              {distance !== undefined && (
                <div className="ml-auto flex items-center gap-1 text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{distance.toFixed(1)} mi</span>
                </div>
              )}
            </div>
          </div>

          {/* Lower body: navy date rail + white content */}
          <div className="flex">
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
            <div className="flex-1 px-4 py-4 space-y-2">

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
                  With <span className="font-medium text-primary">{displayName}</span>
                </span>
              </div>

              {/* Trust strip — live rating, Verified Pro chip, top review */}
              <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={instructor.profile_image_url || undefined} alt={displayName} loading="lazy" />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <InstructorSignalRow
                  instructorId={instructor.id}
                  tone="light"
                  showSnippet
                  snippetClamp={1}
                  className="min-w-0 flex-1"
                />
              </div>

              {/* Google reviews — live from Google Places (only when populated) */}
              {instructor.google_rating != null &&
                (instructor.google_review_count ?? 0) > 0 && (
                  <a
                    href={instructor.google_review_url ?? undefined}
                    target={instructor.google_review_url ? "_blank" : undefined}
                    rel={instructor.google_review_url ? "noopener noreferrer" : undefined}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex flex-col gap-1 rounded-lg border border-border/60 bg-white px-2.5 py-2 ${
                      instructor.google_review_url ? "hover:bg-muted/40 transition-colors" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <GoogleGlyph className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-semibold text-foreground">
                        {Number(instructor.google_rating).toFixed(1)}
                      </span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-muted-foreground">
                        · {instructor.google_review_count} Google review
                        {instructor.google_review_count === 1 ? "" : "s"}
                      </span>
                    </div>
                    {instructor.google_top_review_text && (
                      <p
                        className="text-[11px] italic leading-snug text-muted-foreground"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        “{instructor.google_top_review_text}”
                        {instructor.google_top_review_author && (
                          <span className="not-italic"> — {instructor.google_top_review_author.split(" ")[0]}</span>
                        )}
                      </p>
                    )}
                  </a>
                )}



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
                <AvatarImage src={instructor.profile_image_url || undefined} loading="lazy" />
                <AvatarFallback 
                  className="text-sm text-white"
                  style={{ backgroundColor: brandColour }}
                >
                  {displayName.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-primary-foreground">{displayName}</div>
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
              <Button size="sm" onClick={handleBookNow} className="bg-[#3182ce] text-white hover:bg-[#2563a8]">
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

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.3C41.9 35.6 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

export const DynamicCourseCard = memo(DynamicCourseCardImpl);

