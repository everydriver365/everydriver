import { DynamicCourseCard } from "@/components/DynamicCourseCard";
import { motion } from "framer-motion";

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

export function CourseChatCards({ courses }: CourseChatCardsProps) {
  if (!courses.length) return null;

  return (
    <div className="flex flex-col gap-3 pt-2 pb-1 [&_.group]:hover\:translate-y-0 [&_img]:h-28 [&_.relative.h-48]:h-28 [&_.min-w-\[80px\]]:min-w-[60px] [&_.min-w-\[80px\]]:px-3 [&_.text-3xl]:text-xl [&_.text-lg]:text-sm [&_.text-2xl]:text-lg [&_.p-4]:p-2.5 [&_.p-5]:p-3 [&_.px-5]:px-3 [&_.space-y-2\.5]:space-y-1.5 [&_.mt-4]:mt-2 [&_.mt-3]:mt-2 [&_.h-10]:h-8 [&_.w-10]:w-8">
      {courses.map((course, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="w-full"
        >
          <DynamicCourseCard
            instructor={{
              id: course.instructorId || "unknown",
              name: course.instructorName,
              profile_image_url: course.instructorProfileImage || null,
              car_type: course.instructorCarType || "Manual",
              car_make: course.instructorCarMake || null,
              car_model: course.instructorCarModel || null,
              home_postcode: course.instructorPostcode || "",
              home_address: course.instructorAddress || null,
              hourly_rate: course.instructorHourlyRate || null,
              bio: course.instructorBio || null,
              brand_colour: course.instructorBrandColour || null,
              school_skim_amount: course.instructorSchoolSkim || 0,
            }}
            hours={course.courseHours}
            isPopular={course.isPopular}
            isIntensive={course.isIntensive}
            distance={course.distance ?? undefined}
            discountedPrice={course.discountedPrice}
            features={course.features}
          />
        </motion.div>
      ))}
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
