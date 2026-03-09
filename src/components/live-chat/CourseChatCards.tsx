import { motion } from "framer-motion";
import { MapPin, Zap, TrendingUp, Car } from "lucide-react";

interface CourseCard {
  courseName: string;
  courseHours: number;
  price: number | null;
  discountedPrice?: number | null;
  instructorName: string;
  instructorSlug: string | null;
  instructorId?: string | null;
  instructorProfileImage?: string | null;
  instructorCarType?: string;
  instructorCarMake?: string | null;
  instructorCarModel?: string | null;
  instructorBrandColour?: string | null;
  instructorPostcode?: string | null;
  instructorAddress?: string | null;
  instructorBio?: string | null;
  instructorHourlyRate?: number | null;
  instructorSchoolSkim?: number | null;
  distance?: number | null;
  isIntensive: boolean;
  isPopular: boolean;
  features?: string[] | null;
  availableFrom?: string | null;
}

interface CourseChatCardsProps {
  courses: CourseCard[];
}

function parseAvailableFrom(availableFrom?: string | null) {
  if (!availableFrom) return { day: "TBC", month: "" };
  const date = new Date(availableFrom);
  if (isNaN(date.getTime())) return { day: "TBC", month: "" };
  return {
    day: date.getDate().toString(),
    month: date.toLocaleString("en-GB", { month: "short" }),
  };
}

export function CourseChatCards({ courses }: CourseChatCardsProps) {
  if (!courses.length) return null;

  return (
    <div className="flex flex-col gap-2 pt-2 pb-1">
      {courses.map((course, i) => {
        const { day, month } = parseAvailableFrom(course.availableFrom);
        const brandColour = course.instructorBrandColour || "#10b981";
        const isAuto = (course.instructorCarType || "").toLowerCase() === "automatic";
        const hasDiscount = course.discountedPrice != null && course.price != null;
        const displayPrice = hasDiscount ? course.discountedPrice : course.price;
        const initials = course.instructorName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2);

        return (
          <motion.a
            key={i}
            href={`/book/${course.instructorId}?hours=${course.courseHours}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.25, type: "spring", stiffness: 300, damping: 25 }}
            className="flex items-stretch rounded-lg border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-border transition-all duration-200 overflow-hidden cursor-pointer no-underline group"
          >
            {/* Date strip */}
            <div
              className="flex flex-col items-center justify-center px-3 py-2 min-w-[52px] text-white"
              style={{ backgroundColor: brandColour }}
            >
              {course.instructorProfileImage ? (
                <img
                  src={course.instructorProfileImage}
                  alt={course.instructorName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                  {initials}
                </div>
              )}
              <span className="text-[9px] font-medium mt-1 opacity-80 leading-none">
                {day} {month}
              </span>
            </div>

            {/* Centre info */}
            <div className="flex-1 py-2 px-2.5 min-w-0 flex flex-col justify-center gap-0.5">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-semibold text-foreground truncate">
                  {course.courseName}
                </span>
                {course.isPopular && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-px text-[9px] font-semibold leading-none dark:bg-emerald-900/40 dark:text-emerald-300">
                    <TrendingUp className="h-2.5 w-2.5" />
                    Popular
                  </span>
                )}
                {course.isIntensive && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 text-amber-700 px-1.5 py-px text-[9px] font-semibold leading-none dark:bg-amber-900/40 dark:text-amber-300">
                    <Zap className="h-2.5 w-2.5" />
                    Intensive
                  </span>
                )}
                {isAuto && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 text-blue-700 px-1.5 py-px text-[9px] font-semibold leading-none dark:bg-blue-900/40 dark:text-blue-300">
                    <Car className="h-2.5 w-2.5" />
                    Auto
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                {course.instructorName}
              </span>
              {(course.instructorPostcode || course.distance != null) && (
                <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5 truncate">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {course.distance != null
                    ? `${course.distance.toFixed(1)} miles away`
                    : course.instructorPostcode}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-col items-end justify-center pr-3 pl-1 py-2 shrink-0">
              {hasDiscount && (
                <span className="text-[10px] text-muted-foreground line-through">
                  £{course.price}
                </span>
              )}
              <span className="text-sm font-bold text-foreground">
                {displayPrice != null ? `£${displayPrice}` : "POA"}
              </span>
              <span className="text-[9px] text-primary font-medium group-hover:underline mt-0.5">
                View →
              </span>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}

/** Parse a message for embedded course cards JSON */
export function parseCourseCardsFromMessage(content: string): {
  text: string;
  courseCards: CourseCard[] | null;
} {
  const match = content.match(/<!--COURSES:(\[.*?\])-->/s);
  if (!match) return { text: content, courseCards: null };

  try {
    const courseCards = JSON.parse(match[1]) as CourseCard[];
    const text = content.replace(match[0], "").trim();
    return { text, courseCards };
  } catch {
    return { text: content, courseCards: null };
  }
}
