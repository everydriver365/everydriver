import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Check, Car, Calendar, Clock, ArrowRight, ChevronDown, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";
import { cn } from "@/lib/utils";
import tenHoursBadge from "@/assets/10-hours-badge.png";
import twentyHoursBadge from "@/assets/20-hours-badge.png";
import thirtyHoursBadge from "@/assets/30-hours-badge.png";
import fortyHoursBadge from "@/assets/40-hours-badge.png";
import testInAWeekBadge from "@/assets/test-in-a-week-badge.png";

interface CourseInstructor {
  id: string;
  name: string;
  profile_image_url: string | null;
  car_type?: string;
  home_postcode?: string;
  hourly_rate: number | null;
  bio: string | null;
  school_skim_amount?: number | null;
}

interface Course {
  instructor: CourseInstructor;
  hours: number;
  bookableDate: Date;
  courseImageUrl?: string | null;
  isPopular?: boolean;
  distance?: number;
  isIntensive?: boolean;
  discountedPrice?: number | null;
  customFeatures?: string[] | null;
  isPremium?: boolean;
  placementType?: string;
  areaName?: string | null;
}

interface MobileCourseCardProps {
  course: Course;
  index: number;
}

export function MobileCourseCard({ course, index }: MobileCourseCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { instructor, hours, bookableDate, distance, isPopular, isIntensive, discountedPrice, customFeatures, isPremium } = course;

  const schoolSkim = instructor.school_skim_amount || 0;
  const basePrice = instructor.hourly_rate ? instructor.hourly_rate * hours : 0;
  const price = discountedPrice || (basePrice + schoolSkim);
  const formattedDate = format(bookableDate, "d MMM");
  const transmissionType = instructor.car_type || "Manual";

  const handleLearnMore = () => {
    const params = new URLSearchParams({
      hours: hours.toString(),
      date: bookableDate.toISOString(),
    });
    navigate(`/book/${instructor.id}?${params.toString()}`);
  };

  const features = customFeatures?.length ? customFeatures : [
    "Theory support included",
    "Home pick-up available",
    "Test booking assistance",
    "Free lesson rescheduling",
  ];

  const badgeImg = isIntensive
    ? testInAWeekBadge
    : hours === 10 ? tenHoursBadge
    : hours === 20 ? twentyHoursBadge
    : hours === 30 ? thirtyHoursBadge
    : hours === 40 ? fortyHoursBadge
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div
        className={cn(
          "rounded-2xl border bg-card overflow-hidden transition-shadow",
          isPremium && "border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.1)]",
          expanded && "shadow-lg"
        )}
      >
        {/* Premium banner */}
        {isPremium && (
          <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-white text-[10px] font-bold py-1">
            <Star className="h-3 w-3 fill-current" />
            Featured Instructor
          </div>
        )}

        {/* Main card — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left active:bg-muted/30 transition-colors"
        >
          <div className="p-3.5">
            {/* Top row: badge image + course info + price */}
            <div className="flex items-start gap-3">
              {/* Course badge */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted/50 flex items-center justify-center">
                {badgeImg ? (
                  <img src={badgeImg} alt={`${hours}hr`} className="w-full h-full object-contain p-1" />
                ) : (
                  <img
                    src={course.courseImageUrl || instructor.profile_image_url || "/placeholder.svg"}
                    alt={`${hours} Hour Course`}
                    className="w-full h-full object-cover"
                  />
                )}
                {isPopular && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <Star className="h-2.5 w-2.5 text-white fill-current" />
                  </div>
                )}
              </div>

              {/* Course title + meta */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[15px] text-foreground leading-tight">
                  {hours} Hour {isIntensive ? "Intensive" : "Course"}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />{hours}hrs
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Car className="h-3 w-3" />{transmissionType}
                  </span>
                  {distance && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />{distance.toFixed(1)}mi
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-lg font-black text-foreground">£{price.toLocaleString()}</span>
              </div>
            </div>

            {/* Bottom row: instructor + date + expand */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-border">
                  <AvatarImage src={instructor.profile_image_url || undefined} alt={instructor.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                    {instructor.name?.split(" ").map(n => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">{instructor.name}</span>
                <span className="text-xs text-amber-500 flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-current" />5.0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[11px] px-2.5 py-1 h-auto bg-primary text-primary-foreground border-0 font-bold shadow-sm">
                  <Calendar className="h-3 w-3 mr-1" />Starts {formattedDate}
                </Badge>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </div>
        </button>

        {/* Expandable detail section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="overflow-hidden"
            >
              <div className="px-3.5 pb-4 space-y-3 border-t border-border/50">
                {/* Instructor detail row */}
                <div className="flex items-center gap-3 p-3 mt-3 rounded-xl bg-muted/40">
                  <Avatar className="h-11 w-11 border-2 border-primary/20">
                    <AvatarImage src={instructor.profile_image_url || undefined} alt={instructor.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {instructor.name?.split(" ").map(n => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">{instructor.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />5.0
                      </span>
                      <span>·</span>
                      <span>{transmissionType}</span>
                      {instructor.home_postcode && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{instructor.home_postcode}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {instructor.bio && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{instructor.bio}</p>
                )}

                {/* Features */}
                <div className="space-y-1.5">
                  {features.slice(0, 4).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Payment options */}
                <div className="pt-1">
                  <CompactPaymentBadges amount={price} className="justify-start" />
                </div>

                {/* CTA */}
                <Button
                  onClick={handleLearnMore}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-md"
                  size="lg"
                >
                  Book Now
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
