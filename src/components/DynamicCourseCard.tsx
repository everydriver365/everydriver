import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Star, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isFuture, parseISO, differenceInDays } from "date-fns";

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
  const courseName = hours === 28 ? "Test in a Week" : `${hours} Hour Course`;
  const brandColour = instructor.brand_colour || "#1e3a5f";

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/book/${instructor.id}?hours=${hours}`);
  };

  // Check if instructor has a future available_from date
  const hasDelayedAvailability = availableFrom && isFuture(parseISO(availableFrom));
  const availableFromDate = availableFrom ? parseISO(availableFrom) : null;

  // Check if available within 7 days
  const availableDate = nextAvailable ? new Date(nextAvailable) : (hasDelayedAvailability ? availableFromDate : null);
  const isAvailableSoon = availableDate && differenceInDays(availableDate, new Date()) <= 7 && differenceInDays(availableDate, new Date()) >= 0;

  return (
    <div
      className="group h-[380px] cursor-pointer [perspective:1000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl border bg-card shadow-md [backface-visibility:hidden]">
          {/* Popular Ribbon */}
          {isPopular && (
            <div className="absolute top-0 left-0 z-20 overflow-hidden w-24 h-24 pointer-events-none">
              <div className="absolute top-3 -left-8 w-32 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 text-center transform -rotate-45 shadow-md">
                Popular
              </div>
            </div>
          )}
          
          {/* Hero Image Section */}
          <div className="relative h-44 overflow-hidden">
            <img
              src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop`}
              alt={courseName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Distance badge */}
            {distance !== undefined && (
              <div className="absolute left-3 bottom-3 flex items-center gap-1.5 bg-primary/95 backdrop-blur-sm text-primary-foreground px-2.5 py-1.5 rounded-lg shadow-lg">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{distance.toFixed(1)} mi</span>
              </div>
            )}

            {/* Transmission badge */}
            <Badge className="absolute right-3 top-3 border-0 bg-primary/90 text-primary-foreground backdrop-blur-sm">
              {instructor.car_type}
            </Badge>
          </div>

          {/* Content Section */}
          <div className="p-4">
            {/* Course Title */}
            <h3 className="text-lg font-bold text-foreground">{courseName}</h3>
            
            {/* Duration & Location */}
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{hours} hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{instructor.home_address || instructor.home_postcode}</span>
              </div>
            </div>

            {/* Instructor */}
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-background shadow-md">
                <AvatarImage src={instructor.profile_image_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {instructor.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{instructor.name}</span>
            </div>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">£{totalPrice}</span>
              <span className="text-sm text-muted-foreground line-through">£{Math.round(totalPrice * 1.15)}</span>
              <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Save 15%
              </Badge>
            </div>

            {/* Payment Options */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-[#b2fce4] px-1.5 py-0.5 text-xs font-bold text-black">
                  clearpay
                </span>
                <span className="rounded bg-[#ffb3c7] px-1.5 py-0.5 text-xs font-bold text-black">
                  Klarna.
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Pay in 3 or 4 months</span>
            </div>
          </div>

          {/* Flip hint */}
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Hover for details →
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl border bg-card shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex h-full flex-col p-5">
            <h3 className="text-lg font-bold text-foreground">{courseName}</h3>
            
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
                <div className="font-medium text-foreground">{instructor.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>4.9 rating</span>
                </div>
              </div>
            </div>

            <p className="mt-4 flex-1 text-sm text-muted-foreground line-clamp-3">
              {instructor.bio || `Experienced ${instructor.car_type.toLowerCase()} driving instructor ready to help you pass your test.`}
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Free re-test if needed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Theory test support included</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Pick-up from home/work</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div>
                <span className="text-2xl font-bold text-foreground">£{totalPrice}</span>
                <div className="text-xs text-muted-foreground">
                  or from £{Math.round(totalPrice / 4)}/month
                </div>
              </div>
              <Button size="sm" onClick={handleBookNow}>
                Book Now
              </Button>
            </div>

            <div className="mt-2 text-center text-[10px] text-muted-foreground">
              ← Hover to flip back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
