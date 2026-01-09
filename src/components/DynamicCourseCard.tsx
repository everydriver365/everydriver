import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, User, PoundSterling, Star, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isFuture, parseISO, differenceInDays } from "date-fns";

interface DynamicCourseCardProps {
  instructor: {
    id: string;
    name: string;
    profile_image_url: string | null;
    car_type: string;
    car_make: string | null;
    car_model: string | null;
    home_postcode: string;
    home_address: string | null;
    hourly_rate: number | null;
    bio: string | null;
    brand_colour: string | null;
  };
  hours: number;
  nextAvailable?: Date | null;
  courseImageUrl?: string | null;
  isPopular?: boolean;
  availableFrom?: string | null;
  distance?: number;
}

export function DynamicCourseCard({ 
  instructor, 
  hours, 
  nextAvailable,
  courseImageUrl,
  isPopular = false,
  availableFrom,
  distance
}: DynamicCourseCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  const hourlyRate = instructor.hourly_rate || 40;
  const totalPrice = hours * hourlyRate;
  const courseName = hours === 28 ? "TEST IN A WEEK" : `${hours} HOUR COURSE`;
  const brandColour = instructor.brand_colour || "#1e3a5f";

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

  // Location display
  const locationDisplay = instructor.home_address || instructor.home_postcode;

  return (
    <div
      className="group cursor-pointer [perspective:1000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front of Card */}
        <div className="overflow-hidden border bg-card shadow-md [backface-visibility:hidden]">
          {/* Popular Badge */}
          {isPopular && (
            <div className="absolute top-3 left-3 z-20">
              <Badge className="border-0 bg-emerald-500 text-white">
                Popular
              </Badge>
            </div>
          )}
          
          {/* Hero Image Section */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop`}
              alt={courseName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Distance badge */}
            {distance !== undefined && (
              <div className="absolute right-3 top-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-primary px-2.5 py-1.5 rounded-lg shadow-lg">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{distance.toFixed(1)} mi</span>
              </div>
            )}
          </div>

          {/* Content Section with Date Box */}
          <div className="flex">
            {/* Date Box - Navy blue left column */}
            <div className="flex flex-col items-center justify-center bg-primary px-5 py-4 min-w-[80px]">
              <span className="text-3xl font-bold text-primary-foreground">{dayNumber}</span>
              <span className="text-sm font-semibold text-primary-foreground/80 uppercase">{monthName}</span>
            </div>

            {/* Details - Right column */}
            <div className="flex-1 p-4 space-y-2.5">
              {/* Course Title */}
              <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
                {courseName}
              </h3>
              
              {/* Duration with icon */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{hours} hours ({fullDateDisplay})</span>
              </div>

              {/* Location with icon */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate">{locationDisplay}</span>
              </div>

              {/* Instructor with icon */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">With {instructor.name}</span>
              </div>

              {/* Price with icon */}
              <div className="flex items-center gap-2 text-foreground">
                <PoundSterling className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-semibold">£{totalPrice.toFixed(2)}</span>
              </div>

              {/* Payment Options */}
              <div className="flex items-center gap-2 pt-1">
                <span className="rounded bg-[#ffb3c7] px-2 py-0.5 text-xs font-bold text-black">
                  Klarna.
                </span>
                <span className="rounded bg-[#b2fce4] px-2 py-0.5 text-xs font-bold text-black">
                  clearpay
                </span>
                <span className="text-xs text-muted-foreground">Pay in 3 or 4 months</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 overflow-hidden border bg-primary text-primary-foreground shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
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

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Free re-test if needed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Theory test support included</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Pick-up from home/work</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/20 pt-4">
              <div>
                <span className="text-2xl font-bold text-primary-foreground">£{totalPrice}</span>
                <div className="text-xs text-primary-foreground/70">
                  or from £{Math.round(totalPrice / 4)}/month
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={handleBookNow}>
                Book Now
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
