import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, TrendingUp, Star, CheckCircle, CalendarClock, Zap } from "lucide-react";
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
    hourly_rate: number | null;
    bio: string | null;
    brand_colour: string | null;
  };
  hours: number;
  nextAvailable?: Date | null;
  courseImageUrl?: string | null;
  isPopular?: boolean;
  availableFrom?: string | null;
  distance?: number; // Distance in miles from user's location
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

  const formatNextAvailable = () => {
    // If instructor has a future available_from date, show that instead
    if (hasDelayedAvailability && availableFromDate) {
      return {
        day: availableFromDate.getDate().toString(),
        month: availableFromDate.toLocaleDateString("en-GB", { month: "short" }),
        isDelayed: true,
        date: availableFromDate,
      };
    }
    if (!nextAvailable) return { day: "TBC", month: "", isDelayed: false, date: null };
    const date = new Date(nextAvailable);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("en-GB", { month: "short" }),
      isDelayed: false,
      date: date,
    };
  };

  const { day, month, isDelayed, date: availableDate } = formatNextAvailable();
  
  // Check if available within 7 days
  const isAvailableSoon = availableDate && differenceInDays(availableDate, new Date()) <= 7 && differenceInDays(availableDate, new Date()) >= 0;

  return (
    <div
      className="group h-[420px] cursor-pointer [perspective:1000px]"
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
          {/* Available This Week Ribbon */}
          {isAvailableSoon && (
            <div className="absolute top-0 left-0 z-20 overflow-hidden w-24 h-24 pointer-events-none">
              <div className="absolute top-3 -left-8 w-32 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 text-center transform -rotate-45 shadow-md">
                This Week!
              </div>
            </div>
          )}
          
          {/* Hero Image Section - taller */}
          <div className="relative h-56 overflow-hidden">
            <img
              src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop`}
              alt={courseName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {isPopular && !distance && (
              <Badge className="absolute left-3 top-3 border-0 bg-emerald-500 text-white gap-1">
                <TrendingUp className="h-3 w-3" />
                Popular
              </Badge>
            )}

            {/* Distance badge - bottom left of image */}
            {distance !== undefined && (
              <div className="absolute left-3 bottom-3 flex items-center gap-1.5 bg-primary/95 backdrop-blur-sm text-primary-foreground px-2.5 py-1.5 rounded-lg shadow-lg">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{distance.toFixed(1)} mi</span>
              </div>
            )}

            {/* Price badge - top right */}
            <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
              <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-lg border">
                <div className="text-lg font-bold text-foreground">£{totalPrice}</div>
                <div className="text-[10px] text-muted-foreground">£{Math.round(totalPrice / 4)}/mo</div>
              </div>
              <div className="flex gap-1">
                <Badge className="border-0 bg-primary/90 text-primary-foreground backdrop-blur-sm text-[10px]">
                  {instructor.car_type}
                </Badge>
                {hours === 28 && (
                  <Badge className="border-0 bg-amber-500 text-white text-[10px]">
                    Intensive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Content Section - smaller */}
          <div className="flex h-[calc(100%-14rem)]">
            <div className={`relative flex flex-col items-center justify-center px-3 py-2 min-w-[70px] ${
              isAvailableSoon 
                ? "bg-emerald-500 text-white" 
                : isDelayed 
                  ? "bg-amber-500 text-white" 
                  : "bg-primary text-primary-foreground"
            }`}>
              {isAvailableSoon && (
                <div className="absolute inset-0 bg-emerald-400 animate-pulse opacity-30" />
              )}
              {isAvailableSoon ? (
                <>
                  <Zap className="h-4 w-4 mb-1 animate-pulse" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider">Book</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider">Now!</span>
                </>
              ) : isDelayed ? (
                <>
                  <CalendarClock className="h-4 w-4 mb-1 opacity-90" />
                  <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">Available</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">From</span>
                </>
              ) : (
                <>
                  <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">Next</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">Available</span>
                </>
              )}
              <span className="mt-0.5 text-2xl font-bold relative z-10">{day}</span>
              <span className="text-xs font-semibold relative z-10">{month}</span>
            </div>

            <div className="flex-1 p-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
                  <AvatarImage src={instructor.profile_image_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {instructor.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{courseName}</h3>
                  <span className="text-xs text-muted-foreground truncate block">
                    {instructor.name}
                  </span>
                </div>
              </div>
              
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{hours}hrs</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">
                    {distance !== undefined ? `${distance.toFixed(1)}mi` : instructor.home_postcode}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                <span className="rounded bg-[#b2fce4] px-1 py-0.5 font-semibold text-[#000]">
                  clearpay
                </span>
                <span className="rounded bg-[#ffb3c7] px-1 py-0.5 font-semibold text-[#000]">
                  Klarna.
                </span>
              </div>
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
