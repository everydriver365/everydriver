import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, TrendingUp, Star, CheckCircle, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  isPopular?: boolean;
}

export function DynamicCourseCard({ 
  instructor, 
  hours, 
  nextAvailable,
  isPopular = false 
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

  const formatNextAvailable = () => {
    if (!nextAvailable) return { day: "TBC", month: "" };
    const date = new Date(nextAvailable);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("en-GB", { month: "short" }),
    };
  };

  const { day, month } = formatNextAvailable();

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
          {/* Header Section */}
          <div 
            className="relative h-32 overflow-hidden"
            style={{ backgroundColor: brandColour }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            
            {isPopular && (
              <Badge className="absolute left-3 top-3 border-0 bg-emerald-500 text-white gap-1">
                <TrendingUp className="h-3 w-3" />
                Popular
              </Badge>
            )}

            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <Badge className="border-0 bg-white/20 text-white backdrop-blur-sm">
                {instructor.car_type}
              </Badge>
              {hours === 28 && (
                <Badge className="border-0 bg-amber-500 text-white">
                  Intensive
                </Badge>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{courseName}</h3>
                <p className="text-sm text-white/80">{hours} hours of lessons</p>
              </div>
              <Avatar className="h-14 w-14 border-2 border-white">
                <AvatarImage src={instructor.profile_image_url || undefined} />
                <AvatarFallback className="bg-white text-primary font-semibold">
                  {instructor.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex h-[calc(100%-8rem)]">
            <div className="flex flex-col items-center justify-center bg-primary px-3 py-4 text-primary-foreground min-w-[80px]">
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">Next</span>
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">Available</span>
              <span className="mt-1 text-2xl font-bold">{day}</span>
              <span className="text-xs font-medium">{month}</span>
            </div>

            <div className="flex-1 p-3 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{instructor.name}</span>
              </div>
              
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">Near {instructor.home_postcode}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Car className="h-3 w-3" />
                  <span>{instructor.car_make} {instructor.car_model}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Flexible lesson lengths</span>
                </div>
              </div>

              <div className="mt-auto">
                <span className="text-xl font-bold text-foreground">£{totalPrice}</span>
                <span className="text-xs text-muted-foreground ml-1">total</span>
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
