import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Check, Car, Calendar, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CompactPaymentBadges } from "@/components/payments/PaymentMessaging";

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
}

interface MobileCourseCardProps {
  course: Course;
  index: number;
}

export function MobileCourseCard({ course, index }: MobileCourseCardProps) {
  const navigate = useNavigate();
  const { instructor, hours, bookableDate, distance, isPopular, isIntensive, discountedPrice, customFeatures } = course;

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

  // Default features if none provided
  const features = customFeatures?.length ? customFeatures : [
    "Theory support included",
    "Home pick-up available",
    "Test booking assistance",
    "Free lesson rescheduling",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="course" className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <AccordionTrigger className="px-3 py-3 hover:no-underline [&[data-state=open]>div>.chevron]:rotate-180">
            <div className="flex items-center gap-3 w-full">
              {/* Course Image */}
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={course.courseImageUrl || instructor.profile_image_url || "/placeholder.svg"}
                  alt={`${hours} Hour Course`}
                  className="h-full w-full object-cover"
                />
                {isPopular && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md rounded-tr-lg">
                    ★
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    {hours} HOUR {isIntensive ? "INTENSIVE" : "COURSE"}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formattedDate}
                  </Badge>
                  {distance && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {distance.toFixed(1)} mi
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Badges */}
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-base text-primary">
                  £{price.toLocaleString()}
                </span>
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0 h-5"
                >
                  <Car className="h-3 w-3 mr-1" />
                  {transmissionType}
                </Badge>
              </div>

              {/* Chevron */}
              <ChevronDown className="chevron h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0" />
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3 pb-4">
            <div className="space-y-4 pt-2">
              {/* Instructor Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={instructor.profile_image_url || undefined} alt={instructor.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {instructor.name?.split(" ").map(n => n[0]).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{instructor.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      5.0
                    </span>
                    <span>•</span>
                    <span>{transmissionType} Instructor</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {instructor.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {instructor.bio}
                </p>
              )}

              {/* Features */}
              <div className="grid grid-cols-1 gap-1.5">
                {features.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Location */}
              {instructor.home_postcode && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{instructor.home_postcode}</span>
                </div>
              )}

              {/* Payment Options */}
              <div className="pt-1">
                <CompactPaymentBadges amount={price} className="justify-start" />
              </div>

              {/* Learn More Button */}
              <Button 
                onClick={handleLearnMore}
                className="w-full"
                size="lg"
              >
                Learn More
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
}
