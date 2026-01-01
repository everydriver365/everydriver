import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, TrendingUp, Star, CheckCircle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isFuture, parseISO } from "date-fns";

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
}

export function DynamicCourseCard({ 
  instructor, 
  hours, 
  nextAvailable,
  courseImageUrl,
  isPopular = false,
  availableFrom
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
      };
    }
    if (!nextAvailable) return { day: "TBC", month: "", isDelayed: false };
    const date = new Date(nextAvailable);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("en-GB", { month: "short" }),
      isDelayed: false,
    };
  };

  const { day, month, isDelayed } = formatNextAvailable();

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
          {/* Hero Image Section */}
          <div className="relative h-44 overflow-hidden">
            <img
              src={courseImageUrl || `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop`}
              alt={courseName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {isPopular && (
              <Badge className="absolute left-3 top-3 border-0 bg-emerald-500 text-white gap-1">
                <TrendingUp className="h-3 w-3" />
                Popular
              </Badge>
            )}

            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <Badge className="border-0 bg-primary/90 text-primary-foreground backdrop-blur-sm">
                {instructor.car_type}
              </Badge>
              {hours === 28 && (
                <Badge className="border-0 bg-amber-500 text-white">
                  Intensive
                </Badge>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex h-[calc(100%-11rem)]">
            <div className={`flex flex-col items-center justify-center px-3 py-4 min-w-[80px] ${
              isDelayed ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"
            }`}>
              {isDelayed ? (
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
              <span className="mt-1 text-2xl font-bold">{day}</span>
              <span className="text-xs font-medium">{month}</span>
            </div>

            <div className="flex-1 p-3">
              <h3 className="text-base font-bold text-foreground line-clamp-2">{courseName}</h3>
              
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">Near {instructor.home_postcode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{hours} hours • {instructor.car_type}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={instructor.profile_image_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    {instructor.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {instructor.name}
                </span>
              </div>

              <div className="mt-2">
                <span className="text-xl font-bold text-foreground">£{totalPrice}</span>
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
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
